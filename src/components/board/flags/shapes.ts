// Geometry helpers shared by the flag components.

/** Points of an n-pointed star centered on (cx, cy); `inner` is the inner radius. */
export function starPoints(cx: number, cy: number, outer: number, inner: number, n: number, rotate = -90): string {
  return Array.from({ length: n * 2 }, (_, k) => {
    const a = ((rotate + k * (180 / n)) * Math.PI) / 180;
    const r = k % 2 === 0 ? outer : inner;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
}

/** A pentagram drawn as one continuous line (outline star). */
export function pentagramPath(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 5 }, (_, k) => {
    const a = ((-90 + k * 72) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
  const order = [0, 2, 4, 1, 3];
  return order.map((i, n) => `${n === 0 ? "M" : "L"}${pts[i]![0].toFixed(2)} ${pts[i]![1].toFixed(2)}`).join(" ") + " Z";
}
