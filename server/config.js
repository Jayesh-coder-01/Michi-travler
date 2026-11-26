import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  process.loadEnvFile();
} catch {
  // .env is optional when environment variables are provided by the host
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveWritableDir(preferredDir, fallbackDir) {
  try {
    fs.mkdirSync(preferredDir, { recursive: true });
    fs.accessSync(preferredDir, fs.constants.W_OK);
    return preferredDir;
  } catch (err) {
    console.warn(
      `[config] Cannot write to "${preferredDir}" (${err.code || err.message}); falling back to "${fallbackDir}"`
    );
    fs.mkdirSync(fallbackDir, { recursive: true });
    return fallbackDir;
  }
}

function resolveWritableFilePath(preferredPath, fallbackPath) {
  if (preferredPath === ':memory:') return preferredPath;
  const writableDir = resolveWritableDir(
    path.dirname(preferredPath),
    path.dirname(fallbackPath)
  );
  return writableDir === path.dirname(preferredPath)
    ? preferredPath
    : fallbackPath;
}

export function getConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const defaultDbPath = path.join(__dirname, 'michi.db');
  const defaultUploadDir = path.join(__dirname, 'uploads');

  return {
    port: Number(process.env.PORT || 3001),
    isProd,
    dbPath: resolveWritableFilePath(
      process.env.DB_PATH || defaultDbPath,
      defaultDbPath
    ),
    uploadDir: resolveWritableDir(
      process.env.UPLOAD_DIR || defaultUploadDir,
      defaultUploadDir
    ),
    sessionSecret:
      process.env.SESSION_SECRET || 'michi-dev-session-secret-change-in-prod',
    sessionCookieName: 'michi_session',
    sessionTtlDays: 30,
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    emailFrom: process.env.EMAIL_FROM || 'MICHI <noreply@michi.travel>',
    frontendOrigins: (process.env.FRONTEND_URL || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    publicAppUrl: process.env.PUBLIC_APP_URL || 'http://localhost:5173',
  };
}
