import { me, getLocaleString } from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";

export const Pit = function () {
  Town.doChores();
  Pather.useWaypoint(sdk.areas.BlackMarsh);
  Precast.doPrecast(true);

  if (!Pather.moveToExit([sdk.areas.TamoeHighland, sdk.areas.PitLvl1], true))
    throw new Error("Failed to move to Pit level 1");
  Config.Pit.ClearPit1 && Attack.clearLevel(Config.ClearType);

  if (!Pather.moveToExit(sdk.areas.PitLvl2, true, Config.Pit.ClearPath))
    throw new Error("Failed to move to Pit level 2");
  Attack.clearLevel();

  return true;
};
