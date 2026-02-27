const { OAuth2Client } = require('google-auth-library');
const { getOrCreateUser } = require('../services/supabaseClient');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies Google OAuth token from Apps Script (ScriptApp.getOAuthToken())
 * and attaches user info to req.user
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization token', code: 'AUTH_MISSING' });
    }

    const token = authHeader.split(' ')[1];

    // Verify Google OAuth token
    const tokenInfo = await googleClient.getTokenInfo(token);

    if (!tokenInfo.email) {
      return res.status(401).json({ error: 'Invalid token: no email', code: 'AUTH_INVALID' });
    }

    // Get or create user in Supabase
    const user = await getOrCreateUser(tokenInfo.email, tokenInfo.email.split('@')[0]);

    req.user = {
      id: user.id,
      email: tokenInfo.email,
      googleToken: token,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error.message);

    if (error.message.includes('expired')) {
      return res.status(401).json({ error: 'Token expired', code: 'AUTH_EXPIRED' });
    }

    return res.status(401).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
  }
}

module.exports = { authMiddleware };
