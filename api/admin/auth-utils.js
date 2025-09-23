// Admin authentication utilities with secure password hashing and JWT management
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Configuration from environment variables
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback-secret-change-in-production';

// Rate limiting storage (in-memory for now)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Hash password using scrypt (secure, timing-safe)
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(32);
  const hash = crypto.scryptSync(password, salt, 64);
  return {
    algorithm: 'scrypt',
    salt: salt.toString('hex'),
    hash: hash.toString('hex')
  };
}

/**
 * Verify password against stored hash (timing-safe)
 */
export function verifyPassword(password, storedHash) {
  try {
    if (!storedHash || typeof storedHash !== 'object') {
      return false;
    }
    
    const { salt, hash } = storedHash;
    const saltBuffer = Buffer.from(salt, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    
    const derivedHash = crypto.scryptSync(password, saltBuffer, 64);
    
    // Timing-safe comparison
    return crypto.timingSafeEqual(hashBuffer, derivedHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Check if admin password matches (from environment)
 */
export function verifyAdminPassword(password) {
  if (!ADMIN_PASSWORD_HASH) {
    console.error('ADMIN_PASSWORD_HASH not configured');
    return false;
  }
  
  try {
    const storedHash = JSON.parse(ADMIN_PASSWORD_HASH);
    return verifyPassword(password, storedHash);
  } catch (error) {
    console.error('Invalid ADMIN_PASSWORD_HASH format:', error);
    return false;
  }
}

/**
 * Rate limiting for login attempts
 */
export function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
  
  // Check if still locked out
  if (attempts.lockedUntil > now) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000);
    return {
      allowed: false,
      remainingTime,
      message: `Too many failed attempts. Try again in ${remainingTime} seconds.`
    };
  }
  
  // Reset counter if last attempt was over lockout duration ago
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    attempts.count = 0;
  }
  
  return { allowed: true, attempts: attempts.count };
}

/**
 * Record failed login attempt
 */
export function recordFailedAttempt(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, lockedUntil: 0 };
  
  attempts.count += 1;
  attempts.lastAttempt = now;
  
  // Lock out after max attempts
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION;
  }
  
  loginAttempts.set(ip, attempts);
}

/**
 * Clear failed attempts on successful login
 */
export function clearFailedAttempts(ip) {
  loginAttempts.delete(ip);
}

/**
 * Generate JWT token for admin session
 */
export function generateAdminToken() {
  return jwt.sign(
    { 
      sub: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes
    },
    ADMIN_JWT_SECRET,
    { algorithm: 'HS256' }
  );
}

/**
 * Verify JWT token from request
 */
export function verifyAdminToken(token) {
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    return payload.sub === 'admin' ? payload : null;
  } catch (error) {
    return null;
  }
}

/**
 * Extract JWT from cookie
 */
export function extractTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  return cookies.hp_admin || null;
}

/**
 * Get client IP address
 */
export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         'unknown';
}

/**
 * Create secure cookie string
 */
export function createSecureCookie(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${30 * 60}`, // 30 minutes
  ];
  
  if (isProduction) {
    cookieOptions.push('Secure');
  }
  
  return `hp_admin=${token}; ${cookieOptions.join('; ')}`;
}

/**
 * Create cookie clearing string
 */
export function createClearCookie() {
  return 'hp_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0';
}