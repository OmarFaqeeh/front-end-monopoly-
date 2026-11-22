import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
// NEXT_DIST_DIR lets a verification build run beside a live `next dev` without sharing its .next cache.
const nextConfig: NextConfig = { distDir: process.env.NEXT_DIST_DIR ?? ".next" };

export default withNextIntl(nextConfig);
