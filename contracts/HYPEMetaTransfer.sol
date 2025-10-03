// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HYPEMetaTransfer {
    address public immutable tradingWallet;
    
    mapping(address => uint256) public nonces;
    
    bytes32 public constant TRANSFER_TYPEHASH = keccak256(
        "TransferRequest(address from,address to,uint256 amount,uint256 nonce,uint256 deadline)"
    );
    
    bytes32 public immutable DOMAIN_SEPARATOR;
    
    event MetaTransfer(address indexed from, address indexed to, uint256 amount, uint256 nonce, uint256 timestamp);
    
    constructor(address _tradingWallet) {
        require(_tradingWallet != address(0), "Invalid trading wallet");
        tradingWallet = _tradingWallet;
        
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("HYPEMetaTransfer")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }
    
    function executeMetaTransfer(
        address from,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp <= deadline, "Signature expired");
        require(amount > 0, "Invalid amount");
        
        uint256 currentNonce = nonces[from];
        
        bytes32 structHash = keccak256(
            abi.encode(
                TRANSFER_TYPEHASH,
                from,
                tradingWallet,
                amount,
                currentNonce,
                deadline
            )
        );
        
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );
        
        address signer = ecrecover(digest, v, r, s);
        require(signer == from, "Invalid signature");
        require(signer != address(0), "Invalid signer");
        
        nonces[from] = currentNonce + 1;
        
        (bool success, ) = tradingWallet.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit MetaTransfer(from, tradingWallet, amount, currentNonce, block.timestamp);
    }
    
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }
    
    receive() external payable {}
}
