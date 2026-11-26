import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Plus, Search, Sun, X } from 'lucide-react';
import { MichiLogoIcon } from './MichiLogo';
import { useAppState } from '../context/AppStateContext';

const NAV_ITEMS = [
  { label: 'Explore', to: '/explore' },
  { label: 'Field notes', to: '/blog' },
  { label: 'Community', to: '/profile' },
  { label: 'Wayfinder AI', to: '/chat' },
];

export default function Header() {
  const { dark, toggleTheme, isSignedIn, signOut, profile, journeys } =
    useAppState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const quickMatches = quickQuery.trim()
    ? journeys.filter(
        (j) =>
          j.title.toLowerCase().includes(quickQuery.toLowerCase()) ||
          j.route.toLowerCase().includes(quickQuery.toLowerCase()) ||
          j.tag.toLowerCase().includes(quickQuery.toLowerCase())
      )
    : journeys.slice(0, 3);

  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-30 border-b border-[var(--border)]/70 bg-[var(--background)]/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            data-testid="michi-logo-button"
            className="flex items-center gap-2.5 text-[var(--foreground)] transition-opacity hover:opacity-85"
          >
            <MichiLogoIcon size={36} />
            <span className="font-heading text-xl font-extrabold tracking-[-.04em]">
              MICHI<span className="text-[var(--accent)]">.</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            {NAV_ITEMS.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm font-medium transition-colors ${
                    active
                      ? 'font-semibold text-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            data-testid="header-search-button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Search journeys"
            className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <Search className="size-4" />
          </button>

          <button
            type="button"
            data-testid="theme-toggle"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="michi-interactive inline-flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:border-[var(--accent)]"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {isSignedIn ? (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] py-1 pl-1.5 pr-3 text-xs font-bold text-[var(--foreground)] hover:border-[var(--accent)]"
              >
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-extrabold text-[#141A18]">
                  {profile.initials}
                </span>
                <span>{profile.name.split(' ')[0]}</span>
              </Link>
              <button
                type="button"
                onClick={signOut}
                aria-label="Sign out"
                className="inline-flex size-9 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              data-testid="header-login-button"
              className="hidden rounded-full px-4 py-2 text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          <Link
            to="/create-trip"
            data-testid="header-create-button"
            className="michi-interactive inline-flex h-10 items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-sm font-bold text-[#141A18] hover:bg-[#ff8c60]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Create trip</span>
          </Link>

          <button
            type="button"
            data-testid="mobile-menu-button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] lg:hidden"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--card)] px-5 py-4">
          <div className="mx-auto max-w-[720px]">
            <div className="flex items-center gap-2">
              <Search className="size-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                autoFocus
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchOpen(false);
                    navigate(`/explore?q=${encodeURIComponent(quickQuery)}`);
                  }
                }}
                placeholder="Search paths, regions, or tags... (Enter for atlas)"
                className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Close
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border)]/60 pt-3">
              {quickMatches.map((j) => (
                <Link
                  key={j.id}
                  to={`/journey/${j.id}`}
                  onClick={() => setSearchOpen(false)}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs font-semibold text-[var(--foreground)] hover:border-[var(--accent)]"
                >
                  {j.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)]"
              >
                {item.label}
              </Link>
            ))}
            {isSignedIn ? (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setMobileOpen(false);
                }}
                className="rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)] sm:hidden"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)] sm:hidden"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
