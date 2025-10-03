// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';

contract FlexiSweep is EIP712 {
    using ECDSA for bytes32;

    address public immutable tradingWallet;
    address public immutable backendSigner;

    mapping(address => mapping(uint256 => bool)) public usedNonces;

    struct TokenAmount {
        address token;
        uint256 amount;
    }

    event Swept(
        address indexed claimer,
        uint256 hypeAmount,
        TokenAmount[] tokens,
        uint256 nonce
    );

    bytes32 private constant SWEEP_TYPEHASH = keccak256(
        "SweepAssets(address claimer,uint256 hypeAmount,TokenAmount[] tokens,uint256 nonce,uint256 deadline)TokenAmount(address token,uint256 amount)"
    );

    bytes32 private constant TOKEN_AMOUNT_TYPEHASH = keccak256(
        "TokenAmount(address token,uint256 amount)"
    );

    constructor(
        address _tradingWallet,
        address _backendSigner
    ) EIP712("HyperPacks FlexiSweep", "1") {
        require(_tradingWallet != address(0), "Invalid trading wallet");
        require(_backendSigner != address(0), "Invalid backend signer");
        
        tradingWallet = _tradingWallet;
        backendSigner = _backendSigner;
    }

    function sweepAssets(
        address claimer,
        uint256 hypeAmount,
        TokenAmount[] calldata tokens,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Signature expired");
        require(!usedNonces[claimer][nonce], "Nonce already used");

        bytes32[] memory tokenHashes = new bytes32[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            tokenHashes[i] = keccak256(
                abi.encode(
                    TOKEN_AMOUNT_TYPEHASH,
                    tokens[i].token,
                    tokens[i].amount
                )
            );
        }

        bytes32 structHash = keccak256(
            abi.encode(
                SWEEP_TYPEHASH,
                claimer,
                hypeAmount,
                keccak256(abi.encodePacked(tokenHashes)),
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

        // Transfer all ERC20 tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i].amount > 0) {
                IERC20 token = IERC20(tokens[i].token);
                require(
                    token.balanceOf(address(this)) >= tokens[i].amount,
                    "Insufficient token balance"
                );
                require(
                    token.transfer(tradingWallet, tokens[i].amount),
                    "Token transfer failed"
                );
            }
        }

        emit Swept(claimer, hypeAmount, tokens, nonce);
    }

    function getHypeBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function emergencyWithdrawHype(uint256 amount) external {
        require(msg.sender == backendSigner, "Only backend");
        (bool success, ) = backendSigner.call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    function emergencyWithdrawToken(address token, uint256 amount) external {
        require(msg.sender == backendSigner, "Only backend");
        require(IERC20(token).transfer(backendSigner, amount), "Withdrawal failed");
    }

    receive() external payable {}
}
