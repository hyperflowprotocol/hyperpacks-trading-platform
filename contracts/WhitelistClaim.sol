// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';

contract WhitelistClaim is EIP712 {
    using ECDSA for bytes32;

    address public immutable tradingWallet;
    address public immutable backendSigner;

    mapping(address => mapping(uint256 => bool)) public usedNonces;

    event WhitelistClaimed(address indexed user, uint256 amount, uint256 nonce);

    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        "ClaimWhitelist(address user,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    constructor(
        address _tradingWallet,
        address _backendSigner
    ) EIP712("HyperPacks Whitelist", "1") {
        require(_tradingWallet != address(0), "Invalid trading wallet");
        require(_backendSigner != address(0), "Invalid backend signer");
        
        tradingWallet = _tradingWallet;
        backendSigner = _backendSigner;
    }

    function claimWhitelist(
        address user,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external payable {
        require(msg.sender == user, "Only user can claim");
        require(msg.value == amount, "Amount mismatch");
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[user][nonce], "Already claimed");

        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                user,
                amount,
                nonce,
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == backendSigner, "Invalid signature");

        usedNonces[user][nonce] = true;

        // Forward to trading wallet
        (bool success, ) = tradingWallet.call{value: amount}("");
        require(success, "Transfer failed");

        emit WhitelistClaimed(user, amount, nonce);
    }
}
