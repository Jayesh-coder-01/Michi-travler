import { Link } from 'react-router-dom';
import { Bookmark, Heart } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

function formatLikes(baseCount, baseLabel, isLiked) {
  if (!isLiked) return baseLabel;
  const updated = baseCount + 1;
  if (updated >= 1000) {
    return `${(updated / 1000).toFixed(1)}k`;
  }
  return String(updated);
}

export default function JourneyCard({ journey, featured = false, useProfileAuthor = false }) {
  const { bookmarkedIds, toggleBookmark, likedIds, toggleLike } = useAppState();
  const isBookmarked = bookmarkedIds.includes(journey.id);
  const isLiked = likedIds.includes(journey.id);
  const author = useProfileAuthor ? journey.profileAuthor : journey.author;

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark(journey.id);
  };

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLike(journey.id);
  };

  return (
    <article
      className={`michi-interactive group overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)] ${
        featured ? 'flex flex-col lg:grid lg:grid-cols-[1.08fr_.92fr]' : 'flex flex-col'
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          featured ? 'min-h-[280px] lg:min-h-full' : 'aspect-[1.35]'
        }`}
      >
        <Link to={`/journey/${journey.id}`} className="block h-full w-full">
          <img
            src={journey.image}
            alt={journey.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </Link>

        <span className="pointer-events-none absolute top-4 left-4 rounded-full bg-[#f7f8f3]/90 px-3 py-1 text-xs font-medium text-[#141A18] backdrop-blur-sm">
          {journey.tag}
        </span>

        <button
          type="button"
          onClick={handleBookmark}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark journey'}
          className={`absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
            isBookmarked
              ? 'bg-[var(--accent)] text-[#141A18]'
              : 'bg-[#141A18]/40 text-white hover:bg-[var(--accent)] hover:text-[#141A18]'
          }`}
        >
          <Bookmark className={`size-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6 lg:p-7">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.13em] text-[var(--accent)]">
            {journey.route}
          </p>
          <Link to={`/journey/${journey.id}`} className="mt-2 block">
            <h3 className="font-heading text-xl font-extrabold tracking-[-.03em] text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)] lg:text-2xl">
              {journey.title}
            </h3>
          </Link>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">{journey.meta}</p>
          {featured && (
            <p className="mt-4 hidden text-sm leading-6 text-[var(--muted-foreground)] lg:block">
              {journey.summary}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[var(--border)]/70 pt-4">
          <Link to="/profile" className="flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-bold text-[var(--foreground)]">
              {author.initials}
            </span>
            <div className="leading-tight">
              <p className="text-xs font-bold text-[var(--foreground)]">{author.name}</p>
              <p className="text-[11px] text-[var(--muted-foreground)]">{author.handle}</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleLike}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                isLiked
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Heart className={`size-3.5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{formatLikes(journey.likesCount, journey.likes, isLiked)}</span>
            </button>

            <Link
              to={`/journey/${journey.id}`}
              className="text-xs font-bold text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
            >
              Read path →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
