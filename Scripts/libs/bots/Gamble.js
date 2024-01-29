import {
  addEventListener,
  delay,
  getTickCount,
  me,
  print,
  rand,
  sendCopyData,
} from "boot";
import { sdk } from "../modules/sdk.js";
import { Town } from "../common/Town.js";
import { Game, Packet } from "../common/Misc.js";
import { Pickit } from "../common/Pickit.js";
import { Gambling } from "../Gambling.js";

export const Gamble = function () {
  let idleTick = 0;
  let info = Gambling.getInfo();
  let needGold = false;

  if (!info) throw new Error("Bad Gambling System config.");

  me.maxgametime = 0;
  Town.goToTown(1);

  addEventListener("copydata", (mode, msg) => {
    if (needGold && mode === 0 && info.goldFinders.indexOf(msg) > -1) {
      print("Got game request from " + msg);
      sendCopyData(null, msg, 4, me.gamename + "/" + me.gamepassword);
    }
  });

  while (true) {
    Town.needGamble() ? Town.gamble() : (needGold = true) && (idleTick = 0);
    Town.move("stash");

    while (needGold) {
      // should there be a player count check before getting into this loop?
      // Or maybe gamevent for player join/leave, or itemevent for gold dropping?
      while (true) {
        Town.needGamble() && (needGold = false);
        Town.stash();

        let gold = Game.getItem(sdk.items.Gold, sdk.items.mode.onGround);

        if (!gold || !Pickit.canPick(gold)) {
          break;
        }

        Pickit.pickItem(gold);
        delay(500);
      }

      if (needGold && getTickCount() - idleTick > 0) {
        Packet.questRefresh();
        idleTick += rand(1200, 1500) * 1000;
      }

      delay(500);
    }

    delay(1000);
  }

  return true;
};
