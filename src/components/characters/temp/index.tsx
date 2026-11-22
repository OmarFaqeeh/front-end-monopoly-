// TEMPORARY characters lookup (replace with real art via scripts/prepare-characters.mjs).
import type { ComponentType } from "react";
import C01 from "./C01";
import C02 from "./C02";
import C03 from "./C03";
import C04 from "./C04";
import C05 from "./C05";
import C06 from "./C06";
import C07 from "./C07";
import C08 from "./C08";
import C09 from "./C09";
import C10 from "./C10";
import C11 from "./C11";
import C12 from "./C12";
import type { TempProps } from "./Base";

export const TEMP_CHARACTERS: Record<string, ComponentType<TempProps>> = {
  c01: C01, c02: C02, c03: C03, c04: C04, c05: C05, c06: C06,
  c07: C07, c08: C08, c09: C09, c10: C10, c11: C11, c12: C12,
};
