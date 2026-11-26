import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import multer from 'multer';
import { requireAuth } from '../auth.js';
import { getConfig } from '../config.js';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const FALLBACK_PLACES = [
  { name: 'Kyoto, Japan', lat: 35.0116, lng: 135.7681 },
  { name: 'Ohara, Kyoto, Japan', lat: 35.1194, lng: 135.8342 },
  { name: 'Kurama, Kyoto, Japan', lat: 35.1144, lng: 135.7711 },
  { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Takamatsu, Japan', lat: 34.3428, lng: 134.0466 },
  { name: 'Iya Valley, Tokushima, Japan', lat: 33.8758, lng: 133.8339 },
  { name: 'Kochi, Japan', lat: 33.5588, lng: 133.5312 },
  { name: 'Kamakura, Japan', lat: 35.3192, lng: 139.5467 },
  { name: 'Matsumoto, Japan', lat: 36.238, lng: 137.972 },
  { name: 'Takayama, Japan', lat: 36.1461, lng: 137.2522 },
  { name: 'Kanazawa, Japan', lat: 36.5613, lng: 136.6562 },
  { name: 'Naoshima, Japan', lat: 34.4601, lng: 133.9957 },
];

export function createUploadsRouter() {
  const router = express.Router();
  const cfg = getConfig();
  fs.mkdirSync(cfg.uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, cfg.uploadDir),
    filename: (_req, file, cb) => {
      const ext =
        path.extname(file.originalname || '').toLowerCase() || '.jpg';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
        ? ext
        : '.jpg';
      cb(null, `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${safeExt}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIMES.has(file.mimetype)) {
        return cb(new Error('Only JPG, PNG, WebP, or GIF images are allowed'));
      }
      cb(null, true);
    },
  });

  router.post('/uploads', requireAuth, (req, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Upload failed' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      res.status(201).json({
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename,
        size: req.file.size,
      });
    });
  });

  router.get('/geocode', async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ results: [] });
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
      const upstream = await fetch(url, {
        headers: {
          'User-Agent': 'MICHI-Travel-Atlas/1.0',
        },
        signal: AbortSignal.timeout(4000),
      });
      if (upstream.ok) {
        const list = await upstream.json();
        if (Array.isArray(list) && list.length > 0) {
          return res.json({
            results: list.map((item) => ({
              name: item.display_name.split(',').slice(0, 2).join(', '),
              fullName: item.display_name,
              lat: Number(item.lat),
              lng: Number(item.lon),
            })),
          });
        }
      }
    } catch {
      // Fall back to offline place index when external geocoder is unreachable
    }

    const lower = q.toLowerCase();
    const matches = FALLBACK_PLACES.filter((p) =>
      p.name.toLowerCase().includes(lower)
    );
    res.json({
      results: matches.map((p) => ({
        name: p.name.split(',')[0],
        fullName: p.name,
        lat: p.lat,
        lng: p.lng,
      })),
    });
  });

  return router;
}
