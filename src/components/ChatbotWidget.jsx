import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Maximize2,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

const STARTER_PROMPTS = [
  'Plan a 4-day slow train trip in Shikoku',
  'Best coastal walks near Kamakura',
  'Quiet autumn trails in the Japan Alps',
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content:
    'Hi! I’m the MICHI Wayfinder powered by Groq. Ask me for route ideas, train passes, or quiet stops along the way.',
};

export default function ChatbotWidget() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  // Hide floating widget on the dedicated /chat page
  if (location.pathname === '/chat') {
    return null;
  }

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
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
    <div className="fixed right-5 bottom-5 z-40">
      {open ? (
        <div
          data-testid="michi-chatbot-panel"
          className="flex h-[520px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--secondary)]/60 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--accent)] text-[#141A18]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="font-heading text-sm font-extrabold text-[var(--foreground)]">
                  Wayfinder AI
                </p>
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Powered by Groq
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([INITIAL_MESSAGE])}
                title="Reset chat"
                aria-label="Reset chat"
                className="inline-flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <Link
                to="/chat"
                onClick={() => setOpen(false)}
                title="Open full-page chat"
                aria-label="Open full-page chat"
                className="inline-flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
              >
                <Maximize2 className="size-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chatbot"
                className="inline-flex size-8 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--card)] hover:text-[var(--foreground)]"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 whitespace-pre-wrap ${
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
              <div className="flex flex-wrap gap-1.5 pt-1">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-left text-[11px] font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2 text-xs text-[var(--muted-foreground)]">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2 border-t border-[var(--border)] bg-[var(--card)] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a route or place..."
              className="h-10 flex-1 rounded-full border border-[var(--input)] bg-[var(--background)] px-4 text-xs text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[#141A18] transition-opacity disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          data-testid="michi-chatbot-fab"
          onClick={() => setOpen(true)}
          aria-label="Open Wayfinder AI chatbot"
          className="michi-interactive inline-flex h-13 items-center gap-2.5 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[#141A18] shadow-xl hover:bg-[#ff8c60]"
        >
          <MessageSquare className="size-4" />
          <span>Wayfinder AI</span>
        </button>
      )}
    </div>
  );
}
