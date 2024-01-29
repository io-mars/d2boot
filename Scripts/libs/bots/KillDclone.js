import { delay, scriptBroadcast, me, say } from "boot";
import { sdk } from "../modules/sdk.js";
import { Precast } from "../common/Precast.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Pickit } from "../common/Pickit.js";
import { AutoMule } from "../AutoMule.js";

export const KillDclone = function () {
  Pather.useWaypoint(sdk.areas.ArcaneSanctuary);
  Precast.doPrecast(true);

  if (!Pather.usePortal(null)) {
    throw new Error("Failed to move to Palace Cellar");
  }

  Attack.kill(sdk.monsters.DiabloClone);
  Pickit.pickItems();

  Pather.makePortal();
  AutoMule.callCharmMuler(sdk.items.SmallCharm);
  // if (
  //   AutoMule.getInfo() &&
  //   AutoMule.getInfo().hasOwnProperty("torchMuleInfo")
  // ) {
  //   scriptBroadcast("muleAnni");
  // }

  return true;
};
