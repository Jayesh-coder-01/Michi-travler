import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {
  HERO_IMAGE,
  COASTAL_IMAGE,
  MOUNTAIN_IMAGE,
  CITY_IMAGE,
  WEEKEND_IMAGE,
  INITIAL_COMMENTS,
  JOURNEYS,
  PROFILE_USER,
} from '../src/data/journeys.js';
import { hashPassword } from './auth.js';
import { getConfig } from './config.js';

const STOP_COORDS = {
  Takamatsu: [34.3428, 134.0466],
  'Iya Valley': [33.8758, 133.8339],
  Kochi: [33.5588, 133.5312],
  Kamakura: [35.3192, 139.5467],
  Shimoda: [34.6797, 138.9453],
  Izu: [34.9776, 138.9465],
  Matsumoto: [36.238, 137.972],
  Kamikochi: [36.2465, 137.6383],
  Takayama: [36.1461, 137.2522],
  Yanaka: [35.7278, 139.7667],
  Kiyosumi: [35.6822, 139.7988],
  Tsukishima: [35.6644, 139.7834],
  Otsu: [35.0179, 135.8548],
  'Omi-Maiko': [35.2244, 135.9597],
  Nagahama: [35.3779, 136.2654],
};

const SEED_AUTHORS = [
  {
    id: 'usr_ren',
    email: 'ren@michi.travel',
    handle: '@renfinds',
    name: PROFILE_USER.name,
    initials: PROFILE_USER.initials,
    location: PROFILE_USER.location,
    bio: PROFILE_USER.bio,
    coverImage: PROFILE_USER.coverImage,
    countriesCount: 8,
  },
  {
    id: 'usr_mika',
    email: 'mika@michi.travel',
    handle: '@mika.moves',
    name: 'Mika Tanaka',
    initials: 'MT',
    location: 'Takamatsu, Japan',
    bio: 'Slow-rail notes across Shikoku gorges, island ferries, and morning udon counters.',
    coverImage: HERO_IMAGE,
    countriesCount: 5,
  },
  {
    id: 'usr_alex',
    email: 'alex@michi.travel',
    handle: '@alex.roams',
    name: 'Alex Rivera',
    initials: 'AR',
    location: 'Kamakura, Japan',
    bio: 'Tracing coastal trams, tidepool coves, and small harbor bakeries.',
    coverImage: COASTAL_IMAGE,
    countriesCount: 6,
  },
  {
    id: 'usr_nora',
    email: 'nora@michi.travel',
    handle: '@norawanders',
    name: 'Nora Chen',
    initials: 'NC',
    location: 'Matsumoto, Japan',
    bio: 'Alpine valleys, river trails, and timbered mountain towns.',
    coverImage: MOUNTAIN_IMAGE,
    countriesCount: 9,
  },
  {
    id: 'usr_kenji',
    email: 'kenji@michi.travel',
    handle: '@kenji.walks',
    name: 'Kenji Sato',
    initials: 'KS',
    location: 'Tokyo, Japan',
    bio: 'Walking old shitamachi neighborhoods, canal bridges, and neighborhood kissaten.',
    coverImage: CITY_IMAGE,
    countriesCount: 4,
  },
];

const SEED_FIELD_NOTES = [
  {
    id: 'fn_shikoku_rail',
    slug: 'riding-single-car-trains-through-shikoku',
    authorId: 'usr_mika',
    journeyId: 'hidden-shikoku',
    title: 'Riding single-car trains through the emerald gorges of Shikoku',
    excerpt:
      'Why local diesel railcars and unhurried station transfers reveal a quieter rhythm of mountain travel.',
    content: `Leaving Takamatsu before seven means sharing the platform with high school commuters and thermos coffee from the corner vending machine.\n\nOnce the Dosan Line climbs past Kotohira, the river narrows into steep cedar walls. You stop checking arrival times because every bend opens a small wooden station where nobody is rushing.\n\n### Three things to pack\n- A paper notebook for station stamps\n- Coins for unstaffed fare boxes\n- Extra time between transfers at Awa-Ikeda`,
    coverImage: HERO_IMAGE,
    daysAgo: 3,
  },
  {
    id: 'fn_sagami_coast',
    slug: 'morning-bakeries-along-sagami-bay',
    authorId: 'usr_alex',
    journeyId: 'blue-line-south',
    title: 'Morning bakeries and coastal footpaths along Sagami Bay',
    excerpt:
      'Notes from four unhurried days tracing the Enoden tram and walking between quiet coves on the Izu Peninsula.',
    content: `Between Kamakura and Shimoda, the train hugs the Pacific so closely you can smell salt air every time the doors open.\n\nInstead of planning a checklist of viewpoints, I picked one harbor bakery per morning and walked until the next local bus appeared.\n\n### Favorite pause\nSitting on the seawall near Yuigahama with warm melonpan while surfers carried longboards down the steps.`,
    coverImage: COASTAL_IMAGE,
    daysAgo: 6,
  },
  {
    id: 'fn_biwa_bicycle',
    slug: 'two-mornings-by-lake-biwa',
    authorId: 'usr_ren',
    journeyId: 'lake-biwa-loop',
    title: 'Two mornings by bicycle along Lake Biwa’s western shore',
    excerpt:
      'Just twenty minutes northeast of Kyoto sits a pine-fringed shoreline built for slow weekend loops.',
    content: `Most visitors stay inside Kyoto’s temple ring, never realizing a short ride on the Kosei Line opens onto an inland sea.\n\nAt Omi-Maiko, wind-bent pine trees frame pale sand beaches and distant blue ridges across the water. Rent a simple city bike near the station and let the afternoon stretch.\n\n### Loop tips\n- Start before 8:30 AM for mist over Mount Hiei\n- Stop in Nagahama for handmade soba and glassware studios`,
    coverImage: WEEKEND_IMAGE,
    daysAgo: 10,
  },
];

function createSchema(database) {
  const hasUsers = database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    )
    .get();

  if (!hasUsers) {
    // Drop legacy single-user prototype tables cleanly before creating relational schema
    database.exec(`
      DROP TABLE IF EXISTS user_actions;
      DROP TABLE IF EXISTS profile;
      DROP TABLE IF EXISTS comments;
      DROP TABLE IF EXISTS journeys;
    `);
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      google_id TEXT UNIQUE,
      handle TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT 'Earth',
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      cover_image TEXT NOT NULL,
      countries_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journeys (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      route TEXT NOT NULL,
      route_start TEXT NOT NULL,
      route_end TEXT NOT NULL,
      title TEXT NOT NULL,
      days INTEGER NOT NULL,
      stops_count INTEGER NOT NULL,
      meta TEXT NOT NULL,
      image TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 0,
      thoughts_count INTEGER NOT NULL DEFAULT 0,
      summary TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      visibility TEXT NOT NULL DEFAULT 'Public',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journey_stops (
      id TEXT PRIMARY KEY,
      journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
      position INTEGER NOT NULL,
      name TEXT NOT NULL,
      day TEXT NOT NULL,
      mode TEXT NOT NULL,
      note TEXT NOT NULL,
      photo_url TEXT NOT NULL DEFAULT '',
      lat REAL,
      lng REAL,
      type TEXT NOT NULL DEFAULT 'waypoint'
    );

    CREATE TABLE IF NOT EXISTS journey_likes (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, journey_id)
    );

    CREATE TABLE IF NOT EXISTS journey_bookmarks (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, journey_id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      PRIMARY KEY (follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      journey_id TEXT NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS field_notes (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      journey_id TEXT REFERENCES journeys(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      cover_image TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      published_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_threads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      journey_id TEXT REFERENCES journeys(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_journeys_status_created ON journeys(status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_journeys_author ON journeys(author_id);
    CREATE INDEX IF NOT EXISTS idx_stops_journey ON journey_stops(journey_id, position);
    CREATE INDEX IF NOT EXISTS idx_comments_journey ON comments(journey_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_field_notes_published ON field_notes(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_threads_user ON chat_threads(user_id, updated_at DESC);
  `);
}

export function seedDatabase(database) {
  const { userCount } = database
    .prepare('SELECT COUNT(*) AS userCount FROM users')
    .get();

  if (userCount === 0) {
    const now = new Date().toISOString();
    const demoPasswordHash = hashPassword('MichiDemo123!');
    const insertUser = database.prepare(`
      INSERT INTO users (
        id, email, password_hash, handle, name, initials, location, bio,
        avatar_url, cover_image, countries_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?)
    `);

    for (const u of SEED_AUTHORS) {
      insertUser.run(
        u.id,
        u.email,
        demoPasswordHash,
        u.handle,
        u.name,
        u.initials,
        u.location,
        u.bio,
        u.coverImage,
        u.countriesCount,
        now,
        now
      );
    }
  }

  const { journeyCount } = database
    .prepare('SELECT COUNT(*) AS journeyCount FROM journeys')
    .get();

  if (journeyCount === 0) {
    const handleToId = new Map();
    for (const row of database.prepare('SELECT id, handle FROM users').all()) {
      handleToId.set(row.handle, row.id);
    }

    const insertJourney = database.prepare(`
      INSERT INTO journeys (
        id, author_id, tag, route, route_start, route_end, title, days,
        stops_count, meta, image, likes_count, thoughts_count, summary,
        status, visibility, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'Public', ?, ?)
    `);

    const insertStop = database.prepare(`
      INSERT INTO journey_stops (
        id, journey_id, position, name, day, mode, note, photo_url, lat, lng, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, '', ?, ?, ?)
    `);

    const nowMs = Date.now();
    JOURNEYS.forEach((j, idx) => {
      const authorId = handleToId.get(j.author.handle) || 'usr_ren';
      const ts = new Date(nowMs - idx * 3600_000).toISOString();
      insertJourney.run(
        j.id,
        authorId,
        j.tag,
        j.route,
        j.routeStart,
        j.routeEnd,
        j.title,
        j.days,
        j.stops.length,
        `${j.days} days · ${j.stops.length} stops`,
        j.image,
        j.likesCount,
        j.thoughts,
        j.summary,
        ts,
        ts
      );

      j.stops.forEach((stop, pos) => {
        const coords = STOP_COORDS[stop.name] || [null, null];
        insertStop.run(
          `${j.id}-stop-${pos + 1}`,
          j.id,
          pos,
          stop.name,
          stop.day,
          stop.mode,
          stop.note,
          coords[0],
          coords[1],
          stop.type || (pos === 0 ? 'start' : pos === j.stops.length - 1 ? 'end' : 'waypoint')
        );
      });
    });
  }

  const { commentCount } = database
    .prepare('SELECT COUNT(*) AS commentCount FROM comments')
    .get();

  if (commentCount === 0) {
    const handleToId = new Map();
    for (const row of database.prepare('SELECT id, handle FROM users').all()) {
      handleToId.set(row.handle, row.id);
    }
    const insertComment = database.prepare(`
      INSERT INTO comments (id, journey_id, user_id, text, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const [journeyId, list] of Object.entries(INITIAL_COMMENTS)) {
      list.forEach((c, idx) => {
        const userId = handleToId.get(c.handle) || 'usr_ren';
        const ts = new Date(Date.now() - (idx + 1) * 86400_000).toISOString();
        insertComment.run(c.id, journeyId, userId, c.text, ts, ts);
      });
    }
  }

  const { noteCount } = database
    .prepare('SELECT COUNT(*) AS noteCount FROM field_notes')
    .get();

  if (noteCount === 0) {
    const insertNote = database.prepare(`
      INSERT INTO field_notes (
        id, slug, author_id, journey_id, title, excerpt, content,
        cover_image, status, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)
    `);
    for (const n of SEED_FIELD_NOTES) {
      const ts = new Date(Date.now() - n.daysAgo * 86400_000).toISOString();
      insertNote.run(
        n.id,
        n.slug,
        n.authorId,
        n.journeyId,
        n.title,
        n.excerpt,
        n.content,
        n.coverImage,
        ts,
        ts,
        ts
      );
    }
  }
}

export function initDatabase(customDbPath) {
  const cfg = getConfig();
  const targetPath = customDbPath || cfg.dbPath;
  if (targetPath !== ':memory:') {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  }

  const database = new DatabaseSync(targetPath);
  database.exec('PRAGMA foreign_keys = ON;');
  if (targetPath !== ':memory:') {
    database.exec('PRAGMA journal_mode = WAL;');
  }

  createSchema(database);
  seedDatabase(database);
  return database;
}
