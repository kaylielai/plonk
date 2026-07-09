interface AvatarProps {
  initials: string;
  color: string;
  responded?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({ initials, color, responded = true, size = "md" }: AvatarProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ring-2 ring-paper ${sizes[size]} ${
        responded ? color : "bg-tan-soft text-ink-muted opacity-60"
      }`}
      style={!responded ? { border: "1px dashed var(--color-border)" } : undefined}
    >
      {initials}
    </span>
  );
}

export function AvatarRow({
  people,
  size = "md",
  max = 5,
}: {
  people: { initials: string; color: string; responded?: boolean }[];
  size?: "sm" | "md" | "lg";
  max?: number;
}) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <Avatar key={i} {...p} size={size} />
      ))}
      {overflow > 0 && (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tan text-[10px] font-medium text-ink-muted ring-2 ring-paper">
          +{overflow}
        </span>
      )}
    </div>
  );
}
