// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IHyperCards {
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
    );
    
    struct Card {
        string name;
        uint8 rarity; // 0=Common, 1=Rare, 2=Epic, 3=Legendary
        uint256 attack;
        uint256 defense;
        uint256 speed;
        uint256 marketValue;
        uint256 mintedAt;
        address originalOwner;
        string imageURI;
        bool isSpecial;
    }
    
    function getCardStruct(uint256 tokenId) external view returns (Card memory);
}

/**
 * @title HyperCardMarketplace
 * @dev Trading marketplace for HyperCards NFTs with advanced trading features
 */
contract HyperCardMarketplace is Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    // Token addresses on HyperEVM
    IERC20 public constant HYPE = IERC20(0x4Ed6Add0D693842c7A8c3C07732B91e42B6Bb4E5); // HYPE token
    
    // HYPE destination contract for marketplace fees
    address public constant HYPE_DESTINATION = 0xa6D8DE9A545aedBE612f5643527C2C4ED3df8411;

    IHyperCards public hyperCards;
    
    Counters.Counter private _listingIdCounter;
    Counters.Counter private _offerIdCounter;
    Counters.Counter private _auctionIdCounter;

    // Enhanced listing structure
    struct Listing {
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
        uint256 listedAt;
        uint256 expiresAt;
        uint256 views;
        uint256 favorites;
    }

    // Offer structure with expiration
    struct Offer {
        uint256 tokenId;
        address buyer;
        uint256 price;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
    }

    // Auction structure for rare cards
    struct Auction {
        uint256 tokenId;
        address seller;
        uint256 startingPrice;
        uint256 currentBid;
        address currentBidder;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 minBidIncrement;
        uint256 reservePrice;
    }

    // Bundle structure for multi-card sales
    struct Bundle {
        uint256[] tokenIds;
        address seller;
        uint256 price;
        bool isActive;
        uint256 createdAt;
        uint256 expiresAt;
        string name;
        string description;
    }

    // State variables
    mapping(uint256 => Listing) public listings; // listingId => Listing
    mapping(uint256 => Offer) public offers; // offerId => Offer
    mapping(uint256 => Auction) public auctions; // auctionId => Auction
    mapping(uint256 => Bundle) public bundles; // bundleId => Bundle
    
    mapping(uint256 => uint256[]) public tokenOffers; // tokenId => offerIds[]
    mapping(uint256 => uint256) public tokenToListingId; // tokenId => listingId
    mapping(uint256 => uint256) public tokenToAuctionId; // tokenId => auctionId
    mapping(address => uint256[]) public userListings; // user => listingIds[]
    mapping(address => uint256[]) public userOffers; // user => offerIds[]
    mapping(address => uint256[]) public userAuctions; // user => auctionIds[]

    // Trading statistics
    mapping(uint256 => uint256) public cardTotalTrades; // tokenId => trade count
    mapping(uint256 => uint256) public cardTotalVolume; // tokenId => total volume in HYPE
    mapping(uint8 => uint256) public rarityFloorPrices; // rarity => floor price
    mapping(address => uint256) public userTradingVolume; // user => total volume
    
    // Favorites and watchlist
    mapping(address => mapping(uint256 => bool)) public userFavorites; // user => tokenId => isFavorited
    mapping(address => uint256[]) public userWatchlist; // user => tokenIds[]

    // Fee configuration
    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public constant MAX_PLATFORM_FEE = 1000; // 10% maximum
    address public feeRecipient;

    // Trading configuration
    uint256 public minListingDuration = 1 hours;
    uint256 public maxListingDuration = 30 days;
    uint256 public minOfferDuration = 1 hours;
    uint256 public maxOfferDuration = 7 days;
    uint256 public minAuctionDuration = 1 hours;
    uint256 public maxAuctionDuration = 7 days;
    uint256 public auctionExtensionTime = 10 minutes; // Extend auction if bid in last 10 min

    // Events
    event Listed(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 expiresAt
    );
    
    event Sale(
        uint256 indexed listingId,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price
    );
    
    event ListingCancelled(uint256 indexed listingId, uint256 indexed tokenId);
    
    event OfferMade(
        uint256 indexed offerId,
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 price,
        uint256 expiresAt
    );
    
    event OfferAccepted(
        uint256 indexed offerId,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price
    );
    
    event OfferCancelled(uint256 indexed offerId, uint256 indexed tokenId);

    event AuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 startingPrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionEnded(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed winner,
        uint256 finalPrice
    );

    event CardFavorited(address indexed user, uint256 indexed tokenId, bool favorited);
    event FloorPriceUpdated(uint8 indexed rarity, uint256 oldPrice, uint256 newPrice);

    // Errors
    error NotCardOwner();
    error CardNotApproved();
    error InvalidPrice();
    error InvalidDuration();
    error ListingNotActive();
    error OfferNotActive();
    error AuctionNotActive();
    error InsufficientBalance();
    error ExpiredListing();
    error ExpiredOffer();
    error ExpiredAuction();
    error FeeTooHigh();
    error TransferFailed();
    error BidTooLow();
    error AuctionStillActive();
    error NotAuctionWinner();
    error InvalidAuctionParams();

    constructor(
        address _hyperCards,
        address _feeRecipient
    ) {
        hyperCards = IHyperCards(_hyperCards);
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev List a card for sale
     */
    function listCard(
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) external nonReentrant {
        if (IERC721(address(hyperCards)).ownerOf(tokenId) != msg.sender) {
            revert NotCardOwner();
        }
        if (!IERC721(address(hyperCards)).isApprovedForAll(msg.sender, address(this)) &&
            IERC721(address(hyperCards)).getApproved(tokenId) != address(this)) {
            revert CardNotApproved();
        }
        if (price == 0) revert InvalidPrice();
        if (duration < minListingDuration || duration > maxListingDuration) {
            revert InvalidDuration();
        }

        // Cancel existing listing if any
        if (tokenToListingId[tokenId] != 0) {
            _cancelListing(tokenToListingId[tokenId]);
        }

        // Cancel existing auction if any
        if (tokenToAuctionId[tokenId] != 0) {
            _cancelAuction(tokenToAuctionId[tokenId]);
        }

        _listingIdCounter.increment();
        uint256 listingId = _listingIdCounter.current();

        listings[listingId] = Listing({
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            isActive: true,
            listedAt: block.timestamp,
            expiresAt: block.timestamp + duration,
            views: 0,
            favorites: 0
        });

        tokenToListingId[tokenId] = listingId;
        userListings[msg.sender].push(listingId);

        emit Listed(listingId, tokenId, msg.sender, price, block.timestamp + duration);
    }

    /**
     * @dev Buy a listed card
     */
    function buyCard(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        if (!listing.isActive) revert ListingNotActive();
        if (block.timestamp > listing.expiresAt) revert ExpiredListing();

        if (HYPE.balanceOf(msg.sender) < listing.price) {
            revert InsufficientBalance();
        }

        // Calculate fees
        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - fee;

        // Transfer payment
        if (!HYPE.transferFrom(msg.sender, feeRecipient, fee)) {
            revert TransferFailed();
        }
        if (!HYPE.transferFrom(msg.sender, listing.seller, sellerAmount)) {
            revert TransferFailed();
        }

        // Transfer NFT
        IERC721(address(hyperCards)).safeTransferFrom(
            listing.seller,
            msg.sender,
            listing.tokenId
        );

        // Update trading statistics
        _updateTradingStats(listing.tokenId, listing.price);

        // Update listing status
        listing.isActive = false;
        delete tokenToListingId[listing.tokenId];

        // Cancel all offers for this token
        _cancelAllOffers(listing.tokenId);

        emit Sale(listingId, listing.tokenId, listing.seller, msg.sender, listing.price);
    }

    /**
     * @dev Create an auction for a card
     */
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 duration,
        uint256 minBidIncrement
    ) external nonReentrant {
        if (IERC721(address(hyperCards)).ownerOf(tokenId) != msg.sender) {
            revert NotCardOwner();
        }
        if (!IERC721(address(hyperCards)).isApprovedForAll(msg.sender, address(this)) &&
            IERC721(address(hyperCards)).getApproved(tokenId) != address(this)) {
            revert CardNotApproved();
        }
        if (startingPrice == 0 || minBidIncrement == 0) revert InvalidPrice();
        if (duration < minAuctionDuration || duration > maxAuctionDuration) {
            revert InvalidDuration();
        }
        if (reservePrice > 0 && reservePrice < startingPrice) {
            revert InvalidAuctionParams();
        }

        // Cancel existing listing/auction if any
        if (tokenToListingId[tokenId] != 0) {
            _cancelListing(tokenToListingId[tokenId]);
        }
        if (tokenToAuctionId[tokenId] != 0) {
            _cancelAuction(tokenToAuctionId[tokenId]);
        }

        _auctionIdCounter.increment();
        uint256 auctionId = _auctionIdCounter.current();

        auctions[auctionId] = Auction({
            tokenId: tokenId,
            seller: msg.sender,
            startingPrice: startingPrice,
            currentBid: 0,
            currentBidder: address(0),
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true,
            minBidIncrement: minBidIncrement,
            reservePrice: reservePrice
        });

        tokenToAuctionId[tokenId] = auctionId;
        userAuctions[msg.sender].push(auctionId);

        emit AuctionCreated(auctionId, tokenId, msg.sender, startingPrice, block.timestamp + duration);
    }

    /**
     * @dev Place a bid on an auction
     */
    function placeBid(uint256 auctionId, uint256 bidAmount) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        if (!auction.isActive) revert AuctionNotActive();
        if (block.timestamp > auction.endTime) revert ExpiredAuction();

        uint256 minimumBid = auction.currentBid == 0 ? 
            auction.startingPrice : 
            auction.currentBid + auction.minBidIncrement;

        if (bidAmount < minimumBid) revert BidTooLow();
        if (HYPE.balanceOf(msg.sender) < bidAmount) revert InsufficientBalance();

        // Refund previous bidder
        if (auction.currentBidder != address(0)) {
            if (!HYPE.transfer(auction.currentBidder, auction.currentBid)) {
                revert TransferFailed();
            }
        }

        // Take new bid
        if (!HYPE.transferFrom(msg.sender, address(this), bidAmount)) {
            revert TransferFailed();
        }

        auction.currentBid = bidAmount;
        auction.currentBidder = msg.sender;

        // Extend auction if bid placed in last 10 minutes
        if (auction.endTime - block.timestamp < auctionExtensionTime) {
            auction.endTime = block.timestamp + auctionExtensionTime;
        }

        emit BidPlaced(auctionId, auction.tokenId, msg.sender, bidAmount);
    }

    /**
     * @dev End an auction and transfer assets
     */
    function endAuction(uint256 auctionId) external nonReentrant {
        Auction storage auction = auctions[auctionId];
        
        if (!auction.isActive) revert AuctionNotActive();
        if (block.timestamp <= auction.endTime) revert AuctionStillActive();

        auction.isActive = false;
        delete tokenToAuctionId[auction.tokenId];

        if (auction.currentBidder != address(0)) {
            // Check if reserve price was met
            if (auction.reservePrice > 0 && auction.currentBid < auction.reservePrice) {
                // Reserve not met, refund bidder
                if (!HYPE.transfer(auction.currentBidder, auction.currentBid)) {
                    revert TransferFailed();
                }
            } else {
                // Successful auction
                uint256 fee = (auction.currentBid * platformFee) / 10000;
                uint256 sellerAmount = auction.currentBid - fee;

                // Transfer payment
                if (!HYPE.transfer(feeRecipient, fee)) {
                    revert TransferFailed();
                }
                if (!HYPE.transfer(auction.seller, sellerAmount)) {
                    revert TransferFailed();
                }

                // Transfer NFT
                IERC721(address(hyperCards)).safeTransferFrom(
                    auction.seller,
                    auction.currentBidder,
                    auction.tokenId
                );

                // Update trading statistics
                _updateTradingStats(auction.tokenId, auction.currentBid);

                emit AuctionEnded(auctionId, auction.tokenId, auction.currentBidder, auction.currentBid);
            }
        }

        // Cancel all offers for this token
        _cancelAllOffers(auction.tokenId);
    }

    /**
     * @dev Make an offer on a card
     */
    function makeOffer(
        uint256 tokenId,
        uint256 price,
        uint256 duration
    ) external nonReentrant {
        if (price == 0) revert InvalidPrice();
        if (duration < minOfferDuration || duration > maxOfferDuration) {
            revert InvalidDuration();
        }

        if (HYPE.balanceOf(msg.sender) < price) revert InsufficientBalance();

        _offerIdCounter.increment();
        uint256 offerId = _offerIdCounter.current();

        offers[offerId] = Offer({
            tokenId: tokenId,
            buyer: msg.sender,
            price: price,
            isActive: true,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + duration
        });

        tokenOffers[tokenId].push(offerId);
        userOffers[msg.sender].push(offerId);

        emit OfferMade(offerId, tokenId, msg.sender, price, block.timestamp + duration);
    }

    /**
     * @dev Accept an offer
     */
    function acceptOffer(uint256 offerId) external nonReentrant {
        Offer storage offer = offers[offerId];
        
        if (!offer.isActive) revert OfferNotActive();
        if (block.timestamp > offer.expiresAt) revert ExpiredOffer();
        if (IERC721(address(hyperCards)).ownerOf(offer.tokenId) != msg.sender) {
            revert NotCardOwner();
        }

        if (HYPE.balanceOf(offer.buyer) < offer.price) {
            revert InsufficientBalance();
        }

        // Calculate fees
        uint256 fee = (offer.price * platformFee) / 10000;
        uint256 sellerAmount = offer.price - fee;

        // Transfer payment
        if (!HYPE.transferFrom(offer.buyer, feeRecipient, fee)) {
            revert TransferFailed();
        }
        if (!HYPE.transferFrom(offer.buyer, msg.sender, sellerAmount)) {
            revert TransferFailed();
        }

        // Transfer NFT
        IERC721(address(hyperCards)).safeTransferFrom(
            msg.sender,
            offer.buyer,
            offer.tokenId
        );

        // Update trading statistics
        _updateTradingStats(offer.tokenId, offer.price);

        // Update offer status
        offer.isActive = false;

        // Cancel listing if exists
        if (tokenToListingId[offer.tokenId] != 0) {
            _cancelListing(tokenToListingId[offer.tokenId]);
        }

        // Cancel auction if exists
        if (tokenToAuctionId[offer.tokenId] != 0) {
            _cancelAuction(tokenToAuctionId[offer.tokenId]);
        }

        // Cancel all other offers for this token
        _cancelAllOffers(offer.tokenId);

        emit OfferAccepted(offerId, offer.tokenId, msg.sender, offer.buyer, offer.price);
    }

    /**
     * @dev Add/remove card from favorites
     */
    function toggleFavorite(uint256 tokenId) external {
        bool currentState = userFavorites[msg.sender][tokenId];
        userFavorites[msg.sender][tokenId] = !currentState;
        
        if (!currentState) {
            userWatchlist[msg.sender].push(tokenId);
        } else {
            // Remove from watchlist
            uint256[] storage watchlist = userWatchlist[msg.sender];
            for (uint i = 0; i < watchlist.length; i++) {
                if (watchlist[i] == tokenId) {
                    watchlist[i] = watchlist[watchlist.length - 1];
                    watchlist.pop();
                    break;
                }
            }
        }

        emit CardFavorited(msg.sender, tokenId, !currentState);
    }

    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        
        if (listing.seller != msg.sender) revert NotCardOwner();
        if (!listing.isActive) revert ListingNotActive();

        _cancelListing(listingId);
    }

    /**
     * @dev Cancel an offer
     */
    function cancelOffer(uint256 offerId) external {
        Offer storage offer = offers[offerId];
        
        if (offer.buyer != msg.sender) revert NotCardOwner();
        if (!offer.isActive) revert OfferNotActive();

        offer.isActive = false;
        
        emit OfferCancelled(offerId, offer.tokenId);
    }

    /**
     * @dev Cancel an auction (only before first bid)
     */
    function cancelAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];
        
        if (auction.seller != msg.sender) revert NotCardOwner();
        if (!auction.isActive) revert AuctionNotActive();
        if (auction.currentBidder != address(0)) revert("Cannot cancel auction with bids");

        _cancelAuction(auctionId);
    }

    /**
     * @dev Internal function to update trading statistics
     */
    function _updateTradingStats(uint256 tokenId, uint256 price) internal {
        cardTotalTrades[tokenId]++;
        cardTotalVolume[tokenId] += price;
        
        // Update user trading volume
        address seller = IERC721(address(hyperCards)).ownerOf(tokenId);
        userTradingVolume[seller] += price;

        // Update floor price for rarity
        (, uint8 rarity,,,,,,,) = hyperCards.getCardInfo(tokenId);
        if (rarityFloorPrices[rarity] == 0 || price < rarityFloorPrices[rarity]) {
            uint256 oldFloor = rarityFloorPrices[rarity];
            rarityFloorPrices[rarity] = price;
            emit FloorPriceUpdated(rarity, oldFloor, price);
        }
    }

    /**
     * @dev Internal function to cancel a listing
     */
    function _cancelListing(uint256 listingId) internal {
        Listing storage listing = listings[listingId];
        listing.isActive = false;
        delete tokenToListingId[listing.tokenId];
        
        emit ListingCancelled(listingId, listing.tokenId);
    }

    /**
     * @dev Internal function to cancel an auction
     */
    function _cancelAuction(uint256 auctionId) internal {
        Auction storage auction = auctions[auctionId];
        auction.isActive = false;
        delete tokenToAuctionId[auction.tokenId];
    }

    /**
     * @dev Cancel all offers for a token
     */
    function _cancelAllOffers(uint256 tokenId) internal {
        uint256[] storage offerIds = tokenOffers[tokenId];
        
        for (uint256 i = 0; i < offerIds.length; i++) {
            offers[offerIds[i]].isActive = false;
            emit OfferCancelled(offerIds[i], tokenId);
        }
    }

    // Admin functions
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        if (_platformFee > MAX_PLATFORM_FEE) revert FeeTooHigh();
        platformFee = _platformFee;
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }

    function setTradingDurations(
        uint256 _minListingDuration,
        uint256 _maxListingDuration,
        uint256 _minOfferDuration,
        uint256 _maxOfferDuration,
        uint256 _minAuctionDuration,
        uint256 _maxAuctionDuration
    ) external onlyOwner {
        minListingDuration = _minListingDuration;
        maxListingDuration = _maxListingDuration;
        minOfferDuration = _minOfferDuration;
        maxOfferDuration = _maxOfferDuration;
        minAuctionDuration = _minAuctionDuration;
        maxAuctionDuration = _maxAuctionDuration;
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = HYPE.balanceOf(address(this));
        HYPE.transfer(owner(), balance);
    }

    // View functions
    function getTokenOffers(uint256 tokenId) external view returns (uint256[] memory) {
        return tokenOffers[tokenId];
    }

    function getUserListings(address user) external view returns (uint256[] memory) {
        return userListings[user];
    }

    function getUserOffers(address user) external view returns (uint256[] memory) {
        return userOffers[user];
    }

    function getUserAuctions(address user) external view returns (uint256[] memory) {
        return userAuctions[user];
    }

    function getUserWatchlist(address user) external view returns (uint256[] memory) {
        return userWatchlist[user];
    }

    function getCardTradingStats(uint256 tokenId) external view returns (uint256 trades, uint256 volume) {
        return (cardTotalTrades[tokenId], cardTotalVolume[tokenId]);
    }

    function getRarityFloorPrice(uint8 rarity) external view returns (uint256) {
        return rarityFloorPrices[rarity];
    }

    function isCardFavorited(address user, uint256 tokenId) external view returns (bool) {
        return userFavorites[user][tokenId];
    }
}