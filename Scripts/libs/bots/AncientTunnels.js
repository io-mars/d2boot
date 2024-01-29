import { me, getLocaleString } from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Pickit } from "../common/Pickit.js";
import { Misc } from "../common/Misc.js";

export const AncientTunnels = function () {
  Town.doChores();
  Pather.useWaypoint(sdk.areas.LostCity);
  Precast.doPrecast(true);

  try {
    Config.AncientTunnels.OpenChest &&
      Pather.moveToPreset(
        me.area,
        sdk.unittype.Object,
        sdk.objects.SuperChest
      ) &&
      Misc.openChests(5) &&
      Pickit.pickItems();
  } catch (e) {
    console.error(e);
  }

  try {
    Config.AncientTunnels.KillDarkElder &&
      Pather.moveToPreset(
        me.area,
        sdk.unittype.Monster,
        sdk.monsters.preset.DarkElder
      ) &&
      Attack.clear(15, 0, getLocaleString(sdk.locale.monsters.DarkElder));
  } catch (e) {
    console.error(e);
  }

  if (!Pather.moveToExit(sdk.areas.AncientTunnels, true))
    throw new Error("Failed to move to Ancient Tunnels");
  Attack.clearLevel(Config.ClearType);

  return true;
};
