// Canonical site URL for SEO metadata (sitemap, robots) that can't read
// per-request headers the way route handlers/Server Actions can. Set
// NEXT_PUBLIC_SITE_URL once a custom domain is live; falls back to the
// current Vercel deployment URL, then localhost for local dev.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
