import express from 'express';
import { z } from 'zod';
import { requireAuth, sanitizeUser } from '../auth.js';
import {
  canViewJourney,
  computeInitials,
  serializeJourney,
} from '../helpers.js';

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  location: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(400).optional(),
  avatarUrl: z.string().trim().max(500).optional(),
  coverImage: z.string().trim().max(500).optional(),
  countriesCount: z.coerce.number().int().min(1).max(195).optional(),
});

export function createUsersRouter(db) {
  const router = express.Router();

  // Get public profile by handle (normalized with or without @)
  router.get('/:handle', (req, res) => {
    const raw = decodeURIComponent(req.params.handle);
    const normalizedHandle = raw.startsWith('@') ? raw : `@${raw}`;
    const userRow = db
      .prepare('SELECT * FROM users WHERE LOWER(handle) = LOWER(?)')
      .get(normalizedHandle);

    if (!userRow) {
      return res.status(404).json({ error: 'Traveller not found' });
    }

    const viewerId = req.user?.id || null;
    const isOwner = viewerId === userRow.id;

    const publishedRows = db
      .prepare(
        `SELECT * FROM journeys
         WHERE author_id = ? AND status = 'published'
         ORDER BY created_at DESC`
      )
      .all(userRow.id)
      .filter((r) => canViewJourney(db, r, viewerId));

    const draftRows = isOwner
      ? db
          .prepare(
            `SELECT * FROM journeys
             WHERE author_id = ? AND status = 'draft'
             ORDER BY updated_at DESC`
          )
          .all(userRow.id)
      : [];

    const savedRows = isOwner
      ? db
          .prepare(
            `SELECT j.*
             FROM journey_bookmarks jb
             JOIN journeys j ON j.id = jb.journey_id
             WHERE jb.user_id = ?
             ORDER BY jb.created_at DESC`
          )
          .all(userRow.id)
          .filter((r) => canViewJourney(db, r, viewerId))
      : [];

    const followersCount = db
      .prepare(
        'SELECT COUNT(*) AS count FROM follows WHERE following_id = ?'
      )
      .get(userRow.id).count;
    const followingCount = db
      .prepare(
        'SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?'
      )
      .get(userRow.id).count;

    const isFollowing = viewerId
      ? Boolean(
          db
            .prepare(
              'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
            )
            .get(viewerId, userRow.id)
        )
      : false;

    const fieldNotes = db
      .prepare(
        `SELECT id, slug, title, excerpt, cover_image, published_at, journey_id
         FROM field_notes
         WHERE author_id = ? AND status = 'published'
         ORDER BY published_at DESC`
      )
      .all(userRow.id);

    res.json({
      profile: {
        ...sanitizeUser(userRow),
        isOwner,
        isFollowing,
        stats: [
          { value: String(publishedRows.length), label: 'journeys' },
          { value: String(userRow.countries_count), label: 'countries' },
          { value: String(followersCount), label: 'followers' },
          { value: String(followingCount), label: 'following' },
        ],
      },
      journeys: publishedRows.map((r) => serializeJourney(db, r, viewerId)),
      drafts: draftRows.map((r) => serializeJourney(db, r, viewerId)),
      savedJourneys: savedRows.map((r) => serializeJourney(db, r, viewerId)),
      fieldNotes,
    });
  });

  // Update authenticated user's profile
  router.put('/me/profile', requireAuth, (req, res) => {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid profile data' });
    }

    const current = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(req.user.id);

    const nextName = parsed.data.name || current.name;
    const nextLocation = parsed.data.location || current.location;
    const nextBio =
      parsed.data.bio !== undefined ? parsed.data.bio : current.bio;
    const nextAvatar =
      parsed.data.avatarUrl !== undefined
        ? parsed.data.avatarUrl
        : current.avatar_url;
    const nextCover = parsed.data.coverImage || current.cover_image;
    const nextCountries =
      parsed.data.countriesCount ?? current.countries_count;
    const initials = computeInitials(nextName);

    db.prepare(
      `UPDATE users
       SET name = ?, initials = ?, location = ?, bio = ?,
           avatar_url = ?, cover_image = ?, countries_count = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      nextName,
      initials,
      nextLocation,
      nextBio,
      nextAvatar,
      nextCover,
      nextCountries,
      new Date().toISOString(),
      req.user.id
    );

    const updated = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(req.user.id);
    res.json({ user: sanitizeUser(updated) });
  });

  // Follow / unfollow user by handle
  router.post('/:handle/follow', requireAuth, (req, res) => {
    const raw = decodeURIComponent(req.params.handle);
    const normalizedHandle = raw.startsWith('@') ? raw : `@${raw}`;
    const target = db
      .prepare('SELECT id, handle FROM users WHERE LOWER(handle) = LOWER(?)')
      .get(normalizedHandle);

    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (target.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const exists = db
      .prepare(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?'
      )
      .get(req.user.id, target.id);

    if (exists) {
      db.prepare(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?'
      ).run(req.user.id, target.id);
    } else {
      db.prepare(
        'INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)'
      ).run(req.user.id, target.id, new Date().toISOString());
    }

    const followersCount = db
      .prepare('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?')
      .get(target.id).count;

    res.json({
      following: !exists,
      handle: target.handle,
      followersCount,
    });
  });

  return router;
}
