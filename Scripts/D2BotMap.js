import { me, delay, addEventListener, load } from "boot";

import "@/common/Prototypes.js";
import { Starter, D2Bot, DataFile } from "@/OOG.js";

function main() {
  addEventListener("copydata", Starter.receiveCopyData);

  while (!Starter.handle) {
    delay(100);
  }

  DataFile.updateStats("handle", Starter.handle);
  delay(500);
  D2Bot.init();
  load("tools/heartbeat.js");

  while (true) {
    delay(1000);

    if (me.gameReady) {
      Starter.isUp === "no" &&
        (Starter.isUp = "yes") &&
        //iomars for follow
        (Starter.gameInfo.gameName = me.gamename.toLowerCase()) &&
        (Starter.gameInfo.gamePass = me.gamepassword.toLowerCase());

      me.ingame &&
        D2Bot.updateStatus(
          "(Char: " +
            me.charname +
            ") (Game: " +
            (me.gamename || "singleplayer") +
            ") (Level: " +
            me.charlvl +
            ")"
        );
    } else {
      D2Bot.updateStatus("Out of Game");
      Starter.gameInfo = {};
      Starter.isUp = "no";
    }

    delay(1000);
  }
}

try {
  // if (typeof AdvancedConfig[me.profile] === "object") {
  //   Object.assign(Starter.Config, AdvancedConfig[me.profile]);
  // }

  // if (!FileTools.exists("data/" + me.profile + ".json") && DataFile.create()) {
  //   Starter.firstRun = true;
  // }

  main();
} catch (error) {
  console.error(error);
}
