import crypto from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import {
  canViewJourney,
  formatLikesLabel,
  relativeTime,
  serializeJourney,
  slugify,
} from '../helpers.js';
import { HERO_IMAGE } from '../../src/data/journeys.js';

const stopSchema = z.object({
  name: z.string().trim().min(1, 'Stop name is required').max(120),
  day: z.string().trim().min(1).max(30).default('DAY 01'),
  mode: z.string().trim().min(1).max(60).default('on foot'),
  note: z.string().trim().max(1000).default(''),
  photoUrl: z.string().trim().max(500).optional().default(''),
  lat: z.number().finite().nullable().optional(),
  lng: z.number().finite().nullable().optional(),
  type: z.enum(['start', 'waypoint', 'end']).optional(),
});

const journeyPayloadSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(140),
  tag: z.string().trim().min(1).max(40).default('Slow travel'),
  routeStart: z.string().trim().min(1, 'Start point is required').max(80),
  routeMid: z.string().trim().max(80).optional().default(''),
  routeEnd: z.string().trim().min(1, 'End point is required').max(80),
  days: z.coerce.number().int().min(1).max(365).default(3),
  image: z.string().trim().max(500).optional(),
  summary: z.string().trim().min(1, 'Summary is required').max(4000),
  status: z.enum(['published', 'draft']).default('published'),
  visibility: z
    .enum(['Public', 'Followers only', 'Private draft'])
    .default('Public'),
  stops: z.array(stopSchema).min(2, 'At least 2 stops are required').max(30),
});

const commentSchema = z.object({
  text: z.string().trim().min(1, 'Comment text is required').max(1000),
});

function buildRouteLabel(routeStart, routeMid, routeEnd, stops) {
  const parts = [routeStart, routeMid, routeEnd]
    .map((s) => (s || '').trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => p.toUpperCase()).join(' → ');
  }
  return stops
    .slice(0, 3)
    .map((s) => s.name.toUpperCase())
    .join(' → ');
}

function insertStops(db, journeyId, stops) {
  const stmt = db.prepare(`
    INSERT INTO journey_stops (
      id, journey_id, position, name, day, mode, note, photo_url, lat, lng, type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stops.forEach((s, idx) => {
    const type =
      idx === 0 ? 'start' : idx === stops.length - 1 ? 'end' : 'waypoint';
    stmt.run(
      `${journeyId}-stop-${idx + 1}-${crypto.randomUUID().slice(0, 6)}`,
      journeyId,
      idx,
      s.name,
      s.day,
      s.mode,
      s.note || '',
      s.photoUrl || '',
      s.lat ?? null,
      s.lng ?? null,
      type
    );
  });
}

export function createJourneysRouter(db) {
  const router = express.Router();

  // List journeys with search, filters, sorting, and pagination
  router.get('/', (req, res) => {
    const viewerId = req.user?.id || null;
    const q = String(req.query.q || '').trim().toLowerCase();
    const tag = String(req.query.tag || '').trim();
    const duration = String(req.query.duration || '').trim();
    const savedOnly = req.query.savedOnly === 'true';
    const authorHandle = String(req.query.authorHandle || '').trim();
    const status = String(req.query.status || 'published').trim();
    const sort = String(req.query.sort || 'recent').trim();
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 24)));

    const where = [];
    const params = [];

    if (status === 'draft') {
      if (!viewerId) {
        return res.json({ items: [], total: 0, page, limit, hasMore: false });
      }
      where.push("j.status = 'draft' AND j.author_id = ?");
      params.push(viewerId);
    } else {
      where.push("j.status = 'published'");
    }

    if (tag && tag !== 'All journeys') {
      where.push('j.tag = ?');
      params.push(tag);
    }

    if (duration === '1–3 days' || duration === '1-3') {
      where.push('j.days <= 3');
    } else if (duration === '4–6 days' || duration === '4-6') {
      where.push('j.days BETWEEN 4 AND 6');
    } else if (duration === '7+ days' || duration === '7+') {
      where.push('j.days >= 7');
    }

    if (authorHandle) {
      where.push('u.handle = ?');
      params.push(authorHandle);
    }

    if (savedOnly) {
      if (!viewerId) {
        return res.json({ items: [], total: 0, page, limit, hasMore: false });
      }
      where.push(
        'EXISTS (SELECT 1 FROM journey_bookmarks jb WHERE jb.journey_id = j.id AND jb.user_id = ?)'
      );
      params.push(viewerId);
    }

    if (q) {
      const like = `%${q}%`;
      where.push(
        `(LOWER(j.title) LIKE ? OR LOWER(j.route) LIKE ? OR LOWER(j.tag) LIKE ? OR LOWER(j.summary) LIKE ? OR LOWER(u.name) LIKE ? OR EXISTS (SELECT 1 FROM journey_stops js WHERE js.journey_id = j.id AND LOWER(js.name) LIKE ?))`
      );
      params.push(like, like, like, like, like, like);
    }

    let orderBy = 'j.created_at DESC';
    if (sort === 'Most liked' || sort === 'most_liked') {
      orderBy = 'j.likes_count DESC, j.created_at DESC';
    } else if (sort === 'Longest' || sort === 'longest') {
      orderBy = 'j.days DESC, j.created_at DESC';
    }

    const sql = `
      SELECT j.*
      FROM journeys j
      JOIN users u ON u.id = j.author_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY ${orderBy}
    `;

    const allRows = db
      .prepare(sql)
      .all(...params)
      .filter((row) => canViewJourney(db, row, viewerId));

    const total = allRows.length;
    const offset = (page - 1) * limit;
    const pagedRows = allRows.slice(offset, offset + limit);
    const items = pagedRows.map((row) => serializeJourney(db, row, viewerId));

    res.json({
      items,
      total,
      page,
      limit,
      hasMore: offset + items.length < total,
    });
  });

  // Get single journey + comments
  router.get('/:id', (req, res) => {
    const viewerId = req.user?.id || null;
    const row = db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(req.params.id);

    if (!row || !canViewJourney(db, row, viewerId)) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    const commentRows = db
      .prepare(
        `SELECT c.*, u.name AS author_name, u.handle AS author_handle, u.initials AS author_initials
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.journey_id = ?
         ORDER BY c.created_at DESC`
      )
      .all(row.id);

    const comments = commentRows.map((c) => ({
      id: c.id,
      userId: c.user_id,
      author: c.author_name,
      handle: c.author_handle,
      initials: c.author_initials,
      text: c.text,
      time: relativeTime(c.created_at),
      createdAt: c.created_at,
      canDelete: Boolean(
        viewerId && (viewerId === c.user_id || viewerId === row.author_id)
      ),
    }));

    res.json({
      journey: serializeJourney(db, row, viewerId),
      comments,
    });
  });

  // Create journey or draft
  router.post('/', requireAuth, (req, res) => {
    const parsed = journeyPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid journey' });
    }

    const data = parsed.data;
    const baseSlug = slugify(data.title);
    const id = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
    const now = new Date().toISOString();
    const effectiveStatus =
      data.visibility === 'Private draft' ? 'draft' : data.status;
    const route = buildRouteLabel(
      data.routeStart,
      data.routeMid,
      data.routeEnd,
      data.stops
    );
    const meta = `${data.days} days · ${data.stops.length} stops`;

    db.exec('BEGIN');
    try {
      db.prepare(
        `INSERT INTO journeys (
          id, author_id, tag, route, route_start, route_end, title, days,
          stops_count, meta, image, likes_count, thoughts_count, summary,
          status, visibility, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)`
      ).run(
        id,
        req.user.id,
        data.tag,
        route,
        data.routeStart,
        data.routeEnd,
        data.title,
        data.days,
        data.stops.length,
        meta,
        data.image || HERO_IMAGE,
        data.summary,
        effectiveStatus,
        data.visibility,
        now,
        now
      );

      insertStops(db, id, data.stops);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const createdRow = db.prepare('SELECT * FROM journeys WHERE id = ?').get(id);
    res.status(201).json({ journey: serializeJourney(db, createdRow, req.user.id) });
  });

  // Update journey (owner only)
  router.patch('/:id', requireAuth, (req, res) => {
    const existing = db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    if (existing.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const parsed = journeyPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid journey' });
    }

    const data = parsed.data;
    const now = new Date().toISOString();
    const effectiveStatus =
      data.visibility === 'Private draft' ? 'draft' : data.status;
    const route = buildRouteLabel(
      data.routeStart,
      data.routeMid,
      data.routeEnd,
      data.stops
    );
    const meta = `${data.days} days · ${data.stops.length} stops`;

    db.exec('BEGIN');
    try {
      db.prepare(
        `UPDATE journeys
         SET tag = ?, route = ?, route_start = ?, route_end = ?, title = ?,
             days = ?, stops_count = ?, meta = ?, image = ?, summary = ?,
             status = ?, visibility = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        data.tag,
        route,
        data.routeStart,
        data.routeEnd,
        data.title,
        data.days,
        data.stops.length,
        meta,
        data.image || existing.image,
        data.summary,
        effectiveStatus,
        data.visibility,
        now,
        existing.id
      );

      db.prepare('DELETE FROM journey_stops WHERE journey_id = ?').run(
        existing.id
      );
      insertStops(db, existing.id, data.stops);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const updated = db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(existing.id);
    res.json({ journey: serializeJourney(db, updated, req.user.id) });
  });

  // Delete journey (owner only)
  router.delete('/:id', requireAuth, (req, res) => {
    const existing = db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Journey not found' });
    }
    if (existing.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    db.prepare('DELETE FROM journeys WHERE id = ?').run(existing.id);
    res.json({ ok: true });
  });

  // Toggle like (transactional per-user)
  router.post('/:id/like', requireAuth, (req, res) => {
    const journey = db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(req.params.id);
    if (!journey || !canViewJourney(db, journey, req.user.id)) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    const exists = db
      .prepare(
        'SELECT 1 FROM journey_likes WHERE user_id = ? AND journey_id = ?'
      )
      .get(req.user.id, journey.id);

    db.exec('BEGIN');
    try {
      if (exists) {
        db.prepare(
          'DELETE FROM journey_likes WHERE user_id = ? AND journey_id = ?'
        ).run(req.user.id, journey.id);
        db.prepare(
          'UPDATE journeys SET likes_count = MAX(0, likes_count - 1) WHERE id = ?'
        ).run(journey.id);
      } else {
        db.prepare(
          'INSERT INTO journey_likes (user_id, journey_id, created_at) VALUES (?, ?, ?)'
        ).run(req.user.id, journey.id, new Date().toISOString());
        db.prepare(
          'UPDATE journeys SET likes_count = likes_count + 1 WHERE id = ?'
        ).run(journey.id);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    const updated = db
      .prepare('SELECT likes_count FROM journeys WHERE id = ?')
      .get(journey.id);
    res.json({
      liked: !exists,
      likesCount: updated.likes_count,
      likes: formatLikesLabel(updated.likes_count),
    });
  });

  // Toggle bookmark (per-user)
  router.post('/:id/bookmark', requireAuth, (req, res) => {
    const journey = db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(req.params.id);
    if (!journey || !canViewJourney(db, journey, req.user.id)) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    const exists = db
      .prepare(
        'SELECT 1 FROM journey_bookmarks WHERE user_id = ? AND journey_id = ?'
      )
      .get(req.user.id, journey.id);

    if (exists) {
      db.prepare(
        'DELETE FROM journey_bookmarks WHERE user_id = ? AND journey_id = ?'
      ).run(req.user.id, journey.id);
    } else {
      db.prepare(
        'INSERT INTO journey_bookmarks (user_id, journey_id, created_at) VALUES (?, ?, ?)'
      ).run(req.user.id, journey.id, new Date().toISOString());
    }

    res.json({ bookmarked: !exists });
  });

  // Add comment
  router.post('/:id/comments', requireAuth, (req, res) => {
    const journey = db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(req.params.id);
    if (!journey || !canViewJourney(db, journey, req.user.id)) {
      return res.status(404).json({ error: 'Journey not found' });
    }

    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Comment required' });
    }

    const commentId = `c_${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    db.exec('BEGIN');
    try {
      db.prepare(
        `INSERT INTO comments (id, journey_id, user_id, text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(commentId, journey.id, req.user.id, parsed.data.text, now, now);

      db.prepare(
        'UPDATE journeys SET thoughts_count = thoughts_count + 1 WHERE id = ?'
      ).run(journey.id);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    res.status(201).json({
      comment: {
        id: commentId,
        userId: req.user.id,
        author: req.user.name,
        handle: req.user.handle,
        initials: req.user.initials,
        text: parsed.data.text,
        time: 'Just now',
        createdAt: now,
        canDelete: true,
      },
    });
  });

  // Delete comment (comment author or journey owner)
  router.delete('/comments/:commentId', requireAuth, (req, res) => {
    const comment = db
      .prepare(
        `SELECT c.*, j.author_id AS journey_author_id
         FROM comments c
         JOIN journeys j ON j.id = c.journey_id
         WHERE c.id = ?`
      )
      .get(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (
      comment.user_id !== req.user.id &&
      comment.journey_author_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM comments WHERE id = ?').run(comment.id);
      db.prepare(
        'UPDATE journeys SET thoughts_count = MAX(0, thoughts_count - 1) WHERE id = ?'
      ).run(comment.journey_id);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    res.json({ ok: true });
  });

  return router;
}
