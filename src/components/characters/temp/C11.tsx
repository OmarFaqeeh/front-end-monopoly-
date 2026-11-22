// TEMPORARY: replace with real art. c11 Backpacker: olive cap, big pack straps, passport.
import Base, { stroke, type TempProps } from "./Base";

export default function C11({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={11}
      skin="#e6b48c"
      skinShade="#c8926a"
      clothes="#6b7a34"
      clothesShade="#4a5622"
      back={<path d="M14 200 Q8 120 56 132 L56 200 Z M186 200 Q192 120 144 132 L144 200 Z" fill="#7a8f3a" {...stroke} />}
      body={
        <>
          <path d="M62 150 Q64 176 58 200 H80 Q84 176 84 152 Z" fill="#8a9f44" {...stroke} />
          <path d="M138 150 Q136 176 142 200 H120 Q116 176 116 152 Z" fill="#8a9f44" {...stroke} />
          <rect x="66" y="172" width="14" height="8" rx="2" fill="#d9a441" {...stroke} strokeWidth={2} />
          <rect x="120" y="172" width="14" height="8" rx="2" fill="#d9a441" {...stroke} strokeWidth={2} />
        </>
      }
      top={
        <>
          <path d="M52 66 Q54 28 100 26 Q146 28 148 66 Q100 54 52 66 Z" fill="#7a8f3a" {...stroke} />
          <path d="M50 66 Q100 54 150 66 Q172 70 176 82 Q130 70 100 72 Q70 70 50 66 Z" fill="#5a6a28" {...stroke} />
          <circle cx="100" cy="42" r="6" fill="#e0b84a" {...stroke} strokeWidth={2} />
        </>
      }
      front={
        <g transform="rotate(10 100 188)">
          <rect x="82" y="168" width="34" height="30" rx="4" fill="#2f5f9a" {...stroke} />
          <circle cx="99" cy="183" r="8" fill="#e0b84a" />
          <path d="M92 183 H106 M99 176 V190" stroke="#2f5f9a" strokeWidth="2" />
        </g>
      }
    />
  );
}
