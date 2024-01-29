import { me, getLocation, delay, print, addEventListener, load } from "boot";

import "@/common/Prototypes.js";
import { Starter, D2Bot, DataFile, ControlAction } from "@/OOG.js";

function main() {
  addEventListener("copydata", Starter.receiveCopyData);

  while (!Starter.handle) {
    delay(100);
  }

  DataFile.updateStats("handle", Starter.handle);
  delay(500);
  D2Bot.init();
  load("tools/heartbeat.js");

  // if (!FileTools.exists("data/" + me.profile + ".json")) {
  //   DataFile.create();
  // }

  while (true) {
    Starter.isUp = me.ingame ? "yes" : "no";

    delay(1000);
  }
}

try {
  main();
} catch (error) {
  console.error(error);
}
