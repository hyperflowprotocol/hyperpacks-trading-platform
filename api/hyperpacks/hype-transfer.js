const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.HYPEREVM_RPC_URL);
const backendWallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

const hypeMetaABI = [
  "function executeMetaTransfer(address from, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
  "function getNonce(address user) view returns (uint256)"
];

module.exports = async (req, res) => {
  const { from, amount, deadline, signature } = req.body;
  
  if (!from || !amount || !deadline || !signature) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const hypeMetaContract = new ethers.Contract(
      process.env.HYPE_META_CONTRACT,
      hypeMetaABI,
      backendWallet
    );
    
    const { v, r, s } = ethers.Signature.from(signature);
    
    const tx = await hypeMetaContract.executeMetaTransfer(
      from,
      amount,
      deadline,
      v,
      r,
      s
    );
    
    const receipt = await tx.wait();
    
    res.json({
      success: true,
      txHash: receipt.hash,
      message: 'HYPE transferred successfully'
    });
    
  } catch (error) {
    console.error('HYPE transfer error:', error);
    
    if (error.message.includes('Signature expired')) {
      return res.status(400).json({ error: 'Signature expired' });
    }
    if (error.message.includes('Invalid signature')) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    res.status(500).json({ error: 'Transfer failed' });
  }
};
