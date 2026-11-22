// TEMPORARY: replace with real art. c03 Pearl Diver: teal hooded wetsuit, goggles on the forehead, pearl.
import Base, { stroke, type TempProps } from "./Base";

export default function C03({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={3}
      skin="#9a6a46"
      skinShade="#7d5233"
      clothes="#2f8f8a"
      clothesShade="#1f6b67"
      back={<path d="M40 110 Q34 30 100 28 Q166 30 160 110 Q150 140 100 142 Q50 140 40 110 Z" fill="#2f8f8a" {...stroke} />}
      top={
        <>
          <path d="M52 66 Q56 40 100 38 Q144 40 148 66 Q100 52 52 66 Z" fill="#2f8f8a" {...stroke} />
          <g>
            <circle cx="80" cy="52" r="15" fill="#d9a441" {...stroke} />
            <circle cx="120" cy="52" r="15" fill="#d9a441" {...stroke} />
            <circle cx="80" cy="52" r="9" fill="#bfe6e0" />
            <circle cx="120" cy="52" r="9" fill="#bfe6e0" />
            <path d="M95 52 H105" stroke="#7a5416" strokeWidth="4" />
          </g>
        </>
      }
      front={<circle cx="150" cy="172" r="12" fill="#f6f1e8" {...stroke} />}
    />
  );
}
