import {
  me,
  print,
  getUIFlag,
  getScript,
  getRoom,
  revealLevel,
  delay,
  hideConsole,
  addEventListener,
  removeEventListener,
  getUnit,
  say,
  getDistance,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Config } from "@/common/Config.js";
import { Pather } from "@/common/Pather.js";
import { Attack } from "@/common/Attack.js";
import { Pickit } from "@/common/Pickit.js";
import { Storage } from "@/common/Storage.js";
import { Game } from "@/common/Misc.js";

function MapHelper() {
  let obj = { type: false, dest: false, action: false };
  let action,
    fail = 0,
    x,
    y;
  let mapThread = getScript("tools/mapthread.js");

  const portalMap = {};
  portalMap[sdk.areas.Abaddon] = {
    14: [12638, 6373],
    15: [12638, 6063],
    20: [12708, 6063],
    25: [12948, 6128],
  };
  portalMap[sdk.areas.PitofAcheron] = {
    14: [12638, 7873],
    15: [12638, 7563],
    20: [12708, 7563],
    25: [12948, 7628],
  };
  portalMap[sdk.areas.InfernalPit] = {
    14: [12638, 9373],
    20: [12708, 9063],
    25: [12948, 9128],
  };

  print("\xFFc9MapHelper\xFFc0 \xFFc2loaded\xFFc0");
  Storage.init();
  Pickit.init();

  this.announce = function (msg = "") {
    say(msg);
  };

  this.keyEvent = function (key) {
    switch (key) {
      case sdk.keys.F1:
        if (me.inTown) break;

        if (me.area === sdk.areas.DuranceofHateLvl3) {
          let mephisto = Game.getMonster(sdk.monsters.Mephisto);
          //death or corpse disappear
          if (
            (mephisto &&
              (mephisto.mode === sdk.monsters.mode.Death ||
                mephisto.mode === sdk.monsters.mode.Dead)) ||
            (!mephisto && me.x <= 17590)
          ) {
            this.announce("a4");
            break;
          }
        }

        if (me.area === sdk.areas.UberTristram) {
          this.announce("3b");
          break;
        }

        Pather.makePortal();
        this.announce("1");
        break;
      case sdk.keys.F2: // F2
        this.announce("bo");

        break;
      case sdk.keys.F3: // F3
        if (me.inTown) {
          this.announce("th");
        } else {
          this.announce(
            "/m " +
              Config.Follower.AuraHelper +
              " " +
              Config.Follower.AuraHelper +
              " aura 109"
          );
        }

        break;
      case sdk.keys.F4: // F4
        this.announce("/m " + Config.Follower.AuraHelper + " ah");

        break;
      case sdk.keys.Backspace: // BackSpace
        if (me.area === sdk.areas.UberTristram) {
          this.announce("3bt");
          break;
        }

        let portal = Pather.getPortal(null, me.name);
        if (!portal || (portal && getDistance(me, portal) > 20)) {
          Pather.makePortal();
        }
        this.announce("2");

        break;
    }
  };

  addEventListener("keyup", this.keyEvent, this);
  addEventListener("scriptmsg", (msg) => {
    action = msg;
  });

  // this.togglePickThread = function () {
  //   if (!Config.ManualPlayPick) return;

  //   let pickThread = getScript("tools/pickthread.js");

  //   if (pickThread) {
  //     if (pickThread.running) {
  //       pickThread.pause();
  //     } else if (!pickThread.running) {
  //       pickThread.resume();
  //     }
  //   }
  // };

  this.togglePause = function () {
    if (mapThread) {
      if (mapThread.running) {
        print("pause mapthread");
        mapThread.pause();
      } else if (!mapThread.running) {
        print("resume mapthread");
        mapThread.resume();

        if (!mapThread.running) {
          fail++;

          if (fail % 5 === 0 && !getScript("tools/mapthread.js")) {
            print("MapThread shut down, exiting MapHelper");

            return false;
          }
        }
      }
    } else if (!getScript("tools/mapthread.js")) {
      print("MapThread shut down, exiting MapHelper");

      return false;
    }

    return true;
  };

  while (true) {
    if (getUIFlag(sdk.uiflags.EscMenu)) {
      delay(100);
      mapThread.running && this.togglePause();
    } else {
      if (!mapThread.running) {
        if (!this.togglePause()) {
          return;
        }
      }
    }

    if (action) {
      // try {
      //   let temp = JSON.parse(action);
      //   temp && Object.assign(obj, temp);
      //   // this.togglePickThread();
      //   if (obj) {
      //     let redPortal, chestLoc, king, unit;
      //     switch (obj.type) {
      //       case "area":
      //         if (obj.dest === sdk.areas.ArreatSummit) {
      //           Pather.moveToExit(obj.dest, false);
      //         } else if (
      //           [
      //             sdk.areas.CanyonofMagic,
      //             sdk.areas.A2SewersLvl1,
      //             sdk.areas.PalaceCellarLvl3,
      //             sdk.areas.PandemoniumFortress,
      //             sdk.areas.BloodyFoothills,
      //           ].includes(obj.dest)
      //         ) {
      //           Pather.journeyTo(obj.dest);
      //         } else if (obj.dest === sdk.areas.DurielsLair) {
      //           Pather.moveToPreset(
      //             me.area,
      //             sdk.unittype.Object,
      //             sdk.quest.chest.HoradricStaffHolder,
      //             -11,
      //             3
      //           );
      //           for (let i = 0; i < 3; i++) {
      //             if (
      //               Pather.useUnit(
      //                 sdk.unittype.Object,
      //                 sdk.objects.PortaltoDurielsLair,
      //                 sdk.areas.DurielsLair
      //               )
      //             ) {
      //               break;
      //             }
      //           }
      //         } else {
      //           Pather.moveToExit(obj.dest, true);
      //         }
      //         break;
      //       case "unit":
      //         if (
      //           me.inArea(sdk.areas.MooMooFarm) ||
      //           (me.inArea(sdk.areas.DurielsLair) && Misc.talkToTyrael())
      //         ) {
      //           break;
      //         }
      //         Pather.moveToUnit(obj.dest, true);
      //         switch (me.area) {
      //           case sdk.areas.ColdPlains:
      //             Pather.moveToExit(sdk.areas.CaveLvl1, true);
      //             break;
      //           case sdk.areas.BlackMarsh:
      //             Pather.moveToExit(sdk.areas.HoleLvl1, true);
      //             break;
      //           case sdk.areas.LutGholein:
      //             Pather.useUnit(
      //               sdk.unittype.Stairs,
      //               sdk.exits.preset.A2EnterSewersDoor,
      //               sdk.areas.A2SewersLvl1
      //             );
      //             break;
      //           case sdk.areas.KurastBazaar:
      //             Pather.useUnit(
      //               sdk.unittype.Stairs,
      //               sdk.exits.preset.A3EnterSewers,
      //               sdk.areas.A3SewersLvl1
      //             );
      //             break;
      //         }
      //         if (obj.action && typeof obj.action === "object") {
      //           if (obj.action.do === "openChest") {
      //             !!obj.action.id && Misc.openChest(obj.action.id);
      //           } else if (obj.action.do === "usePortal") {
      //             !!obj.action.id
      //               ? Pather.usePortal(obj.action.id)
      //               : Pather.usePortal();
      //           }
      //         }
      //         break;
      //       case "wp":
      //         Pather.getWP(me.area);
      //         break;
      //       case "actChange":
      //         print("Going to act: " + obj.dest);
      //         Pather.changeAct(obj.dest);
      //         break;
      //       case "portal":
      //         if (
      //           obj.dest === sdk.areas.WorldstoneChamber &&
      //           Game.getMonster(sdk.monsters.ThroneBaal)
      //         ) {
      //           me.overhead("Can't enter Worldstone C yet. Baal still in area");
      //           break;
      //         } else if (
      //           obj.dest === sdk.areas.WorldstoneChamber &&
      //           !Game.getMonster(sdk.monsters.ThroneBaal)
      //         ) {
      //           redPortal = Game.getObject(sdk.objects.WorldstonePortal);
      //           redPortal && Pather.usePortal(null, null, redPortal);
      //           break;
      //         }
      //         switch (obj.dest) {
      //           case sdk.areas.RogueEncampment:
      //             king = Game.getPresetMonster(
      //               me.area,
      //               sdk.monsters.preset.TheCowKing
      //             );
      //             switch (king.x) {
      //               case 1:
      //                 Pather.moveTo(25183, 5923);
      //                 break;
      //             }
      //             break;
      //           case sdk.areas.StonyField:
      //             Pather.moveTo(25173, 5086);
      //             redPortal = Pather.getPortal(obj.dest);
      //             break;
      //           case sdk.areas.MooMooFarm:
      //             redPortal = Pather.getPortal(obj.dest);
      //             break;
      //           case sdk.areas.ArcaneSanctuary:
      //             Pather.moveTo(12692, 5195);
      //             redPortal = Pather.getPortal(obj.dest);
      //             !redPortal && Pather.useWaypoint(obj.dest);
      //             break;
      //           case sdk.areas.Harrogath:
      //             Pather.moveTo(20193, 8693);
      //             break;
      //           case sdk.areas.FrigidHighlands:
      //           case sdk.areas.ArreatPlateau:
      //           case sdk.areas.FrozenTundra:
      //             chestLoc = Game.getPresetObject(
      //               me.area,
      //               sdk.objects.SmallSparklyChest
      //             );
      //             if (!chestLoc) {
      //               break;
      //             }
      //             [x, y] = portalMap[me.area][chestLoc.x];
      //             Pather.moveTo(x, y);
      //             Pather.usePortal();
      //             break;
      //           case sdk.areas.MatronsDen:
      //           case sdk.areas.ForgottenSands:
      //           case sdk.areas.FurnaceofPain:
      //           case sdk.areas.UberTristram:
      //             redPortal = Pather.getPortal(obj.dest);
      //             break;
      //           default:
      //             Pather.usePortal(obj.dest);
      //             break;
      //         }
      //         if (redPortal) {
      //           Pather.moveToUnit(redPortal);
      //           Pather.usePortal(null, null, redPortal);
      //         }
      //         break;
      //       case "qol":
      //         switch (obj.action) {
      //           case "heal":
      //             Town.initNPC("Heal", "heal");
      //             break;
      //           case "openStash":
      //             Town.openStash();
      //             break;
      //           case "stashItems":
      //             Town.stash(true, true);
      //             break;
      //           case "makePortal":
      //             Pather.makePortal();
      //             break;
      //           case "takePortal":
      //             Town.goToTown();
      //             break;
      //           case "clear":
      //             Attack.clear(10);
      //             break;
      //           case "cowportal":
      //             Misc.openRedPortal(sdk.areas.MooMooFarm);
      //             break;
      //           case "ubertrist":
      //             Misc.openRedPortal(sdk.areas.UberTristram);
      //             break;
      //           case "uberportal":
      //             Misc.openRedPortal();
      //             break;
      //           case "filltps":
      //             Town.fillTome(sdk.items.TomeofTownPortal);
      //             me.cancel();
      //             break;
      //           case "moveItemFromInvoToStash":
      //           case "moveItemFromStashToInvo":
      //             unit = Game.getSelectedUnit();
      //             switch (unit.location) {
      //               case sdk.storage.Inventory:
      //                 Storage.Stash.CanFit(unit) && Storage.Stash.MoveTo(unit);
      //                 break;
      //               case sdk.storage.Stash:
      //                 Storage.Inventory.CanFit(unit) &&
      //                   Storage.Inventory.MoveTo(unit);
      //                 break;
      //             }
      //             break;
      //           case "moveItemFromInvoToCube":
      //           case "moveItemFromCubeToInvo":
      //             unit = Game.getSelectedUnit();
      //             switch (unit.location) {
      //               case sdk.storage.Inventory:
      //                 Storage.Cube.CanFit(unit) && Storage.Cube.MoveTo(unit);
      //                 break;
      //               case sdk.storage.Cube:
      //                 Storage.Inventory.CanFit(unit) &&
      //                   Storage.Inventory.MoveTo(unit);
      //                 break;
      //             }
      //             break;
      //           case "moveItemFromInvoToTrade":
      //           case "moveItemFromTradeToInvo":
      //             unit = Game.getSelectedUnit();
      //             switch (unit.location) {
      //               case sdk.storage.Inventory:
      //                 Storage.TradeScreen.CanFit(unit) &&
      //                   Storage.TradeScreen.MoveTo(unit);
      //                 break;
      //               case sdk.storage.TradeWindow:
      //                 if (Storage.Inventory.CanFit(unit)) {
      //                   Packet.itemToCursor(unit);
      //                   Storage.Inventory.MoveTo(unit);
      //                 }
      //                 break;
      //             }
      //             break;
      //           case "pick":
      //             Config.ManualPlayPick
      //               ? Pickit.pickItems()
      //               : Pickit.basicPickItems();
      //             break;
      //           case "sellItem":
      //             unit = Game.getSelectedUnit();
      //             if (unit.isInInventory && unit.sellable) {
      //               try {
      //                 unit.sell();
      //               } catch (e) {
      //                 console.error(e);
      //               }
      //             }
      //             break;
      //         }
      //         break;
      //       case "drop":
      //         switch (obj.action) {
      //           case "invo":
      //             Misc.dropItems(sdk.storage.Inventory);
      //             break;
      //           case "stash":
      //             Misc.dropItems(sdk.storage.Stash);
      //             break;
      //         }
      //         break;
      //       case "stack":
      //         switch (obj.action) {
      //           case "thawing":
      //             Town.buyPots(10, "Thawing", true, true);
      //             break;
      //           case "antidote":
      //             Town.buyPots(10, "Antidote", true, true);
      //             break;
      //           case "stamina":
      //             Town.buyPots(10, "Stamina", true, true);
      //             break;
      //         }
      //         break;
      //     }
      //   }
      // } catch (e) {
      //   console.error(e);
      // } finally {
      //   action = false;
      //   // this.togglePickThread();
      // }
    }

    delay(50);
  }
}

Config.asyncInit().then(async () => {
  await Attack.asyncInit(false);
  new MapHelper();
});
