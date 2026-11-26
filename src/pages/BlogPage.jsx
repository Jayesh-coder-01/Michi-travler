import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { MichiStamp } from '../components/MichiLogo';

const CHECKLIST = [
  {
    title: 'Cover story',
    detail: 'An opening frame that sets the pace before the map even loads.',
  },
  {
    title: 'Route notes',
    detail: 'Train times, missed ferries, and the small detours worth keeping.',
  },
  {
    title: 'Three connected stops',
    detail: 'Enough structure to follow, with room for the unplanned.',
  },
];

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-5 py-12 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
            FROM THE FIELD
          </p>
          <h1 className="font-heading mt-3 text-4xl font-extrabold tracking-[-.06em] text-[var(--foreground)] sm:text-5xl">
            The road, in longer sentences.
          </h1>
        </div>
        <span className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
          Prototype screen
        </span>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        {/* Left Card */}
        <section className="flex flex-col justify-between rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-8 lg:p-10">
          <div>
            <h2 className="font-heading text-2xl font-extrabold tracking-[-.03em] text-[var(--foreground)]">
              A calm place to begin
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted-foreground)]">
              Field notes pair long-form writing with the route itself. Every dispatch
              stays anchored to the stops where it was written.
            </p>

            <ul className="mt-8 space-y-5">
              {CHECKLIST.map((item) => (
                <li
                  key={item.title}
                  className="flex items-start gap-3.5 rounded-2xl border border-[var(--border)]/70 bg-[var(--background)] p-4"
                >
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--primary)]" />
                  <div>
                    <p className="text-sm font-bold text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                      {item.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 border-t border-[var(--border)]/70 pt-5 text-xs text-[var(--muted-foreground)]">
            Updated with community dispatches every week.
          </div>
        </section>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-8">
            <div className="topo-grid pointer-events-none absolute inset-0 opacity-80" />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
                IN THIS VIEW
              </p>
              <h2 className="font-heading mt-3 max-w-xs text-3xl font-extrabold leading-tight tracking-[-.04em] text-[var(--foreground)]">
                Small details, big distance.
              </h2>
            </div>

            <div className="relative z-10 mt-6 flex items-end justify-between">
              <p className="max-w-[210px] text-xs leading-5 text-[var(--muted-foreground)]">
                Hand-drawn route markers and quiet observations from the trail.
              </p>
              <div className="rounded-full bg-[#141A18]/80 p-1">
                <MichiStamp className="size-24" />
              </div>
            </div>
          </div>

          <Link
            to="/explore"
            className="michi-interactive flex flex-col justify-between rounded-[24px] bg-[var(--accent)] p-8 text-[#141A18] hover:bg-[#ff8c60]"
          >
            <p className="text-xs font-bold uppercase tracking-[.18em]">
              KEEP EXPLORING
            </p>
            <div className="mt-6 flex items-center justify-between">
              <span className="font-heading text-2xl font-extrabold tracking-[-.03em]">
                Find another path →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
