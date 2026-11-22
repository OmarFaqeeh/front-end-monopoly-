// TEMPORARY: replace with real art. c04 Falconer: brown leather jacket, glove, small falcon.
import Base, { stroke, type TempProps } from "./Base";

export default function C04({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={4}
      skin="#e3b48c"
      skinShade="#c68f66"
      clothes="#8a5a3a"
      clothesShade="#66401f"
      body={
        <>
          <path d="M70 150 L86 172 L100 150 L114 172 L130 150" fill="#5a3a22" {...stroke} strokeWidth={2.5} />
          <path d="M150 150 Q176 160 176 200 H140 Z" fill="#c9a06a" {...stroke} />
        </>
      }
      top={
        <>
          <path d="M54 80 Q50 36 100 34 Q150 36 146 80 Q134 54 100 56 Q66 54 54 80 Z" fill="#3a2a1e" {...stroke} />
          <path d="M80 44 Q96 38 112 46" fill="none" stroke="#6a4a32" strokeWidth="4" strokeLinecap="round" />
        </>
      }
      front={
        <g>
          <ellipse cx="158" cy="132" rx="15" ry="19" fill="#a6753f" {...stroke} />
          <path d="M146 126 Q150 112 164 114 Q170 124 158 130 Z" fill="#d6b98f" {...stroke} strokeWidth={2} />
          <circle cx="159" cy="118" r="9" fill="#a6753f" {...stroke} />
          <path d="M166 118 L176 122 L166 124 Z" fill="#e0b84a" {...stroke} strokeWidth={2} />
          <circle cx="161" cy="116" r="2.5" fill="#2a1d14" />
        </g>
      }
    />
  );
}
