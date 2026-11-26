import { useEffect, useRef, useState } from 'react';
import { RotateCcw, Send, Sparkles } from 'lucide-react';
import { apiUrl } from '../lib/api';

const PROMPTS = [
  'Suggest a 5-day slow travel itinerary from Kyoto to Takayama',
  'What should I pack for walking the Kumano Kodo in autumn?',
  'Recommend quiet coastal towns accessible by local train from Tokyo',
  'How do I pace a 7-day island trip in Shikoku without a car?',
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    'Welcome to the MICHI Wayfinder Studio. Tell me where you’re starting or the kind of pace you’re looking for, and I’ll help map out stops, local transit, and quiet detours.',
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Chat request failed');
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Could not reach Groq right now (${err.message}). Make sure the backend server is running with \`npm run dev\`.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1000px] px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
            <Sparkles className="size-3.5" />
            <span>WAYFINDER AI · GROQ</span>
          </p>
          <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-[-.05em] text-[var(--foreground)] sm:text-5xl">
            Ask the atlas.
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setMessages([INITIAL_MESSAGE])}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
        >
          <RotateCcw className="size-3.5" />
          <span>New conversation</span>
        </button>
      </div>

      <div className="mt-8 flex h-[580px] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[var(--accent)] font-medium text-[#141A18]'
                    : 'border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {messages.length === 1 && (
            <div className="grid gap-2.5 pt-2 sm:grid-cols-2">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="michi-interactive rounded-2xl border border-[var(--border)] bg-[var(--background)] p-3.5 text-left text-xs font-semibold text-[var(--foreground)] hover:border-[var(--accent)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
                Mapping out an answer…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-3 border-t border-[var(--border)] bg-[var(--card)] p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a route, train line, season, or quiet stop..."
            className="h-12 flex-1 rounded-full border border-[var(--input)] bg-[var(--background)] px-5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="michi-interactive inline-flex h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-6 text-sm font-bold text-[#141A18] hover:bg-[#ff8c60] disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </main>
  );
}
