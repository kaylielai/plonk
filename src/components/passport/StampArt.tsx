// Static SVG stamps per activity tag — vintage postage feel, single-color line art.
// Placeholder until real generated art lands.

interface StampArtProps {
  tag: string;
  className?: string;
}

const paths: Record<string, JSX.Element> = {
  Food: (
    <g>
      <path d="M20 30h24l-2 26a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" />
      <path d="M28 24v6M32 22v8M36 24v6" />
    </g>
  ),
  Outdoors: (
    <g>
      <path d="M10 54l14-22 10 14 6-8 14 16z" />
      <circle cx="46" cy="20" r="4" />
    </g>
  ),
  Study: (
    <g>
      <path d="M14 18h36v32H14z" />
      <path d="M32 18v32M14 26h36M14 42h36" />
    </g>
  ),
  "Game night": (
    <g>
      <rect x="10" y="24" width="44" height="20" rx="10" />
      <circle cx="22" cy="34" r="2" />
      <circle cx="28" cy="34" r="2" />
      <circle cx="42" cy="30" r="2" />
      <circle cx="42" cy="38" r="2" />
    </g>
  ),
  Movie: (
    <g>
      <circle cx="32" cy="32" r="18" />
      <circle cx="32" cy="32" r="4" />
      <circle cx="32" cy="18" r="3" />
      <circle cx="32" cy="46" r="3" />
      <circle cx="18" cy="32" r="3" />
      <circle cx="46" cy="32" r="3" />
    </g>
  ),
  Music: (
    <g>
      <path d="M26 44V18l16-4v26" />
      <circle cx="22" cy="46" r="4" />
      <circle cx="38" cy="42" r="4" />
    </g>
  ),
  Café: (
    <g>
      <path d="M16 28h28v14a10 10 0 0 1-10 10h-8a10 10 0 0 1-10-10z" />
      <path d="M44 32h4a4 4 0 0 1 0 8h-4" />
      <path d="M22 20c0 2 2 2 2 4M30 18c0 2 2 2 2 4M38 20c0 2 2 2 2 4" />
    </g>
  ),
  Travel: (
    <g>
      <path d="M8 34l12-2 10-14h4l-4 16 12-2 4-6h3l-2 8 2 8h-3l-4-6-12-2 4 16h-4L20 36l-12-2z" />
    </g>
  ),
};

const fallback = (
  <g>
    <path d="M32 12l6 14 15 1-11 10 3 15-13-8-13 8 3-15-11-10 15-1z" />
  </g>
);

export function StampArt({ tag, className = "" }: StampArtProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {paths[tag] ?? fallback}
    </svg>
  );
}
