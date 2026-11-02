/**
 * Geometric patterns drawn from imigongo, the relief art of eastern Rwanda.
 * Used sparingly: the home page panel and thin bands that close major sections.
 */
const DARK = "var(--ink)";
const GOLD = "var(--marigold)";

export function ImigongoPanel({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 560"
      className={className}
      role="img"
      aria-label="Imigongo geometric pattern"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="imigongo-chevrons" width="120" height="80" patternUnits="userSpaceOnUse">
          <rect width="120" height="80" fill="#ffffff" />
          <path d="M0 0 L60 40 L120 0 V20 L60 60 L0 20 Z" fill={DARK} />
          <path d="M0 40 L60 80 L120 40 V60 L100 73 L120 80 H0 L20 73 L0 60 Z" fill={GOLD} />
        </pattern>
        <pattern id="imigongo-diamonds" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill={DARK} />
          <path d="M60 4 L116 60 L60 116 L4 60 Z" fill="#ffffff" />
          <path d="M60 24 L96 60 L60 96 L24 60 Z" fill={DARK} />
          <path d="M60 44 L76 60 L60 76 L44 60 Z" fill={GOLD} />
        </pattern>
      </defs>
      <rect width="480" height="560" fill="url(#imigongo-chevrons)" />
      <rect x="120" y="80" width="240" height="360" fill="url(#imigongo-diamonds)" />
      <path d="M120 80 H360 V440 H120 Z" fill="none" stroke="#ffffff" strokeWidth="10" />
    </svg>
  );
}

export function ImigongoBand({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-3 w-full ${className}`}
      style={{
        backgroundColor: "var(--ink)",
        backgroundImage: `linear-gradient(135deg, var(--marigold) 25%, transparent 25%), linear-gradient(225deg, var(--marigold) 25%, transparent 25%)`,
        backgroundSize: "24px 12px",
      }}
    />
  );
}
