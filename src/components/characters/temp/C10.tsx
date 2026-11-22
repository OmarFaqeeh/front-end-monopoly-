// TEMPORARY: replace with real art. c10 Fisher: conical straw hat, coral shirt, small fish on a string.
import Base, { stroke, type TempProps } from "./Base";

export default function C10({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={10}
      skin="#d8a478"
      skinShade="#b88356"
      clothes="#e0825a"
      clothesShade="#b95f3a"
      body={<path d="M84 150 Q100 164 116 150" fill="none" stroke="#a84e2a" strokeWidth="4" strokeLinecap="round" />}
      top={
        <>
          <path d="M100 8 L168 74 Q100 88 32 74 Z" fill="#e9cf7c" {...stroke} />
          <path d="M100 8 L124 78 M100 8 L76 78 M100 8 L148 80 M100 8 L52 80" stroke="#c9a94c" strokeWidth="3" fill="none" />
          <path d="M60 80 Q100 92 140 80" fill="none" stroke="#a8884a" strokeWidth="4" />
        </>
      }
      front={
        <g>
          <path d="M160 150 Q166 160 164 168" fill="none" stroke="#6a4a2a" strokeWidth="3" />
          <ellipse cx="164" cy="182" rx="17" ry="9" fill="#7ea4c4" {...stroke} strokeWidth={2.5} />
          <path d="M180 182 L194 172 L194 192 Z" fill="#7ea4c4" {...stroke} strokeWidth={2.5} />
          <circle cx="154" cy="180" r="2.4" fill="#2a1d14" />
        </g>
      }
    />
  );
}
