import crypto from 'node:crypto';
import { getConfig } from './config.js';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, expectedHex] = storedHash.split(':');
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    handle: row.handle,
    name: row.name,
    initials: row.initials,
    location: row.location,
    bio: row.bio,
    avatarUrl: row.avatar_url || '',
    coverImage: row.cover_image,
    countriesCount: row.countries_count ?? 1,
    createdAt: row.created_at,
  };
}

export function createSession(db, userId, res) {
  const cfg = getConfig();
  const rawToken = generateToken(32);
  const tokenHash = hashToken(rawToken);
  const id = `sess_${crypto.randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + cfg.sessionTtlDays * 24 * 60 * 60 * 1000
  );

  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, userId, tokenHash, expiresAt.toISOString(), now.toISOString());

  if (res) {
    res.cookie(cfg.sessionCookieName, rawToken, {
      httpOnly: true,
      sameSite: cfg.isProd && cfg.frontendOrigins.length > 0 ? 'none' : 'lax',
      secure: cfg.isProd,
      expires: expiresAt,
      path: '/',
    });
  }

  return rawToken;
}

export function clearSession(db, req, res) {
  const cfg = getConfig();
  const rawToken = extractToken(req, cfg.sessionCookieName);
  if (rawToken) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(
      hashToken(rawToken)
    );
  }
  res.clearCookie(cfg.sessionCookieName, { path: '/' });
}

function extractToken(req, cookieName) {
  const cookieToken = req.cookies?.[cookieName];
  if (cookieToken) return cookieToken;
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

export function attachUser(db) {
  const cfg = getConfig();
  return (req, _res, next) => {
    const rawToken = extractToken(req, cfg.sessionCookieName);
    if (!rawToken) {
      req.user = null;
      return next();
    }

    const row = db
      .prepare(
        `SELECT u.*
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`
      )
      .get(hashToken(rawToken), new Date().toISOString());

    req.user = sanitizeUser(row);
    next();
  };
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}
