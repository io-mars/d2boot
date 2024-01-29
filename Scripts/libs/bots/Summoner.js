import { me, getLocaleString, delay } from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Loader } from "../common/Loader.js";
import { Game } from "../common/Misc.js";

export const Summoner = function () {
  Town.doChores();
  Pather.useWaypoint(sdk.areas.ArcaneSanctuary);
  Precast.doPrecast(true);

  if (Config.Summoner.FireEye) {
    try {
      if (!Pather.usePortal(null))
        throw new Error("Failed to move to Fire Eye");
      Attack.clear(15, 0, getLocaleString(sdk.locale.monsters.FireEye));
    } catch (e) {
      console.error(e);
    }
  }

  if (me.inArea(sdk.areas.PalaceCellarLvl3) && !Pather.usePortal(null))
    throw new Error("Failed to move to Summoner");

  if (
    !Pather.moveToPreset(
      me.area,
      sdk.unittype.Object,
      sdk.quest.chest.Journal,
      -3,
      -3
    )
  )
    throw new Error("Failed to move to Summoner");

  Attack.clear(15, 0, sdk.monsters.TheSummoner);

  if (Loader.scriptName(1) === "Duriel") {
    let journal = Game.getObject(sdk.quest.chest.Journal);
    if (!journal) return true;

    Pather.moveToUnit(journal);
    journal.interact();
    delay(500);
    me.cancel();

    if (!Pather.usePortal(sdk.areas.CanyonofMagic)) return true;

    Loader.skipTown.push("Duriel");
  }

  return true;
};
