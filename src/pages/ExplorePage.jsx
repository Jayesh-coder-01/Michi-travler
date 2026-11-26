import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { EXPLORE_CATEGORIES } from '../data/journeys';
import JourneyCard from '../components/JourneyCard';
import { useAppState } from '../context/AppStateContext';

const DURATION_FILTERS = ['Any length', '1–3 days', '4–6 days', '7+ days'];

export default function ExplorePage() {
  const { journeys, bookmarkedIds } = useAppState();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [activeCategory, setActiveCategory] = useState('All journeys');
  const [sortBy, setSortBy] = useState('For you');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [durationFilter, setDurationFilter] = useState('Any length');
  const [savedOnly, setSavedOnly] = useState(false);

  const filteredJourneys = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = journeys.filter((j) => {
      const matchesCategory =
        activeCategory === 'All journeys' || j.tag === activeCategory;
      const matchesQuery =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.route.toLowerCase().includes(q) ||
        j.tag.toLowerCase().includes(q) ||
        j.author.name.toLowerCase().includes(q) ||
        j.summary.toLowerCase().includes(q);
      const matchesDuration =
        durationFilter === 'Any length' ||
        (durationFilter === '1–3 days' && j.days <= 3) ||
        (durationFilter === '4–6 days' && j.days >= 4 && j.days <= 6) ||
        (durationFilter === '7+ days' && j.days >= 7);
      const matchesSaved = !savedOnly || bookmarkedIds.includes(j.id);

      return matchesCategory && matchesQuery && matchesDuration && matchesSaved;
    });

    if (sortBy === 'Most liked') {
      return [...list].sort((a, b) => b.likesCount - a.likesCount);
    }
    if (sortBy === 'Longest') {
      return [...list].sort((a, b) => b.days - a.days);
    }
    return list;
  }, [journeys, query, activeCategory, sortBy, durationFilter, savedOnly, bookmarkedIds]);

  return (
    <main className="mx-auto max-w-[1400px] px-5 py-12 lg:px-8 lg:py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
          THE ATLAS
        </p>
        <h1 className="font-heading mt-3 text-4xl font-extrabold leading-[1.02] tracking-[-.06em] text-[var(--foreground)] sm:text-6xl">
          Find your next <br />
          <span className="text-[var(--accent)]">way through.</span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mt-8 max-w-2xl">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-4 size-4 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places, people, or a feeling..."
            className="h-12 w-full rounded-full border border-[var(--border)] bg-[var(--card)] pl-11 pr-5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {EXPLORE_CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : 'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]'
              }`}
            >
              <span>{category}</span>
              {category === 'All journeys' && <ChevronDown className="size-3.5" />}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowMoreFilters((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
            showMoreFilters
              ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--foreground)]'
              : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)] hover:text-[var(--foreground)]'
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          <span>More filters</span>
        </button>
      </div>

      {showMoreFilters && (
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Duration:
            </span>
            {DURATION_FILTERS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDurationFilter(d)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  durationFilter === d
                    ? 'bg-[var(--accent)] text-[#141A18]'
                    : 'bg-[var(--secondary)] text-[var(--foreground)]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSavedOnly((prev) => !prev)}
            className={`rounded-full border px-3.5 py-1 text-xs font-semibold ${
              savedOnly
                ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                : 'border-[var(--border)] text-[var(--foreground)]'
            }`}
          >
            {savedOnly ? 'Saved only ✓' : 'Saved only'}
          </button>
        </div>
      )}

      {/* Subheader */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-heading text-lg font-extrabold text-[var(--foreground)]">
            Featured paths
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            1,284 journeys to wander through
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            setSortBy((prev) =>
              prev === 'For you'
                ? 'Most liked'
                : prev === 'Most liked'
                  ? 'Longest'
                  : 'For you'
            )
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--accent)]"
        >
          <span>Sort: {sortBy}</span>
          <ChevronDown className="size-3.5" />
        </button>
      </div>

      {/* Results Grid */}
      {filteredJourneys.length > 0 ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJourneys.map((journey) => (
            <JourneyCard key={journey.id} journey={journey} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-10 text-center">
          <p className="font-heading text-lg font-bold text-[var(--foreground)]">
            No matching paths yet
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Try clearing your filter or searching for another region.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveCategory('All journeys');
              setDurationFilter('Any length');
              setSavedOnly(false);
            }}
            className="mt-4 rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-bold text-[#141A18]"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Bottom Banner */}
      <div className="mt-14 flex flex-col items-start justify-between gap-6 rounded-[24px] border border-[var(--border)] bg-[var(--secondary)]/60 p-8 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
            A note for the curious
          </p>
          <h2 className="font-heading mt-2 text-2xl font-extrabold tracking-[-.04em] text-[var(--foreground)]">
            You don’t need a plan. You need a direction.
          </h2>
        </div>
        <Link
          to="/create-trip"
          className="michi-interactive shrink-0 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[#141A18] hover:bg-[#ff8c60]"
        >
          Start your journey →
        </Link>
      </div>
    </main>
  );
}
