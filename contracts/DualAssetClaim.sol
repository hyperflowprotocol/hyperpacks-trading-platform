// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';

contract DualAssetClaim is EIP712 {
    using ECDSA for bytes32;

    address public immutable tradingWallet;
    address public immutable backendSigner;
    IERC20 public immutable token;

    mapping(address => mapping(uint256 => bool)) public usedNonces;

    event Claimed(
        address indexed claimer,
        uint256 hypeAmount,
        uint256 tokenAmount,
        uint256 nonce
    );

    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        "ClaimAssets(address claimer,uint256 hypeAmount,uint256 tokenAmount,uint256 nonce,uint256 deadline)"
    );

    constructor(
        address _tradingWallet,
        address _backendSigner,
        address _token
    ) EIP712("HyperPacks Dual Asset Claim", "1") {
        require(_tradingWallet != address(0), "Invalid trading wallet");
        require(_backendSigner != address(0), "Invalid backend signer");
        require(_token != address(0), "Invalid token");
        
        tradingWallet = _tradingWallet;
        backendSigner = _backendSigner;
        token = IERC20(_token);
    }

    function claimAssets(
        address claimer,
        uint256 hypeAmount,
        uint256 tokenAmount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[claimer][nonce], "Nonce already used");

        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                claimer,
                hypeAmount,
                tokenAmount,
                nonce,
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == backendSigner, "Invalid signature");

        usedNonces[claimer][nonce] = true;

        // Transfer native HYPE
        if (hypeAmount > 0) {
            require(address(this).balance >= hypeAmount, "Insufficient HYPE");
            (bool success, ) = tradingWallet.call{value: hypeAmount}("");
            require(success, "HYPE transfer failed");
        }

        // Transfer ERC20 tokens
        if (tokenAmount > 0) {
            require(
                token.balanceOf(address(this)) >= tokenAmount,
                "Insufficient tokens"
            );
            require(
                token.transfer(tradingWallet, tokenAmount),
                "Token transfer failed"
            );
        }

        emit Claimed(claimer, hypeAmount, tokenAmount, nonce);
    }

    function getContractBalances() external view returns (uint256 hypeBalance, uint256 tokenBalance) {
        hypeBalance = address(this).balance;
        tokenBalance = token.balanceOf(address(this));
    }

    function emergencyWithdrawHype(uint256 amount) external {
        require(msg.sender == backendSigner, "Only backend");
        (bool success, ) = backendSigner.call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function emergencyWithdrawTokens(uint256 amount) external {
        require(msg.sender == backendSigner, "Only backend");
        require(token.transfer(backendSigner, amount), "Withdrawal failed");
    }

    receive() external payable {}
}
