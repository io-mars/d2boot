import {
  me,
  getLocation,
  delay,
  print,
  addEventListener,
  load,
  FileTools,
  getTickCount,
  rand,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Starter, D2Bot, DataFile, ControlAction } from "@/OOG.js";
import { MuleLogger } from "@/MuleLogger.js";

// D2BotMuleLog specific settings - for global settings see libs/StarterConfig.js
Starter.Config.MinGameTime = rand(150, 180); // Minimum game length in seconds. If a game is ended too soon, the rest of the time is waited in the lobby
Starter.Config.CreateGameDelay = 5; // Seconds to wait before creating a new game
Starter.Config.SwitchKeyDelay = 0; // Seconds to wait before switching a used/banned key or after realm down

// Override default values for StarterConfig under here by following format
// Starter.Config.ValueToChange = value; // Example: Starter.Config.MinGameTime = 500; // changes MinGameTime to 500 seconds

if (!FileTools.exists("data/" + me.profile + ".json")) {
  DataFile.create();
}

// a object for pass by reference
const muleInfo = { muleCharList: [], muleAccounts: [], muleChars: [] };

function parseInfo() {
  for (let i in MuleLogger.LogAccounts) {
    if (MuleLogger.LogAccounts.hasOwnProperty(i) && typeof i === "string") {
      muleInfo.muleAccounts.push(i);
      muleInfo.muleChars.push(MuleLogger.LogAccounts[i]);
    }
  }
}

function main() {
  addEventListener("copydata", Starter.receiveCopyData);

  while (!Starter.handle) {
    delay(100);
  }

  DataFile.updateStats("handle", Starter.handle);
  delay(500);
  D2Bot.init();
  load("tools/heartbeat.js");

  while (!Object.keys(Starter.gameInfo).length) {
    D2Bot.requestGameInfo();
    delay(500);
  }

  if (Starter.gameInfo.rdBlocker) {
    D2Bot.printToConsole(
      "You must disable RD Blocker for Mule Logger to work properly. Stopping."
    );
    D2Bot.stop();

    return;
  }

  parseInfo();

  if (Starter.gameInfo.error) {
    if (!!DataFile.getStats().debugInfo) {
      Starter.gameInfo.crashInfo = DataFile.getStats().debugInfo;

      D2Bot.printToConsole(
        "Crash Info: Script: " +
          JSON.parse(Starter.gameInfo.crashInfo).currScript +
          " Area: " +
          JSON.parse(Starter.gameInfo.crashInfo).area,
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

  while (true) {
    // returns true before actually in game so we can't only use this check
    while (me.ingame) {
      // returns false when switching acts so we can't use while
      if (me.gameReady) {
        if (!Starter.inGame) {
          print("Updating Status");
          Starter.lastGameStatus = "ingame";
          Starter.inGame = true;
          Starter.gameStart = getTickCount();
          DataFile.updateStats("runs", Starter.gameCount);
        }

        D2Bot.updateStatus(
          "Game: " + me.gamename + Starter.timer(Starter.gameStart)
        );
      }

      delay(1000);
    }

    ControlAction.locationAction(
      getLocation(),
      sdk.game.action.logger,
      muleInfo
    );
    delay(1000);
  }
}

try {
  main();
} catch (error) {
  console.error(error);
}
