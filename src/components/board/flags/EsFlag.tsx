// Spain: red, yellow (double height), red, with a simplified coat of arms (crown, quartered shield, two pillars).
export default function EsFlag() {
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />

      <g transform="translate(22 20)">
        {/* Pillars */}
        <rect x="-8.6" y="-6" width="2.2" height="12.5" fill="#C8A04A" stroke="#8C6A1F" strokeWidth="0.3" />
        <rect x="6.4" y="-6" width="2.2" height="12.5" fill="#C8A04A" stroke="#8C6A1F" strokeWidth="0.3" />
        <rect x="-9.2" y="-6.6" width="3.4" height="1" fill="#8C6A1F" />
        <rect x="5.8" y="-6.6" width="3.4" height="1" fill="#8C6A1F" />
        <rect x="-9.2" y="6.2" width="3.4" height="1" fill="#8C6A1F" />
        <rect x="5.8" y="6.2" width="3.4" height="1" fill="#8C6A1F" />

        {/* Shield, quartered */}
        <path d="M-5 -4 H5 V2.5 Q5 6.5 0 8 Q-5 6.5 -5 2.5 Z" fill="#FFFFFF" stroke="#8C6A1F" strokeWidth="0.35" />
        <path d="M-5 -4 H0 V2 H-5 Z" fill="#AA151B" />
        <path d="M0 2 H5 V2.5 Q5 6.5 0 8 Z" fill="#AA151B" />
        <path d="M0 -4 H5 V2 H0 Z" fill="#F1BF00" opacity="0.9" />
        <ellipse cx="0" cy="1.6" rx="1.7" ry="2.2" fill="#0039F0" stroke="#8C6A1F" strokeWidth="0.25" />

        {/* Crown */}
        <path
          d="M-3.6 -5 L-3.9 -8.4 L-2 -7 L0 -9.2 L2 -7 L3.9 -8.4 L3.6 -5 Z"
          fill="#E0B14A"
          stroke="#8C6A1F"
          strokeWidth="0.3"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="-9.6" r="0.5" fill="#E0B14A" />
      </g>
    </svg>
  );
}
