// Flag lookup by country code. Flags are never mirrored.
import type { ComponentType } from "react";
import type { FlagCode } from "@/config/boardLayout";
import AeFlag from "./AeFlag";
import ArFlag from "./ArFlag";
import EgFlag from "./EgFlag";
import EsFlag from "./EsFlag";
import JoFlag from "./JoFlag";
import JpFlag from "./JpFlag";
import MaFlag from "./MaFlag";
import TrFlag from "./TrFlag";

export const FLAGS: Record<FlagCode, ComponentType> = {
  AR: ArFlag,
  JO: JoFlag,
  EG: EgFlag,
  TR: TrFlag,
  ES: EsFlag,
  JP: JpFlag,
  MA: MaFlag,
  AE: AeFlag,
};
