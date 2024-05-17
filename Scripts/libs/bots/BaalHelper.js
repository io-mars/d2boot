import { me, delay, getParty, getTickCount, say, print } from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Common } from "../common/Common.js";
import { Loader } from "../common/Loader.js";
import { Game, Misc, Time } from "../common/Misc.js";
import { D2Bot } from "../OOG.js";

export const BaalHelper = function () {
  Config.BaalHelper.KillNihlathak && Loader.runScript("Nihlathak");
  Config.BaalHelper.FastChaos &&
    Loader.runScript("Diablo", () => (Config.Diablo.Fast = true));

  Town.goToTown(5);
  Town.doChores();
  Config.RandomPrecast && Precast.needOutOfTownCast()
    ? Precast.doRandomPrecast(true, sdk.areas.Harrogath)
    : Precast.doPrecast(true);

  if (Config.BaalHelper.SkipTP) {
    !me.inArea(sdk.areas.WorldstoneLvl2) &&
      Pather.useWaypoint(sdk.areas.WorldstoneLvl2);

    if (
      !Pather.moveToExit(
        [sdk.areas.WorldstoneLvl3, sdk.areas.ThroneofDestruction],
        false
      )
    )
      throw new Error("Failed to move to WSK3.");
    if (
      !Misc.poll(
        () => {
          let party = getParty();

          if (party) {
            do {
              if (
                (!Config.Leader || party.name === Config.Leader) &&
                party.area === sdk.areas.ThroneofDestruction
              ) {
                return true;
              }
            } while (party.getNext());
          }

          return false;
        },
        Time.minutes(Config.BaalHelper.Wait),
        1000
      )
    )
      throw new Error(
        "Player wait timed out (" +
          (Config.Leader ? "Leader not" : "No players") +
          " found in Throne)"
      );

    let entrance = Misc.poll(
      () => Game.getStairs(sdk.exits.preset.NextAreaWorldstone),
      1000,
      200
    );
    entrance &&
      Pather.moveTo(
        entrance.x > me.x ? entrance.x - 5 : entrance.x + 5,
        entrance.y > me.y ? entrance.y - 5 : entrance.y + 5
      );

    if (
      !Pather.moveToExit(
        [sdk.areas.WorldstoneLvl3, sdk.areas.ThroneofDestruction],
        false
      )
    )
      throw new Error("Failed to move to WSK3.");
    if (!Pather.moveToExit(sdk.areas.ThroneofDestruction, true))
      throw new Error("Failed to move to Throne of Destruction.");
    if (!Pather.moveTo(15113, 5040)) D2Bot.printToConsole("path fail");
  } else {
    Town.goToTown(5);
    Town.move("portalspot");

    if (
      !Misc.poll(
        () => {
          if (
            Pather.getPortal(
              sdk.areas.ThroneofDestruction,
              Config.Leader || null
            ) &&
            Pather.usePortal(
              sdk.areas.ThroneofDestruction,
              Config.Leader || null
            )
          ) {
            return true;
          }

          return false;
        },
        Time.minutes(Config.BaalHelper.Wait),
        1000
      )
    )
      throw new Error(
        "Player wait timed out (" +
          (Config.Leader ? "No leader" : "No player") +
          " portals found)"
      );
  }

  if (Config.BaalHelper.DollQuit && Game.getMonster(sdk.monsters.SoulKiller)) {
    print("Undead Soul Killers found.");

    return true;
  }

  Precast.doPrecast(false);
  Common.Baal.clearThrone();

  if (!Common.Baal.clearWaves()) {
    throw new Error("Couldn't clear baal waves");
  }

  if (Config.BaalHelper.KillBaal) {
    Common.Baal.killBaal();

    // delay for load MFHelper.js, avoid the leader pickit something still in WorldstoneChamber
    if (Config.BaalHelper.Town) {
      let tick = getTickCount();
      Town.goToTown() && Town.doChores();

      while (getTickCount() - tick < Time.seconds(5)) {
        delay(200);
      }
    }
  } else {
    Town.goToTown();
    while (true) {
      delay(500);
    }
  }

  return true;
};
