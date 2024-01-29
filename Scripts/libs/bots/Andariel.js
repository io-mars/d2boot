import { me, say, delay } from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Game } from "../common/Misc.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Pickit } from "../common/Pickit.js";

export const Andariel = function () {
  this.killAndariel = function () {
    let target = Game.getMonster(sdk.monsters.Andariel);
    if (!target) throw new Error("Andariel not found.");

    Config.MFLeader &&
      Pather.makePortal() &&
      say(`kill ${sdk.monsters.Andariel}@${area}`);

    for (let i = 0; i < 300 && target.attackable; i += 1) {
      Attack.ClassAttack.doAttack(target);
      target.distance <= 10 &&
        Pather.moveTo(me.x > 22548 ? 22535 : 22560, 9520);
    }

    return target.dead;
  };
  Town.doChores();
  Pather.useWaypoint(sdk.areas.CatacombsLvl2);
  Precast.doPrecast(true);

  if (
    !Pather.moveToExit([sdk.areas.CatacombsLvl3, sdk.areas.CatacombsLvl4], true)
  )
    throw new Error("Failed to move to Catacombs Level 4");

  Pather.moveTo(22549, 9520);
  me.sorceress && me.classic
    ? this.killAndariel()
    : Attack.kill(sdk.monsters.Andariel);

  delay(100); // Wait for minions to die.

  Pickit.pickItems();

  return true;
};
