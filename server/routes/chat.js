import crypto from 'node:crypto';
import express from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth.js';
import { getConfig } from '../config.js';

const chatRequestSchema = z.object({
  threadId: z.string().trim().optional(),
  journeyId: z.string().trim().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .min(1),
});

function buildSystemContext(db, journeyId, lastUserMessage) {
  let context =
    'You are the MICHI Wayfinder Assistant — a warm, concise, knowledgeable travel and route-planning companion for MICHI ("Every path has a story"). Help travellers discover slow travel routes, local trains, coastal walks, mountain trails, and practical trip tips. Keep answers clear, friendly, and well-structured.';

  if (journeyId) {
    const journey = db
      .prepare('SELECT * FROM journeys WHERE id = ?')
      .get(journeyId);
    if (journey) {
      const stops = db
        .prepare(
          'SELECT name, day, mode, note FROM journey_stops WHERE journey_id = ? ORDER BY position ASC'
        )
        .all(journeyId);
      const stopSummary = stops
        .map((s) => `${s.day} ${s.name} (${s.mode}): ${s.note}`)
        .join(' | ');
      context += `\n\nThe traveller is currently viewing the MICHI journey "${journey.title}" (${journey.route}, ${journey.days} days, tag: ${journey.tag}). Summary: ${journey.summary}. Stops: ${stopSummary}. Tailor your answer directly to this route.`;
    }
  } else if (lastUserMessage) {
    const tokens = lastUserMessage
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length >= 4)
      .slice(0, 4);
    if (tokens.length > 0) {
      const published = db
        .prepare(
          "SELECT id, title, route, days, tag FROM journeys WHERE status = 'published' AND visibility = 'Public' LIMIT 12"
        )
        .all();
      const relevant = published
        .filter((j) =>
          tokens.some(
            (t) =>
              j.title.toLowerCase().includes(t) ||
              j.route.toLowerCase().includes(t) ||
              j.tag.toLowerCase().includes(t)
          )
        )
        .slice(0, 3);
      if (relevant.length > 0) {
        context += `\n\nRelevant community paths already on MICHI that you may reference: ${relevant
          .map((r) => `"${r.title}" (${r.route}, ${r.days} days)`)
          .join('; ')}.`;
      }
    }
  }

  return context;
}

export function createChatRouter(db) {
  const router = express.Router();
  const cfg = getConfig();

  router.get('/threads', requireAuth, (req, res) => {
    const threads = db
      .prepare(
        `SELECT id, journey_id, title, created_at, updated_at
         FROM chat_threads
         WHERE user_id = ?
         ORDER BY updated_at DESC
         LIMIT 30`
      )
      .all(req.user.id);
    res.json({ threads });
  });

  router.get('/threads/:id', requireAuth, (req, res) => {
    const thread = db
      .prepare('SELECT * FROM chat_threads WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!thread) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const messages = db
      .prepare(
        `SELECT id, role, content, model, created_at
         FROM chat_messages
         WHERE thread_id = ?
         ORDER BY created_at ASC`
      )
      .all(thread.id);
    res.json({ thread, messages });
  });

  router.delete('/threads/:id', requireAuth, (req, res) => {
    const result = db
      .prepare('DELETE FROM chat_threads WHERE id = ? AND user_id = ?')
      .run(req.params.id, req.user.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ ok: true });
  });

  router.post('/', async (req, res) => {
    if (!cfg.groqApiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
    }

    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Invalid chat input' });
    }

    const { threadId: requestedThreadId, journeyId, messages } = parsed.data;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    const systemPrompt = {
      role: 'system',
      content: buildSystemContext(db, journeyId, lastUserMsg?.content),
    };

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cfg.groqApiKey}`,
          },
          body: JSON.stringify({
            model: cfg.groqModel,
            messages: [systemPrompt, ...messages.slice(-12)],
            temperature: 0.7,
            max_tokens: 750,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({
          error: data?.error?.message || 'Groq API request failed',
        });
      }

      const reply =
        data?.choices?.[0]?.message?.content?.trim() ||
        'I could not generate a response right now.';

      // Persist thread & messages when user is authenticated
      let savedThreadId = requestedThreadId || null;
      if (req.user && lastUserMsg) {
        const now = new Date().toISOString();
        if (savedThreadId) {
          const owns = db
            .prepare('SELECT id FROM chat_threads WHERE id = ? AND user_id = ?')
            .get(savedThreadId, req.user.id);
          if (!owns) savedThreadId = null;
        }
        if (!savedThreadId) {
          savedThreadId = `thr_${crypto.randomUUID().slice(0, 10)}`;
          const title = lastUserMsg.content.slice(0, 64);
          db.prepare(
            `INSERT INTO chat_threads (id, user_id, journey_id, title, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).run(
            savedThreadId,
            req.user.id,
            journeyId || null,
            title,
            now,
            now
          );
        } else {
          db.prepare(
            'UPDATE chat_threads SET updated_at = ? WHERE id = ?'
          ).run(now, savedThreadId);
        }

        const insertMsg = db.prepare(
          `INSERT INTO chat_messages (id, thread_id, role, content, model, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        );
        insertMsg.run(
          `msg_${crypto.randomUUID().slice(0, 10)}`,
          savedThreadId,
          'user',
          lastUserMsg.content,
          '',
          now
        );
        insertMsg.run(
          `msg_${crypto.randomUUID().slice(0, 10)}`,
          savedThreadId,
          'assistant',
          reply,
          data?.model || cfg.groqModel,
          new Date(Date.now() + 1).toISOString()
        );
      }

      res.json({
        reply,
        model: data?.model,
        threadId: savedThreadId,
      });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Failed to reach Groq API' });
    }
  });

  // Generate structured trip draft JSON from a natural-language prompt
  router.post('/draft-trip', async (req, res) => {
    if (!cfg.groqApiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
    }

    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cfg.groqApiKey}`,
          },
          body: JSON.stringify({
            model: cfg.groqModel,
            response_format: { type: 'json_object' },
            messages: [
              {
                role: 'system',
                content:
                  'Generate a slow-travel itinerary as valid JSON with keys: title (string), category (one of "Slow travel", "Coastal", "Mountain", "City edges", "Weekend"), routeStart (string), routeMid (string), routeEnd (string), days (integer 1-21), summary (string), stops (array of 3-5 objects with name, day like "DAY 01", mode, note).',
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.6,
            max_tokens: 900,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return res
          .status(response.status)
          .json({ error: data?.error?.message || 'Failed to draft trip' });
      }
      const raw = data?.choices?.[0]?.message?.content || '{}';
      const draft = JSON.parse(raw);
      res.json({ draft });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Failed to parse draft' });
    }
  });

  return router;
}
