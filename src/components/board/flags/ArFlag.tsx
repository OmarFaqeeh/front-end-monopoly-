// Argentina: light blue, white, light blue stripes with a small golden sun (16 rays).
export default function ArFlag() {
  const rays = Array.from({ length: 16 }, (_, k) => {
    const a = (k * 22.5 * Math.PI) / 180;
    return (
      <line
        key={k}
        x1={30 + 4.2 * Math.cos(a)}
        y1={20 + 4.2 * Math.sin(a)}
        x2={30 + 6.6 * Math.cos(a)}
        y2={20 + 6.6 * Math.sin(a)}
        stroke="#F6B40E"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    );
  });
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="60" height="40" fill="#74ACDF" />
      <rect y="13.33" width="60" height="13.34" fill="#FFFFFF" />
      <circle cx="30" cy="20" r="3.6" fill="#F6B40E" />
      {rays}
    </svg>
  );
}
