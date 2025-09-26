// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title HyperCards
 * @dev Main ERC-721 contract for trading card NFTs with EIP-712 pack opening mechanics
 */
contract HyperCards is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    using ECDSA for bytes32;

    // EIP-712 Domain Separator
    bytes32 private constant DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant PACK_OPENING_TYPEHASH = keccak256("PackOpening(address user,uint256 packType,uint256 nonce,uint256 timestamp)");
    bytes32 private immutable DOMAIN_SEPARATOR;

    // Token addresses on HyperEVM
    IERC20 public constant HYPE = IERC20(0x4Ed6Add0D693842c7A8c3C07732B91e42B6Bb4E5); // HYPE token
    
    // HYPE destination contract for pack payments
    address public constant HYPE_DESTINATION = 0xa6D8DE9A545aedBE612f5643527C2C4ED3df8411;

    Counters.Counter private _tokenIdCounter;

    // Card rarity tiers
    enum Rarity { COMMON, RARE, EPIC, LEGENDARY }

    // Pack types with corrected pricing
    uint256 public constant COMMON_PACK = 1;
    uint256 public constant EPIC_PACK = 2;

    // Pack configuration
    struct PackConfig {
        uint256 price;
        uint256 maxSupply;
        uint256 currentSupply;
        bool isActive;
        string name;
        uint256 rewardMultiplier; // Base reward multiplier for cards from this pack type
    }

    // Card information with stats and market value
    struct Card {
        string name;
        Rarity rarity;
        uint256 attack;
        uint256 defense;
        uint256 speed;
        uint256 marketValue; // In HYPE tokens (wei)
        uint256 mintedAt;
        address originalOwner;
        string imageURI;
        bool isSpecial;
    }

    // State variables
    mapping(uint256 => Card) public cards;
    mapping(string => uint256) public cardNameToTokenId;
    mapping(string => bool) public isReservedCardName;
    mapping(Rarity => uint256) public rarityWeights;
    mapping(uint256 => PackConfig) public packConfigs;

    // EIP-712 Pack opening - Nonce tracking
    mapping(address => uint256) public nonces;
    mapping(bytes32 => bool) public usedSignatures;

    // Authorized signers for pack opening
    mapping(address => bool) public authorizedSigners;

    // Constants
    uint256 public constant MAX_CARD_NAME_LENGTH = 64;
    uint256 public constant MIN_CARD_NAME_LENGTH = 2;
    
    // Base URI for metadata
    string private _baseTokenURI;

    // Events
    event CardMinted(uint256 indexed tokenId, string name, address indexed owner, Rarity rarity, uint256 marketValue);
    event PackOpened(uint256 packType, address indexed opener, uint256 indexed tokenId, string cardName, Rarity rarity, uint256 rewardAmount);
    event PackConfigUpdated(uint256 indexed packType, uint256 price, uint256 maxSupply);
    event RarityWeightUpdated(Rarity rarity, uint256 weight);
    event SignerAuthorized(address indexed signer, bool authorized);
    event CardValueUpdated(uint256 indexed tokenId, uint256 oldValue, uint256 newValue);

    // Errors
    error InvalidCardName();
    error CardAlreadyExists();
    error PackNotActive();
    error PackSoldOut();
    error InsufficientPayment();
    error NotCardOwner();
    error InvalidPackType();
    error ReservedCardName();
    error InvalidSignature();
    error SignatureAlreadyUsed();
    error UnauthorizedSigner();
    error InvalidNonce();
    error SignatureExpired();

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
        
        // Initialize EIP-712 domain separator
        DOMAIN_SEPARATOR = keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes("HyperCards")),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));

        // Initialize rarity weights (out of 1000)
        rarityWeights[Rarity.COMMON] = 600;    // 60%
        rarityWeights[Rarity.RARE] = 300;      // 30%
        rarityWeights[Rarity.EPIC] = 80;       // 8%
        rarityWeights[Rarity.LEGENDARY] = 20;  // 2%

        // Initialize pack configurations with correct pricing
        _initializePackConfigs();

        // Set deployer as initial authorized signer
        authorizedSigners[msg.sender] = true;
    }

    function _initializePackConfigs() private {
        // Common Pack - 0.1 HYPE
        packConfigs[COMMON_PACK] = PackConfig({
            price: 1 * 10**17, // 0.1 HYPE in wei
            maxSupply: 50000,
            currentSupply: 0,
            isActive: true,
            name: "Common Pack",
            rewardMultiplier: 100 // 1.0x base reward
        });

        // Epic Pack - 1 HYPE  
        packConfigs[EPIC_PACK] = PackConfig({
            price: 1 * 10**18, // 1 HYPE in wei
            maxSupply: 10000,
            currentSupply: 0,
            isActive: true,
            name: "Epic Pack",
            rewardMultiplier: 300 // 3.0x base reward
        });
    }

    /**
     * @dev Open a pack using EIP-712 signature verification
     */
    function openPackWithSignature(
        uint256 packType,
        uint256 timestamp,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant {
        PackConfig storage pack = packConfigs[packType];
        
        if (!pack.isActive) revert PackNotActive();
        if (pack.currentSupply >= pack.maxSupply) revert PackSoldOut();

        // Check signature expiration (10 minutes)
        if (block.timestamp > timestamp + 600) revert SignatureExpired();

        // Create message hash for EIP-712
        bytes32 structHash = keccak256(abi.encode(
            PACK_OPENING_TYPEHASH,
            msg.sender,
            packType,
            nonces[msg.sender],
            timestamp
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        
        // Check if signature was already used
        if (usedSignatures[digest]) revert SignatureAlreadyUsed();
        
        // Recover signer
        address signer = digest.recover(v, r, s);
        if (!authorizedSigners[signer]) revert UnauthorizedSigner();

        // Transfer pack price to your contract
        if (!HYPE.transferFrom(msg.sender, HYPE_DESTINATION, pack.price)) {
            revert InsufficientPayment();
        }

        // Generate card based on pack type and secure randomness
        (string memory cardName, Rarity rarity, uint256 attack, uint256 defense, uint256 speed, uint256 marketValue, string memory imageURI, bool isSpecial) = _generateCard(packType, digest);
        
        // Mint the card
        uint256 tokenId = _mintCard(cardName, rarity, attack, defense, speed, marketValue, imageURI, isSpecial, msg.sender);
        
        // Calculate rewards (but don't track them since all payments go to your contract)
        uint256 rewardAmount = _calculateReward(marketValue, pack.rewardMultiplier);

        // Update pack supply, nonce and mark signature as used
        pack.currentSupply++;
        nonces[msg.sender]++;
        usedSignatures[digest] = true;
        
        emit PackOpened(packType, msg.sender, tokenId, cardName, rarity, rewardAmount);
    }

    /**
     * @dev Mint a specific card (admin function)
     */
    function mintCard(
        string memory cardName,
        Rarity rarity,
        uint256 attack,
        uint256 defense,
        uint256 speed,
        uint256 marketValue,
        string memory imageURI,
        bool isSpecial,
        address to
    ) external onlyOwner returns (uint256) {
        return _mintCard(cardName, rarity, attack, defense, speed, marketValue, imageURI, isSpecial, to);
    }


    /**
     * @dev Internal function to mint a card
     */
    function _mintCard(
        string memory cardName,
        Rarity rarity,
        uint256 attack,
        uint256 defense,
        uint256 speed,
        uint256 marketValue,
        string memory imageURI,
        bool isSpecial,
        address to
    ) internal returns (uint256) {
        if (!_isValidCardName(cardName)) revert InvalidCardName();
        if (cardNameToTokenId[cardName] != 0) revert CardAlreadyExists();
        if (isReservedCardName[cardName]) revert ReservedCardName();

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Create card data
        cards[tokenId] = Card({
            name: cardName,
            rarity: rarity,
            attack: attack,
            defense: defense,
            speed: speed,
            marketValue: marketValue,
            mintedAt: block.timestamp,
            originalOwner: to,
            imageURI: imageURI,
            isSpecial: isSpecial
        });

        cardNameToTokenId[cardName] = tokenId;

        // Mint NFT
        _safeMint(to, tokenId);

        emit CardMinted(tokenId, cardName, to, rarity, marketValue);
        return tokenId;
    }

    /**
     * @dev Generate random card with enhanced mechanics
     */
    function _generateCard(uint256 packType, bytes32 entropy) internal view returns (
        string memory name,
        Rarity rarity,
        uint256 attack,
        uint256 defense,
        uint256 speed,
        uint256 marketValue,
        string memory imageURI,
        bool isSpecial
    ) {
        // Get rarity based on pack type
        rarity = _getPackRarity(packType, entropy);
        
        // Generate card stats based on rarity
        (attack, defense, speed) = _generateStats(rarity, entropy);
        
        // Generate market value based on rarity and stats
        marketValue = _calculateMarketValue(rarity, attack, defense, speed);
        
        // Generate card name
        name = _generateCardName(rarity, entropy);
        
        // Generate image URI
        imageURI = _generateImageURI(rarity, name, entropy);
        
        // Determine if special (legendary has chance, epic pack increases chance)
        isSpecial = _isSpecialCard(rarity, packType, entropy);
        
        // Bonus for special cards
        if (isSpecial) {
            marketValue = marketValue * 150 / 100; // 1.5x value for special cards
        }
    }

    /**
     * @dev Generate card stats based on rarity
     */
    function _generateStats(Rarity rarity, bytes32 entropy) internal pure returns (uint256 attack, uint256 defense, uint256 speed) {
        uint256 baseRand = uint256(entropy);
        
        if (rarity == Rarity.LEGENDARY) {
            attack = 80 + (baseRand % 21); // 80-100
            defense = 80 + ((baseRand >> 8) % 21); // 80-100
            speed = 80 + ((baseRand >> 16) % 21); // 80-100
        } else if (rarity == Rarity.EPIC) {
            attack = 60 + (baseRand % 21); // 60-80
            defense = 60 + ((baseRand >> 8) % 21); // 60-80
            speed = 60 + ((baseRand >> 16) % 21); // 60-80
        } else if (rarity == Rarity.RARE) {
            attack = 40 + (baseRand % 21); // 40-60
            defense = 40 + ((baseRand >> 8) % 21); // 40-60
            speed = 40 + ((baseRand >> 16) % 21); // 40-60
        } else {
            attack = 20 + (baseRand % 21); // 20-40
            defense = 20 + ((baseRand >> 8) % 21); // 20-40
            speed = 20 + ((baseRand >> 16) % 21); // 20-40
        }
    }

    /**
     * @dev Calculate market value based on rarity and stats
     */
    function _calculateMarketValue(Rarity rarity, uint256 attack, uint256 defense, uint256 speed) internal pure returns (uint256) {
        uint256 baseValue;
        uint256 totalStats = attack + defense + speed;
        
        if (rarity == Rarity.LEGENDARY) {
            baseValue = 5 * 10**18; // 5 HYPE base
        } else if (rarity == Rarity.EPIC) {
            baseValue = 1 * 10**18; // 1 HYPE base
        } else if (rarity == Rarity.RARE) {
            baseValue = 2 * 10**17; // 0.2 HYPE base
        } else {
            baseValue = 5 * 10**16; // 0.05 HYPE base
        }
        
        // Add bonus based on total stats (up to 50% bonus)
        uint256 statBonus = baseValue * totalStats / 600; // Max stats = 300, so max bonus = 50%
        
        return baseValue + statBonus;
    }

    /**
     * @dev Calculate reward for pack opening
     */
    function _calculateReward(uint256 marketValue, uint256 multiplier) internal pure returns (uint256) {
        // Reward is 10% of market value * pack multiplier
        return marketValue * 10 * multiplier / 10000;
    }

    /**
     * @dev Determine if card is special
     */
    function _isSpecialCard(Rarity rarity, uint256 packType, bytes32 entropy) internal pure returns (bool) {
        uint256 chance = uint256(entropy) % 1000;
        
        if (rarity == Rarity.LEGENDARY) {
            return chance < 200; // 20% chance for legendary
        } else if (rarity == Rarity.EPIC) {
            uint256 baseChance = packType == EPIC_PACK ? 50 : 20; // 5% or 2%
            return chance < baseChance;
        }
        
        return false; // Only epic and legendary can be special
    }

    /**
     * @dev Get rarity based on pack type and secure randomness
     */
    function _getPackRarity(uint256 packType, bytes32 entropy) internal view returns (Rarity) {
        uint256 randomValue = uint256(entropy) % 1000;
        
        if (packType == EPIC_PACK) {
            // Epic pack has better odds
            if (randomValue < 50) return Rarity.LEGENDARY; // 5%
            if (randomValue < 200) return Rarity.EPIC; // 15%
            if (randomValue < 500) return Rarity.RARE; // 30%
            return Rarity.COMMON; // 50%
        } else {
            // Common pack uses standard distribution
            if (randomValue < rarityWeights[Rarity.LEGENDARY]) return Rarity.LEGENDARY;
            if (randomValue < rarityWeights[Rarity.LEGENDARY] + rarityWeights[Rarity.EPIC]) return Rarity.EPIC;
            if (randomValue < 1000 - rarityWeights[Rarity.COMMON]) return Rarity.RARE;
            return Rarity.COMMON;
        }
    }

    /**
     * @dev Generate card name based on rarity
     */
    function _generateCardName(Rarity rarity, bytes32 entropy) internal pure returns (string memory) {
        string[6] memory prefixes = ["Shadow", "Fire", "Ice", "Lightning", "Earth", "Wind"];
        string[6] memory creatures = ["Dragon", "Phoenix", "Wolf", "Tiger", "Eagle", "Serpent"];
        string[4] memory suffixes = ["Master", "Guardian", "Warrior", "Spirit"];
        
        uint256 random = uint256(entropy);
        
        if (rarity == Rarity.LEGENDARY) {
            // Legendary cards get special prefix + creature + suffix
            return string(abi.encodePacked(
                "Legendary ",
                prefixes[random % prefixes.length],
                " ",
                creatures[(random >> 8) % creatures.length],
                " ",
                suffixes[(random >> 16) % suffixes.length]
            ));
        } else if (rarity == Rarity.EPIC) {
            // Epic cards get prefix + creature + suffix
            return string(abi.encodePacked(
                prefixes[random % prefixes.length],
                " ",
                creatures[(random >> 8) % creatures.length],
                " ",
                suffixes[(random >> 16) % suffixes.length]
            ));
        } else if (rarity == Rarity.RARE) {
            // Rare cards get prefix + creature
            return string(abi.encodePacked(
                prefixes[random % prefixes.length],
                " ",
                creatures[(random >> 8) % creatures.length]
            ));
        } else {
            // Common cards get just creature
            return creatures[random % creatures.length];
        }
    }

    /**
     * @dev Generate image URI for card
     */
    function _generateImageURI(Rarity rarity, string memory name, bytes32 entropy) internal pure returns (string memory) {
        uint256 imageIndex = uint256(entropy) % 100; // 100 different images per rarity
        
        string memory rarityString;
        if (rarity == Rarity.LEGENDARY) rarityString = "legendary";
        else if (rarity == Rarity.EPIC) rarityString = "epic";
        else if (rarity == Rarity.RARE) rarityString = "rare";
        else rarityString = "common";
        
        return string(abi.encodePacked(
            "https://api.hypercards.io/images/",
            rarityString,
            "/",
            imageIndex.toString(),
            ".png"
        ));
    }

    /**
     * @dev Validate card name
     */
    function _isValidCardName(string memory name) internal pure returns (bool) {
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length < MIN_CARD_NAME_LENGTH || nameBytes.length > MAX_CARD_NAME_LENGTH) {
            return false;
        }

        for (uint i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            if (!(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x41 && char <= 0x5A) && // A-Z
                !(char >= 0x61 && char <= 0x7A) && // a-z
                char != 0x20 && // space
                char != 0x2D) { // -
                return false;
            }
        }
        return true;
    }

    // Admin functions
    function updatePackConfig(
        uint256 packType,
        uint256 price,
        uint256 maxSupply,
        bool isActive,
        uint256 rewardMultiplier
    ) external onlyOwner {
        PackConfig storage pack = packConfigs[packType];
        pack.price = price;
        pack.maxSupply = maxSupply;
        pack.isActive = isActive;
        pack.rewardMultiplier = rewardMultiplier;
        
        emit PackConfigUpdated(packType, price, maxSupply);
    }

    function updateRarityWeights(
        Rarity rarity,
        uint256 weight
    ) external onlyOwner {
        rarityWeights[rarity] = weight;
        emit RarityWeightUpdated(rarity, weight);
    }

    function reserveCardName(string memory cardName, bool reserved) external onlyOwner {
        isReservedCardName[cardName] = reserved;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function authorizeSigners(address[] calldata signers, bool authorized) external onlyOwner {
        for (uint i = 0; i < signers.length; i++) {
            authorizedSigners[signers[i]] = authorized;
            emit SignerAuthorized(signers[i], authorized);
        }
    }

    function updateCardValue(uint256 tokenId, uint256 newValue) external onlyOwner {
        if (!_exists(tokenId)) revert("Card does not exist");
        
        uint256 oldValue = cards[tokenId].marketValue;
        cards[tokenId].marketValue = newValue;
        
        emit CardValueUpdated(tokenId, oldValue, newValue);
    }

    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = HYPE.balanceOf(address(this));
        HYPE.transfer(owner(), balance);
    }

    // View functions
    function getCardInfo(uint256 tokenId) external view returns (
        string memory name,
        uint8 rarity,
        uint256 attack,
        uint256 defense,
        uint256 speed,
        uint256 marketValue,
        uint256 mintedAt,
        address originalOwner,
        string memory imageURI,
        bool isSpecial
    ) {
        Card memory card = cards[tokenId];
        return (
            card.name,
            uint8(card.rarity),
            card.attack,
            card.defense,
            card.speed,
            card.marketValue,
            card.mintedAt,
            card.originalOwner,
            card.imageURI,
            card.isSpecial
        );
    }
    
    function getCardStruct(uint256 tokenId) external view returns (Card memory) {
        return cards[tokenId];
    }

    function getPackInfo(uint256 packType) external view returns (PackConfig memory) {
        return packConfigs[packType];
    }

    function getUserNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    function getDomainSeparator() external view returns (bytes32) {
        return DOMAIN_SEPARATOR;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter.current();
    }

    // Override functions
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}