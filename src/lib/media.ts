// Server-side check for hero media files in public/media (with a single dev warning if the video is missing).
import fs from "node:fs";
import path from "node:path";

const state = globalThis as { __heroMissingWarned?: boolean };

export function mediaExists(file: string): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", "media", file));
}

export function warnIfHeroVideoMissing(hasVideo: boolean): void {
  if (hasVideo || state.__heroMissingWarned || process.env.NODE_ENV === "production") return;
  state.__heroMissingWarned = true;
  console.warn(
    "[Hero] No video found. Expected front/public/media/hero.mp4 (or hero.webm). Showing the tonal fallback.",
  );
}
