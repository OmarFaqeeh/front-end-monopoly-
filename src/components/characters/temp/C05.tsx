// TEMPORARY: replace with real art. c05 Auctioneer: top hat, burgundy waistcoat, gavel.
import Base, { stroke, type TempProps } from "./Base";

export default function C05({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={5}
      skin="#eac09a"
      skinShade="#cf9f78"
      clothes="#8f2f3a"
      clothesShade="#6a1f29"
      body={
        <>
          <path d="M84 148 L100 190 L116 148 Q100 158 84 148 Z" fill="#f4f1e6" {...stroke} strokeWidth={2.5} />
          <circle cx="100" cy="170" r="3" fill="#e0b84a" />
          <circle cx="100" cy="184" r="3" fill="#e0b84a" />
        </>
      }
      top={
        <>
          <path d="M48 62 H152 Q152 74 100 74 Q48 74 48 62 Z" fill="#1f1a1a" {...stroke} />
          <path d="M66 62 V20 Q100 12 134 20 V62 Z" fill="#26201f" {...stroke} />
          <rect x="66" y="48" width="68" height="11" fill="#8f2f3a" {...stroke} strokeWidth={2} />
        </>
      }
      front={
        <g transform="rotate(-25 156 170)">
          <rect x="150" y="150" width="8" height="38" rx="4" fill="#a6753f" {...stroke} />
          <rect x="138" y="144" width="32" height="18" rx="5" fill="#c08a4a" {...stroke} />
        </g>
      }
    />
  );
}
