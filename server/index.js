import express from 'express';
import cors from 'cors';
import { db, getActionList, mapJourneyRow, setActionList } from './db.js';

try {
  process.loadEnvFile();
} catch {
  // .env is optional if environment variables are already set
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: 'sqlite' });
});

app.get('/api/bootstrap', (_req, res) => {
  const journeyRows = db
    .prepare('SELECT * FROM journeys ORDER BY created_at DESC')
    .all();
  const journeys = journeyRows.map(mapJourneyRow);

  const profileRow = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  const profile = {
    initials: profileRow.initials,
    name: profileRow.name,
    handle: profileRow.handle,
    location: profileRow.location,
    bio: profileRow.bio,
    coverImage: profileRow.cover_image,
    stats: JSON.parse(profileRow.stats_json),
    tabs: JSON.parse(profileRow.tabs_json),
  };

  const commentRows = db
    .prepare('SELECT * FROM comments ORDER BY created_at DESC')
    .all();
  const commentsByJourney = {};
  for (const row of commentRows) {
    if (!commentsByJourney[row.journey_id]) {
      commentsByJourney[row.journey_id] = [];
    }
    commentsByJourney[row.journey_id].push({
      id: row.id,
      author: row.author,
      handle: row.handle,
      text: row.text,
      time: row.time,
    });
  }

  res.json({
    journeys,
    profile,
    commentsByJourney,
    bookmarkedIds: getActionList('bookmarks'),
    likedIds: getActionList('likes'),
    followedAuthors: getActionList('following'),
  });
});

app.post('/api/journeys', (req, res) => {
  const j = req.body;
  if (!j || !j.id || !j.title) {
    return res.status(400).json({ error: 'Invalid journey payload' });
  }

  db.prepare(`
    INSERT INTO journeys (
      id, tag, route, route_start, route_end, title, days, stops_count, meta,
      image, author_json, profile_author_json, likes, likes_count, thoughts,
      summary, stops_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
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
    j.likes || '1',
    j.likesCount ?? 1,
    j.thoughts ?? 0,
    j.summary,
    JSON.stringify(j.stops || []),
    new Date().toISOString()
  );

  res.status(201).json(j);
});

app.post('/api/journeys/:id/bookmark', (req, res) => {
  const { id } = req.params;
  const current = getActionList('bookmarks');
  const exists = current.includes(id);
  const next = exists ? current.filter((item) => item !== id) : [...current, id];
  setActionList('bookmarks', next);
  res.json({ bookmarkedIds: next, bookmarked: !exists });
});

app.post('/api/journeys/:id/like', (req, res) => {
  const { id } = req.params;
  const current = getActionList('likes');
  const exists = current.includes(id);
  const next = exists ? current.filter((item) => item !== id) : [...current, id];
  setActionList('likes', next);
  res.json({ likedIds: next, liked: !exists });
});

app.post('/api/follow', (req, res) => {
  const { handle } = req.body || {};
  if (!handle) {
    return res.status(400).json({ error: 'Missing handle' });
  }
  const current = getActionList('following');
  const exists = current.includes(handle);
  const next = exists
    ? current.filter((item) => item !== handle)
    : [...current, handle];
  setActionList('following', next);
  res.json({ followedAuthors: next, following: !exists });
});

app.post('/api/journeys/:id/comments', (req, res) => {
  const { id: journeyId } = req.params;
  const { author, handle, text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  const comment = {
    id: `c-${Date.now()}`,
    author: author || 'Ren Nakamura',
    handle: handle || '@renfinds',
    text: text.trim(),
    time: 'Just now',
  };

  db.prepare(`
    INSERT INTO comments (id, journey_id, author, handle, text, time, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    comment.id,
    journeyId,
    comment.author,
    comment.handle,
    comment.text,
    comment.time,
    new Date().toISOString()
  );

  res.status(201).json(comment);
});

app.put('/api/profile', (req, res) => {
  const { name, location, bio } = req.body || {};
  const existing = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  const nextName = (name || existing.name).trim();
  const nextLocation = (location || existing.location).trim();
  const nextBio = (bio || existing.bio).trim();
  const initials =
    nextName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || existing.initials;

  db.prepare(`
    UPDATE profile
    SET initials = ?, name = ?, location = ?, bio = ?
    WHERE id = 1
  `).run(initials, nextName, nextLocation, nextBio);

  res.json({
    initials,
    name: nextName,
    handle: existing.handle,
    location: nextLocation,
    bio: nextBio,
    coverImage: existing.cover_image,
    stats: JSON.parse(existing.stats_json),
    tabs: JSON.parse(existing.tabs_json),
  });
});

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const systemPrompt = {
    role: 'system',
    content:
      'You are the MICHI Wayfinder Assistant — a warm, concise, knowledgeable travel and route-planning companion for MICHI ("Every path has a story"). Help travellers discover slow travel routes, local trains, coastal walks, mountain trails, and practical trip tips. Keep answers clear, friendly, and well-structured.',
  };

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
          messages: [systemPrompt, ...messages.slice(-12)],
          temperature: 0.7,
          max_tokens: 700,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Groq API request failed',
      });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    res.json({
      reply: reply || 'I could not generate a response right now.',
      model: data?.model,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to reach Groq API' });
  }
});

app.listen(PORT, () => {
  console.log(`MICHI backend listening on http://localhost:${PORT}`);
});
