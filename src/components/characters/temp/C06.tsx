// TEMPORARY: replace with real art. c06 Cartographer: forest-green coat, round spectacles, rolled map.
import Base, { stroke, type TempProps } from "./Base";

export default function C06({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={6}
      skin="#f0c8a0"
      skinShade="#d4a47a"
      clothes="#4f7f4a"
      clothesShade="#365a33"
      body={<path d="M86 150 L100 168 L114 150" fill="#e8dcc0" {...stroke} strokeWidth={2.5} />}
      top={
        <>
          <path d="M54 82 Q48 34 100 32 Q152 34 146 82 Q138 52 100 54 Q62 52 54 82 Z" fill="#6a4a2e" {...stroke} />
          <circle cx="80" cy="90" r="15" fill="none" stroke="#3a2a1e" strokeWidth="4" />
          <circle cx="120" cy="90" r="15" fill="none" stroke="#3a2a1e" strokeWidth="4" />
          <path d="M95 90 H105" stroke="#3a2a1e" strokeWidth="4" />
          <circle cx="80" cy="90" r="14" fill="#fff" opacity="0.15" />
          <circle cx="120" cy="90" r="14" fill="#fff" opacity="0.15" />
        </>
      }
      front={
        <g transform="rotate(-18 60 176)">
          <rect x="30" y="160" width="62" height="22" rx="11" fill="#ecdcae" {...stroke} />
          <ellipse cx="34" cy="171" rx="6" ry="11" fill="#d8c48a" {...stroke} strokeWidth={2.5} />
          <path d="M44 166 H80 M44 176 H72" stroke="#a8884a" strokeWidth="3" />
        </g>
      }
    />
  );
}
