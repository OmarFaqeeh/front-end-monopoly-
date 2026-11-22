// TEMPORARY: replace with real art. c01 Desert Trader: sand head wrap, ochre robe, coin pouch.
import Base, { stroke, type TempProps } from "./Base";

export default function C01({ mood }: TempProps) {
  return (
    <Base
      mood={mood}
      seed={1}
      skin="#d4a06a"
      skinShade="#b9824f"
      clothes="#c98f3f"
      clothesShade="#a06f26"
      body={
        <>
          <path d="M70 152 Q100 172 130 152" fill="none" stroke="#7a5416" strokeWidth="4" strokeLinecap="round" />
          <circle cx="132" cy="176" r="14" fill="#7b4a26" {...stroke} />
          <path d="M126 164 L132 158 L138 164 Z" fill="#e0b84a" {...stroke} strokeWidth={2} />
          <circle cx="132" cy="177" r="4" fill="#e0b84a" />
        </>
      }
      top={
        <>
          <path d="M52 74 Q52 34 100 32 Q148 34 148 74 Q130 56 100 58 Q70 56 52 74 Z" fill="#ecd9aa" {...stroke} />
          <path d="M56 70 Q100 46 144 70" fill="none" stroke="#c9ad6e" strokeWidth="4" />
          <path d="M120 40 Q160 46 164 82 Q150 70 136 66 Z" fill="#e2cb92" {...stroke} />
        </>
      }
    />
  );
}
