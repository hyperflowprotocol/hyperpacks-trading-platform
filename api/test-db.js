const { Pool } = require('pg');

module.exports = async (req, res) => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query('SELECT NOW()');
    
    res.json({
      success: true,
      timestamp: result.rows[0].now,
      env_vars_present: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        BACKEND_PRIVATE_KEY: !!process.env.BACKEND_PRIVATE_KEY,
        HYPEREVM_RPC_URL: !!process.env.HYPEREVM_RPC_URL,
        WHITELIST_CLAIM_CONTRACT: !!process.env.WHITELIST_CLAIM_CONTRACT
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      detail: error.detail
    });
  }
};
