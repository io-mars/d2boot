import {
  FileTools,
  addEventListener,
  copyUnit,
  delay,
  getDistance,
  getParty,
  getTickCount,
  joinGame,
  me,
  print,
  quit,
  removeEventListener,
  scriptBroadcast,
  sendCopyData,
} from "boot";

import { sdk } from "./modules/sdk.js";
import { Config } from "./common/Config.js";
import { Town } from "./common/Town.js";
import { Misc, Game, Messaging } from "./common/Misc.js";
import { Cubing } from "./common/Cubing.js";
import { Storage } from "./common/Storage.js";
import { Pickit } from "./common/Pickit.js";
import { Time } from "./common/Misc.js";
import { Runewords } from "./common/Runewords.js";
import { NTIP } from "./NTItemParser.js";
import { D2Bot, Starter } from "./OOG.js";
import { AutoMuleConfig } from "./config/_StarterConfig.js";
import { TorchSystem } from "./TorchSystem.js";
import { CraftingSystem } from "./CraftingSystem.js";

export const AutoMule = {
  inGame: false,
  check: false,
  torchAnniCheck: false,
  CharmType: {
    None: 0,
    SmallCharm: 1,
    LargeCharm: 2,
    GrandCharm: 4,
  },

  // *** Master functions ***
  getInfo() {
    let info;

    for (let i in AutoMuleConfig.Mules) {
      if (AutoMuleConfig.Mules.hasOwnProperty(i)) {
        for (
          let j = 0;
          j < AutoMuleConfig.Mules[i].enabledProfiles.length;
          j += 1
        ) {
          if (
            AutoMuleConfig.Mules[i].enabledProfiles[j].toLowerCase() ===
            me.profile.toLowerCase()
          ) {
            !info && (info = {});
            info.muleInfo = AutoMuleConfig.Mules[i];
          }
        }
      }
    }

    for (let i in AutoMuleConfig.TorchAnniMules) {
      if (AutoMuleConfig.TorchAnniMules.hasOwnProperty(i)) {
        for (
          let j = 0;
          j < AutoMuleConfig.TorchAnniMules[i].enabledProfiles.length;
          j += 1
        ) {
          if (
            AutoMuleConfig.TorchAnniMules[i].enabledProfiles[
              j
            ].toLowerCase() === me.profile.toLowerCase()
          ) {
            !info && (info = {});
            info.torchMuleInfo = AutoMuleConfig.TorchAnniMules[i];
          }
        }
      }
    }

    return info;
  },

  muleCheck() {
    let info = this.getInfo();

    if (info && info.hasOwnProperty("muleInfo")) {
      let items = this.getMuleItems();

      if (
        info.muleInfo.hasOwnProperty("usedStashTrigger") &&
        info.muleInfo.hasOwnProperty("usedInventoryTrigger") &&
        Storage.Inventory.UsedSpacePercent() >=
          info.muleInfo.usedInventoryTrigger &&
        Storage.Stash.UsedSpacePercent() >= info.muleInfo.usedStashTrigger &&
        items.length > 0
      ) {
        D2Bot.printToConsole("MuleCheck triggered!", sdk.colors.D2Bot.DarkGold);

        return true;
      }

      for (let i = 0; i < items.length; i += 1) {
        if (this.matchItem(items[i], Config.AutoMule.Trigger)) {
          D2Bot.printToConsole(
            "MuleCheck triggered!",
            sdk.colors.D2Bot.DarkGold
          );
          return true;
        }
      }
    }

    return false;
  },

  getMule() {
    let info = this.getInfo();

    if (info) {
      if (this.check && info.hasOwnProperty("muleInfo")) return info.muleInfo;
      if (this.torchAnniCheck && info.hasOwnProperty("torchMuleInfo"))
        return info.torchMuleInfo;
    }

    return false;
  },

  outOfGameCheck() {
    if (!this.check && !this.torchAnniCheck) return false;

    let muleObj = this.getMule();
    if (!muleObj) return false;

    function muleCheckEvent({ mode, msg }) {
      // mode === 10 && (muleInfo = JSON.parse(msg));
      mode === 10 && (muleInfo = msg);
    }

    let stopCheck = false;
    let muleInfo = { status: "" };
    let failCount = 0;

    if (!muleObj.continuousMule || !muleObj.skipMuleResponse) {
      addEventListener("copydata", muleCheckEvent);
    }

    if (muleObj.continuousMule) {
      D2Bot.printToConsole("Starting mule.", sdk.colors.D2Bot.DarkGold);
      D2Bot.start(muleObj.muleProfile);
    } else {
      D2Bot.printToConsole(
        "Starting " +
          (this.torchAnniCheck === 2
            ? "anni "
            : this.torchAnniCheck === 1
            ? "torch "
            : "") +
          "mule profile: " +
          muleObj.muleProfile,
        sdk.colors.D2Bot.DarkGold
      );
    }

    MainLoop: while (true) {
      // Set status to ready if using continuous mule with no response check
      if (muleObj.continuousMule && muleObj.skipMuleResponse) {
        muleInfo.status = "ready";

        // If nothing received our copy data start the mule profile
      } else if (
        !sendCopyData(
          null,
          muleObj.muleProfile,
          10,
          JSON.stringify({
            profile: me.profile,
            mode: this.torchAnniCheck || 0,
          })
        ) &&
        !muleObj.continuousMule
      ) {
        // if the mule profile isn't already running and there is a profile to be stopped, stop it before starting the mule profile
        if (
          !stopCheck &&
          muleObj.stopProfile &&
          me.profile.toLowerCase() !== muleObj.stopProfile.toLowerCase()
        ) {
          D2Bot.stop(muleObj.stopProfile, muleObj.stopProfileKeyRelease);
          stopCheck = true;
          delay(2000); // prevents cd-key in use error if using -skiptobnet on mule profile
        }

        D2Bot.start(muleObj.muleProfile);
      }

      delay(1000);

      switch (muleInfo.status) {
        case "loading":
          if (
            !muleObj.continuousMule &&
            !stopCheck &&
            muleObj.stopProfile &&
            me.profile.toLowerCase() !== muleObj.stopProfile.toLowerCase()
          ) {
            D2Bot.stop(muleObj.stopProfile, muleObj.stopProfileKeyRelease);

            stopCheck = true;
          }

          failCount += 1;

          break;
        case "busy":
        case "begin":
          D2Bot.printToConsole("Mule profile is busy.", sdk.colors.D2Bot.Red);

          break MainLoop;
        case "ready":
          Starter.LocationEvents.openJoinGameWindow();

          delay(2000);

          this.inGame = true;
          me.blockMouse = true;

          try {
            joinGame(muleObj.muleGameName[0], muleObj.muleGameName[1]);
          } catch (joinError) {
            delay(100);
          }

          me.blockMouse = false;

          // Untested change 11.Feb.14.
          for (let i = 0; i < 8; i += 1) {
            delay(1000);

            if (me.ingame && me.gameReady) {
              break MainLoop;
            }
          }

          if (
            muleObj.continuousMule &&
            muleObj.skipMuleResponse &&
            !me.ingame
          ) {
            D2Bot.printToConsole(
              "Unable to join mule game",
              sdk.colors.D2Bot.Red
            );

            break MainLoop;
          }

          break;
        default:
          failCount += 1;

          break;
      }

      if (failCount >= 260) {
        D2Bot.printToConsole(
          "No response from mule profile.",
          sdk.colors.D2Bot.Red
        );

        break;
      }
    }

    if (!muleObj.continuousMule || !muleObj.skipMuleResponse) {
      removeEventListener("copydata", muleCheckEvent);
    }

    while (me.ingame) {
      delay(1000);
    }

    this.inGame = false;
    this.check = false;
    this.torchAnniCheck = false;

    // No response - stop mule profile
    if (!muleObj.continuousMule) {
      if (failCount >= 60) {
        D2Bot.stop(muleObj.muleProfile, true);
        delay(1000);
      }

      if (stopCheck && muleObj.stopProfile) {
        D2Bot.start(muleObj.stopProfile);
      }
    }

    return true;
  },

  inGameCheck() {
    let muleObj, tick;
    let begin = false;
    let timeout = 150 * 1000; // Ingame mule timeout
    let status = "muling";

    // Single player
    if (!me.gamename) return false;

    let info = this.getInfo();

    // Profile is not a part of AutoMule
    if (!info) return false;

    // Profile is not in mule or torch mule game
    if (
      !(
        (info.hasOwnProperty("muleInfo") &&
          me.gamename.toLowerCase() ===
            info.muleInfo.muleGameName[0].toLowerCase()) ||
        (info.hasOwnProperty("torchMuleInfo") &&
          me.gamename.toLowerCase() ===
            info.torchMuleInfo.muleGameName[0].toLowerCase())
      )
    ) {
      return false;
    }

    function dropStatusEvent({ mode, msg }) {
      if (mode === 10) {
        switch (msg.status) {
          case "report": // reply to status request
            sendCopyData(
              null,
              muleObj.muleProfile,
              12,
              JSON.stringify({ status: status })
            );

            break;
          case "quit": // quit command
            status = "quit";

            break;
        }
      }
    }

    function muleModeEvent(msg) {
      switch (msg) {
        case "2":
          AutoMule.torchAnniCheck = 2;

          break;
        case "1":
          AutoMule.torchAnniCheck = 1;

          break;
        case "0":
          AutoMule.check = true;

          break;
      }
    }

    addEventListener("scriptmsg", muleModeEvent);
    scriptBroadcast("getMuleMode");
    delay(500);

    if (!this.check && !this.torchAnniCheck) {
      print("Error - Unable to determine mule mode");
      quit();

      return false;
    }

    muleObj = this.getMule();
    me.maxgametime = 0;

    !muleObj.continuousMule && addEventListener("copydata", dropStatusEvent);

    if (!Town.goToTown(1)) {
      print("Error - Failed to go to Act 1");
      quit();

      return false;
    }

    Town.move("stash");

    if (muleObj.continuousMule) {
      print("\xFFc4AutoMule\xFFc0: Looking for valid mule");
      tick = getTickCount();

      while (getTickCount() - tick < timeout) {
        if (this.verifyMulePrefix(muleObj.charPrefix)) {
          print("\xFFc4AutoMule\xFFc0: Found valid mule");
          begin = true;

          break;
        }

        delay(2000);
      }

      if (!begin) {
        print("Error - Unable to find mule character");
        delay(2000);
        quit();
      }
    } else {
      sendCopyData(null, muleObj.muleProfile, 11, "begin");
    }

    if (this.torchAnniCheck === 2) {
      print("\xFFc4AutoMule\xFFc0: In anni mule game.");
      D2Bot.updateStatus("AutoMule: In game.");
      this.dropCharm(true);
    } else if (this.torchAnniCheck === 1) {
      print("\xFFc4AutoMule\xFFc0: In torch mule game.");
      D2Bot.updateStatus("AutoMule: In game.");
      this.dropCharm(false);
    } else {
      print("\xFFc4AutoMule\xFFc0: In mule game.");
      D2Bot.updateStatus("AutoMule: In game.");
      this.dropStuff();
    }

    status = "done";
    tick = getTickCount();

    while (true) {
      if (muleObj.continuousMule) {
        if (this.isFinished()) {
          D2Bot.printToConsole("Done muling.", sdk.colors.D2Bot.DarkGold);
          status = "quit";
        } else {
          delay(5000);
        }
      }

      if (status === "quit") {
        break;
      }

      if (getTickCount() - tick > timeout) {
        D2Bot.printToConsole(
          "Mule didn't rejoin. Picking up items.",
          sdk.colors.D2Bot.Red
        );
        Misc.useItemLog = false; // Don't log items picked back up in town.
        Pickit.pickItems();

        break;
      }

      delay(500);
    }

    if (!muleObj.continuousMule) {
      removeEventListener("copydata", dropStatusEvent);
      D2Bot.stop(muleObj.muleProfile, true);
      delay(1000);
      muleObj.stopProfile && D2Bot.start(muleObj.stopProfile);
    }

    delay(2000);
    quit();

    return true;
  },

  // finished if no items are on ground
  isFinished() {
    let item = Game.getItem();

    if (item) {
      do {
        // exclude trash
        if (
          getDistance(me, item) < 20 &&
          item.onGroundOrDropping &&
          Town.ignoredItemTypes.indexOf(item.itemType) === -1
        ) {
          return false;
        }
      } while (item.getNext());
    }

    return true;
  },

  // make sure mule character is in game
  verifyMulePrefix: function (mulePrefix) {
    try {
      let player = getParty();

      if (player) {
        let regex = new RegExp(mulePrefix, "i");

        do {
          // case insensitive matching
          if (player.name.match(regex)) {
            return true;
          }
        } while (player.getNext());
      }
    } catch (e) {
      delay(100);
    }

    return false;
  },

  dropStuff() {
    if (!Town.openStash()) return false;

    let items = this.getMuleItems() || [];
    if (items.length === 0) return false;

    D2Bot.printToConsole(
      "AutoMule: Transfering items.",
      sdk.colors.D2Bot.DarkGold
    );

    for (let i = 0; i < items.length; i += 1) {
      items[i].drop();
    }

    delay(1000);
    me.cancel();

    return true;
  },

  matchItem: function (item, list) {
    let parsedPickit = [],
      classIDs = [];

    for (let i = 0; i < list.length; i += 1) {
      let info = {
        file: "Character Config",
        line: list[i],
      };

      // classids
      if (typeof list[i] === "number") {
        classIDs.push(list[i]);
      } else if (typeof list[i] === "string") {
        // pickit entries
        let parsedLine = NTIP.ParseLineInt(list[i], info);
        parsedLine && parsedPickit.push(parsedLine);
      }
    }

    return (
      classIDs.includes(item.classid) || NTIP.CheckItem(item, parsedPickit)
    );
  },

  // get a list of items to mule
  getMuleItems() {
    let info = this.getInfo();

    if (!info || !info.hasOwnProperty("muleInfo")) return false;

    let item = me.getItem(-1, sdk.items.mode.inStorage);
    let items = [];

    if (item) {
      do {
        if (
          Town.ignoredItemTypes.indexOf(item.itemType) === -1 &&
          (Pickit.checkItem(item).result > 0 ||
            (item.isInStash &&
              info.muleInfo.hasOwnProperty("muleOrphans") &&
              info.muleInfo.muleOrphans)) &&
          item.classid !== sdk.quest.item.Cube && // Don't drop Horadric Cube
          (item.classid !== sdk.items.SmallCharm ||
            item.quality !== sdk.items.quality.Unique) && // Don't drop Annihilus
          (item.classid !== sdk.items.LargeCharm ||
            item.quality !== sdk.items.quality.Unique) && // Don't drop Hellfire Torch
          (item.isInStash ||
            (item.isInInventory &&
              !Storage.Inventory.IsLocked(item, Config.Inventory))) && // Don't drop items in locked slots
          ((!TorchSystem.getFarmers() && !TorchSystem.isFarmer()) ||
            [
              sdk.quest.item.KeyofTerror,
              sdk.quest.item.KeyofHate,
              sdk.quest.item.KeyofDestruction,
            ].indexOf(item.classid) === -1)
        ) {
          // Don't drop Keys if part of TorchSystem
          // Always drop items on Force or Trigger list
          if (
            this.matchItem(
              item,
              Config.AutoMule.Force.concat(Config.AutoMule.Trigger)
            ) ||
            // Don't drop Excluded items or Runeword/Cubing/CraftingSystem ingredients
            (!this.matchItem(item, Config.AutoMule.Exclude) &&
              !this.cubingIngredient(item) &&
              !this.runewordIngredient(item) &&
              !this.utilityIngredient(item))
          ) {
            items.push(copyUnit(item));
          }
        }
      } while (item.getNext());
    }

    return items;
  },

  utilityIngredient: function (item) {
    return !!item && CraftingSystem.validGids.includes(item.gid);
  },

  // check if an item is a cubing ingredient
  cubingIngredient: function (item) {
    if (!item) return false;

    for (let i = 0; i < Cubing.validIngredients.length; i += 1) {
      if (item.gid === Cubing.validIngredients[i].gid) {
        return true;
      }
    }

    return false;
  },

  // check if an item is a runeword ingrediend - rune, empty base or bad rolled base
  runewordIngredient: function (item) {
    if (!item) return false;
    if (Runewords.validGids.includes(item.gid)) return true;

    if (!this.baseGids) {
      this.baseGids = [];

      for (let i = 0; i < Config.Runewords.length; i += 1) {
        let base =
          Runewords.getBase(
            Config.Runewords[i][0],
            Config.Runewords[i][1],
            Config.Runewords[i][2] || 0
          ) ||
          Runewords.getBase(
            Config.Runewords[i][0],
            Config.Runewords[i][1],
            Config.Runewords[i][2] || 0,
            true
          );
        base && this.baseGids.push(base.gid);
      }
    }

    return this.baseGids.includes(item.gid);
  },

  dropCharm: function (dropAnni) {
    if (!Town.openStash()) return false;

    if (dropAnni) {
      let item = me.findItem(
        sdk.items.SmallCharm,
        sdk.items.mode.inStorage,
        -1,
        sdk.items.quality.Unique
      );

      if (item && !Storage.Inventory.IsLocked(item, Config.Inventory)) {
        D2Bot.printToConsole(
          "AutoMule: Transfering Anni.",
          sdk.colors.D2Bot.DarkGold
        );
        item.drop();
        delay(1000);
        me.cancel();

        return true;
      }

      return false;
    }

    let item = me.findItem(
      sdk.items.LargeCharm,
      sdk.items.mode.inStorage,
      -1,
      sdk.items.quality.Unique
    );

    if (item) {
      D2Bot.printToConsole(
        "AutoMule: Transfering Torch.",
        sdk.colors.D2Bot.DarkGold
      );
      item.drop();
      delay(1000);
      me.cancel();

      return true;
    }

    me.cancel();

    return true;
  },

  // *** Mule functions ***
  getMaster: function (info) {
    let muleObj =
      info.mode === 1 ? AutoMuleConfig.TorchAnniMules : AutoMuleConfig.Mules;

    for (let i in muleObj) {
      if (muleObj.hasOwnProperty(i)) {
        for (let j in muleObj[i]) {
          if (muleObj[i].hasOwnProperty(j) && j === "enabledProfiles") {
            for (let k = 0; k < muleObj[i][j].length; k += 1) {
              if (
                muleObj[i][j][k].toLowerCase() === info.profile.toLowerCase()
              ) {
                return {
                  profile: muleObj[i][j][k],
                  mode: info.mode,
                };
              }
            }
          }
        }
      }
    }

    return false;
  },

  getMuleObject: function (mode, master, continuous = false) {
    mode = mode || 0;
    let mule = mode > 0 ? AutoMuleConfig.TorchAnniMules : AutoMuleConfig.Mules;

    for (let i in mule) {
      if (mule.hasOwnProperty(i)) {
        if (
          mule[i].muleProfile &&
          mule[i].enabledProfiles &&
          mule[i].muleProfile.toLowerCase() === me.profile.toLowerCase() &&
          (continuous || mule[i].enabledProfiles.includes(master))
        ) {
          return mule[i];
        }
      }
    }

    return false;
  },

  getCharmMuleObject: function (master) {
    let mule = AutoMuleConfig.TorchAnniMules;
    for (let i in mule) {
      if (mule.hasOwnProperty(i)) {
        if (
          mule[i].type === "charm" &&
          mule[i].muleProfile &&
          mule[i].enabledProfiles &&
          mule[i].muleProfile.toLowerCase() === me.profile.toLowerCase() &&
          mule[i].enabledProfiles.includes(master)
        ) {
          return mule[i];
        }
      }
    }

    return false;
  },

  getMuleFilename: function (mode, master, continuous = false) {
    mode = mode || 0;
    let mule = mode > 0 ? AutoMuleConfig.TorchAnniMules : AutoMuleConfig.Mules;
    let file;

    // Iterate through mule object
    for (let i in mule) {
      if (mule.hasOwnProperty(i)) {
        // Mule profile matches config
        if (
          mule[i].muleProfile &&
          mule[i].muleProfile.toLowerCase() === me.profile.toLowerCase() &&
          (continuous || mule[i].enabledProfiles.includes(master))
        ) {
          file =
            mode === 0
              ? "logs/AutoMule." + i + ".json"
              : "logs/TorchMule." + i + ".json";

          // If file exists check for valid info
          if (FileTools.exists(file)) {
            try {
              let jsonStr = FileTools.readText(file);
              let jsonObj = JSON.parse(jsonStr);

              // Return filename containing correct mule info
              if (
                mule[i].accountPrefix &&
                jsonObj.account &&
                jsonObj.account.match(mule[i].accountPrefix)
              ) {
                return file;
              }
            } catch (e) {
              print(e);
            }
          } else {
            return file;
          }
        }
      }
    }

    // File exists but doesn't contain valid info - remake
    FileTools.remove(file);

    return file;
  },

  getMuleMode() {
    for (let i in AutoMuleConfig.Mules) {
      if (AutoMuleConfig.Mules.hasOwnProperty(i)) {
        if (
          AutoMuleConfig.Mules[i].muleProfile &&
          AutoMuleConfig.Mules[i].muleProfile.toLowerCase() ===
            me.profile.toLowerCase()
        ) {
          return 0;
        }
      }
    }

    for (let i in AutoMuleConfig.TorchAnniMules) {
      if (AutoMuleConfig.TorchAnniMules.hasOwnProperty(i)) {
        if (
          AutoMuleConfig.TorchAnniMules[i].muleProfile &&
          AutoMuleConfig.TorchAnniMules[i].muleProfile.toLowerCase() ===
            me.profile.toLowerCase()
        ) {
          return 1;
        }
      }
    }

    return 0;
  },

  isContinousMule() {
    for (let i in AutoMuleConfig.Mules) {
      if (AutoMuleConfig.Mules.hasOwnProperty(i)) {
        if (
          AutoMuleConfig.Mules[i].muleProfile &&
          AutoMuleConfig.Mules[i].muleProfile.toLowerCase() ===
            me.profile.toLowerCase()
        ) {
          return AutoMuleConfig.Mules[i].continuousMule;
        }
      }
    }

    for (let i in AutoMuleConfig.TorchAnniMules) {
      if (AutoMuleConfig.TorchAnniMules.hasOwnProperty(i)) {
        if (
          AutoMuleConfig.TorchAnniMules[i].muleProfile &&
          AutoMuleConfig.TorchAnniMules[i].muleProfile.toLowerCase() ===
            me.profile.toLowerCase()
        ) {
          return AutoMuleConfig.TorchAnniMules[i].continuousMule;
        }
      }
    }

    return false;
  },

  checkUniqueCharm(charm) {
    let item;

    Misc.poll(
      () => {
        item = Game.getItem(charm, sdk.items.mode.onGround);
        return item;
      },
      2000,
      200
    );

    if (!item) {
      return false;
    }

    do {
      if (item.unique) {
        return item;
      }
    } while (item.getNext());

    return false;
  },

  callCharmMuler(charm) {
    if (!this.checkUniqueCharm(charm)) {
      print(`\xFFc8AutoMule\xFFc0 :: can't found charm!`);

      return false;
    }

    if (
      !Config.MFTorches.MuleProfile ||
      Config.MFTorches.MuleProfile.trim() === ""
    )
      return false;

    print(
      `\xFFc8AutoMule\xFFc0 :: starting muler: ${Config.MFTorches.MuleProfile}...`
    );

    D2Bot.start(Config.MFTorches.MuleProfile);

    delay(2000);

    Starter.gameInfo = {
      gameName: me.gamename,
      gamePass: me.gamePass,
      gameCount: "",
      inGame: true,
    };

    let response = undefined;
    let tries = 1;
    let ct;

    switch (charm) {
      case sdk.items.LargeCharm:
        ct = this.CharmType.LargeCharm;
        break;
      case sdk.items.SmallCharm:
        ct = this.CharmType.SmallCharm;
        break;
      default:
        ct = this.CharmType.GrandCharm;
        break;
    }

    while (response === undefined && tries < 5) {
      response = Messaging.sendToProfile(
        Config.MFTorches.MuleProfile,
        sdk.oog.message.Messaging,
        {
          action: "MuleCharm",
          gameName: me.gamename,
          gamePass: me.gamepassword,
          inGame: true,
          inviter: me.name,
          charmType: ct,
        },
        true
      );
      tries++;
    }

    let tick = getTickCount();
    while (getTickCount() - tick < Time.minutes(5)) {
      delay(100);
    }

    return true;
  },
};
