import { Star } from "lucide-react";

export function Stars({ value, label }: { value: number; label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={label ?? `${value} / 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= Math.round(value) ? "fill-marigold text-marigold" : "text-input"}`}
        />
      ))}
    </span>
  );
}
