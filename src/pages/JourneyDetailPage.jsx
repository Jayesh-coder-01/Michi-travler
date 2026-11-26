import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

const GUIDE_PROMPTS = [
  {
    q: 'Best season?',
    a: 'Late October to mid-November brings crisp air, clear mountain ridgelines, and quieter trains.',
  },
  {
    q: 'Rail pass tip?',
    a: 'Regional 3-day or 5-day local rail passes cover nearly every valley leg without needing reservations.',
  },
  {
    q: 'Quiet stays?',
    a: 'Look for family-run minshuku near the second stop — most include dinner and early morning tea.',
  },
];

export default function JourneyDetailPage() {
  const { id } = useParams();
  const {
    journeys,
    bookmarkedIds,
    toggleBookmark,
    likedIds,
    toggleLike,
    followedAuthors,
    toggleFollow,
    commentsByJourney,
    addComment,
  } = useAppState();

  const journey = journeys.find((j) => j.id === id) || journeys[0];
  const [viewMode, setViewMode] = useState('Timeline');
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideAnswer, setGuideAnswer] = useState(GUIDE_PROMPTS[0].a);
  const [thoughtsOpen, setThoughtsOpen] = useState(false);
  const [thoughtText, setThoughtText] = useState('');

  const isBookmarked = bookmarkedIds.includes(journey.id);
  const isLiked = likedIds.includes(journey.id);
  const isFollowing = followedAuthors.includes(journey.profileAuthor.handle);
  const comments = commentsByJourney[journey.id] || [];
  const totalThoughts = journey.thoughts + comments.length;

  const handlePostThought = (e) => {
    e.preventDefault();
    if (!thoughtText.trim()) return;
    addComment(journey.id, thoughtText);
    setThoughtText('');
  };

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-10 lg:px-8 lg:py-14">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to atlas</span>
      </Link>

      {/* Header Meta */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-6 border-b border-[var(--border)] pb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--accent)]">
            {journey.days} days · {journey.tag}
          </p>
          <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-[-.05em] text-[var(--foreground)] sm:text-5xl">
            {journey.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-extrabold text-[#141A18]">
              {journey.profileAuthor.initials}
            </span>
            <p className="text-sm text-[var(--muted-foreground)]">
              <strong className="text-[var(--foreground)]">
                {journey.profileAuthor.name}
              </strong>{' '}
              {journey.profileAuthor.handle} · saved from your studio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => toggleLike(journey.id)}
            aria-label="Like journey"
            className={`inline-flex size-10 items-center justify-center rounded-full border transition-colors ${
              isLiked
                ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]'
            }`}
          >
            <Heart className={`size-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => toggleBookmark(journey.id)}
            aria-label="Bookmark journey"
            className={`inline-flex size-10 items-center justify-center rounded-full border transition-colors ${
              isBookmarked
                ? 'border-[var(--accent)] bg-[var(--accent)] text-[#141A18]'
                : 'border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]'
            }`}
          >
            <Bookmark className={`size-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2-Column Split */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
        {/* Left: Story + Visual Route Map */}
        <div className="space-y-8">
          <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)]">
            <img
              src={journey.image}
              alt={journey.title}
              className="aspect-[16/10] w-full object-cover"
            />
            <div className="p-6 lg:p-8">
              <p className="text-base leading-8 text-[var(--muted-foreground)]">
                {journey.summary}
              </p>
            </div>
          </div>

          {/* Dotted-grid Visual Route Map Card */}
          <div className="topo-dots relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[.16em] text-[var(--muted-foreground)]">
                Route preview · visual
              </span>
              <span className="rounded-full bg-[var(--secondary)] px-3 py-1 text-[11px] font-semibold text-[var(--foreground)]">
                {journey.stopsCount} stops
              </span>
            </div>

            <div className="mt-6">
              <svg
                viewBox="0 0 420 150"
                fill="none"
                className="h-36 w-full"
                aria-label="Visual route path"
              >
                <path
                  d="M36 105 C 120 25, 220 130, 384 48"
                  stroke="var(--accent)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="6 6"
                />
                <circle cx="36" cy="105" r="8" fill="var(--accent)" />
                <text
                  x="36"
                  y="132"
                  textAnchor="middle"
                  className="fill-[var(--foreground)] text-[11px] font-bold"
                >
                  {journey.routeStart}
                </text>

                <circle
                  cx="206"
                  cy="78"
                  r="6"
                  fill="var(--card)"
                  stroke="var(--accent)"
                  strokeWidth="3"
                />

                <circle cx="384" cy="48" r="8" fill="var(--primary)" />
                <text
                  x="384"
                  y="30"
                  textAnchor="middle"
                  className="fill-[var(--foreground)] text-[11px] font-bold"
                >
                  {journey.routeEnd}
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Right: Timeline + Actions + AI Guide */}
        <div className="space-y-8">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 lg:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-extrabold text-[var(--foreground)]">
                Along the way
              </h2>
              <button
                type="button"
                onClick={() =>
                  setViewMode((prev) => (prev === 'Timeline' ? 'Compact' : 'Timeline'))
                }
                className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3.5 py-1 text-xs font-semibold text-[var(--foreground)]"
              >
                {viewMode}
              </button>
            </div>

            <div className="mt-6 space-y-6 border-l-2 border-[var(--border)] pl-5">
              {journey.stops.map((stop, idx) => (
                <div key={`${stop.name}-${idx}`} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 size-3 rounded-full border-2 border-[var(--card)] ${
                      stop.type === 'end'
                        ? 'bg-[var(--primary)]'
                        : 'bg-[var(--accent)]'
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {stop.index && (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[11px] font-bold text-[var(--accent)]">
                        {stop.index}
                      </span>
                    )}
                    <h3 className="font-heading text-base font-bold text-[var(--foreground)]">
                      {stop.name}
                    </h3>
                    <span className="rounded-full bg-[var(--secondary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">
                      {stop.day}
                    </span>
                    <span className="rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                      {stop.mode}
                    </span>
                  </div>
                  {viewMode === 'Timeline' && (
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                      {stop.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--border)]/70 pt-6">
              <button
                type="button"
                onClick={() => setThoughtsOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${
                  thoughtsOpen
                    ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]'
                    : 'border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] hover:border-[var(--accent)]'
                }`}
              >
                <MessageCircle className="size-3.5" />
                <span>{totalThoughts} thoughts</span>
              </button>

              <button
                type="button"
                onClick={() => toggleFollow(journey.profileAuthor.handle)}
                className={`rounded-full px-5 py-2 text-xs font-bold transition-colors ${
                  isFollowing
                    ? 'border border-[var(--primary)] bg-[var(--secondary)] text-[var(--foreground)]'
                    : 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                }`}
              >
                {isFollowing
                  ? `Following ${journey.profileAuthor.name.split(' ')[0]} ✓`
                  : `+ Follow ${journey.profileAuthor.name.split(' ')[0]}`}
              </button>
            </div>

            {thoughtsOpen && (
              <div className="mt-6 border-t border-[var(--border)]/70 pt-5">
                <form onSubmit={handlePostThought} className="flex gap-2">
                  <input
                    type="text"
                    value={thoughtText}
                    onChange={(e) => setThoughtText(e.target.value)}
                    placeholder="Leave a note about this path..."
                    className="h-10 flex-1 rounded-full border border-[var(--input)] bg-[var(--background)] px-4 text-xs text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[#141A18]"
                  >
                    Post
                  </button>
                </form>

                <div className="mt-4 space-y-3">
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-2xl border border-[var(--border)]/60 bg-[var(--background)] p-3.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[var(--foreground)]">
                          {c.author}{' '}
                          <span className="font-normal text-[var(--muted-foreground)]">
                            {c.handle}
                          </span>
                        </span>
                        <span className="text-[var(--muted-foreground)]">
                          {c.time}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-5 text-[var(--muted-foreground)]">
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Guide Card */}
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--secondary)]/60 p-6 lg:p-8">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.14em] text-[var(--accent)]">
              <Sparkles className="size-3.5" />
              <span>WAYFINDER GUIDE</span>
            </p>
            <h3 className="font-heading mt-2 text-xl font-extrabold text-[var(--foreground)]">
              Need a little context?
            </h3>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              Ask about seasonal rail passes, ferry timings, or quiet places to
              stay along this route.
            </p>

            {guideOpen && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {GUIDE_PROMPTS.map((item) => (
                    <button
                      key={item.q}
                      type="button"
                      onClick={() => setGuideAnswer(item.a)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        guideAnswer === item.a
                          ? 'bg-[var(--foreground)] text-[var(--background)]'
                          : 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)]'
                      }`}
                    >
                      {item.q}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-xs leading-6 text-[var(--muted-foreground)]">
                  <strong className="text-[var(--foreground)]">Tip:</strong>{' '}
                  {guideAnswer}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setGuideOpen((prev) => !prev)}
              className="michi-interactive mt-5 rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-bold text-[#141A18] hover:bg-[#ff8c60]"
            >
              {guideOpen ? 'Hide guide' : 'Open guide'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
