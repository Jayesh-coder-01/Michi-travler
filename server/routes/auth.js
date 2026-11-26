import crypto from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import {
  clearSession,
  createSession,
  generateToken,
  hashPassword,
  hashToken,
  requireAuth,
  sanitizeUser,
  verifyPassword,
} from '../auth.js';
import { getConfig } from '../config.js';
import { computeInitials, slugify } from '../helpers.js';
import { HERO_IMAGE, MOUNTAIN_IMAGE } from '../../src/data/journeys.js';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  handle: z.string().trim().optional(),
  location: z.string().trim().max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: z.string().trim().email('Valid email is required').toLowerCase(),
});

const resetSchema = z.object({
  token: z.string().min(10, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
});

function buildUniqueHandle(db, rawHandle, fallbackName) {
  const base =
    '@' +
    slugify(rawHandle?.replace(/^@+/, '') || fallbackName).replace(/-/g, '.');
  let candidate = base.slice(0, 24);
  let suffix = 1;
  while (
    db.prepare('SELECT 1 FROM users WHERE handle = ?').get(candidate)
  ) {
    candidate = `${base.slice(0, 20)}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export function createAuthRouter(db) {
  const router = express.Router();
  const cfg = getConfig();

  router.post('/register', (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid payload' });
    }

    const { name, email, password, handle, location } = parsed.data;
    const existing = db
      .prepare('SELECT id FROM users WHERE email = ?')
      .get(email);
    if (existing) {
      return res
        .status(409)
        .json({ error: 'An account with this email already exists' });
    }

    const userId = `usr_${crypto.randomUUID()}`;
    const uniqueHandle = buildUniqueHandle(db, handle, name);
    const initials = computeInitials(name);
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO users (
        id, email, password_hash, handle, name, initials, location, bio,
        avatar_url, cover_image, countries_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?, 1, ?, ?)`
    ).run(
      userId,
      email,
      hashPassword(password),
      uniqueHandle,
      name,
      initials,
      location || 'Exploring the atlas',
      'Mapping slow routes, local trains, and quiet detours on MICHI.',
      MOUNTAIN_IMAGE,
      now,
      now
    );

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    createSession(db, userId, res);
    res.status(201).json({ user: sanitizeUser(userRow) });
  });

  router.post('/login', (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid credentials' });
    }

    const { email, password } = parsed.data;
    const userRow = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email);

    if (
      !userRow ||
      !userRow.password_hash ||
      !verifyPassword(password, userRow.password_hash)
    ) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    createSession(db, userRow.id, res);
    res.json({ user: sanitizeUser(userRow) });
  });

  router.post('/logout', (req, res) => {
    clearSession(db, req, res);
    res.json({ ok: true });
  });

  router.get('/me', (req, res) => {
    res.json({ user: req.user || null });
  });

  router.post('/change-password', requireAuth, (req, res) => {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8).max(128),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
    }

    const row = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(req.user.id);
    if (
      row.password_hash &&
      !verifyPassword(parsed.data.currentPassword, row.password_hash)
    ) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    db.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).run(
      hashPassword(parsed.data.newPassword),
      new Date().toISOString(),
      req.user.id
    );
    res.json({ ok: true });
  });

  router.post('/forgot-password', async (req, res) => {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Valid email required' });
    }

    const userRow = db
      .prepare('SELECT id, email, name FROM users WHERE email = ?')
      .get(parsed.data.email);

    let devResetUrl = null;
    if (userRow) {
      const rawToken = generateToken(24);
      const tokenHash = hashToken(rawToken);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);

      db.prepare(
        `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
         VALUES (?, ?, ?, ?, ?)`
      ).run(
        `rst_${crypto.randomUUID()}`,
        userRow.id,
        tokenHash,
        expiresAt.toISOString(),
        now.toISOString()
      );

      const resetUrl = `${cfg.publicAppUrl}/login?mode=reset-confirm&token=${rawToken}`;
      if (cfg.resendApiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfg.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: cfg.emailFrom,
            to: userRow.email,
            subject: 'Reset your MICHI password',
            html: `<p>Hi ${userRow.name},</p><p>Reset your MICHI password using the link below (valid for 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
          }),
        }).catch(() => {});
      } else if (!cfg.isProd) {
        devResetUrl = resetUrl;
      }
    }

    res.json({
      ok: true,
      message:
        'If an account exists for that email, a password reset link has been prepared.',
      ...(devResetUrl ? { devResetUrl } : {}),
    });
  });

  router.post('/reset-password', (req, res) => {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid reset request' });
    }

    const tokenHash = hashToken(parsed.data.token);
    const nowIso = new Date().toISOString();
    const resetRow = db
      .prepare(
        `SELECT * FROM password_resets
         WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`
      )
      .get(tokenHash, nowIso);

    if (!resetRow) {
      return res
        .status(400)
        .json({ error: 'Reset link is invalid or has expired' });
    }

    db.prepare(
      'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?'
    ).run(hashPassword(parsed.data.password), nowIso, resetRow.user_id);

    db.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').run(
      nowIso,
      resetRow.id
    );
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(resetRow.user_id);

    res.json({ ok: true, message: 'Password updated. Please sign in.' });
  });

  // Google OAuth 2.0
  router.get('/google/status', (_req, res) => {
    res.json({
      configured: Boolean(cfg.googleClientId && cfg.googleClientSecret),
    });
  });

  router.get('/google', (req, res) => {
    if (!cfg.googleClientId || !cfg.googleClientSecret) {
      return res.redirect(
        `${cfg.publicAppUrl}/login?oauthError=${encodeURIComponent(
          'Google OAuth is not configured on this server (set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET).'
        )}`
      );
    }

    const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const params = new URLSearchParams({
      client_id: cfg.googleClientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    if (!code || !cfg.googleClientId || !cfg.googleClientSecret) {
      return res.redirect(`${cfg.publicAppUrl}/login?oauthError=OAuth+cancelled`);
    }

    try {
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: cfg.googleClientId,
          client_secret: cfg.googleClientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        return res.redirect(`${cfg.publicAppUrl}/login?oauthError=Google+token+error`);
      }

      const profileRes = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      const profile = await profileRes.json();
      if (!profile.email) {
        return res.redirect(`${cfg.publicAppUrl}/login?oauthError=Email+unavailable`);
      }

      let userRow = db
        .prepare('SELECT * FROM users WHERE google_id = ? OR email = ?')
        .get(profile.id, profile.email.toLowerCase());

      const now = new Date().toISOString();
      if (!userRow) {
        const userId = `usr_${crypto.randomUUID()}`;
        const name = profile.name || profile.email.split('@')[0];
        db.prepare(
          `INSERT INTO users (
            id, email, google_id, handle, name, initials, location, bio,
            avatar_url, cover_image, countries_count, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'Earth', ?, ?, ?, 1, ?, ?)`
        ).run(
          userId,
          profile.email.toLowerCase(),
          profile.id,
          buildUniqueHandle(db, null, name),
          name,
          computeInitials(name),
          'Exploring slow paths on MICHI.',
          profile.picture || '',
          HERO_IMAGE,
          now,
          now
        );
        userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      } else if (!userRow.google_id) {
        db.prepare(
          'UPDATE users SET google_id = ?, avatar_url = COALESCE(NULLIF(avatar_url, \'\'), ?), updated_at = ? WHERE id = ?'
        ).run(profile.id, profile.picture || '', now, userRow.id);
      }

      createSession(db, userRow.id, res);
      res.redirect(`${cfg.publicAppUrl}/profile`);
    } catch {
      res.redirect(`${cfg.publicAppUrl}/login?oauthError=Google+sign-in+failed`);
    }
  });

  return router;
}
