"use client";
// One WebGL canvas for the pair of dice. Demand frameloop; pauses when offscreen or the tab is hidden.
import { Canvas } from "@react-three/fiber";
import { NoToneMapping } from "three";
import { useEffect, useRef, useState } from "react";
import DiceScene, { type DiceSceneProps } from "./DiceScene";

export default function DiceCanvas({ fovScale = 1, ...props }: Omit<DiceSceneProps, "active"> & { fovScale?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [docVisible, setDocVisible] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e?.isIntersecting ?? true));
    io.observe(el);
    const onVis = () => setDocVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={wrap} aria-hidden="true" className="size-full">
      <Canvas
        frameloop="demand"
        dpr={[1, 2]}
        shadows="percentage"
        scene={{ environmentIntensity: 0.3 }}
        gl={{ antialias: true, alpha: true, toneMapping: NoToneMapping }}
        camera={{ fov: (2 * Math.atan(Math.tan((14 * Math.PI) / 180) * fovScale) * 180) / Math.PI, near: 0.1, far: 30, position: [-1.7, 2.4, 3.2] }}
        onCreated={({ camera }) => camera.lookAt(0, 0.05, 0)}
        style={{ background: "transparent" }}
      >
        <DiceScene {...props} active={inView && docVisible} />
      </Canvas>
    </div>
  );
}
