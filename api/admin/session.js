// Admin session check endpoint
import { extractTokenFromCookie, verifyAdminToken } from './auth-utils.js';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  // CORS for admin routes
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://hypack.xyz',
    'https://hyperpacks-trading-platform.vercel.app',
    'http://localhost:5000' // Development only
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Extract token from cookie
    const token = extractTokenFromCookie(req.headers.cookie);
    
    if (!token) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        message: 'No session found'
      });
    }

    // Verify token
    const payload = verifyAdminToken(token);
    
    if (!payload) {
      return res.status(200).json({
        success: true,
        authenticated: false,
        message: 'Invalid or expired session'
      });
    }

    // Valid session
    return res.status(200).json({
      success: true,
      authenticated: true,
      expiresAt: payload.exp * 1000 // Convert to milliseconds
    });

  } catch (error) {
    console.error('Session check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}