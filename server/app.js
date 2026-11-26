import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { attachUser } from './auth.js';
import { getConfig } from './config.js';
import { createAuthRouter } from './routes/auth.js';
import { createJourneysRouter } from './routes/journeys.js';
import { createUsersRouter } from './routes/users.js';
import { createFieldNotesRouter } from './routes/fieldNotes.js';
import { createUploadsRouter } from './routes/uploads.js';
import { createChatRouter } from './routes/chat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

export function createApp(db, options = {}) {
  const cfg = getConfig();
  const app = express();
  const enableRateLimit = options.rateLimit ?? cfg.isProd;

  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: cfg.frontendOrigins.length > 0 ? cfg.frontendOrigins : true,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(attachUser(db));

  if (enableRateLimit) {
    app.use(
      '/api/auth',
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 40,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
    app.use(
      '/api/chat',
      rateLimit({
        windowMs: 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
  }

  fs.mkdirSync(cfg.uploadDir, { recursive: true });
  app.use('/uploads', express.static(cfg.uploadDir));

  app.get('/api/health', (_req, res) => {
    const counts = {
      users: db.prepare('SELECT COUNT(*) AS c FROM users').get().c,
      journeys: db
        .prepare("SELECT COUNT(*) AS c FROM journeys WHERE status = 'published'")
        .get().c,
      fieldNotes: db
        .prepare("SELECT COUNT(*) AS c FROM field_notes WHERE status = 'published'")
        .get().c,
    };
    res.json({ ok: true, database: 'sqlite', counts });
  });

  app.get('/api/stats', (_req, res) => {
    const users = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    const journeys = db
      .prepare("SELECT COUNT(*) AS c FROM journeys WHERE status = 'published'")
      .get().c;
    const stops = db.prepare('SELECT COUNT(*) AS c FROM journey_stops').get().c;
    res.json({ users, journeys, stops });
  });

  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/journeys', createJourneysRouter(db));
  app.use('/api/users', createUsersRouter(db));
  app.use('/api/field-notes', createFieldNotesRouter(db));
  app.use('/api', createUploadsRouter());
  app.use('/api/chat', createChatRouter(db));

  // Serve built React SPA in production
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Centralized error handler
  app.use((err, _req, res, _next) => {
    console.error('[MICHI API Error]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  });

  return app;
}
