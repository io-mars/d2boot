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
  Hash,
  createGame,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Starter, D2Bot, DataFile, ControlAction } from "@/OOG.js";
import { MuleLogger } from "@/MuleLogger.js";
import Controls from "@/modules/Control.js";

// D2BotMuleLog specific settings - for global settings see libs/StarterConfig.js
Starter.Config.MinGameTime = rand(5, 10); // Minimum game length in seconds. If a game is ended too soon, the rest of the time is waited in the lobby
Starter.Config.CreateGameDelay = 5; // Seconds to wait before creating a new game
Starter.Config.SwitchKeyDelay = 0; // Seconds to wait before switching a used/banned key or after realm down

// Override default values for StarterConfig under here by following format
// Starter.Config.ValueToChange = value; // Example: Starter.Config.MinGameTime = 500; // changes MinGameTime to 500 seconds

if (!FileTools.exists("data/" + me.profile + ".json")) {
  DataFile.create();
}

// a object for pass by reference
const muleInfo = { charList: [], accounts: [], chars: [] };

function parseInfo() {
  for (let i in MuleLogger.LogAccounts) {
    if (MuleLogger.LogAccounts.hasOwnProperty(i) && typeof i === "string") {
      muleInfo.accounts.push(i);
      muleInfo.chars.push(MuleLogger.LogAccounts[i]);
    }
  }
}

function initEvent() {
  ControlAction.actionEvent[sdk.game.locations.MainMenu] = function () {
    if (!muleInfo.accounts.length) {
      MuleLogger.remove();
      D2Bot.printToConsole("Done logging mules!");
      D2Bot.stop();

      return;
    }

    let obj = {};

    if (FileTools.exists("logs/MuleLog.json")) {
      obj = JSON.parse(FileTools.readText("logs/MuleLog.json"));

      if (obj.currAcc) {
        for (let i = 0; i < muleInfo.accounts.length; i += 1) {
          if (muleInfo.accounts[i].split("/")[0] === obj.currAcc) {
            muleInfo.accounts.splice(0, i);
            muleInfo.chars.splice(0, i);
            i -= 1;

            break;
          }
        }
      }
    }

    let currAcc = muleInfo.accounts[0];
    currAcc = currAcc.split("/");
    muleInfo.charList = muleInfo.chars[0];
    obj.currAcc = currAcc[0];

    print("\xFFc4Mule Logger\xFFc2: Login account: " + currAcc[0]);
    MuleLogger.save(
      Hash.md5(currAcc[2].toLowerCase() + currAcc[0].toLowerCase()),
      currAcc[1]
    );

    if (
      ControlAction.loginAccount({
        account: currAcc[0],
        password: currAcc[1],
        realm: currAcc[2],
      })
    ) {
      muleInfo.accounts.shift(); // remove current account from the list
    }
  };

  ControlAction.actionEvent[sdk.game.locations.Login] = function () {
    ControlAction.actionEvent[sdk.game.locations.MainMenu]();
  };
  ControlAction.actionEvent[sdk.game.locations.SplashScreen] = function () {
    ControlAction.actionEvent[sdk.game.locations.MainMenu]();
  };

  ControlAction.actionEvent[sdk.game.locations.Lobby] = function () {
    D2Bot.updateStatus("Lobby");

    if (Starter.inGame) {
      if (
        getTickCount() - Starter.gameStart <
        Starter.Config.MinGameTime * 1e3
      ) {
        ControlAction.timeoutDelay(
          "Min game time wait",
          Starter.Config.MinGameTime * 1e3 + Starter.gameStart - getTickCount()
        );
      }

      print("updating runs");
      D2Bot.updateRuns();
      delay(1000);

      Starter.gameCount += 1;
      Starter.lastGameStatus = "ready";
      Starter.inGame = false;
      Controls.LobbyQuit.click();

      return;
    }

    Starter.LocationEvents.openCreateGameWindow();
  };

  ControlAction.actionEvent[sdk.game.locations.LobbyChat] = function () {
    ControlAction.actionEvent[sdk.game.locations.Lobby]();
  };

  ControlAction.actionEvent[sdk.game.locations.CreateGame] = function () {
    D2Bot.updateStatus("Creating Game");

    // remove level restriction
    Controls.CharacterDifference.disabled === 5 &&
      Controls.CharacterDifferenceButton.click();

    // Max number of players
    Controls.MaxPlayerCount.setText("8");

    if (Starter.gameCount >= 99) {
      Starter.gameCount = 1;

      DataFile.updateStats("runs", Starter.gameCount);
    }

    if (Starter.lastGameStatus === "pending") {
      D2Bot.printToConsole("Failed to create game");

      Starter.gameCount += 1;
    }

    ControlAction.timeoutDelay(
      "Make Game Delay",
      Starter.Config.CreateGameDelay * 1e3
    );
    createGame(
      MuleLogger.LogGame[0] + Starter.gameCount,
      MuleLogger.LogGame[1],
      0
    );
    Starter.locationTimeout(5000, sdk.game.locations.CreateGame);
    Starter.lastGameStatus = "pending";
  };

  ControlAction.actionEvent[sdk.game.locations.CharSelect] = function () {
    // Single Player screen fix
    if (
      getLocation() === sdk.game.locations.CharSelect &&
      !Controls.CharSelectCurrentRealm.control &&
      Controls.CharSelectExit.click()
    ) {
      return;
    }

    if (!muleInfo.charList.length && Controls.CharSelectExit.click()) {
      return;
    }

    muleInfo.charList[0] === "all" &&
      (muleInfo.charList = ControlAction.getCharacters());

    let obj = {};

    if (FileTools.exists("logs/MuleLog.json")) {
      obj = JSON.parse(FileTools.readText("logs/MuleLog.json"));

      if (obj.currChar) {
        for (let i = 0; i < muleInfo.charList.length; i += 1) {
          if (muleInfo.charList[i] === obj.currChar) {
            // Remove the previous currChar as well
            muleInfo.charList.splice(0, i + 1);

            break;
          }
        }
      }
    }

    // last char in acc = trigger next acc
    if (!muleInfo.charList.length) {
      print("No more characters");
      muleInfo.accounts.shift(); // remove current account from the list
      muleInfo.chars.shift();

      return;
    }

    let currChar = muleInfo.charList.shift();
    obj.currChar = currChar;

    print("\xFFc4Mule Logger\xFFc2: Login character: " + currChar);
    FileTools.writeText("logs/MuleLog.json", JSON.stringify(obj));

    if (MuleLogger.AutoPerm) {
      let characterStatus = {
        charname: currChar,
        perm: ControlAction.getPermStatus({ charName: currChar }),
      };
      MuleLogger.savePermedStatus(characterStatus);
    }

    ControlAction.loginCharacter({ charName: currChar });
  };
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

  Starter.gameMode = sdk.game.action.Create;
  Starter.gameCount = DataFile.getStats().runs + 1 || 1;

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

  initEvent();

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

    ControlAction.locationAction();

    delay(1000);
  }
}

try {
  main();
} catch (error) {
  console.error(error);
}
