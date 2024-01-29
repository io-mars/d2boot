import * as boot from "boot";
import { D2Bot, DataFile } from "@/OOG.js";

function HeardBeat() {
  D2Bot.init();
  boot.print("\xFFc9Heartbeat\xFFc0 \xFFc2loaded\xFFc0");

  // function togglePause() {
  //   let script = getScript();

  //   if (script) {
  //     do {
  //       if (script.name.includes(".dbj")) {
  //         if (script.running) {
  //           print("\xFFc1Pausing \xFFc0" + script.name);
  //           script.pause();
  //         } else {
  //           print("\xFFc2Resuming \xFFc0" + script.name);
  //           script.resume();
  //         }
  //       }
  //     } while (script.getNext());
  //   }

  //   return true;
  // }

  // // Event functions
  // function KeyEvent(key) {
  //   switch (key) {
  //     case sdk.keys.PauseBreak:
  //       if (me.ingame) {
  //         break;
  //       }

  //       togglePause();

  //       break;
  //   }
  // }

  // addEventListener("keyup", KeyEvent);

  while (true) {
    D2Bot.heartBeat();
    boot.delay(1000);
  }
}

HeardBeat();
