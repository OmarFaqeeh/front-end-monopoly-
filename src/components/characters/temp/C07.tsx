// TEMPORARY: replace with real art. c07 Street Chef: white toque, red neckerchief, ladle.
import Base, { stroke, type TempProps } from "./Base";

export default function C07({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={7}
      skin="#e8b48a"
      skinShade="#c9916a"
      clothes="#d6453d"
      clothesShade="#a82f2a"
      body={<path d="M72 148 Q100 160 128 148 L100 186 Z" fill="#f4f1e6" {...stroke} strokeWidth={2.5} />}
      top={
        <>
          <path d="M56 58 Q56 44 66 40 Q64 18 86 20 Q96 6 114 20 Q138 16 134 40 Q144 44 144 58 Q100 70 56 58 Z" fill="#fff" {...stroke} />
          <path d="M60 56 Q100 66 140 56" fill="none" stroke="#d9d5c6" strokeWidth="3" />
        </>
      }
      front={
        <g transform="rotate(20 154 168)">
          <rect x="150" y="146" width="7" height="42" rx="3.5" fill="#9aa4a8" {...stroke} />
          <ellipse cx="153.5" cy="146" rx="15" ry="10" fill="#b6bfc2" {...stroke} />
        </g>
      }
    />
  );
}
