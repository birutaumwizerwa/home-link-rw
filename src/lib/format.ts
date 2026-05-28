export function formatPrice(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (!Number.isFinite(n)) return "0 RWF";
  return `${new Intl.NumberFormat("en-US").format(Math.round(n))} RWF`;
}

export function formatPricePeriod(period: string | null | undefined): string {
  switch (period) {
    case "monthly": return "/ month";
    case "yearly": return "/ year";
    case "fixed": return "";
    default: return "";
  }
}

/** Strip Rwandan phone-number patterns from free-text fields. */
export function stripPhoneNumbers(text: string | null | undefined): string {
  if (!text) return "";
  return text
    // +250 7XX XXX XXX
    .replace(/\+?250[\s\-]?7\d{2}[\s\-]?\d{3}[\s\-]?\d{3}/g, "[contact via app]")
    // 07XXXXXXXX
    .replace(/\b07\d{8}\b/g, "[contact via app]")
    // Loose 9–13 digit runs
    .replace(/(\d[\s\-]?){9,13}/g, (m) => (m.replace(/\D/g, "").length >= 9 ? "[contact via app]" : m));
}

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}
