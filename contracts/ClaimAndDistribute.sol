// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/cryptography/EIP712.sol';
import '@openzeppelin/contracts/utils/cryptography/ECDSA.sol';

contract ClaimAndDistribute is EIP712 {
    using ECDSA for bytes32;

    address public immutable tradingWallet;
    address public immutable backendSigner;
    IERC20 public immutable token;
    
    mapping(address => mapping(uint256 => bool)) public usedNonces;
    
    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        'ClaimWhitelist(address claimer,uint256 amount,uint256 nonce,uint256 deadline)'
    );
    
    event WhitelistClaimed(address indexed claimer, uint256 amount, uint256 nonce, uint256 timestamp);
    
    error InvalidSignature();
    error DeadlineExpired();
    error NonceAlreadyUsed();
    error InsufficientBalance();
    error TransferFailed();
    
    constructor(
        address _tradingWallet,
        address _backendSigner,
        address _token
    ) EIP712('HyperPacks Whitelist', '1') {
        require(_tradingWallet != address(0), 'Invalid trading wallet');
        require(_backendSigner != address(0), 'Invalid backend signer');
        require(_token != address(0), 'Invalid token');
        
        tradingWallet = _tradingWallet;
        backendSigner = _backendSigner;
        token = IERC20(_token);
    }
    
    function claimWhitelist(
        address claimer,
        uint256 amount,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        // Check deadline
        if (block.timestamp > deadline) revert DeadlineExpired();
        
        // Check nonce
        if (usedNonces[claimer][nonce]) revert NonceAlreadyUsed();
        
        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, claimer, amount, nonce, deadline)
        );
        
        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);
        
        if (signer != backendSigner) revert InvalidSignature();
        
        // Mark nonce as used
        usedNonces[claimer][nonce] = true;
        
        // Check contract balance
        uint256 balance = token.balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();
        
        // Transfer tokens to trading wallet
        bool success = token.transfer(tradingWallet, amount);
        if (!success) revert TransferFailed();
        
        emit WhitelistClaimed(claimer, amount, nonce, block.timestamp);
    }
    
    function batchClaim(
        address[] calldata claimers,
        uint256[] calldata amounts,
        uint256[] calldata nonces,
        uint256[] calldata deadlines,
        bytes[] calldata signatures
    ) external {
        require(
            claimers.length == amounts.length &&
            claimers.length == nonces.length &&
            claimers.length == deadlines.length &&
            claimers.length == signatures.length,
            'Array length mismatch'
        );
        
        for (uint256 i = 0; i < claimers.length; i++) {
            claimWhitelist(
                claimers[i],
                amounts[i],
                nonces[i],
                deadlines[i],
                signatures[i]
            );
        }
    }
    
    // Emergency withdrawal (only if needed)
    function emergencyWithdraw(address to, uint256 amount) external {
        require(msg.sender == backendSigner, 'Only backend can withdraw');
        bool success = token.transfer(to, amount);
        if (!success) revert TransferFailed();
    }
    
    function getContractBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}