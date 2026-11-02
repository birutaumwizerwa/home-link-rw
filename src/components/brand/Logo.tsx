import { Link } from "@tanstack/react-router";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="var(--primary)" />
      <path d="M16 6 L27 16 V19 L16 9 L5 19 V16 Z" fill="var(--marigold)" />
      <path d="M16 13 L24 20.5 V26 H8 V20.5 Z" fill="#ffffff" />
      <path d="M16 18 L19.5 21.5 L16 25 L12.5 21.5 Z" fill="var(--primary)" />
    </svg>
  );
}

export function Logo({ tone = "default" }: { tone?: "default" | "light" }) {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="HomeLink Rwanda home">
      <LogoMark />
      <span
        className={`font-display text-lg font-bold leading-none ${tone === "light" ? "text-white" : "text-foreground"}`}
      >
        HomeLink <span className={tone === "light" ? "text-marigold" : "text-primary"}>Rwanda</span>
      </span>
    </Link>
  );
}
