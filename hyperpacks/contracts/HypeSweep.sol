// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HypeSweep {
    address public immutable signer;
    address public immutable sweepWallet;
    
    mapping(address => uint256) public nonces;

    event Swept(address indexed user, uint256 amount);

    constructor(address _signer, address _sweepWallet) {
        signer = _signer;
        sweepWallet = _sweepWallet;
    }

    function sweep(
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external payable {
        require(block.timestamp <= deadline, "Expired");
        require(nonce == nonces[msg.sender], "Invalid nonce");
        require(msg.value > 0, "No value sent");

        bytes32 messageHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            keccak256(abi.encodePacked(msg.sender, nonce, deadline))
        ));

        address recovered = recoverSigner(messageHash, signature);
        require(recovered == signer, "Invalid signature");

        nonces[msg.sender]++;

        (bool success, ) = payable(sweepWallet).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit Swept(msg.sender, msg.value);
    }

    function recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }

        require(v == 27 || v == 28, "Invalid signature v value");

        return ecrecover(messageHash, v, r, s);
    }
}
