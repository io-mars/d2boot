import { me, getLocaleString } from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Misc, Game } from "../common/Misc.js";

export const Countess = function () {
  Town.doChores();
  Pather.useWaypoint(sdk.areas.BlackMarsh);
  Precast.doPrecast(true);

  if (
    !Pather.moveToExit(
      [
        sdk.areas.ForgottenTower,
        sdk.areas.TowerCellarLvl1,
        sdk.areas.TowerCellarLvl2,
        sdk.areas.TowerCellarLvl3,
        sdk.areas.TowerCellarLvl4,
        sdk.areas.TowerCellarLvl5,
      ],
      true
    )
  )
    throw new Error("Failed to move to Countess");

  if (Config.Countess.ClearLastTower) {
    Attack.clearLevel();
    return true;
  }

  let poi = Game.getPresetObject(me.area, sdk.objects.SuperChest);

  if (!poi) throw new Error("Failed to move to Countess (preset not found)");

  switch (poi.roomx * 5 + poi.x) {
    case 12565:
      Pather.moveTo(12578, 11043);
      break;
    case 12526:
      Pather.moveTo(12548, 11083);
      break;
  }

  Attack.clear(20, 0, getLocaleString(sdk.locale.monsters.TheCountess));
  Config.OpenChests.Enabled && Misc.openChestsInArea();

  return true;
};
