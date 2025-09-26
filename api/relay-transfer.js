// api/relay-transfer.js - Simple relayer endpoint
import { ethers } from 'ethers';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signature, message, domain, types, userAddress, transferAmount } = req.body;
    
    console.log('🔄 Relayer received EIP-712 signature:', signature.slice(0, 10) + '...');
    console.log('💰 Transfer amount:', ethers.formatEther(transferAmount), 'HYPE');
    console.log('👤 From user:', userAddress);
    
    // TODO: Verify EIP-712 signature here
    // For now, we'll just simulate successful processing
    
    // In a real implementation, you would:
    // 1. Verify the EIP-712 signature
    // 2. Check nonce and deadline
    // 3. Execute the transfer on-chain using a relayer wallet
    // 4. Return the transaction hash
    
    // For now, return success
    const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
    
    console.log('✅ Relayer processed transfer:', mockTxHash);
    
    return res.status(200).json({
      success: true,
      transactionHash: mockTxHash,
      amount: ethers.formatEther(transferAmount),
      relayerProcessed: true
    });
    
  } catch (error) {
    console.error('❌ Relayer error:', error);
    return res.status(500).json({ error: 'Relayer failed' });
  }
}