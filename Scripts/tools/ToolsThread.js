import {
  me,
  print,
  showConsole,
  getTickCount,
  rand,
  scriptBroadcast,
  addEventListener,
  delay,
  getMercHP,
  say,
  getDistance,
  copyUnit,
  load,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Config } from "@/common/Config.js";
import { Town } from "@/common/Town.js";
import { Common } from "@/common/Common.js";
import { Pather } from "@/common/Pather.js";
import { Attack } from "@/common/Attack.js";
import { Pickit } from "@/common/Pickit.js";
import { Cubing } from "@/common/Cubing.js";
import { Runewords } from "@/common/Runewords.js";
import { Misc, Game, Time, Messaging, Packet } from "@/common/Misc.js";
import { D2Bot, DataFile } from "@/OOG.js";

function ToolsThread() {
  let ironGolem,
    debugInfo = { area: 0, currScript: "no entry" };
  let quitFlag = false;
  let quitListDelayTime;
  let antiIdle = false;
  let canQuit = true;

  this.scriptEvent = function (msg) {
    if (!msg) return;

    if (typeof msg === "string") {
      switch (msg) {
        case "toggleQuitlist":
          canQuit = !canQuit;

          break;
        case "quit":
          quitFlag = true;

          break;
        case "datadump":
          console.log("\xFFc8Systems Data Dump: \xFFc2Start");
          console.log("\xFFc8Cubing");
          console.log(
            "\xFFc9Cubing Valid Items\xFFc0",
            Cubing.validIngredients
          );
          console.log(
            "\xFFc9Cubing Needed Items\xFFc0",
            Cubing.neededIngredients
          );
          console.log("\xFFc8Runeword");
          console.log("\xFFc9Runeword Valid Items\xFFc0", Runewords.validGids);
          console.log("\xFFc9Runeword Needed Items\xFFc0", Runewords.needList);
          console.log(
            "\xFFc8Systems Data Dump: \xFFc1****************Info End****************"
          );

          break;
        // ignore common scriptBroadcast messages that aren't relevent to this thread
        case "mule":
        case "muleTorch":
        case "muleAnni":
        case "torch":
        case "crafting":
        case "getMuleMode":
        case "pingquit":
        case "townCheck":
          break;
        default:
          break;
      }
    } else if (typeof msg === "object") {
      msg.hasOwnProperty("currScript") &&
        (debugInfo.currScript = msg.currScript);
      msg.hasOwnProperty("lastAction") &&
        (debugInfo.lastAction = msg.lastAction);

      DataFile.updateStats("debugInfo", JSON.stringify(debugInfo));
    }
  };

  this.keyEvent = function (key) {
    switch (key) {
      case sdk.keys.PauseBreak: // pause default.js
        Common.Toolsthread.togglePause();
        break;
      case 74: //J for look
        let msg,
          unit = Game.getSelectedUnit();

        !unit && (unit = me);

        msg = `${getTickCount()} type:[${
          unit.type
        }] name:[${unit.name.omitColor()}] classid:[${
          unit.classid
        }]    prefix:[${unit.prefix}] gid:[${unit.gid}] code:[${
          unit.code ? unit.code : "-"
        }] ilvl:[${unit.ilvl ? unit.ilvl : "-"}] mode:[${
          unit.mode
        }]    itemclass:[${unit.itemclass}] itemType:[${
          unit.itemType
        }]    location:[${unit.location}] X:[${unit.x}] Y:[${unit.y}]`;

        //gold number
        if (unit.classid == sdk.items.Gold) {
          msg += " stats-gold(14):[" + unit.getStat(sdk.stats.Gold) + "]";
        }

        if (unit.type == sdk.unittype.Object) {
          //Object show the area
          msg += " area:[" + unit.area + "]";
        }

        if (unit.type == sdk.unittype.Item && unit.code == "crs") {
          unit.ilvl >= 25 && unit.ilvl <= 39
            ? (msg += " socked 4s(25<=ilvl<=39)")
            : (msg += " only (25<=ilvl<=39) socked 4s");
        }

        Pickit.init();
        msg += " checkItem=" + JSON.stringify(Pickit.checkItem(unit));
        msg += " getDistance=" + Math.round(getDistance(me, unit));

        say(msg);
        break;

      case 75: //K for look
        let item = Game.getSelectedUnit();

        // let stats = item.getStat(-1);
        // charges skill
        // print("--getState(-1)---" + JSON.stringify(stats));
        // skill = pStat[nStat].wSubIndex >> 6, level = pStat[nStat].wSubIndex & 0x3F,
        // charges = pStat[nStat].dwStatValue & 0xff;
        // maxcharges = pStat[nStat].dwStatValue >> 8;

        let stats = item.getStat(-2);
        // print("--getState(-2)---" + JSON.stringify(stats));

        for (let [key, value] of Object.entries(sdk.stats)) {
          stats[value] &&
            print(`${key}--${value}--${JSON.stringify(stats[value])}`);
        }
        break;
    }
  };

  this.gameEvent = function ({ mode, param1, param2, name1, name2 }) {
    switch (mode) {
      case 0x00: // "%Name1(%Name2) dropped due to time out."
      case 0x01: // "%Name1(%Name2) dropped due to errors."
      case 0x03: // "%Name1(%Name2) left our world. Diablo's minions weaken."
        Config.DebugMode &&
          mode === 0 &&
          D2Bot.printToConsole(name1 + " timed out, check their logs");

        if (
          (typeof Config.QuitList === "string" &&
            Config.QuitList.toLowerCase() === "any") ||
          (Config.QuitList instanceof Array && Config.QuitList.includes(name1))
        ) {
          print(name1 + (mode === 0 ? " timed out" : " left"));

          if (
            typeof Config.QuitListDelay !== "undefined" &&
            typeof quitListDelayTime === "undefined" &&
            Config.QuitListDelay.length > 0
          ) {
            Config.QuitListDelay.sort((a, b) => a - b);
            quitListDelayTime =
              getTickCount() +
              rand(
                Time.seconds(Config.QuitListDelay[0]),
                Time.seconds(Config.QuitListDelay[1])
              );
          } else {
            quitListDelayTime = getTickCount();
          }

          quitFlag = true;
        }

        if (Config.AntiHostile) {
          scriptBroadcast("remove " + name1);
        }

        break;
      case 0x06: // "%Name1 was Slain by %Name2"
        if (Config.AntiHostile && param2 === 0x00 && name2 === me.name) {
          scriptBroadcast("mugshot " + name1);
        }

        break;
      case 0x07:
        if (Config.AntiHostile && param2 === 0x03) {
          // "%Player has declared hostility towards you."
          scriptBroadcast("findHostiles");
        }

        break;
      case 0x11: // "%Param1 Stones of Jordan Sold to Merchants"
        if (Config.DCloneQuit === 2) {
          D2Bot.printToConsole("SoJ sold in game. Leaving.");

          quitFlag = true;

          break;
        }

        if (Config.SoJWaitTime && me.expansion) {
          !!me.realm &&
            D2Bot.printToConsole(
              param1 +
                " Stones of Jordan Sold to Merchants on IP " +
                me.gameserverip.split(".")[3],
              sdk.colors.D2Bot.DarkGold
            );
          Messaging.sendToScript("default.js", "soj");
        }

        break;
      case 0x12: // "Diablo Walks the Earth"
        if (Config.DCloneQuit > 0) {
          D2Bot.printToConsole("Diablo walked in game. Leaving.");

          quitFlag = true;

          break;
        }

        if (Config.StopOnDClone && me.expansion) {
          D2Bot.printToConsole(
            "Diablo Walks the Earth",
            sdk.colors.D2Bot.DarkGold
          );
          Common.Toolsthread.cloneWalked = true;

          Common.Toolsthread.togglePause();
          Town.goToTown();
          showConsole();
          print("\xFFc4Diablo Walks the Earth");

          me.maxgametime = 0;

          if (Config.KillDclone && load("tools/CloneThread.js")) {
            break;
          } else {
            antiIdle = true;
          }
        }

        break;
    }
  };

  let tick = getTickCount();
  D2Bot.init();
  print("\xFFc3Start ToolsThread script");
  addEventListener("keyup", this.keyEvent, this);
  addEventListener("gameevent", this.gameEvent, this);
  addEventListener("scriptmsg", this.scriptEvent, this);
  //show hook
  Common.Toolsthread.hookInfo();

  for (let i = 0; i < 5; i += 1) {
    Common.Toolsthread.timerLastDrink[i] = 0;
  }

  // Reset core chicken
  me.chickenhp = -1;
  me.chickenmp = -1;

  // General functions
  Common.Toolsthread.pauseScripts = [
    "default.js",
    "tools/townchicken.js",
    "tools/autobuildthread.js",
    "tools/antihostile.js",
    "tools/party.js",
    "tools/rushthread.js",
  ];
  Common.Toolsthread.stopScripts = [
    "default.js",
    "tools/townchicken.js",
    "tools/autobuildthread.js",
    "tools/antihostile.js",
    "tools/party.js",
    "tools/rushthread.js",
    "libs//modules/guard.js",
  ];

  while (true) {
    try {
      if (me.gameReady && !me.inTown) {
        Config.UseHP > 0 &&
          me.hpPercent < Config.UseHP &&
          Common.Toolsthread.drinkPotion(Common.Toolsthread.pots.Health);
        Config.UseRejuvHP > 0 &&
          me.hpPercent < Config.UseRejuvHP &&
          Common.Toolsthread.drinkPotion(Common.Toolsthread.pots.Rejuv);

        if (Config.LifeChicken > 0 && me.hpPercent <= Config.LifeChicken) {
          // takes a moment sometimes for townchicken to actually get to town so re-check that we aren't in town before quitting
          if (!me.inTown) {
            D2Bot.printToConsole(
              "Life Chicken (" +
                me.hp +
                "/" +
                me.hpmax +
                ")" +
                Attack.getNearestMonster().name +
                " in " +
                Pather.getAreaName(me.area) +
                ". Ping: " +
                me.ping,
              sdk.colors.D2Bot.Red
            );
            Common.Toolsthread.exit(true);

            break;
          }
        }

        Config.UseMP > 0 &&
          me.mpPercent < Config.UseMP &&
          Common.Toolsthread.drinkPotion(Common.Toolsthread.pots.Mana);
        Config.UseRejuvMP > 0 &&
          me.mpPercent < Config.UseRejuvMP &&
          Common.Toolsthread.drinkPotion(Common.Toolsthread.pots.Rejuv);

        if (Config.ManaChicken > 0 && me.mpPercent <= Config.ManaChicken) {
          D2Bot.printToConsole(
            "Mana Chicken: (" +
              me.mp +
              "/" +
              me.mpmax +
              ") in " +
              Pather.getAreaName(me.area),
            sdk.colors.D2Bot.Red
          );
          Common.Toolsthread.exit(true);

          break;
        }

        if (Config.IronGolemChicken > 0 && me.necromancer) {
          if (!ironGolem || copyUnit(ironGolem).x === undefined) {
            ironGolem = Common.Toolsthread.getIronGolem();
          }

          if (ironGolem) {
            // ironGolem.hpmax is bugged with BO
            if (
              ironGolem.hp <= Math.floor((128 * Config.IronGolemChicken) / 100)
            ) {
              D2Bot.printToConsole(
                "Irom Golem Chicken in " + Pather.getAreaName(me.area),
                sdk.colors.D2Bot.Red
              );
              Common.Toolsthread.exit(true);

              break;
            }
          }
        }

        if (Config.UseMerc) {
          let merc = me.getMerc();
          if (!!merc) {
            let mercHP = getMercHP();

            if (mercHP > 0 && merc.mode !== sdk.monsters.mode.Dead) {
              if (mercHP < Config.MercChicken) {
                D2Bot.printToConsole(
                  "Merc Chicken in " + Pather.getAreaName(me.area),
                  sdk.colors.D2Bot.Red
                );
                Common.Toolsthread.exit(true);

                break;
              }

              mercHP < Config.UseMercHP &&
                Common.Toolsthread.drinkPotion(
                  Common.Toolsthread.pots.MercHealth
                );
              mercHP < Config.UseMercRejuv &&
                Common.Toolsthread.drinkPotion(
                  Common.Toolsthread.pots.MercRejuv
                );
            }
          }
        }

        if (Config.ViperCheck && getTickCount() - tick >= 250) {
          Common.Toolsthread.checkVipers() && (quitFlag = true);

          tick = getTickCount();
        }

        Common.Toolsthread.checkPing(true) && (quitFlag = true);
      }

      if (antiIdle) {
        tick = getTickCount();
        let idleTick = tick;

        while (getTickCount() - tick < Time.minutes(Config.DCloneWaitTime)) {
          if (getTickCount() - idleTick > 0) {
            Packet.questRefresh();
            idleTick += rand(1200, 1500) * 1000;
            let timeStr = Time.format(idleTick - getTickCount());
            me.overhead(
              "Diablo Walks the Earth! - Next packet in: (\xFFc2" +
                timeStr +
                "\xFFc0)"
            );
            print("Sent anti-idle packet, next refresh in: (" + timeStr + ")");
          }
          delay(5000);
        }
      }
    } catch (error) {
      Misc.errorReport(error, "ToolsThread");
      quitFlag = true;
    }

    if (
      quitFlag &&
      canQuit &&
      (typeof quitListDelayTime === "undefined" ||
        getTickCount() >= quitListDelayTime)
    ) {
      let startTime = getTickCount();
      let quitTimeout = Config.QuitTimeout ? Config.QuitTimeout : 100;

      DataFile.updateStats(["gold", "torches"]);

      while (getTickCount() - startTime < quitTimeout) {
        me.overhead(
          "Wait \xFFc2" +
            Math.round((startTime + quitTimeout - getTickCount()) / 1000) +
            " Seconds\xFFc0 to exit."
        );
        delay(1000);
      }

      Common.Toolsthread.checkPing(false); // In case of quitlist triggering first
      Common.Toolsthread.exit();

      break;
    }
    delay(50);
  }
}

Config.asyncInit(false)
  .then(async () => {
    await Attack.asyncInit(false);
    new ToolsThread();
  })
  .catch((error) => {
    console.error(error);
  });
