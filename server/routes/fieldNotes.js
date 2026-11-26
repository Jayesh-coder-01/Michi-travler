import crypto from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { relativeTime, slugify } from '../helpers.js';
import { HERO_IMAGE } from '../../src/data/journeys.js';

const fieldNoteSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(160),
  excerpt: z.string().trim().min(5, 'Excerpt is required').max(320),
  content: z.string().trim().min(20, 'Content is required').max(30000),
  coverImage: z.string().trim().max(500).optional(),
  journeyId: z.string().trim().nullable().optional(),
  status: z.enum(['published', 'draft']).default('published'),
});

function serializeNote(row, viewerId) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image,
    status: row.status,
    journeyId: row.journey_id,
    journeyTitle: row.journey_title || null,
    journeyRoute: row.journey_route || null,
    publishedAt: row.published_at,
    timeLabel: relativeTime(row.published_at),
    canEdit: Boolean(viewerId && viewerId === row.author_id),
    author: {
      id: row.author_id,
      name: row.author_name,
      handle: row.author_handle,
      initials: row.author_initials,
    },
  };
}

export function createFieldNotesRouter(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const viewerId = req.user?.id || null;
    const rows = db
      .prepare(
        `SELECT fn.*, u.name AS author_name, u.handle AS author_handle, u.initials AS author_initials,
                j.title AS journey_title, j.route AS journey_route
         FROM field_notes fn
         JOIN users u ON u.id = fn.author_id
         LEFT JOIN journeys j ON j.id = fn.journey_id
         WHERE fn.status = 'published' OR fn.author_id = ?
         ORDER BY fn.published_at DESC`
      )
      .all(viewerId || '');

    res.json({
      items: rows.map((r) => serializeNote(r, viewerId)),
    });
  });

  router.get('/:slugOrId', (req, res) => {
    const viewerId = req.user?.id || null;
    const row = db
      .prepare(
        `SELECT fn.*, u.name AS author_name, u.handle AS author_handle, u.initials AS author_initials,
                j.title AS journey_title, j.route AS journey_route
         FROM field_notes fn
         JOIN users u ON u.id = fn.author_id
         LEFT JOIN journeys j ON j.id = fn.journey_id
         WHERE fn.slug = ? OR fn.id = ?`
      )
      .get(req.params.slugOrId, req.params.slugOrId);

    if (!row || (row.status === 'draft' && row.author_id !== viewerId)) {
      return res.status(404).json({ error: 'Field note not found' });
    }

    res.json({ note: serializeNote(row, viewerId) });
  });

  router.post('/', requireAuth, (req, res) => {
    const parsed = fieldNoteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid field note' });
    }

    const data = parsed.data;
    const id = `fn_${crypto.randomUUID().slice(0, 8)}`;
    const slug = `${slugify(data.title)}-${id.slice(-4)}`;
    const now = new Date().toISOString();

    const validJourneyId =
      data.journeyId &&
      db.prepare('SELECT id FROM journeys WHERE id = ?').get(data.journeyId)
        ? data.journeyId
        : null;

    db.prepare(
      `INSERT INTO field_notes (
        id, slug, author_id, journey_id, title, excerpt, content,
        cover_image, status, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      slug,
      req.user.id,
      validJourneyId,
      data.title,
      data.excerpt,
      data.content,
      data.coverImage || HERO_IMAGE,
      data.status,
      now,
      now,
      now
    );

    const created = db
      .prepare(
        `SELECT fn.*, u.name AS author_name, u.handle AS author_handle, u.initials AS author_initials,
                j.title AS journey_title, j.route AS journey_route
         FROM field_notes fn
         JOIN users u ON u.id = fn.author_id
         LEFT JOIN journeys j ON j.id = fn.journey_id
         WHERE fn.id = ?`
      )
      .get(id);

    res.status(201).json({ note: serializeNote(created, req.user.id) });
  });

  router.delete('/:id', requireAuth, (req, res) => {
    const existing = db
      .prepare('SELECT * FROM field_notes WHERE id = ?')
      .get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Field note not found' });
    }
    if (existing.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    db.prepare('DELETE FROM field_notes WHERE id = ?').run(existing.id);
    res.json({ ok: true });
  });

  return router;
}
