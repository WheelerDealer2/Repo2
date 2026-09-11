export function CarIcon({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 64 36" fill="none" aria-hidden="true">
      <path
        d="M6 26h-4v-9l4-8h28l10 8h4a4 4 0 0 1 4 4v5h-4"
        fill={color}
        opacity="0.15"
      />
      <path
        d="M6 26h-4v-9l4-8h28l10 8h4a4 4 0 0 1 4 4v5h-4"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="26" r="5" fill={color} />
      <circle cx="16" cy="26" r="2" fill="white" />
      <circle cx="42" cy="26" r="5" fill={color} />
      <circle cx="42" cy="26" r="2" fill="white" />
    </svg>
  );
}

export function GaugeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M12 3a9 9 0 0 0-9 9c0 2.5 1 4.5 2.5 6M21 12a9 9 0 0 0-3-6.7" />
    </svg>
  );
}

export function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8d92" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6z" />
    </svg>
  );
}

export function LogoIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );
}
