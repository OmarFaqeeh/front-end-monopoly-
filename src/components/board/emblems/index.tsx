// Emblem lookup per tile and the glow token used behind each emblem.
import type { ReactNode } from "react";
import type { TileData } from "@/config/boardLayout";
import CityTaxEmblem from "./CityTaxEmblem";
import CustomsEmblem from "./CustomsEmblem";
import DesalinationEmblem from "./DesalinationEmblem";
import DetentionEmblem from "./DetentionEmblem";
import FortuneEmblem from "./FortuneEmblem";
import GoToDetentionEmblem from "./GoToDetentionEmblem";
import HarborEmblem from "./HarborEmblem";
import OasisEmblem from "./OasisEmblem";
import SolarEmblem from "./SolarEmblem";
import StartEmblem from "./StartEmblem";
import VaultEmblem from "./VaultEmblem";

/** The emblem element for a tile (an element, not a component, so it can be rendered more than once). */
export function emblemFor(tile: TileData): ReactNode {
  switch (tile.kind) {
    case "vault":
      return <VaultEmblem />;
    case "fortune":
      return <FortuneEmblem />;
    case "harbor":
      return <HarborEmblem />;
    case "utility":
      return tile.icon === "droplets" ? <DesalinationEmblem /> : <SolarEmblem />;
    case "tax":
      return tile.icon === "stamp" ? <CustomsEmblem /> : <CityTaxEmblem />;
    case "start":
      return <StartEmblem />;
    case "detention":
      return <DetentionEmblem />;
    case "goToDetention":
      return <GoToDetentionEmblem />;
    case "oasis":
      return <OasisEmblem />;
    default:
      return null;
  }
}

/** CSS custom property (theme token) tinting the glow behind the emblem. */
export function glowToken(tile: TileData): string {
  switch (tile.kind) {
    case "vault":
    case "fortune":
      return "--accent";
    case "harbor":
      return "--info";
    case "utility":
      return tile.icon === "droplets" ? "--info" : "--accent";
    case "tax":
    case "goToDetention":
      return "--danger";
    case "oasis":
      return "--brand";
    default:
      return "--accent";
  }
}
