import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  INITIAL_COMMENTS,
  JOURNEYS,
  PROFILE_USER,
} from '../src/data/journeys.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'michi.db');

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS journeys (
    id TEXT PRIMARY KEY,
    tag TEXT NOT NULL,
    route TEXT NOT NULL,
    route_start TEXT NOT NULL,
    route_end TEXT NOT NULL,
    title TEXT NOT NULL,
    days INTEGER NOT NULL,
    stops_count INTEGER NOT NULL,
    meta TEXT NOT NULL,
    image TEXT NOT NULL,
    author_json TEXT NOT NULL,
    profile_author_json TEXT NOT NULL,
    likes TEXT NOT NULL,
    likes_count INTEGER NOT NULL,
    thoughts INTEGER NOT NULL,
    summary TEXT NOT NULL,
    stops_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    journey_id TEXT NOT NULL,
    author TEXT NOT NULL,
    handle TEXT NOT NULL,
    text TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    initials TEXT NOT NULL,
    name TEXT NOT NULL,
    handle TEXT NOT NULL,
    location TEXT NOT NULL,
    bio TEXT NOT NULL,
    cover_image TEXT NOT NULL,
    stats_json TEXT NOT NULL,
    tabs_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_actions (
    key TEXT PRIMARY KEY,
    value_json TEXT NOT NULL
  );
`);

function seedDatabase() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM journeys').get();
  if (count === 0) {
    const insertJourney = db.prepare(`
      INSERT INTO journeys (
        id, tag, route, route_start, route_end, title, days, stops_count, meta,
        image, author_json, profile_author_json, likes, likes_count, thoughts,
        summary, stops_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = Date.now();
    JOURNEYS.forEach((j, idx) => {
      insertJourney.run(
        j.id,
        j.tag,
        j.route,
        j.routeStart,
        j.routeEnd,
        j.title,
        j.days,
        j.stopsCount,
        j.meta,
        j.image,
        JSON.stringify(j.author),
        JSON.stringify(j.profileAuthor),
        j.likes,
        j.likesCount,
        j.thoughts,
        j.summary,
        JSON.stringify(j.stops),
        new Date(now - idx * 60000).toISOString()
      );
    });
  }

  const { commentCount } = db
    .prepare('SELECT COUNT(*) AS commentCount FROM comments')
    .get();
  if (commentCount === 0) {
    const insertComment = db.prepare(`
      INSERT INTO comments (id, journey_id, author, handle, text, time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const [journeyId, list] of Object.entries(INITIAL_COMMENTS)) {
      list.forEach((c) => {
        insertComment.run(
          c.id,
          journeyId,
          c.author,
          c.handle,
          c.text,
          c.time,
          new Date().toISOString()
        );
      });
    }
  }

  const existingProfile = db
    .prepare('SELECT id FROM profile WHERE id = 1')
    .get();
  if (!existingProfile) {
    db.prepare(`
      INSERT INTO profile (
        id, initials, name, handle, location, bio, cover_image, stats_json, tabs_json
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      PROFILE_USER.initials,
      PROFILE_USER.name,
      PROFILE_USER.handle,
      PROFILE_USER.location,
      PROFILE_USER.bio,
      PROFILE_USER.coverImage,
      JSON.stringify(PROFILE_USER.stats),
      JSON.stringify(PROFILE_USER.tabs)
    );
  }

  const initAction = db.prepare(
    'INSERT OR IGNORE INTO user_actions (key, value_json) VALUES (?, ?)'
  );
  initAction.run('bookmarks', '[]');
  initAction.run('likes', '[]');
  initAction.run('following', '[]');
}

seedDatabase();

export function mapJourneyRow(row) {
  return {
    id: row.id,
    tag: row.tag,
    route: row.route,
    routeStart: row.route_start,
    routeEnd: row.route_end,
    title: row.title,
    days: row.days,
    stopsCount: row.stops_count,
    meta: row.meta,
    image: row.image,
    author: JSON.parse(row.author_json),
    profileAuthor: JSON.parse(row.profile_author_json),
    likes: row.likes,
    likesCount: row.likes_count,
    thoughts: row.thoughts,
    summary: row.summary,
    stops: JSON.parse(row.stops_json),
  };
}

export function getActionList(key) {
  const row = db
    .prepare('SELECT value_json FROM user_actions WHERE key = ?')
    .get(key);
  return row ? JSON.parse(row.value_json) : [];
}

export function setActionList(key, list) {
  db.prepare(
    'INSERT OR REPLACE INTO user_actions (key, value_json) VALUES (?, ?)'
  ).run(key, JSON.stringify(list));
}
