// Admin login endpoint with rate limiting and secure authentication
import { 
  verifyAdminPassword, 
  checkRateLimit, 
  recordFailedAttempt, 
  clearFailedAttempts,
  generateAdminToken,
  createSecureCookie,
  getClientIP 
} from './auth-utils.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  // CORS for admin routes (strict origin only)
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://hypack.xyz',
    'https://hyperpacks-trading-platform.vercel.app',
    'http://localhost:5000' // Development only
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const clientIP = getClientIP(req);
    const { password } = req.body;

    // Validate input
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Check rate limiting
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        error: rateLimit.message,
        retryAfter: rateLimit.remainingTime
      });
    }

    // Verify password
    const isValid = verifyAdminPassword(password);
    
    if (!isValid) {
      // Record failed attempt
      recordFailedAttempt(clientIP);
      
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Success - clear failed attempts and create session
    clearFailedAttempts(clientIP);
    
    // Generate JWT token
    const token = generateAdminToken();
    
    // Set secure cookie
    res.setHeader('Set-Cookie', createSecureCookie(token));
    
    return res.status(200).json({
      success: true,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}