import {
  me,
  getLocation,
  delay,
  print,
  addEventListener,
  load,
  FileTools,
  getTickCount,
  getParty,
  clickParty,
  say,
  quit,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Town } from "@/common/Town.js";
import { Pather } from "@/common/Pather.js";
import { Config } from "@/common/Config.js";
import { Pickit } from "@/common/Pickit.js";
import { Storage } from "@/common/Storage.js";
import { Messaging, Misc, Game } from "@/common/Misc.js";
import { Starter, D2Bot, DataFile, ControlAction } from "@/OOG.js";
import { StarterConfig, AdvancedConfig } from "@/config/_StarterConfig.js";
import { AutoMule } from "@/AutoMule.js";

const MuleCharmData = {
  // read data from the mule datafile and return the data object
  read() {
    if (!FileTools.exists("data/data-MuleCharm.json")) {
      return undefined;
    }

    let string = FileTools.readText("data/data-MuleCharm.json");

    if (string === "") return undefined;

    let obj = JSON.parse(string);

    return obj;
  },

  // write a data object to the mule datafile
  write(obj) {
    let string = JSON.stringify(obj);
    FileTools.writeText("data/data-MuleCharm.json", string);
  },

  save(account, charName, charmType) {
    let obj = this.read();
    if (obj === undefined) obj = {};

    if (obj[account] === undefined) obj[account] = {};

    obj[account][charName] = obj[account][charName]
      ? obj[account][charName] | charmType
      : charmType;

    this.write(obj);
  },
};

const CharmMuler = {
  charmType: 0,
  account: undefined,
  charName: undefined,
  stopCheck: false,
  muler: undefined,

  initEvent() {
    this.muler = AutoMule.getCharmMuleObject(Starter.leader[0]);

    ControlAction.actionEvent[sdk.game.locations.MainMenu] = function () {
      CharmMuler.account = CharmMuler.muler?.accountPrefix;

      if (
        !CharmMuler.stopCheck &&
        CharmMuler.muler?.stopProfile &&
        me.profile.toLowerCase() !==
          CharmMuler.muler?.stopProfile?.toLowerCase()
      ) {
        D2Bot.stop(
          CharmMuler.muler?.stopProfile,
          CharmMuler.muler?.stopProfileKeyRelease
        );
        CharmMuler.stopCheck = true;
      }

      let info = {
        realm: CharmMuler.muler?.realm,
        account: CharmMuler.muler?.accountPrefix,
        password: CharmMuler.muler?.accountPassword,
      };

      ControlAction.loginAccount(info);
    };

    ControlAction.actionEvent[sdk.game.locations.CharSelect] = function () {
      let chars = ControlAction.getCharacters();
      if (!chars.length) return false;

      let save = MuleCharmData.read();

      CharmMuler.charName =
        save == undefined
          ? chars[0]
          : chars.find((char) => {
              if (
                save[CharmMuler.account] === undefined ||
                save[CharmMuler.account][char] === undefined
              )
                return true;

              return !(save[CharmMuler.account][char] & CharmMuler.charmType);
            });

      if (ControlAction.findCharacter({ charName: CharmMuler.charName })) {
        ControlAction.loginCharacter({ charName: CharmMuler.charName }, false);
      }
    };
  },

  checkAnniTorch() {
    while (!me.gameReady) {
      delay(500);
    }

    return me
      .getItemsEx()
      .filter(
        (i) =>
          i.isInStorage &&
          i.unique &&
          [sdk.items.SmallCharm, sdk.items.LargeCharm].includes(i.classid)
      )
      .some((i) =>
        [sdk.items.SmallCharm, sdk.items.LargeCharm].includes(i.classid)
      );
  },

  stashItems() {
    me.getItemsEx()
      .filter((item) => item.isInInventory)
      .sort((a, b) => b.sizex * b.sizey - a.sizex * a.sizey)
      .forEach((item) => {
        Storage.Stash.CanFit(item) && Storage.Stash.MoveTo(item);
      });

    return true;
  },

  cursorCheck() {
    let cursorItem = Game.getCursorUnit();

    if (cursorItem) {
      if (
        !Storage.Inventory.CanFit(cursorItem) ||
        !Storage.Inventory.MoveTo(cursorItem)
      ) {
        cursorItem.drop();
      }
    }

    return true;
  },

  report(item, result) {
    let msg;
    const sc = (label, stat) => `${label}\xFFc2${item.getStat(stat)}\xFFc0`;
    const chars = () => {
      let lv, i;
      for (i = 0; i < 7; i += 1) {
        lv = item.getStat(sdk.stats.AddClassSkills, i);
        if (lv) break;
      }

      return `\xFFc2${lv} ${sdk.player.class.nameOf(i)}\xFFc0`;
    };

    switch (item.classid) {
      case sdk.items.SmallCharm:
        msg = `${item.name}\xFFc0 ${sc(
          "Attributes:+",
          sdk.stats.Strength
        )} ${sc("Resistances:+", sdk.stats.FireResist)} ${sc(
          "AddExperience:+",
          sdk.stats.AddExperience
        )}%`;
        break;
      case sdk.items.LargeCharm:
        msg = `${item.name}\xFFc0 +${chars()} ${sc(
          "Attributes:+",
          sdk.stats.Strength
        )} ${sc("Resistances:+", sdk.stats.FireResist)}`;
        break;

      default:
        msg = `${item.name}\xFFc0 ${sc(
          "GoldBonus:+",
          sdk.stats.GoldBonus
        )}% ${sc("MagicBonus:+", sdk.stats.MagicBonus)}% ${sc(
          "ReducedPrices:+",
          sdk.stats.ReducedPrices
        )}% `;
        break;
    }
    say(
      `${msg} \xFFc8${result === Pickit.Result.WANTED ? "Kept" : "Drop"}\xFFc0`
    );
  },

  identifyCharm(item) {
    let idTool = Town.getIdTool();
    idTool && Town.identifyItem(item, idTool);

    let result = Pickit.checkItem(item);
    this.report(item, result.result);

    switch (result.result) {
      case Pickit.Result.WANTED:
        // Couldn't id autoEquip item. Don't log it.
        // if (result.result === 1 && Config.AutoEquip && !item.indentifed && Item.autoEquipCheck(item)) {
        // 	break;
        // }
        MuleCharmData.save(this.account, this.charName, this.charmType);
        Misc.itemLogger("Kept", item);
        Misc.logItem("Kept", item, result.line);

        break;
      case Pickit.Result.UNID:
      case Pickit.Result.RUNEWORD: // (doesn't trigger normally)
        break;
      default: // shop speedup test
        Misc.itemLogger("Drop", item);
        item.drop();
        break;
    }
    return true;
  },

  pickCharm() {
    let item = Game.getItem(-1, sdk.items.mode.onGround);
    let success;

    if (item) {
      do {
        if (
          item.unique &&
          [
            sdk.items.SmallCharm,
            sdk.items.LargeCharm,
            sdk.items.GrandCharm,
          ].includes(item.classid) &&
          Pickit.canPick(item)
        ) {
          success =
            success || (Pickit.pickItem(item) && this.identifyCharm(item));
        }
      } while (item.getNext());

      return success;
    } else {
      say("found \xFFc1nothing\xFFc0!");
      return false;
    }
  },

  muleCharm(location, owner) {
    Town.goToTown(sdk.areas.actOf(location.area));

    let portal = Pather.getPortal(
      location.area,
      location.area === sdk.areas.UberTristram ? undefined : owner
    );

    if (!portal) {
      print("\xFFc4D2BotMuleCharm\xFFc0: Failed to find portal.");
      return false;
    }

    for (let i = 0; i < 5; i += 1) {
      if (me.inTown && Pather.usePortal(null, null, portal)) {
        break;
      }

      delay(500 + me.ping);
    }

    if (me.area !== location.area) {
      print("\xFFc4D2BotMuleCharm\xFFc0: Failed to use portal.");
      return false;
    }

    Pather.moveTo(location.x, location.y);
    this.pickCharm();
  },

  party(inviter) {
    while (me.gameReady) {
      let player = getParty();

      if (player) {
        // the first is me
        let myPartyId = player.partyid;

        while (player.getNext()) {
          if (player.name === inviter) {
            // already in party
            if (myPartyId !== sdk.party.NoParty) return player;

            if (
              myPartyId === sdk.party.NoParty &&
              player.partyflag === sdk.party.Accept
            ) {
              clickParty(player, 2);
              delay(100);
              return player;
            }
          }
        }
      }

      delay(100);
    }

    return false;
  },

  action() {
    Config.PickitFiles.push("MuleCharm.nip");
    Pickit.init(true);

    let player = this.party(Starter.joinInfo.inviter);

    if (player) {
      // Misc.poll(() => !!player.area, 20000, 100);
      while (!player.area) {
        delay(200);
      }

      let location = { area: player.area, x: player.x, y: player.y };

      this.muleCharm(location, Starter.joinInfo.inviter);
    }

    // while (true) {
    //   delay(1000);
    // }

    delay(1000);
    quit();

    if (this.stopCheck && this.muler?.stopProfile) {
      D2Bot.start(this.muler?.stopProfile);
    }

    delay(1000);
    D2Bot.stop(me.profile, true);
  },
};

function receiveMuleCopyData({ mode, msg }) {
  if (mode === sdk.oog.message.Messaging) {
    switch (msg?.message?.action) {
      case "MuleCharm":
        //add leader
        Starter.leader.push(msg.sender);
        CharmMuler.charmType = msg?.message?.charmType;
        break;

      default:
        break;
    }
    Messaging.sendToProfile(msg.sender, mode, "echo");
  } else {
    Starter.receiveCopyData({ mode, msg });
  }
}

function main() {
  addEventListener("copydata", receiveMuleCopyData);

  while (!Starter.handle) {
    delay(100);
  }

  DataFile.updateStats("handle", Starter.handle);
  D2Bot.init();
  load("tools/heartbeat.js");

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

  //waiting for message
  while (!Starter.leader.length) {
    delay(100);
  }

  CharmMuler.initEvent();

  while (true) {
    if (me.ingame && me.gameReady) {
      me.updatePlayerGid();

      // Misc.poll(() => !!me.area, 5000, 100);
      while (!me.area) {
        delay(200);
      }

      //doing now
      CharmMuler.action();
    }

    ControlAction.locationAction(getLocation());

    delay(500);
  }
}

try {
  Object.assign(Starter.Config, StarterConfig);

  if (typeof AdvancedConfig[me.profile] === "object") {
    Object.assign(Starter.Config, AdvancedConfig[me.profile]);
  }

  // if (!FileTools.exists("data/" + me.profile + ".json") && DataFile.create()) {
  //   Starter.firstRun = true;
  // }
  main();
} catch (error) {
  console.error(error);
}
