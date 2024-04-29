import {
  me,
  Profile,
  getLocation,
  delay,
  print,
  addEventListener,
  debugLog,
  load,
  FileTools,
  getTickCount,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Starter, D2Bot, DataFile, ControlAction } from "@/OOG.js";
import { StarterConfig, AdvancedConfig } from "@/config/_StarterConfig.js";

// D2BotFollow specific settings - for global settings see libs/StarterConfig.js
Starter.Config.JoinRetryDelay = 5; // Time in seconds to wait before next join attempt

// Override default values for StarterConfig under here by following format
// Starter.Config.ValueToChange = value; // Example: Starter.Config.MinGameTime = 500; // changes MinGameTime to 500 seconds

function receiveCopyData(mode, msg) {
  if (mode === 3) {
    Starter.isUp = me.gameReady ? "yes" : "no";
    if (!me.gameReady) {
      return;
    }
    Starter.gameInfo.gameName = me.gamename || "";
    Starter.gameInfo.gamePass = me.gamepassword || "";
  } else {
    Starter.receiveCopyData(mode, msg);
  }
}

function main() {
  // debugLog(me.profile);
  addEventListener("copydata", receiveCopyData);
  addEventListener("scriptmsg", Starter.scriptMsgEvent);

  while (!Starter.handle) {
    delay(100);
  }

  DataFile.updateStats("handle", Starter.handle);
  D2Bot.init();
  load("tools/heartbeat.js");

  while (!Object.keys(Starter.gameInfo).length) {
    D2Bot.requestGameInfo();
    delay(500);
  }

  Starter.gameMode = sdk.game.action.Join;
  Starter.gameCount = DataFile.getStats().runs + 1 || 1;

  if (Starter.gameInfo.error) {
    delay(200);

    if (!!DataFile.getStats().debugInfo) {
      Starter.gameInfo.crashInfo = JSON.parse(DataFile.getStats().debugInfo);

      D2Bot.printToConsole(
        "Crash Info: Script: " +
          Starter.gameInfo.crashInfo.currScript +
          " Area: " +
          Starter.gameInfo.crashInfo.area,
        sdk.colors.D2Bot.Gray
      );
    }

    ControlAction.timeoutDelay("Crash Delay", Starter.Config.CrashDelay * 1e3);
    D2Bot.updateRuns();
  }

  DataFile.updateStats(
    "debugInfo",
    JSON.stringify({ currScript: "none", area: "out of game" })
  );

  while (!Object.keys(Starter.profileInfo).length) {
    D2Bot.getProfile();
    print("Getting Profile");
    delay(500);
  }

  while (true) {
    // returns true before actually in game so we can't only use this check
    while (me.ingame) {
      // returns false when switching acts so we can't use while
      if (me.gameReady) {
        if (!Starter.inGame) {
          print("\xFFc4Updating Status");
          Starter.lastGameStatus = "ingame";
          Starter.inGame = true;
          Starter.gameStart = getTickCount();

          DataFile.updateStats("runs", Starter.gameCount);
        }

        D2Bot.updateStatus(
          Starter.profileInfo.charName +
            " | Game: " +
            (me.gamename || "singleplayer") +
            Starter.timer(Starter.gameStart)
        );
      }

      delay(1000);
    }

    ControlAction.locationAction();
    delay(1000);
  }
}

try {
  Object.assign(Starter.Config, StarterConfig);

  if (typeof AdvancedConfig[me.profile] === "object") {
    Object.assign(Starter.Config, AdvancedConfig[me.profile]);
  }

  if (!FileTools.exists("data/" + me.profile + ".json") && DataFile.create()) {
    Starter.firstRun = true;
  }

  main();
} catch (error) {
  console.error(error);
}
