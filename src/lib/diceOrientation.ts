// Pure dice orientation math (no three.js): face normals, face-up quaternions and helpers.
export type Vec3 = [number, number, number];
/** Quaternion as [x, y, z, w]. */
export type Quat = [number, number, number, number];

/** Face values on the model: +Z=1, +X=2, +Y=3, -Z=6, -X=5, -Y=4 (opposite faces sum to 7). */
export const FACE_NORMALS: Record<number, Vec3> = {
  1: [0, 0, 1],
  2: [1, 0, 0],
  3: [0, 1, 0],
  6: [0, 0, -1],
  5: [-1, 0, 0],
  4: [0, -1, 0],
};

export const IDENTITY: Quat = [0, 0, 0, 1];

export const oppositeValue = (n: number) => 7 - n;

export function qFromAxisAngle(axis: Vec3, angle: number): Quat {
  const len = Math.hypot(...axis) || 1;
  const s = Math.sin(angle / 2) / len;
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
}

/** Hamilton product a * b (apply b first, then a). */
export function qMultiply(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function qNormalize(q: Quat): Quat {
  const len = Math.hypot(...q) || 1;
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

export function rotateVec(q: Quat, v: Vec3): Vec3 {
  const [qx, qy, qz, qw] = q;
  const [x, y, z] = v;
  // t = 2 * cross(q.xyz, v); v' = v + w * t + cross(q.xyz, t)
  const tx = 2 * (qy * z - qz * y);
  const ty = 2 * (qz * x - qx * z);
  const tz = 2 * (qx * y - qy * x);
  return [x + qw * tx + (qy * tz - qz * ty), y + qw * ty + (qz * tx - qx * tz), z + qw * tz + (qx * ty - qy * tx)];
}

/** Shortest-arc rotation taking unit vector a to unit vector b. */
export function qFromUnitVectors(a: Vec3, b: Vec3): Quat {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  if (dot > 0.999999) return IDENTITY;
  if (dot < -0.999999) {
    // opposite: rotate half a turn around any axis perpendicular to a
    const axis: Vec3 = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
    return qFromAxisAngle(axis, Math.PI);
  }
  const cross: Vec3 = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  return qNormalize([cross[0], cross[1], cross[2], 1 + dot]);
}

/** Orientation of a die at rest showing `n` (face n pointing up, +Y), turned by `yaw` around the vertical axis. */
export function faceUpQuaternion(n: number, yaw = 0): Quat {
  const normal = FACE_NORMALS[n];
  if (!normal) throw new RangeError(`Invalid die value: ${n}`);
  const up = qFromUnitVectors(normal, [0, 1, 0]);
  return qNormalize(qMultiply(qFromAxisAngle([0, 1, 0], yaw), up));
}

/** Which value points up for an orientation (the face whose rotated normal is closest to +Y). */
export function upValue(q: Quat): number {
  let best = 1;
  let bestY = -2;
  for (const [n, normal] of Object.entries(FACE_NORMALS)) {
    const y = rotateVec(q, normal)[1];
    if (y > bestY) {
      bestY = y;
      best = Number(n);
    }
  }
  return best;
}

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
