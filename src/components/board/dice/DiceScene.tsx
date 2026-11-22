"use client";
// Three.js scene for the dice pair: rounded-box model, engraved gold pips, lights, shadow catcher, roll timeline.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  CircleGeometry,
  Color,
  DoubleSide,
  Euler,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  Quaternion,
  RingGeometry,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
  type Texture,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FACE_NORMALS, faceUpQuaternion, type Quat, type Vec3 } from "@/lib/diceOrientation";
import { planRoll, rollHeight, rollOrientation, ROLL_DURATION_MS, type RollPlan } from "@/lib/diceRoll";

const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, 1], [1, -1]],
  3: [[-1, 1], [0, 0], [1, -1]],
  4: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
  5: [[-1, 1], [1, 1], [0, 0], [-1, -1], [1, -1]],
  6: [[-1, 1], [1, 1], [-1, 0], [1, 0], [-1, -1], [1, -1]],
};
const PIP_STEP = 0.26;
const DIE_X = [-0.625, 0.625] as const;

interface PipPlacement {
  position: Vector3;
  quaternion: Quaternion;
}

/** Tangent axes for a face normal. */
function tangents(n: Vec3): [Vec3, Vec3] {
  if (n[1] !== 0) return [[1, 0, 0], [0, 0, 1]];
  if (n[0] !== 0) return [[0, 0, 1], [0, 1, 0]];
  return [[1, 0, 0], [0, 1, 0]];
}

function buildPips(): PipPlacement[] {
  const out: PipPlacement[] = [];
  for (const [value, normal] of Object.entries(FACE_NORMALS)) {
    const n = normal;
    const [u, v] = tangents(n);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(...n));
    for (const [cx, cy] of PIPS[Number(value)]!) {
      out.push({
        position: new Vector3(
          n[0] * 0.5 + u[0] * cx * PIP_STEP + v[0] * cy * PIP_STEP,
          n[1] * 0.5 + u[1] * cx * PIP_STEP + v[1] * cy * PIP_STEP,
          n[2] * 0.5 + u[2] * cx * PIP_STEP + v[2] * cy * PIP_STEP,
        ),
        quaternion: q.clone(),
      });
    }
  }
  return out;
}

function makeBlobTexture(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.65)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.25)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

interface DieState {
  plan: RollPlan | null;
  start: number;
  duration: number;
  q: Quaternion;
  hover: number;
  hoverTarget: number;
  fade: number;
  /** Where this throw starts (x, z); the die travels from there to its resting spot. */
  from: [number, number];
  /** Scales the toss height (0.75 to 1.45), different for every throw. */
  peak: number;
  /** 0 = hidden (after the result was shown), 1 = visible. */
  vis: number;
}

export interface DiceSceneProps {
  values: [number, number];
  rollKey: number;
  reduced: boolean;
  interactive: boolean;
  active: boolean;
  /** The dice leave the table after the result was shown; the next roll brings them back. */
  hidden?: boolean;
  /** Dev only: spin both dice slowly on two axes so every face shows over time. */
  autoRotate?: boolean;
  onRequestRoll?: () => void;
  onRolled?: () => void;
}

const toThree = (q: Quat) => new Quaternion(q[0], q[1], q[2], q[3]);

export default function DiceScene({ values, rollKey, reduced, interactive, active, hidden = false, autoRotate, onRequestRoll, onRolled }: DiceSceneProps) {
  const { invalidate, gl } = useThree();

  // One shared geometry/material per kind for both dice.
  const assets = useMemo(() => {
    const body = new RoundedBoxGeometry(1, 1, 1, 6, 0.14);
    // Shallow spherical cap, sunk slightly into the face (pole toward +Z).
    const R = 0.16;
    const theta = Math.asin(0.075 / R);
    const cap = new SphereGeometry(R, 24, 10, 0, Math.PI * 2, 0, theta);
    cap.rotateX(Math.PI / 2);
    cap.translate(0, 0, -R * Math.cos(theta) - 0.006);
    const ring = new RingGeometry(0.07, 0.097, 36);
    const bodyMat = new MeshPhysicalMaterial({ color: new Color("#3f5f4c"), roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.22, envMapIntensity: 0.1 });
    const pipMat = new MeshStandardMaterial({ color: new Color("#e0b25c"), metalness: 0.85, roughness: 0.3, envMapIntensity: 0.7 });
    const ringMat = new MeshStandardMaterial({ color: new Color("#1d2a22"), roughness: 0.8, side: DoubleSide });
    const blobTex = makeBlobTexture();
    const blobGeo = new CircleGeometry(0.85, 32);
    const blobMat = [0, 1].map(() => new MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
    return { body, cap, ring, bodyMat, pipMat, ringMat, blobTex, blobGeo, blobMat, pips: buildPips() };
  }, []);

  // Dispose everything on unmount.
  useEffect(
    () => () => {
      const geos: BufferGeometry[] = [assets.body, assets.cap, assets.ring, assets.blobGeo];
      const mats: Material[] = [assets.bodyMat, assets.pipMat, assets.ringMat, ...assets.blobMat];
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      assets.blobTex.dispose();
    },
    [assets],
  );

  // Procedural environment for reflections (no network assets), attached to the scene via <primitive>.
  const envTexture = useMemo<Texture>(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = new RoomEnvironment();
    const tex = pmrem.fromScene(env, 0.04).texture;
    env.dispose();
    pmrem.dispose();
    return tex;
  }, [gl]);
  useEffect(() => () => envTexture.dispose(), [envTexture]);

  const groups = useRef<(Group | null)[]>([null, null]);
  const blobs = useRef<(Mesh | null)[]>([null, null]);
  const states = useRef<DieState[]>(
    [0, 1].map((i) => ({ plan: null, start: 0, duration: ROLL_DURATION_MS[i]!, q: toThree(faceUpQuaternion(values[i]!, i * 1.3 + 0.4)), hover: 0, hoverTarget: 0, fade: 1, from: [DIE_X[i]!, 0] as [number, number], peak: 1, vis: 1 })),
  );
  const rolled = useRef(false);
  const lastKey = useRef(rollKey);
  const valuesRef = useRef(values);
  const hiddenRef = useRef(hidden);
  useEffect(() => {
    hiddenRef.current = hidden;
    invalidate();
  }, [hidden, invalidate]);

  useEffect(() => {
    valuesRef.current = values;
  });

  // Start a roll whenever rollKey changes.
  useEffect(() => {
    if (lastKey.current === rollKey) return;
    lastKey.current = rollKey;
    const now = performance.now();
    // Every throw is different: a random side and distance to throw from, random spin turns, height and duration.
    const side = Math.random() < 0.5 ? -1 : 1;
    states.current.forEach((s, i) => {
      const plan = planRoll(valuesRef.current[i]!, Math.random, 2 + Math.floor(Math.random() * 4));
      s.plan = plan;
      s.start = now;
      s.vis = 1;
      // starts well inside the (large) frame, so the dice are visible from the first moment
      s.from = reduced ? [DIE_X[i]!, 0] : [DIE_X[i]! + side * (2.6 + Math.random() * 1.6) + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 2.2];
      s.peak = 0.75 + Math.random() * 0.7;
      s.duration = reduced ? 200 : 950 + Math.random() * 300; // never longer than the 1250 ms the game waits
      if (reduced) {
        s.q = toThree(plan.final);
        s.fade = 0;
      }
    });
    rolled.current = false;
    invalidate();
  }, [rollKey, reduced, invalidate]);

  // Idle float: re-render at most ~30fps while visible.
  useEffect(() => {
    if (!active || reduced) return;
    const id = window.setInterval(() => invalidate(), 33);
    return () => window.clearInterval(id);
  }, [active, reduced, invalidate]);

  useFrame(() => {
    const now = performance.now();
    let animating = false;
    states.current.forEach((s, i) => {
      const g = groups.current[i];
      if (!g) return;
      let y = 0;
      let x: number = DIE_X[i]!;
      let z = 0;
      let q = s.q;
      if (autoRotate) {
        const t = now / 1000 + i * 2;
        q = new Quaternion().setFromEuler(new Euler(t * 0.45, t * 0.62, t * 0.15));
        animating = true;
      } else if (s.plan) {
        const t = Math.min((now - s.start) / s.duration, 1);
        if (reduced) {
          s.fade = t;
        } else {
          y = rollHeight(t) * s.peak;
          q = toThree(rollOrientation(s.plan, t));
          // the die flies in from where it was thrown and slows down as it lands
          const travel = 1 - Math.pow(1 - t, 2.4);
          x = s.from[0] + (DIE_X[i]! - s.from[0]) * travel;
          z = s.from[1] * (1 - travel);
        }
        if (t < 1) animating = true;
        else {
          s.q = toThree(s.plan.final);
          q = s.q;
          s.plan = null;
          s.fade = 1;
        }
      } else if (!reduced) {
        const phase = now / 1000 + i * 1.7;
        y = 0.03 * Math.sin(phase * 1.3);
        const wobble = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.012 * Math.sin(phase * 0.9));
        q = wobble.multiply(s.q.clone());
      }
      s.hover += (s.hoverTarget - s.hover) * 0.25;
      if (Math.abs(s.hoverTarget - s.hover) > 0.002) animating = true;
      const h = y + s.hover * 0.06;
      g.position.set(x, h, z);
      g.quaternion.copy(q);
      // leave (shrink away) after the result was shown, come back with the next throw
      const visTarget = hiddenRef.current && !s.plan ? 0 : 1;
      s.vis += (visTarget - s.vis) * (reduced ? 1 : 0.22);
      if (Math.abs(visTarget - s.vis) > 0.01) animating = true;
      else s.vis = visTarget;
      g.visible = s.vis > 0.02;
      // a short scale-in at the start of a throw instead of popping into view
      const intro = s.plan && !reduced ? Math.min(1, (now - s.start) / 160) : 1;
      const scale = (reduced ? 0.9 + 0.1 * s.fade : 1) * s.vis * (0.35 + 0.65 * intro);
      g.scale.setScalar(Math.max(scale, 0.0001));
      const blob = blobs.current[i];
      if (blob) {
        const k = Math.min(h / 1.1, 1);
        blob.position.set(x, -0.497, z);
        blob.visible = s.vis > 0.02;
        blob.scale.setScalar((1.05 - 0.4 * k) * s.vis);
        (blob.material as MeshBasicMaterial).opacity = 0.9 * (1 - k);
      }
    });
    if (animating) invalidate();
    else if (!rolled.current && states.current.every((s) => !s.plan) && lastKey.current !== 0) {
      rolled.current = true;
      onRolled?.();
    }
  });

  return (
    <>
      <primitive object={envTexture} attach="environment" />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[-3, 5, 3]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={1}
        shadow-camera-far={14}
        shadow-bias={-0.0004}
        shadow-radius={5}
      />
      <directionalLight position={[4, 2, 2]} intensity={0.5} />
      <directionalLight position={[0, 3, -4]} intensity={0.6} />

      {/* shadow catcher: transparent plane under the dice */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.28} />
      </mesh>

      {[0, 1].map((i) => (
        <group key={i}>
          <mesh
            ref={(m) => {
              blobs.current[i] = m;
            }}
            rotation={[-Math.PI / 2, 0, 0]}
            geometry={assets.blobGeo}
            material={assets.blobMat[i]}
          />
          <group
            ref={(g) => {
              groups.current[i] = g;
            }}
            onPointerOver={(e) => {
              if (!interactive) return;
              states.current[i]!.hoverTarget = 1;
              (e.nativeEvent.target as HTMLElement).style.cursor = "pointer";
              invalidate();
            }}
            onPointerOut={(e) => {
              states.current[i]!.hoverTarget = 0;
              (e.nativeEvent.target as HTMLElement).style.cursor = "";
              invalidate();
            }}
            onClick={() => interactive && onRequestRoll?.()}
          >
            <mesh geometry={assets.body} material={assets.bodyMat} castShadow receiveShadow />
            {assets.pips.map((p, k) => (
              <group key={k} position={p.position} quaternion={p.quaternion}>
                <mesh geometry={assets.ring} material={assets.ringMat} position={[0, 0, 0.0015]} />
                <mesh geometry={assets.cap} material={assets.pipMat} castShadow />
              </group>
            ))}
          </group>
        </group>
      ))}
    </>
  );
}
