import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  ImagePlus,
  MapPin,
  Plus,
  Route as RouteIcon,
  Trash2,
} from 'lucide-react';
import { COVER_PRESETS, HERO_IMAGE } from '../data/journeys';
import { useAppState } from '../context/AppStateContext';

const STEPS = [
  { num: 1, label: 'Story' },
  { num: 2, label: 'Route' },
  { num: 3, label: 'Stops' },
  { num: 4, label: 'Details' },
  { num: 5, label: 'Publish' },
];

export default function CreateTripPage() {
  const navigate = useNavigate();
  const { addJourney, profile, showToast } = useAppState();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('A quiet week in the mountains');
  const [coverImage, setCoverImage] = useState(HERO_IMAGE);
  const [category, setCategory] = useState('Slow travel');
  const [visibility, setVisibility] = useState('Public');

  const [routeStart, setRouteStart] = useState('Kyoto');
  const [routeMid, setRouteMid] = useState('Ohara');
  const [routeEnd, setRouteEnd] = useState('Kurama');
  const [days, setDays] = useState(5);

  const [stops, setStops] = useState([
    {
      name: 'Kyoto',
      day: 'DAY 01',
      mode: 'morning train',
      note: 'Coffee by the Kamogawa River before heading north into the cedar hills.',
      type: 'start',
    },
    {
      name: 'Ohara',
      day: 'DAY 03',
      mode: 'on foot',
      note: 'Mossy temple gardens and warm yuzu tea along the valley stream.',
      type: 'waypoint',
      index: 1,
    },
    {
      name: 'Kurama',
      day: 'DAY 05',
      mode: 'mountain rail',
      note: 'Cedar trail over the ridge and open-air hot springs at dusk.',
      type: 'end',
    },
  ]);

  const [summary, setSummary] = useState(
    'Five slow days following cedar-lined mountain trails, quiet valley shrines, and single-car local trains north of Kyoto.'
  );

  const handleSaveDraft = () => {
    localStorage.setItem(
      'michi-draft',
      JSON.stringify({
        title,
        coverImage,
        category,
        visibility,
        routeStart,
        routeMid,
        routeEnd,
        days,
        stops,
        summary,
      })
    );
    showToast('Draft saved to your studio');
  };

  const handleAddStop = () => {
    const nextIndex = stops.length;
    setStops((prev) => [
      ...prev,
      {
        name: `Stop ${nextIndex + 1}`,
        day: `DAY 0${Math.min(nextIndex + 1, 9)}`,
        mode: 'on foot',
        note: 'What stood out here along the way.',
        type: 'waypoint',
        index: nextIndex,
      },
    ]);
  };

  const handleUpdateStop = (idx, field, value) => {
    setStops((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveStop = (idx) => {
    if (stops.length <= 2) {
      showToast('Keep at least 2 stops on your route');
      return;
    }
    setStops((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePublish = (e) => {
    e.preventDefault();
    const id = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;

    const formattedRoute = [routeStart, routeMid, routeEnd]
      .filter(Boolean)
      .map((s) => s.toUpperCase())
      .join(' → ');

    const newJourney = {
      id,
      tag: category,
      route: formattedRoute || `${routeStart.toUpperCase()} → ${routeEnd.toUpperCase()}`,
      routeStart: routeStart || 'Start',
      routeEnd: routeEnd || 'Finish',
      title: title.trim() || 'Untitled Journey',
      days: Number(days) || 3,
      stopsCount: stops.length,
      meta: `${Number(days) || 3} days · ${stops.length} stops`,
      image: coverImage || HERO_IMAGE,
      author: {
        initials: profile.initials,
        name: profile.name,
        handle: profile.handle,
      },
      profileAuthor: {
        initials: profile.initials,
        name: profile.name,
        handle: profile.handle,
      },
      likes: '1',
      likesCount: 1,
      thoughts: 0,
      summary: summary.trim() || 'A newly shared path on MICHI.',
      stops: stops.map((s, i) => ({
        ...s,
        type: i === 0 ? 'start' : i === stops.length - 1 ? 'end' : 'waypoint',
        index: i > 0 && i < stops.length - 1 ? i : undefined,
      })),
    };

    addJourney(newJourney);
    navigate(`/journey/${id}`);
  };

  return (
    <main className="mx-auto max-w-[960px] px-5 py-12 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
            Create a journey
          </p>
          <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-[-.05em] text-[var(--foreground)] sm:text-5xl">
            Make room for the in-between.
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSaveDraft}
          className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:border-[var(--accent)]"
        >
          Draft ready to save
        </button>
      </div>

      {/* 5-step clickable progress indicator */}
      <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-6">
        {STEPS.map((item) => {
          const active = step === item.num;
          const completed = step > item.num;
          return (
            <button
              key={item.num}
              type="button"
              onClick={() => setStep(item.num)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                active
                  ? 'bg-[var(--foreground)] text-[var(--background)]'
                  : completed
                    ? 'border border-[var(--primary)] bg-[var(--secondary)] text-[var(--foreground)]'
                    : 'border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--accent)]'
              }`}
            >
              <span>{completed ? <Check className="size-3.5" /> : item.num}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <form
        onSubmit={handlePublish}
        className="mt-8 rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-10"
      >
        {step === 1 && (
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-[-.03em] text-[var(--foreground)]">
              Start with the feeling.
            </h2>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              Give your journey a title, choose a cover frame, and set who can see it.
            </p>

            <div className="mt-7 space-y-6">
              <div>
                <label
                  htmlFor="journey-title"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
                >
                  Journey title
                </label>
                <input
                  id="journey-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 h-12 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 text-sm font-medium text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Cover image
                </span>
                <div className="mt-2 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-4 sm:flex-row sm:items-center">
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="h-24 w-36 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--foreground)]">
                      <ImagePlus className="size-4 text-[var(--accent)]" />
                      <span>Choose a cover preset</span>
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {COVER_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setCoverImage(preset.url)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            coverImage === preset.url
                              ? 'bg-[var(--accent)] text-[#141A18]'
                              : 'border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="journey-category"
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
                  >
                    Category
                  </label>
                  <select
                    id="journey-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option>Slow travel</option>
                    <option>Coastal</option>
                    <option>Mountain</option>
                    <option>City edges</option>
                    <option>Weekend</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="journey-visibility"
                    className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
                  >
                    Visibility
                  </label>
                  <select
                    id="journey-visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-3 text-sm font-medium text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option>Public</option>
                    <option>Friends only</option>
                    <option>Private draft</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-[-.03em] text-[var(--foreground)]">
              Trace your route.
            </h2>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              Set where you started, a turning point along the way, and where the road ended.
            </p>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Start point
                </label>
                <input
                  type="text"
                  value={routeStart}
                  onChange={(e) => setRouteStart(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Midpoint highlight
                </label>
                <input
                  type="text"
                  value={routeMid}
                  onChange={(e) => setRouteMid(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  End point
                </label>
                <input
                  type="text"
                  value={routeEnd}
                  onChange={(e) => setRouteEnd(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                  Duration (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="mt-2 h-11 w-full rounded-xl border border-[var(--input)] bg-[var(--background)] px-4 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </div>

            <div className="topo-dots mt-6 rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.15em] text-[var(--accent)]">
                <RouteIcon className="size-3.5" />
                <span>LIVE ROUTE LINE</span>
              </p>
              <p className="font-heading mt-2 text-lg font-extrabold text-[var(--foreground)]">
                {[routeStart, routeMid, routeEnd].filter(Boolean).join(' → ')} ·{' '}
                {days} days
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-extrabold tracking-[-.03em] text-[var(--foreground)]">
                  Add stops along the way.
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  Every pin holds a small note from the road.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddStop}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                <Plus className="size-3.5" />
                <span>Add stop</span>
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {stops.map((stop, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)]">
                      <MapPin className="size-3.5" />
                      <span>Stop {idx + 1}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(idx)}
                      aria-label="Remove stop"
                      className="text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      value={stop.name}
                      onChange={(e) => handleUpdateStop(idx, 'name', e.target.value)}
                      placeholder="Place name"
                      className="h-10 rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)]"
                    />
                    <input
                      type="text"
                      value={stop.day}
                      onChange={(e) => handleUpdateStop(idx, 'day', e.target.value)}
                      placeholder="DAY 01"
                      className="h-10 rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)]"
                    />
                    <input
                      type="text"
                      value={stop.mode}
                      onChange={(e) => handleUpdateStop(idx, 'mode', e.target.value)}
                      placeholder="local train"
                      className="h-10 rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--foreground)]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={stop.note}
                    onChange={(e) => handleUpdateStop(idx, 'note', e.target.value)}
                    placeholder="What happened here?"
                    className="mt-3 w-full rounded-xl border border-[var(--input)] bg-[var(--card)] p-3 text-xs text-[var(--foreground)]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-[-.03em] text-[var(--foreground)]">
              Write the field summary.
            </h2>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              A short paragraph that captures the pace and mood of the whole trip.
            </p>

            <div className="mt-6">
              <label
                htmlFor="journey-summary"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]"
              >
                Story summary
              </label>
              <textarea
                id="journey-summary"
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--input)] bg-[var(--background)] p-4 text-sm leading-6 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-[-.03em] text-[var(--foreground)]">
              Ready to share with the atlas.
            </h2>
            <p className="mt-1.5 text-sm text-[var(--muted-foreground)]">
              Review your card before publishing it to MICHI.
            </p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background)] sm:grid sm:grid-cols-[220px_1fr]">
              <img
                src={coverImage}
                alt={title}
                className="h-44 w-full object-cover sm:h-full"
              />
              <div className="p-5">
                <span className="rounded-full bg-[var(--secondary)] px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)]">
                  {category} · {visibility}
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-[.12em] text-[var(--accent)]">
                  {[routeStart, routeMid, routeEnd].filter(Boolean).join(' → ')}
                </p>
                <h3 className="font-heading mt-1 text-xl font-extrabold text-[var(--foreground)]">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {days} days · {stops.length} stops
                </p>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--muted-foreground)]">
                  {summary}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)]/70 pt-6">
          {step === 1 ? (
            <Link
              to="/"
              onClick={handleSaveDraft}
              className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              ← Save for later
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              ← Previous step
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(5, s + 1))}
              className="michi-interactive rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[#141A18] hover:bg-[#ff8c60]"
            >
              Save &amp; continue →
            </button>
          ) : (
            <button
              type="submit"
              className="michi-interactive rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-[#141A18] hover:bg-[#ff8c60]"
            >
              Publish journey →
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
