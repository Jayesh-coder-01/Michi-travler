export function MichiLogoIcon({ size = 36 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-[var(--card)]"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className="h-[68%] w-[68%]"
        aria-hidden="true"
      >
        <path
          d="M7 6c11 0 14 5 8 9-6 4-2 7 6 7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="7" cy="6" r="2.5" fill="var(--accent)" />
      </svg>
    </span>
  );
}

export function MichiStamp({ className = '' }) {
  return (
    <div
      className={`relative flex size-28 items-center justify-center rounded-full border border-[var(--accent)]/40 bg-[var(--background)]/30 p-3 backdrop-blur-sm ${className}`}
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        className="h-full w-full -rotate-12"
        aria-hidden="true"
      >
        <circle
          cx="80"
          cy="80"
          r="66"
          stroke="var(--accent)"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <path
          d="M36 52c34-18 68 6 42 30-24 22 4 46 46 30"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          className="michi-path"
        />
        <circle cx="36" cy="52" r="5" fill="var(--accent)" />
        <circle
          cx="124"
          cy="112"
          r="5"
          fill="var(--card)"
          stroke="var(--primary)"
          strokeWidth="2.5"
        />
      </svg>
      <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-[9px] font-extrabold uppercase leading-[1.2] tracking-[.22em] text-white drop-shadow">
        <span>every path</span>
        <span>has a story</span>
      </span>
    </div>
  );
}
