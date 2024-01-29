import {
  me,
  delay,
  clearAllEvents,
  getScript,
  load,
  scriptBroadcast,
  getTickCount,
  print,
  addEventListener,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Scripts, Config } from "@/common/Config.js";
import { Pickit } from "@/common/Pickit.js";
import { Town } from "@/common/Town.js";
import { Pather } from "@/common/Pather.js";
import { Attack } from "@/common/Attack.js";
import { Storage } from "@/common/Storage.js";
import { Runewords } from "@/common/Runewords.js";
import { Cubing } from "@/common/Cubing.js";
import { Loader } from "@/common/Loader.js";
import { D2Bot, DataFile } from "@/OOG.js";
import { CraftingSystem } from "@/CraftingSystem.js";
import { AutoMule } from "@/AutoMule.js";
import { TorchSystem } from "@/TorchSystem.js";
import { Gambling } from "@/Gambling.js";
import { MuleLogger } from "@/MuleLogger.js";

let sojPause = false;
let sojCounter = 0;

const scriptEvent = function (msg) {
  if (typeof msg === "string" && msg === "soj") {
    sojPause = true;
    sojCounter = 0;
  }
};

const copyDataEvent = function ({ mode, msg }) {
  if (mode === 0 && msg === "mule") {
    if (AutoMule.getInfo() && AutoMule.getInfo().hasOwnProperty("muleInfo")) {
      if (AutoMule.getMuleItems().length > 0) {
        D2Bot.printToConsole("Mule triggered");
        scriptBroadcast("mule");
        scriptBroadcast("quit");
      } else {
        D2Bot.printToConsole("No items to mule.");
      }
    } else {
      D2Bot.printToConsole("Profile not enabled for muling.");
    }
  }

  // getProfile
  if (mode === 1638) {
    msg = JSON.parse(msg);

    // if (msg.Tag) {
    //   GameAction.init(msg.Tag);
    // }
  }
};

async function main() {
  D2Bot.init(); // Get D2Bot# handle
  D2Bot.ingame();

  // wait until game is ready
  while (!me.gameReady) {
    delay(50);
  }

  clearAllEvents();

  !getScript("tools/heartbeat.js") && load("tools/heartbeat.js");

  if (getScript("d2botmap.js")) {
    await Config.asyncInit(true);
    // LocalChat.init();

    // load threads
    me.automap = true;

    load("tools/mapthread.js");
    load("tools/ToolsThread.js");

    Config.PublicMode && load("tools/party.js");

    while (true) {
      delay(1000);
    }
  }

  // Mule handler
  ["D2BotMule.js", "D2BotMuleLog.js", "D2BotMuleCharm.js"].forEach((s) => {
    if (getScript(s)) {
      if (s === "D2BotMuleLog.js") {
        return MuleLogger.inGameCheck();
      } else {
        while (true) {
          delay(1000);
        }
      }
    }
  });

  let startTime = getTickCount();

  // Initialize libs - load config variables, build pickit list, attacks, containers and cubing and runeword recipes
  await Config.asyncInit(true);
  //update the config now
  if (Config.AutoBuild.Enabled) {
    try {
      const { AutoBuilder } = await import("@/common/AutoBuild.js");
      const autoBuild = new AutoBuilder();
      //load the event listener when leve up
      await autoBuild.initialize();
    } catch (error) {
      print(
        "\xFFc8Error in libs/common/AutoBuild.js (AutoBuild system is not active!)"
      );
      // print(error.stack);
      throw new Error(error);
    }
  }

  await Attack.asyncInit();
  //Storage init first Pickit, Storage-->Pickit-->Cubing
  Storage.init();
  Pickit.init(true);
  CraftingSystem.buildLists();
  Runewords.init();
  Cubing.init();

  // LocalChat.init();

  // // Load event listeners
  addEventListener("scriptmsg", scriptEvent);
  addEventListener("copydata", copyDataEvent);

  // GameAction/AutoMule/TorchSystem/Gambling/Crafting handler
  if (
    // GameAction.inGameCheck() ||
    AutoMule.inGameCheck() ||
    TorchSystem.inGameCheck() ||
    Gambling.inGameCheck() ||
    CraftingSystem.inGameCheck()
  ) {
    return true;
  }

  me.maxgametime = Config.MaxGameTime * 1000;
  let stats = DataFile.getStats();

  // Check for experience decrease -> log death. Skip report if life chicken is disabled.
  if (
    stats.name === me.name &&
    me.getStat(sdk.stats.Experience) < stats.experience &&
    Config.LifeChicken > 0
  ) {
    D2Bot.printToConsole(
      "You died in last game. | Area :: " +
        stats.lastArea +
        " | Script :: " +
        JSON.parse(stats.debugInfo).currScript,
      sdk.colors.D2Bot.Red
    );
    D2Bot.printToConsole(
      "Experience decreased by " +
        (stats.experience - me.getStat(sdk.stats.Experience)),
      sdk.colors.D2Bot.Red
    );
    DataFile.updateStats("deaths");
    D2Bot.updateDeaths();
  }

  DataFile.updateStats(["experience", "name"]);

  // Load threads
  !getScript("tools/ToolsThread.js") && load("tools/ToolsThread.js");

  (Config.TownCheck || Config.TownHP > 0 || Config.TownMP > 0) &&
    load("tools/TownChicken.js");

  Config.PublicMode && load("tools/Party.js");

  Config.AutoBuild.Enabled &&
    !getScript("tools/autobuildthread.js") &&
    load("tools/autobuildthread.js");

  // One time maintenance - check cursor, get corpse, clear leftover items, pick items in case anything important was dropped
  if (!Scripts.UserAddon && !Scripts.Test) {
    // main checks
    Cubing.cursorCheck();
    Town.getCorpse();
    Town.clearBelt();
    Pather.init(); // initialize wp data

    let { x, y } = me;
    Config.ClearInvOnStart && Town.clearInventory();
    [x, y].distance > 3 && Pather.moveTo(x, y);
    Pickit.pickItems();
    me.hpPercent <= 10 && Town.heal() && me.cancelUIFlags();

    if (Config.DebugMode) {
      delay(2000);
      let script = getScript();

      if (script) {
        do {
          console.log(script);
        } while (script.getNext());
      }
    }
  }

  me.automap = Config.AutoMap;

  // offline
  !me.realm && D2Bot.updateRuns();

  // Go;
  await Loader.init();

  if (
    Config.MinGameTime &&
    getTickCount() - startTime < Config.MinGameTime * 1000
  ) {
    try {
      Town.goToTown();

      while (getTickCount() - startTime < Config.MinGameTime * 1000) {
        me.overhead(
          "Stalling for \xFFc2" +
            Math.round(
              (startTime + Config.MinGameTime * 1000 - getTickCount()) / 1000
            ) +
            "\xFFc0 Seconds"
        );
        delay(1000);
      }
    } catch (e1) {
      print(e1);
    }
  }

  DataFile.updateStats(["gold", "torches"]);

  if (sojPause) {
    try {
      Town.doChores();
      me.maxgametime = 0;

      while (sojCounter < Config.SoJWaitTime) {
        me.overhead(
          "Waiting for SoJ sales... \xFFc2" +
            (Config.SoJWaitTime - sojCounter) +
            "\xFFc0 min"
        );
        delay(6e4);

        sojCounter += 1;
      }
    } catch (e2) {
      print(e2);
    }
  }

  if (Config.LastMessage) {
    switch (typeof Config.LastMessage) {
      case "string":
        say(
          Config.LastMessage.replace(
            "$nextgame",
            DataFile.getStats().nextGame,
            "i"
          )
        );

        break;
      case "object":
        for (let i = 0; i < Config.LastMessage.length; i += 1) {
          say(
            Config.LastMessage[i].replace(
              "$nextgame",
              DataFile.getStats().nextGame,
              "i"
            )
          );
        }

        break;
    }
  }

  AutoMule.muleCheck() && scriptBroadcast("mule");

  scriptBroadcast("quit");

  return true;
}

try {
  main();
} catch (error) {
  console.error(error);
}
