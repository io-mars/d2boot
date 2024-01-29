import {
  me,
  getParty,
  getTickCount,
  say,
  print,
  addEventListener,
  removeEventListener,
  delay,
  quit,
} from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Pickit } from "../common/Pickit.js";
import { Common } from "../common/Common.js";
import { Loader } from "../common/Loader.js";
import { Misc, Game, Time } from "../common/Misc.js";

export const DiabloHelper = function () {
  const allowSay = true;

  this.announce = function (msg = "") {
    if (!allowSay) return;
    say(msg);
  };

  this.Leader = Misc.poll(
    () => Misc.findPlayer(Config.Leader).name,
    Time.minutes(Config.DiabloHelper.Wait),
    Time.seconds(1)
  );

  if (!this.Leader) {
    this.announce("Leader \xFFc1not found\xFFc0.");
    delay(1000);
    quit();
  }

  addEventListener("gamepacket", Common.Diablo.diabloLightsEvent);
  Common.Diablo.waitForGlow = true;
  Common.Diablo.clearRadius = Config.DiabloHelper.ClearRadius;
  Common.Diablo.MFLeader = this.Leader;

  Town.doChores();

  if (me.mode === sdk.player.mode.Dead) {
    while (!me.inTown) {
      me.revive();
      delay(1000);
    }

    Town.move("portalspot");
  }

  if (me.inTown) {
    let act = Misc.getPlayerAct(this.Leader);
    if (act > 4 && Loader.scriptName() === "DiabloHelper") {
      me.overhead("\xFFc1skip\xFFc0 DiabloHelper.");

      removeEventListener("gamepacket", Common.Diablo.diabloLightsEvent);
      return;
    }

    me.act !== 4 && Town.goToTown(4);

    Town.move("portalspot");
    while (me.inTown) {
      Pather.getPortal(sdk.areas.ChaosSanctuary, Config.Leader) &&
        Pather.usePortal(sdk.areas.ChaosSanctuary, Config.Leader);
      delay(500);
    }
  }

  Common.Diablo.initLayout();

  Attack.clear(10, 0, false, Common.Diablo.sort);
  Precast.doPrecast(true);

  Common.Diablo.runEntranceToStar();

  Common.Diablo.runSeals(Config.Diablo.SealOrder, false);

  Common.Diablo.diabloPrep();

  Attack.kill(sdk.monsters.Diablo);
  Pickit.pickItems();

  Common.Diablo.done = true;
  removeEventListener("gamepacket", Common.Diablo.diabloLightsEvent);

  return true;
};
