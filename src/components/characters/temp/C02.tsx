// TEMPORARY: replace with real art. c02 Navigator: captain cap, brass compass.
import Base, { stroke, type TempProps } from "./Base";

export default function C02({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={2}
      skin="#f1cba3"
      skinShade="#d6a97c"
      clothes="#2f6faf"
      clothesShade="#1f4f82"
      body={
        <>
          <path d="M84 150 L100 176 L116 150" fill="#f4f1e6" {...stroke} strokeWidth={2.5} />
          <circle cx="100" cy="178" r="13" fill="#d9a441" {...stroke} />
          <circle cx="100" cy="178" r="8" fill="#fff6dc" />
          <path d="M100 171 L103 178 L100 185 L97 178 Z" fill="#b8402f" />
        </>
      }
      top={
        <>
          <path d="M54 62 Q54 26 100 26 Q146 26 146 62 Z" fill="#fff" {...stroke} />
          <path d="M54 62 Q100 74 146 62 L146 52 Q100 62 54 52 Z" fill="#2f6faf" {...stroke} strokeWidth={2.5} />
          <path d="M60 64 Q100 84 140 64 Q140 74 100 78 Q60 74 60 64 Z" fill="#1d2f4a" {...stroke} />
          <circle cx="100" cy="46" r="8" fill="#e0b84a" {...stroke} strokeWidth={2} />
        </>
      }
    />
  );
}
