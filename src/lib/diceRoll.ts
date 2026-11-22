// Pure roll timeline math: toss height, bounces and the forward spin that ends exactly on the final pose.
import { easeOutCubic, faceUpQuaternion, qFromAxisAngle, qMultiply, qNormalize, type Quat, type Vec3 } from "./diceOrientation";

export const ROLL_DURATION_MS = [1100, 1250] as const;

/** Toss peak, then two decreasing bounces; each segment is [startFraction, endFraction, peak]. */
const SEGMENTS: [number, number, number][] = [
  [0, 0.5, 0.9],
  [0.5, 0.78, 0.25],
  [0.78, 0.92, 0.08],
];

/** Height above the resting position (die units) at normalized time t in [0, 1]. */
export function rollHeight(t: number): number {
  if (t <= 0 || t >= 0.92) return 0;
  for (const [a, b, peak] of SEGMENTS) {
    if (t >= a && t < b) {
      const s = (t - a) / (b - a);
      return peak * 4 * s * (1 - s);
    }
  }
  return 0;
}

export interface RollPlan {
  value: number;
  /** Random vertical turn of the resting pose. */
  yaw: number;
  axis: Vec3;
  /** Extra full turns, 2 to 4. */
  k: number;
  final: Quat;
}

export function planRoll(value: number, rand: () => number, k: number): RollPlan {
  const yaw = rand() * Math.PI * 2;
  const axis: Vec3 = [rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1];
  if (Math.hypot(...axis) < 0.2) axis[0] = 1;
  return { value, yaw, axis, k, final: faceUpQuaternion(value, yaw) };
}

/** Orientation at normalized time t: qSpin(axis, (1 - easeOutCubic(t)) * 2PI * k) * qFinal (exact at t = 1). */
export function rollOrientation(plan: Pick<RollPlan, "axis" | "k" | "final">, t: number): Quat {
  const angle = (1 - easeOutCubic(Math.min(Math.max(t, 0), 1))) * Math.PI * 2 * plan.k;
  return qNormalize(qMultiply(qFromAxisAngle(plan.axis, angle), plan.final));
}
