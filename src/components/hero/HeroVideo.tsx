"use client";
// Hero background: autoplaying, muted, looping video (no controls) over a tonal fallback that
// shows while loading or when the file is missing. Layered overlay keeps text AA.
import { useEffect, useRef } from "react";
import { ALWAYS_PLAY_VIDEO } from "@/config/hero";
import GoldDust from "./GoldDust";

interface Props {
  hasVideo: boolean;
  hasWebm: boolean;
  hasPoster: boolean;
}

const DEV = process.env.NODE_ENV !== "production";
const log = (...args: unknown[]) => {
  if (DEV) console.info("[HeroVideo]", ...args);
};

export default function HeroVideo({ hasVideo, hasWebm, hasPoster }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    // Muted must be set as a property (not only the attribute) so autoplay policies allow play().
    video.muted = true;
    video.defaultMuted = true;

    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const blockers: string[] = [];
    if (conn?.saveData === true) blockers.push("saveData");
    if (!ALWAYS_PLAY_VIDEO && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      blockers.push("prefers-reduced-motion");
    }
    if (blockers.length) {
      log("autoplay blocked by:", blockers.join(", "), "(showing poster only)");
      video.pause();
      return;
    }

    let inView = true;
    const sync = () => {
      if (inView && !document.hidden) {
        video.play().catch((err: unknown) => {
          log("play() rejected:", err instanceof DOMException ? err.name : String(err));
        });
      } else {
        log("paused:", !inView ? "hero offscreen (IntersectionObserver)" : "tab hidden");
        video.pause();
      }
    };

    // Belt and braces next to the loop attribute: restart immediately if it ever ends.
    const onEnded = () => {
      video.currentTime = 0;
      sync();
    };
    const onError = () => {
      if (DEV) {
        console.warn(
          `[HeroVideo] video failed to load (MediaError code ${video.error?.code}). Expected /media/hero.mp4 (or hero.webm) in front/public/media/.`,
        );
      }
    };
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError, true);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      sync();
    });
    io.observe(video);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError, true);
    };
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-(--hero-ink)">
      <div className="hero-fallback" />
      {hasVideo ? (
        <video
          ref={ref}
          className="absolute inset-0 size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          poster={hasPoster ? "/media/hero-poster.jpg" : undefined}
        >
          {hasWebm && <source src="/media/hero.webm" type="video/webm" />}
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
      ) : (
        <GoldDust />
      )}
      <div className="absolute inset-0 bg-(--hero-ink)/50" />
      <div className="hero-vignette absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-linear-to-b from-transparent to-surface" />
    </div>
  );
}
