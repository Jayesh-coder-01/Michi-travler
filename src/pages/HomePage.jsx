import { Link } from 'react-router-dom';
import { Compass, MapPin, Route } from 'lucide-react';
import { HERO_IMAGE, PRINCIPLE_ITEMS } from '../data/journeys';
import { MichiStamp } from '../components/MichiLogo';
import JourneyCard from '../components/JourneyCard';
import { useAppState } from '../context/AppStateContext';

export default function HomePage() {
  const { journeys } = useAppState();
  const [featuredJourney, secondJourney, thirdJourney] = journeys;

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="topo-grid pointer-events-none absolute inset-0 opacity-80" />

        <div className="relative mx-auto grid max-w-[1400px] items-center gap-14 px-5 py-16 lg:grid-cols-[1fr_.78fr] lg:px-8 lg:py-24">
          <div className="michi-rise">
            <span
              data-testid="landing-eyebrow"
              className="mb-6 inline-block rounded-full border border-[var(--accent)]/50 px-3 py-1 text-xs font-medium text-[var(--accent)]"
            >
              A social atlas for curious people
            </span>

            <h1
              data-testid="landing-headline"
              className="font-heading max-w-[720px] font-extrabold leading-[.94] tracking-[-.075em] text-[var(--foreground)]"
              style={{ fontSize: 'clamp(3.2rem, 7vw, 6.6rem)' }}
            >
              Every path <span className="text-[var(--accent)]">has a story.</span>
            </h1>

            <p
              data-testid="landing-description"
              className="mt-8 max-w-[500px] text-lg leading-8 text-[var(--muted-foreground)]"
            >
              MICHI is where the whole journey comes together — where you started,
              what you found along the way, and the place that stayed with you.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/create-trip"
                className="michi-interactive inline-flex h-12 items-center rounded-full bg-[var(--accent)] px-6 text-sm font-bold text-[#141A18] hover:bg-[#ff8c60]"
              >
                Start your journey →
              </Link>
              <Link
                to="/explore"
                className="michi-interactive inline-flex h-12 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                <span>Explore the atlas</span>
                <Compass className="size-4" />
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-8 border-t border-[var(--border)] pt-5 text-xs text-[var(--muted-foreground)]">
              <div>
                <p className="font-heading text-xl font-bold text-[var(--foreground)]">
                  12.8k
                </p>
                <p>travellers writing</p>
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-[var(--foreground)]">
                  38k
                </p>
                <p>paths shared</p>
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-[var(--foreground)]">
                  74
                </p>
                <p>countries crossed</p>
              </div>
            </div>
          </div>

          {/* Right Column Framed Photo Card */}
          <div className="relative mx-auto w-full max-w-[500px] lg:ml-auto">
            <div className="relative aspect-[.84] overflow-hidden rounded-[28px] border-[10px] border-[var(--card)] shadow-2xl shadow-[#141A18]/20">
              <img
                src={HERO_IMAGE}
                alt="A forest path between cedar trees"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#141A18]/65 via-transparent to-transparent" />

              <div className="absolute bottom-6 left-6 right-32 text-white">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.18em]">
                  <MapPin className="size-3.5 text-[var(--accent)]" />
                  <span>KUMANO KODO</span>
                </p>
                <p className="font-heading mt-1.5 text-2xl font-bold tracking-tight">
                  Walk slowly. See more.
                </p>
              </div>

              <div className="absolute right-4 bottom-4">
                <MichiStamp />
              </div>
            </div>

            {/* Floating Route Preview Card */}
            <Link
              to="/journey/hidden-shikoku"
              data-testid="landing-route-card"
              className="michi-interactive absolute -bottom-5 left-2 w-56 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-xl sm:-left-6"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.14em] text-[var(--muted-foreground)]">
                <span>ROUTE PREVIEW</span>
                <Route className="size-3.5 text-[var(--accent)]" />
              </div>

              <div className="mt-3 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 flex flex-col items-center">
                    <span className="size-2.5 rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent)]/20" />
                    <span className="my-1 h-7 w-px border-l border-dashed border-[var(--accent)]" />
                    <span className="size-2.5 rounded-full border-2 border-[var(--primary)] bg-[var(--card)]" />
                  </div>
                  <div className="flex flex-col justify-between gap-2.5">
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">
                        Takijiri-oji
                      </p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        Nakahechi · 72 km
                      </p>
                    </div>
                    <p className="text-xs font-bold text-[var(--foreground)]">
                      Kumano Hongu
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Community Paths Section */}
      <section className="mx-auto max-w-[1400px] px-5 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
              FROM THE COMMUNITY
            </p>
            <h2 className="font-heading mt-2 text-3xl font-extrabold tracking-[-.05em] text-[var(--foreground)] lg:text-5xl">
              Paths with a pulse.
            </h2>
          </div>

          <Link
            to="/explore"
            className="text-sm font-bold text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
          >
            View all journeys →
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          {featuredJourney && <JourneyCard journey={featuredJourney} featured />}
          <div className="flex flex-col gap-5">
            {secondJourney && <JourneyCard journey={secondJourney} />}
            {thirdJourney && <JourneyCard journey={thirdJourney} />}
          </div>
        </div>
      </section>

      {/* The MICHI Principle Section */}
      <section className="border-y border-[var(--border)] bg-[var(--secondary)]/50">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 lg:grid-cols-[.8fr_1.2fr] lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
              THE MICHI PRINCIPLE
            </p>
            <h2 className="font-heading mt-3 text-4xl font-extrabold leading-tight tracking-[-.055em] text-[var(--foreground)]">
              The in-between is where the magic lives.
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {PRINCIPLE_ITEMS.map((item) => (
              <div
                key={item.number}
                className="border-l-2 pl-4"
                style={{ borderColor: item.borderColor }}
              >
                <p className="font-heading text-xs font-bold tracking-widest text-[var(--muted-foreground)]">
                  {item.number}
                </p>
                <h3 className="font-heading mt-2 text-lg font-bold text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
