import path from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  process.loadEnvFile();
} catch {
  // .env is optional when environment variables are provided by the host
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    port: Number(process.env.PORT || 3001),
    isProd,
    dbPath: process.env.DB_PATH || path.join(__dirname, 'michi.db'),
    uploadDir: process.env.UPLOAD_DIR || path.join(__dirname, 'uploads'),
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
