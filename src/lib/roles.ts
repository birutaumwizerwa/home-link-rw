export type Role = "client" | "vendor" | "admin";

/** The page each kind of user lands on after signing in. */
export function homePath(roles: string[]): "/admin" | "/dashboard" | "/account" {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("vendor")) return "/dashboard";
  return "/account";
}

/** Only allows redirects inside this site. */
export function safeNext(next?: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/auth")
    ? next
    : null;
}
