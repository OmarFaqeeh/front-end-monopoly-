// TEMPORARY: replace with real art. c08 Astronomer: star-pattern scarf, round glasses, telescope.
import Base, { stroke, type TempProps } from "./Base";
import { starPoints } from "@/components/board/flags/shapes";

export default function C08({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={8}
      skin="#efc7a6"
      skinShade="#d3a37f"
      clothes="#3f3560"
      clothesShade="#2b2345"
      body={
        <>
          <path d="M60 140 Q100 176 140 140 L146 160 Q100 192 54 160 Z" fill="#7a4fa0" {...stroke} />
          <polygon points={starPoints(84, 164, 7, 3, 5)} fill="#f3d36a" />
          <polygon points={starPoints(112, 168, 6, 2.6, 5)} fill="#f3d36a" />
          <polygon points={starPoints(130, 152, 5, 2.2, 5)} fill="#f3d36a" />
        </>
      }
      top={
        <>
          <path d="M52 86 Q44 34 100 30 Q156 34 148 86 Q140 50 118 56 Q106 40 90 56 Q60 50 52 86 Z" fill="#2c2a3a" {...stroke} />
          <circle cx="80" cy="90" r="14" fill="none" stroke="#d9a441" strokeWidth="4" />
          <circle cx="120" cy="90" r="14" fill="none" stroke="#d9a441" strokeWidth="4" />
          <path d="M94 90 H106" stroke="#d9a441" strokeWidth="4" />
        </>
      }
      front={
        <g transform="rotate(-35 150 176)">
          <rect x="118" y="166" width="64" height="16" rx="5" fill="#d9a441" {...stroke} />
          <rect x="170" y="162" width="16" height="24" rx="4" fill="#7a5416" {...stroke} />
          <rect x="112" y="168" width="10" height="12" rx="3" fill="#b8802c" {...stroke} strokeWidth={2.5} />
        </g>
      }
    />
  );
}
