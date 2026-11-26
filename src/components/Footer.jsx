import { Link } from 'react-router-dom';
import { MichiLogoIcon } from './MichiLogo';

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="border-t border-[var(--border)] bg-[var(--background)]"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-[var(--foreground)]">
          <MichiLogoIcon size={30} />
          <span className="text-sm font-semibold">Every path has a story.</span>
        </Link>
        <p className="text-xs text-[var(--muted-foreground)]">
          © 2025 MICHI · Built for the wayfinders
        </p>
      </div>
    </footer>
  );
}
