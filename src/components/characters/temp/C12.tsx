// TEMPORARY: replace with real art. c12 Potter: terracotta apron, patterned headband, clay vase.
import Base, { stroke, type TempProps } from "./Base";

export default function C12({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={12}
      skin="#c98d62"
      skinShade="#a96e46"
      clothes="#f1e2c4"
      clothesShade="#d8c49e"
      body={
        <>
          <path d="M70 152 H130 L146 200 H54 Z" fill="#b8604a" {...stroke} />
          <path d="M70 152 L76 134 M130 152 L124 134" stroke="#2a1d14" strokeWidth="3" />
          <path d="M82 176 H118" stroke="#8a4030" strokeWidth="4" strokeDasharray="6 5" />
        </>
      }
      top={
        <>
          <path d="M52 84 Q44 30 100 28 Q156 30 148 84 Q140 46 100 50 Q60 46 52 84 Z" fill="#2c1e18" {...stroke} />
          <path d="M54 62 Q100 44 146 62 L144 74 Q100 58 56 74 Z" fill="#c8453a" {...stroke} />
          <circle cx="72" cy="66" r="3" fill="#f6e2b0" />
          <circle cx="90" cy="60" r="3" fill="#f6e2b0" />
          <circle cx="110" cy="60" r="3" fill="#f6e2b0" />
          <circle cx="128" cy="66" r="3" fill="#f6e2b0" />
        </>
      }
      front={
        <g>
          <path d="M142 168 Q130 176 136 192 Q150 200 164 192 Q170 176 158 168 L156 160 H144 Z" fill="#b8604a" {...stroke} />
          <ellipse cx="150" cy="160" rx="9" ry="4" fill="#8a4030" {...stroke} strokeWidth={2.5} />
          <path d="M138 180 H162" stroke="#f6e2b0" strokeWidth="3" strokeDasharray="4 3" />
        </g>
      }
    />
  );
}
