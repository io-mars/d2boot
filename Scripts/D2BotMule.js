import {
  me,
  Profile,
  getLocation,
  delay,
  print,
  addEventListener,
  copyUnit,
  rand,
  load,
  FileTools,
  getTickCount,
  Hash,
  sendCopyData,
  joinGame,
  getScript,
  quit,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Town } from "@/common/Town.js";
import { Pather } from "@/common/Pather.js";
import { Attack } from "@/common/Attack.js";
import { Storage } from "@/common/Storage.js";
import { CollMap } from "@/common/CollMap.js";
import { Game, Time } from "@/common/Misc.js";
import { Pickit } from "@/common/Pickit.js";
import { Starter, D2Bot, DataFile, ControlAction } from "@/OOG.js";
import Controls from "@/modules/Control.js";
import { MuleLogger } from "@/MuleLogger.js";
import { AutoMule } from "@/AutoMule.js";

/**
 * @todo redo how muleing is handled, really dislike how it's handled here
 */

// D2BotMule specific settings - for global settings see libs/StarterConfig.js
Starter.Config.MinGameTime = 30; // Minimum game length in seconds. If a game is ended too soon, the rest of the time is waited in the lobby
Starter.Config.MaxGameTime = 60; // Maximum game length in minutes, only for continuous muling
Starter.Config.CreateGameDelay = 5; // Seconds to wait before creating a new game
Starter.Config.SwitchKeyDelay = 0; // Seconds to wait before switching a used/banned key or after realm down
Starter.Config.ExitToMenu = false; // Set to true to wait out restriction in main menu or false to wait in lobby.
Starter.Config.VersionErrorDelay = rand(15, 30); // Seconds to wait after 'unable to identify version' message
Starter.Config.MakeAccountOnFailure = true;

// Override default values for StarterConfig under here by following format
// Starter.Config.ValueToChange = value; // Example: Starter.Config.MinGameTime = 500; // changes MinGameTime to 500 seconds

let muleFilename;
let checkOnJoin = false;
let masterStatus = { status: "" };

// Mule Data object manipulates external mule datafile
const MuleData = {
  // create a new mule datafile
  create: function () {
    let obj = {
      account: "",
      accNum: 0,
      character: "",
      charNum: 0,
      fullChars: [],
      torchChars: [],
    };

    FileTools.writeText(muleFilename, JSON.stringify(obj));
  },

  // read data from the mule datafile and return the data object
  read: function () {
    let string = FileTools.readText(muleFilename);
    let obj = JSON.parse(string);

    return obj;
  },

  // write a data object to the mule datafile
  write: function (obj) {
    let string = JSON.stringify(obj);
    FileTools.writeText(muleFilename, string);
  },

  // set next account - increase account number in mule datafile
  nextAccount: function (accountPrefix) {
    let obj = MuleData.read();

    obj.accNum = obj.accNum + 1;
    obj.account = accountPrefix + obj.accNum;
    obj.character = "";
    obj.charNum = 0;
    obj.fullChars = [];
    obj.torchChars = [];

    MuleData.write(obj);

    return obj.account;
  },

  nextChar: function (charPrefix) {
    checkOnJoin = true;
    let charSuffix = "";
    let charNumbers = "abcdefghijklmnopqrstuvwxyz";
    let obj = MuleData.read();

    // dirty
    obj.charNum > 25 && (obj.charNum = 0);
    let num = obj.accNum.toString();

    for (let i = 0; i < num.length; i++) {
      charSuffix += charNumbers[parseInt(num[i], 10)];
    }

    charSuffix += charNumbers[obj.charNum];
    obj.charNum = obj.charNum + 1;
    obj.character = charPrefix + charSuffix;

    MuleData.write(obj);

    return obj.character;
  },
};

const Mule = {
  continuousMule: false,
  clearedJunk: false,

  quit: function () {
    ["default.js", "tools/AntiIdle.js", "tools/AreaWatcher.js"].forEach(
      (thread) => {
        let script = getScript(thread);
        !!script && script.running && script.stop();
        delay(100);
      }
    );
    Mule.cursorCheck();
    quit();

    return true;
  },

  gameRefresh: function () {
    if (!this.continuousMule) return this.quit();
    console.log("MaxGameTime Reached");
    Mule.quit();

    while (me.ingame) {
      delay(100);
    }

    Starter.firstLogin = true;
    console.log("updating runs");
    D2Bot.updateRuns();
    muleInfo.status = "ready";
    Starter.inGame = false;

    delay(1000);
    Controls.LobbyQuit.click(); // Quit from Lobby
    ControlAction.timeoutDelay("Refresh game", 330 * 1000); // 5.5 minutes
    return true;
  },

  ingameTimeout: function (time) {
    let tick = getTickCount();

    while (getTickCount() - tick < time) {
      if (me.ingame && me.gameReady) return true;

      // game doesn't exist, might need more locs
      if (getLocation() === 28) {
        break;
      }

      delay(100);
    }

    return me.ingame && me.gameReady;
  },

  foreverAlone: function () {
    let party = getParty();

    if (party) {
      do {
        if (party.name !== me.name) return false;
      } while (party.getNext());
    }

    return true;
  },

  checkAnniTorch: function () {
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

  stashItems: function () {
    me.getItemsEx()
      .filter((item) => item.isInInventory)
      .sort((a, b) => b.sizex * b.sizey - a.sizex * a.sizey)
      .forEach((item) => {
        Storage.Stash.CanFit(item) && Storage.Stash.MoveTo(item);
      });

    return true;
  },

  cursorCheck: function () {
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

  pickItems: function () {
    let waitTick = getTickCount();
    let canFit, item;
    let rval = "fail";
    let list = [];

    while (!me.name || !me.gameReady) {
      if (!me.ingame) return rval;
      delay(100);
    }

    if (!Mule.clearedJunk) {
      me.getItemsEx()
        .filter((item) => {
          item.isInInventory &&
            Town.ignoredItemTypes.includes(item.itemType) &&
            (muleInfo.muleMode === 0 ||
              item.classid !== sdk.items.ScrollofIdentify);
        })
        .forEach((item) => {
          try {
            item.drop();
          } catch (e) {
            console.warn("Failed to drop an item.");
          }
        });
      Mule.clearedJunk = true; // only do this once
    }

    while (me.gameReady) {
      if (
        masterStatus.status === "done" ||
        Mule.continuousMule ||
        checkOnJoin
      ) {
        checkOnJoin && (checkOnJoin = false);
        item = Game.getItem();

        if (item) {
          do {
            // don't pick up trash
            if (
              item.distance < 20 &&
              item.onGroundOrDropping &&
              Town.ignoredItemTypes.indexOf(item.itemType) === -1
            ) {
              list.push(copyUnit(item));
            }
          } while (item.getNext());
        }

        // If and only if there is nothing left are we "done"
        if (!Mule.continuousMule && list.length === 0) {
          rval = "done";

          break;
        }

        // pick large items first by sorting items by size in descending order and move gheed's charm to the end of the list
        list.sort(function (a, b) {
          if (
            a.classid === sdk.items.GrandCharm &&
            a.unique &&
            !Pickit.canPick(a)
          )
            return 1;
          if (
            b.classid === sdk.items.GrandCharm &&
            b.unique &&
            !Pickit.canPick(b)
          )
            return -1;

          return b.sizex * b.sizey - a.sizex * a.sizey;
        });

        while (list.length > 0) {
          item = list.shift();
          canFit = Storage.Inventory.CanFit(item);

          // Torch handling
          if (
            muleInfo.muleMode > 0 &&
            item.classid === sdk.items.LargeCharm &&
            item.unique &&
            !Pickit.canPick(item)
          ) {
            D2Bot.printToConsole(
              "Mule already has a Torch.",
              sdk.colors.D2Bot.DarkGold
            );

            rval = "next";
          }

          // Anni handling
          if (
            muleInfo.muleMode > 0 &&
            item.classid === sdk.items.SmallCharm &&
            item.unique &&
            !Pickit.canPick(item)
          ) {
            D2Bot.printToConsole(
              "Mule already has an Anni.",
              sdk.colors.D2Bot.DarkGold
            );

            rval = "next";
          }

          // Gheed's Fortune handling
          if (
            item.classid === sdk.items.GrandCharm &&
            item.unique &&
            !Pickit.canPick(item)
          ) {
            D2Bot.printToConsole(
              "Mule already has Gheed's.",
              sdk.colors.D2Bot.DarkGold
            );

            rval = "next";
          }

          if (!canFit && Mule.stashItems()) {
            canFit = Storage.Inventory.CanFit(item);
          }

          if (canFit) {
            Pickit.pickItem(item);

            if (
              muleInfo.muleMode > 0 &&
              Mule.continuousMule &&
              item.unique &&
              [
                sdk.items.SmallCharm,
                sdk.items.LargeCharm,
                sdk.items.GrandCharm,
              ].includes(item.classid)
            ) {
              rval = "next";
            }
          } else {
            rval = "next";
          }
        }

        if (rval === "next" || Mule.continuousMule) {
          break;
        }
      } else {
        if (!Mule.continuousMule) {
          sendCopyData(
            null,
            muleInfo.master,
            10,
            JSON.stringify({ status: "report" })
          );
        } else {
          if (getTickCount() - waitTick > Time.minutes(10)) {
            break;
          }
        }
      }

      delay(500);
    }

    return rval;
  },
};

const muleInfo = {
  // MuleData,
  // Mule,
  status: "loading",
  makeNext: false,
  maxCharCount: -1,
  // muleData: MuleData,
  muler: undefined,
  master: undefined,
  muleMode: undefined,
};

function receiveCopyData({ mode, msg }) {
  if (mode === 3) return;
  // master/mule communication function
  switch (mode) {
    case 10: // mule request
      if (Mule.continuousMule && me.ingame) {
        sendCopyData(
          null,
          msg.profile,
          10,
          JSON.stringify({ status: "ready" })
        );
      } else {
        if (!muleInfo.master) {
          let masterInfo = AutoMule.getMaster(msg);

          if (masterInfo) {
            muleInfo.master = masterInfo.profile;
            muleInfo.muleMode = masterInfo.mode;
          }
        } else {
          if (msg.profile === muleInfo.master) {
            sendCopyData(
              null,
              muleInfo.master,
              10,
              JSON.stringify({ status: muleInfo.status })
            );
          } else {
            sendCopyData(
              null,
              msg.profile,
              10,
              JSON.stringify({ status: "busy" })
            );
          }
        }
      }

      break;
    case 11: // begin item pickup
      muleInfo.status = "begin";

      break;
    case 12: // get master's status
      masterStatus = msg;

      break;
    default:
      Starter.receiveCopyData({ mode, msg });

      break;
  }
}

Starter.updateCount = function () {
  D2Bot.updateCount();
  delay(1000);
  Controls.BattleNet.click();

  let obj = MuleData.read();
  let info = {
    realm: muleInfo.muler.realm,
    account: obj.account,
    password: muleInfo.muler.accountPassword,
  };

  MuleLogger.save(
    Hash.md5(info.realm.toLowerCase() + info.account.toLowerCase()),
    info.password
  );
  ControlAction.loginAccount(info);
  delay(1000);
  Controls.CharSelectExit.click();
};

function locationAction(location, action, extra) {
  let i, obj, info, string, text;

  switch (location) {
    case sdk.game.locations.PreSplash:
    case sdk.game.locations.SplashScreen:
      ControlAction.click();

      break;
    case sdk.game.locations.Lobby:
    case sdk.game.locations.LobbyChat:
      D2Bot.updateStatus("Lobby");

      if (Starter.inGame) {
        print("updating runs");
        D2Bot.updateRuns();
        muleInfo.status = "ready";
        Starter.inGame = false;
      }

      if (extra.makeNext) {
        Controls.LobbyQuit.click();

        break;
      }

      Starter.LocationEvents.openJoinGameWindow();

      break;
    case sdk.game.locations.CreateGame:
      D2Bot.updateStatus("Creating Game");

      // remove level restriction
      Controls.CharacterDifference.disabled === 5 &&
        Controls.CharacterDifferenceButton.click();

      // Max number of players
      Controls.MaxPlayerCount.setText("8");

      delay(2000);

      // FTJ handler
      if (muleInfo.status === "pending") {
        D2Bot.printToConsole("Failed to create game");
        ControlAction.timeoutDelay("FTJ delay", Starter.Config.FTJDelay * 1e3);
        D2Bot.updateRuns();
      }

      ControlAction.createGame(
        extra.muler.muleGameName[0],
        extra.muler.muleGameName[1]
      );
      Mule.ingameTimeout(5000);

      muleInfo.status = "pending";

      break;
    case sdk.game.locations.WaitingInLine:
      Starter.LocationEvents.waitingInLine();

      break;
    case sdk.game.locations.JoinGame:
      D2Bot.updateStatus("Join Game");

      if (muleInfo.status === "pending") {
        D2Bot.printToConsole("Failed to join game");
        ControlAction.timeoutDelay(
          "Join Delay",
          Starter.Config.FTJDelay * 1000
        );
        D2Bot.updateRuns();
      }

      if (!Mule.continuousMule) {
        D2Bot.requestGame(extra.master);
        delay(100);
      }

      delay(2000);

      if (
        Object.keys(Starter.joinInfo).length &&
        Starter.joinInfo.gameName !== "" &&
        Starter.joinInfo.inGame
      ) {
        joinGame(Starter.joinInfo.gameName, Starter.joinInfo.gamePass);
      } else {
        joinGame(extra.muler.muleGameName[0], extra.muler.muleGameName[1]);
      }

      !Starter.firstLogin && (muleInfo.status = "pending");

      Mule.ingameTimeout(5000);
      print("Ingame timeout done.");

      // could not join game
      getLocation() === sdk.game.locations.Lobby &&
        !me.ingame &&
        Controls.CreateGameWindow.click();

      break;
    case sdk.game.locations.Ladder:
    case sdk.game.locations.ChannelList:
      break;
    case sdk.game.locations.MainMenu:
    case sdk.game.locations.Login:
      extra.makeNext && (extra.makeNext = false);

      obj = MuleData.read();

      if (!obj.account || obj.account.indexOf(extra.muler.accountPrefix) < 0) {
        MuleData.nextAccount(extra.muler.accountPrefix);
        obj = MuleData.read();
      }

      info = {
        realm: extra.muler.realm,
        account: obj.account,
        password: extra.muler.accountPassword,
      };

      if (Starter.makeAccount) {
        ControlAction.makeAccount(info);
        D2Bot.printToConsole(
          "Made account: " + info.account,
          sdk.colors.D2Bot.DarkGold
        );
        Starter.makeAccount = false;

        break;
      }

      MuleLogger.save(
        Hash.md5(info.realm.toLowerCase() + info.account.toLowerCase()),
        info.password
      );
      !ControlAction.loginAccount(info) && (Starter.makeAccount = true);

      break;
    case sdk.game.locations.LoginError:
    case sdk.game.locations.InvalidCdKey:
    case sdk.game.locations.CdKeyInUse:
      Starter.LocationEvents.loginError();

      break;
    case sdk.game.locations.LoginUnableToConnect:
    case sdk.game.locations.TcpIpUnableToConnect:
      Starter.LocationEvents.unableToConnect();

      break;
    case sdk.game.locations.RealmDown:
      Starter.LocationEvents.realmDown();

      break;
    case sdk.game.locations.Disconnected:
    case sdk.game.locations.LobbyLostConnection:
      D2Bot.updateStatus("Disconnected/LostConnection");
      delay(1000);
      Controls.OkCentered.click();

      break;
    case sdk.game.locations.CharSelect:
    case sdk.game.locations.NewCharSelected:
    case sdk.game.locations.CharacterCreate:
    case sdk.game.locations.CharSelectNoChars:
      string = "";
      text = Controls.CharSelectError.getText();

      if (text) {
        for (i = 0; i < text.length; i++) {
          string += text[i];

          if (i !== text.length - 1) {
            string += " ";
          }
        }

        if (
          string === getLocaleString(sdk.locale.text.CdKeyDisabledFromRealm)
        ) {
          // CDKey disabled from realm play
          D2Bot.updateStatus("Realm Disabled CDKey");
          D2Bot.printToConsole(
            "Realm Disabled CDKey: " + Starter.gameInfo.mpq,
            sdk.colors.D2Bot.Gold
          );
          D2Bot.CDKeyDisabled();

          if (Starter.gameInfo.switchKeys) {
            ControlAction.timeoutDelay(
              "Key switch delay",
              Starter.Config.SwitchKeyDelay * 1000
            );
            D2Bot.restart(true);
          } else {
            D2Bot.stop(me.profile, true);
          }
        }
      }

      // Single Player screen fix
      // TODO: see if this is still needed. d2bs doesn't load scripts twice anymore
      if (
        getLocation() === sdk.game.locations.CharSelect &&
        !Controls.CharSelectCurrentRealm.control
      ) {
        Controls.CharSelectExit.click();

        break;
      }

      // Can't create character, button greyed out = high likelyhood of realm down
      if (
        getLocation() === sdk.game.locations.CharSelectNoChars &&
        Controls.CharSelectCreate.disabled === sdk.game.controls.Disabled
      ) {
        D2Bot.updateStatus("Realm Down");
        delay(1000);

        if (!Controls.CharSelectExit.click()) {
          break;
        }

        Starter.updateCount();
        ControlAction.timeoutDelay(
          "Realm Down",
          Starter.Config.RealmDownDelay * 6e4
        );
        D2Bot.CDKeyRD();

        if (Starter.gameInfo.switchKeys) {
          D2Bot.printToConsole("Realm Down - Changing CD-Key");
          ControlAction.timeoutDelay(
            "Key switch delay",
            Starter.Config.SwitchKeyDelay * 1000
          );
          D2Bot.restart(true);
        } else {
          D2Bot.restart();
        }
      }

      obj = MuleData.read();
      extra.maxCharCount =
        extra.muler.charsPerAcc > 0 ? Math.min(extra.muler.charsPerAcc, 18) : 8;

      if (extra.makeNext) {
        if (
          obj.fullChars.length >= extra.maxCharCount ||
          (extra.muleMode > 0 && obj.torchChars.length >= extra.maxCharCount)
        ) {
          Controls.CharSelectExit.click();
          MuleData.nextAccount(extra.muler.accountPrefix);

          break;
        }

        extra.makeNext = false;
      }

      if (!obj.character || obj.character.indexOf(extra.muler.charPrefix) < 0) {
        MuleData.nextChar(extra.muler.charPrefix);

        obj = MuleData.read();
      }

      info = {
        account: obj.account,
        charName: obj.character,
        ladder: extra.muler.ladder,
        hardcore: extra.muler.hardcore,
        expansion: extra.muler.expansion,
        charClass: "amazon",
      };

      if (extra.muleMode > 0 && obj.torchChars.includes(info.charName)) {
        MuleData.nextChar(extra.muler.charPrefix);

        break;
      }

      if (ControlAction.findCharacter(info)) {
        ControlAction.loginCharacter(info, false);
      } else {
        // premade account that's already full
        if (ControlAction.getCharacters().length >= extra.maxCharCount) {
          Controls.CharSelectExit.click();
          MuleData.nextAccount(extra.muler.accountPrefix);

          break;
        }

        if (!ControlAction.makeCharacter(info)) {
          // TODO: check if acc is full and cancel location 15 and 29 if true
          MuleData.nextChar(extra.muler.charPrefix);

          break;
        }

        D2Bot.printToConsole(
          "Made character: " + info.charName,
          sdk.colors.D2Bot.DarkGold
        );
      }

      break;
    case sdk.game.locations.CharSelectPleaseWait:
      !Starter.locationTimeout(
        Starter.Config.PleaseWaitTimeout * 1e3,
        location
      ) && Controls.OkCentered.click();

      break;
    case sdk.game.locations.SelectDifficultySP:
      break;
    case sdk.game.locations.MainMenuConnecting:
      !Starter.locationTimeout(
        Starter.Config.ConnectingTimeout * 1e3,
        location
      ) && Controls.LoginCancelWait.click();

      break;
    case sdk.game.locations.CharSelectConnecting:
      Starter.LocationEvents.charSelectError();

      break;
    case sdk.game.locations.LobbyPleaseWait:
      !Starter.locationTimeout(
        Starter.Config.PleaseWaitTimeout * 1e3,
        location
      ) && Controls.OkCentered.click();

      break;
    case sdk.game.locations.GameNameExists:
      Controls.JoinGameWindow.click();

      break;
    case sdk.game.locations.GatewaySelect:
      Controls.GatewayCancel.click();

      break;
    case sdk.game.locations.GameDoesNotExist:
      Controls.CreateGameWindow.click();

      break;
    case sdk.game.locations.OkCenteredErrorPopUp:
      Controls.OkCentered.click();
      Controls.CharSelectExit.click();

      break;
    case sdk.game.locations.ServerDown:
    case sdk.game.locations.GameIsFull:
      break;
    case sdk.game.locations.OtherMultiplayer:
      // probably should implement way to use open-bnet
      Controls.OtherMultiplayerCancel.click();

      break;
    case sdk.game.locations.TcpIp:
    case sdk.game.locations.TcpIpEnterIp:
      Controls.TcpIpCancel.click();

      break;
    default:
      if (location !== undefined) {
        D2Bot.printToConsole("Unhandled location " + location);
        delay(500);
        D2Bot.restart();
      }

      break;
  }
}

function gameEvent(mode, param1, param2, name1, name2) {
  if (!me.ingame || !me.gameReady || !me.name) {
    return;
  }

  switch (mode) {
    case 0x00: // "%Name1(%Name2) dropped due to time out."
    case 0x01: // "%Name1(%Name2) dropped due to errors."
    case 0x03: // "%Name1(%Name2) left our world. Diablo's minions weaken."
      print("Waiting");
      muleInfo.status = "ready";

      break;
    case 0x02: // "%Name1(%Name2) joined our world. Diablo's minions grow stronger."
      if (name1.trim() !== me.name.trim()) {
        print("begin");
        muleInfo.status = "begin";
      }

      break;
  }
}

function main() {
  addEventListener("copydata", receiveCopyData);

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

  if (Starter.gameInfo.rdBlocker) {
    D2Bot.printToConsole(
      "You must disable RD Blocker for Mule Logger to work properly. Stopping."
    );
    D2Bot.stop(me.profile, true);

    return;
  }

  D2Bot.updateRuns(); // we need the mule to swap keys somehow after all
  delay(1000);

  Mule.continuousMule = AutoMule.isContinousMule();

  if (Mule.continuousMule) {
    muleInfo.muleMode = AutoMule.getMuleMode();
    muleInfo.muler = AutoMule.getMuleObject(muleInfo.muleMode, "", true);
    muleFilename = AutoMule.getMuleFilename(muleInfo.muleMode, "", true);
    addEventListener("gameevent", gameEvent);
  } else {
    // Wait for master before login = give room to determine muling mode (normal or torch)
    while (!muleInfo.master) {
      delay(100);
    }

    print("Master found: " + muleInfo.master);

    muleInfo.muler = AutoMule.getMuleObject(muleInfo.muleMode, muleInfo.master);
    muleFilename = AutoMule.getMuleFilename(muleInfo.muleMode, muleInfo.master);
  }

  print("Mule filename: " + muleFilename);

  let obj,
    tick,
    statusString = "";

  try {
    // ugly solution to uglier problem - pickItem area update
    !FileTools.exists("data/" + me.profile + ".json") && DataFile.create();

    // create mule datafile if it doesn't exist
    !FileTools.exists(muleFilename) && MuleData.create();

    obj = MuleData.read();
    obj.account &&
      obj.account.indexOf(muleInfo.muler.accountPrefix) < 0 &&
      MuleData.create();
  } catch (e) {
    console.warn("Caught exception creating data files.");
    console.error(e);
    D2Bot.printToConsole(
      "DataFileException: " +
        e.message +
        " (" +
        e.fileName.substring(
          e.fileName.lastIndexOf("\\") + 1,
          e.fileName.length
        ) +
        " #" +
        e.lineNumber +
        ")"
    );
  }

  while (true) {
    try {
      if (me.ingame && me.gameReady) {
        if (!Starter.inGame) {
          Starter.firstLogin && (Starter.firstLogin = false);
          muleInfo.status !== "begin" && (muleInfo.status = "ready");
          statusString =
            "In " +
            (muleInfo.muleMode === 2
              ? "anni "
              : muleInfo.muleMode === 1
              ? "torch "
              : "") +
            "mule game.";

          D2Bot.updateStatus(statusString + " Status: " + muleInfo.status);
          D2Bot.printToConsole(statusString, sdk.colors.D2Bot.DarkGold);
          tick = getTickCount();

          // iomars. first! if used me in D2BotXXX.js;
          me.updatePlayerGid();

          while (
            (getLocation() !== null || !me.area) &&
            getTickCount() - tick < 5000
          ) {
            delay(200);
          }

          Town.goToTown(1);
          Town.move("stash");

          // Move away from stash so we don't block muler
          let coord = CollMap.getRandCoordinate(me.x, -6, 6, me.y, -6, 6);
          !!coord &&
            Attack.validSpot(coord.x, coord.y) &&
            Pather.moveTo(coord.x, coord.y);

          Storage.init();
          checkOnJoin && (muleInfo.status = "begin");
          Starter.inGame = true;
          Mule.continuousMule &&
            !muleInfo.muler.onlyLogWhenFull &&
            MuleLogger.logChar();
        }

        if (!Mule.continuousMule) {
          console.log("Waiting for muler");
          tick = getTickCount();

          while (getTickCount() - tick < Time.minutes(1)) {
            if (muleInfo.status === "begin") {
              break;
            }

            delay(100);
          }

          if (muleInfo.status !== "begin") {
            D2Bot.printToConsole(
              "Nobody joined - stopping.",
              sdk.colors.D2Bot.Red
            );
            D2Bot.stop(me.profile, true);
          }

          me.overhead("begin");
        }

        D2Bot.updateStatus(statusString + Starter.timer(me.gamestarttime));

        if (muleInfo.status === "begin") {
          switch (Mule.pickItems()) {
            // done picking, tell the master to leave game and kill mule profile
            case "done":
              !muleInfo.muler.onlyLogWhenFull && MuleLogger.logChar();

              obj = MuleData.read();

              if (
                Mule.checkAnniTorch() &&
                obj.torchChars.indexOf(me.name) === -1
              ) {
                obj.torchChars.push(me.name);
              }

              MuleData.write(obj);
              D2Bot.printToConsole("Done muling.", sdk.colors.D2Bot.DarkGold);
              sendCopyData(
                null,
                muleInfo.master,
                10,
                JSON.stringify({ status: "quit" })
              );
              D2Bot.stop(me.profile, true);

              return;
            // can't fit more items, get to next character or account
            case "next":
              MuleLogger.logChar();
              delay(500);

              [muleInfo.makeNext, checkOnJoin] = [true, true];
              obj = MuleData.read();

              if (
                Mule.checkAnniTorch() &&
                obj.torchChars.indexOf(me.name) === -1
              ) {
                obj.torchChars.push(me.name);
              }

              obj.fullChars.push(me.name);
              MuleData.write(obj);
              MuleData.nextChar(muleInfo.muler.charPrefix);
              D2Bot.printToConsole(
                "Mule full, getting next character.",
                sdk.colors.D2Bot.DarkGold
              );

              if (
                Starter.Config.MinGameTime &&
                getTickCount() - tick < Starter.Config.MinGameTime * 1000
              ) {
                while (
                  getTickCount() - tick <
                  Starter.Config.MinGameTime * 1000
                ) {
                  me.overhead(
                    "Stalling for \xFFc2" +
                      Math.round(
                        (tick +
                          Starter.Config.MinGameTime * 1000 -
                          getTickCount()) /
                          1000
                      ) +
                      "\xFFc0 Seconds"
                  );
                  delay(1000);
                }
              }

              Mule.quit();

              // TODO: see whether a for loop is better
              while (me.ingame) {
                delay(100);
              }

              break;
            case "fail":
              // Try again
              break;
          }
        }

        if (Mule.continuousMule && Starter.Config.MaxGameTime > 0) {
          if (
            getTickCount() - me.gamestarttime >
              Time.minutes(Starter.Config.MaxGameTime) &&
            Mule.foreverAlone()
          ) {
            Mule.gameRefresh();
          }
        }
      }

      if (!me.ingame) {
        delay(1000);
        // ControlAction.locationAction(
        //   getLocation(),
        //   sdk.game.action.mule,
        //   muleInfo
        // );
        locationAction(getLocation(), sdk.game.action.mule, muleInfo);
      }
    } catch (e2) {
      console.warn("Caught an exception in the main loop.");
      console.error(e2);
      D2Bot.printToConsole(
        "MainLoopException: " + e2.message + " (" + e2.stack + ")"
      );
    }

    delay(100);
  }
}

try {
  main();
} catch (error) {
  console.error(error);
}
