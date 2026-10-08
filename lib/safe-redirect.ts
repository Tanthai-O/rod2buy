// Only allow same-site relative paths — blocks open redirects like
// ?redirectTo=https://evil.com or //evil.com
export function safeRedirect(target: string | null | undefined, fallback = "/listings"): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) {
    return fallback
  }
  return target
}
