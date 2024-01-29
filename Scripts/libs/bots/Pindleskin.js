import { me, print, getLocaleString } from "boot";
import { sdk } from "../modules/sdk.js";
import { Attack } from "../common/Attack.js";
import { Config } from "../common/Config.js";
import { Pather } from "../common/Pather.js";
import { Town } from "../common/Town.js";
import { Game } from "../common/Misc.js";
import { Precast } from "../common/Precast.js";
import { Pickit } from "../common/Pickit.js";

export const Pindleskin = function () {
  Town.goToTown(Config.Pindleskin.UseWaypoint ? undefined : 5);
  Town.doChores();

  if (Config.Pindleskin.UseWaypoint) {
    Pather.useWaypoint(sdk.areas.HallsofPain);
    Precast.doPrecast(true);

    if (
      !Pather.moveToExit(
        [sdk.areas.HallsofAnguish, sdk.areas.NihlathaksTemple],
        true
      )
    ) {
      throw new Error("Failed to move to Nihlahak's Temple");
    }
  } else {
    if (!Pather.journeyTo(sdk.areas.NihlathaksTemple))
      throw new Error("Failed to use portal.");

    Precast.doPrecast(true);
  }

  Pather.moveTo(10058, 13234);

  Attack.kill(getLocaleString(sdk.locale.monsters.Pindleskin));

  if (Config.Pindleskin.KillNihlathak) {
    if (
      !Pather.moveToExit(
        [
          sdk.areas.HallsofAnguish,
          sdk.areas.HallsofPain,
          sdk.areas.HallsofVaught,
        ],
        true
      )
    )
      throw new Error("Failed to move to Halls of Vaught");

    Pather.moveToPreset(
      me.area,
      sdk.unittype.Object,
      sdk.objects.NihlathaksPlatform,
      10,
      10
    );

    if (
      Config.Pindleskin.ViperQuit &&
      Game.getMonster(sdk.monsters.TombViper2)
    ) {
      console.log("Tomb \xFFc1Vipers\xFFc0 found.");
      Town.goToTown();

      return true;
    }

    Config.Pindleskin.ClearVipers &&
      Attack.clearList(Attack.getMob(sdk.monsters.TombViper2, 0, 20));

    Attack.kill(sdk.monsters.Nihlathak);
    Pickit.pickItems();
  }

  return true;
};
