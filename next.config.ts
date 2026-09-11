import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Without this, the client-side router cache can serve a stale copy of
    // the root layout (and its unread-messages badge) after a soft
    // navigation, instead of re-checking the database. Everything here is
    // per-request/session data anyway, so there's nothing worth caching.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
