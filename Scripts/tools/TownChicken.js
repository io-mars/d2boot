import {
  me,
  print,
  getUIFlag,
  getScript,
  delay,
  addEventListener,
  say,
  getDistance,
  scriptBroadcast,
} from "boot";

import "@/common/Prototypes.js";
import { Config } from "@/common/Config.js";
import { Town } from "@/common/Town.js";
import { CraftingSystem } from "@/CraftingSystem.js";
// import { Attack } from "@/common/Attack.js";
import { Pickit } from "@/common/Pickit.js";
import { Storage } from "@/common/Storage.js";
import { Game, Misc } from "@/common/Misc.js";
import { D2Bot } from "@/OOG.js";
import { Runewords } from "@/common/Runewords.js";
import { Cubing } from "@/common/Cubing.js";

function TownChicken() {
  let townCheck = false;

  this.togglePause = function () {
    let scripts = [
      "default.js",
      "tools/antihostile.js",
      "tools/rushthread.js",
      "tools/CloneKilla.js",
    ];

    for (let i = 0; i < scripts.length; i += 1) {
      let script = getScript(scripts[i]);

      if (script) {
        if (script.running) {
          scripts[i] === "default.js" && print("\xFFc1Pausing.");
          script.pause();
        } else {
          if (scripts[i] === "default.js") {
            // resume only if clonekilla isn't running
            if (!getScript("tools/clonekilla.js")) {
              console.log("\xFFc2Resuming.");
              script.resume();
            }
          } else {
            script.resume();
          }
        }
      }
    }

    return true;
  };

  addEventListener("scriptmsg", (msg) => {
    if (typeof msg === "string" && msg === "townCheck") {
      townCheck = true;
    }
  });

  D2Bot.init();
  Storage.init();
  Pickit.init();
  CraftingSystem.buildLists();
  Runewords.init();
  Cubing.init();

  // Init config and attacks
  print("\xFFc3Start TownChicken thread");

  let checkHP = Config.TownHP > 0;
  let checkMP = Config.TownMP > 0;

  // START
  // test for getUnit bug
  let test = Game.getMonster();
  test === null && console.warn("getUnit is bugged");

  while (true) {
    if (
      !me.inTown &&
      (townCheck ||
        // should TownHP/MP check be in toolsthread?
        // We would then be able to remove all game interaction checks until we get a townCheck msg
        (checkHP && me.hpPercent < Config.TownHP) ||
        (checkMP && me.mpPercent < Config.TownMP))
    ) {
      // canTpToTown should maybe be overrided here to quit if we can't tp to town but isn't just because we are in non-tp-able area
      if (!Town.canTpToTown()) {
        townCheck = false;

        continue;
      }
      this.togglePause();

      while (!me.gameReady) {
        if (me.dead) return;

        delay(100);
      }

      try {
        console.log("(TownChicken) :: Going to town");
        me.overhead("Going to town");
        Town.visitTown();
      } catch (e) {
        Misc.errorReport(e, "TownChicken.js");
        scriptBroadcast("quit");

        return;
      } finally {
        this.togglePause();

        townCheck = false;
      }
    }

    delay(50);
  }
}

Config.asyncInit(false)
  .then(() => {
    // await Attack.asyncInit(false);
    new TownChicken();
  })
  .catch((error) => {
    console.error(error);
  });
