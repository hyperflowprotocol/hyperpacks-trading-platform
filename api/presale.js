// Simple Vercel API function for cross-browser presale sync
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get current presale progress
      const result = await pool.query(`
        SELECT total_raised, updated_at 
        FROM presale_progress 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      
      let totalRaised = 500.0; // Default baseline
      
      if (result.rows.length > 0) {
        totalRaised = parseFloat(result.rows[0].total_raised);
      } else {
        // Insert initial record
        await pool.query('INSERT INTO presale_progress (total_raised) VALUES ($1)', [totalRaised]);
      }
      
      // Calculate progress
      const TARGET_RAISE = 3000;
      const HYPACK_PER_HYPE = 108000;
      const progressPercentage = Math.min((totalRaised / TARGET_RAISE) * 100, 100);
      const realTimeBalance = Math.floor(totalRaised * HYPACK_PER_HYPE);
      
      return res.status(200).json({
        success: true,
        data: {
          total_raised: totalRaised,
          target_raise: TARGET_RAISE,
          progress_percentage: progressPercentage,
          real_time_balance: realTimeBalance
        }
      });
      
    } else if (req.method === 'POST') {
      // Update presale progress
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount required'
        });
      }
      
      // Get current total
      const currentResult = await pool.query(`
        SELECT total_raised 
        FROM presale_progress 
        ORDER BY updated_at DESC 
        LIMIT 1
      `);
      
      let currentTotal = 500.0;
      if (currentResult.rows.length > 0) {
        currentTotal = parseFloat(currentResult.rows[0].total_raised);
      }
      
      // Add new amount
      const newTotal = currentTotal + parseFloat(amount);
      
      // Insert new record
      await pool.query('INSERT INTO presale_progress (total_raised) VALUES ($1)', [newTotal]);
      
      // Calculate new progress
      const TARGET_RAISE = 3000;
      const HYPACK_PER_HYPE = 108000;
      const progressPercentage = Math.min((newTotal / TARGET_RAISE) * 100, 100);
      const realTimeBalance = Math.floor(newTotal * HYPACK_PER_HYPE);
      
      return res.status(200).json({
        success: true,
        data: {
          total_raised: newTotal,
          target_raise: TARGET_RAISE,
          progress_percentage: progressPercentage,
          real_time_balance: realTimeBalance,
          amount_added: parseFloat(amount)
        }
      });
      
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database error'
    });
  }
}