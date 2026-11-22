// TEMPORARY: replace with real art. c09 Lantern Keeper: yellow raincoat hood, glowing lantern.
import Base, { stroke, type TempProps } from "./Base";

export default function C09({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={9}
      skin="#f0c4a0"
      skinShade="#d49f78"
      clothes="#e3c04a"
      clothesShade="#b8962a"
      back={<path d="M36 112 Q30 24 100 22 Q170 24 164 112 Q156 142 100 144 Q44 142 36 112 Z" fill="#e3c04a" {...stroke} />}
      top={
        <>
          <path d="M50 76 Q54 40 100 38 Q146 40 150 76 Q100 56 50 76 Z" fill="#e3c04a" {...stroke} />
          <path d="M60 64 Q100 46 140 64" fill="none" stroke="#b8962a" strokeWidth="4" />
        </>
      }
      body={<path d="M100 150 V200" stroke="#b8962a" strokeWidth="4" />}
      front={
        <g>
          <path d="M38 158 Q50 140 62 158" fill="none" stroke="#5a4a2a" strokeWidth="4" />
          <circle cx="50" cy="180" r="26" fill="#ffe9a0" opacity="0.4" />
          <rect x="38" y="160" width="24" height="30" rx="6" fill="#ffd45a" {...stroke} />
          <rect x="35" y="157" width="30" height="7" rx="3" fill="#6a4a2a" {...stroke} strokeWidth={2.5} />
          <rect x="35" y="187" width="30" height="7" rx="3" fill="#6a4a2a" {...stroke} strokeWidth={2.5} />
          <path d="M50 168 Q44 178 50 186 Q56 178 50 168 Z" fill="#fff6c8" />
        </g>
      }
    />
  );
}
