import {
  me,
  delay,
  getTickCount,
  FileTools,
  sendCopyData,
  getLocation,
  Profile,
  getLocaleString,
  login,
  scriptBroadcast,
  hideConsole,
  getControl,
  sendKey,
  print,
  rand,
  say,
} from "boot";
import { sdk } from "./modules/sdk.js";
import { Misc } from "./common/Misc.js";
import { Pather } from "./common/Pather.js";
import Controls from "./modules/Control.js";
import { AutoMule } from "./AutoMule.js";
import { Gambling } from "./Gambling.js";
import { TorchSystem } from "./TorchSystem.js";
import { CraftingSystem } from "./CraftingSystem.js";
import { AdvancedConfig, JoinSettings } from "./config/_StarterConfig.js";

export const Starter = {
  Config: {},
  useChat: false,
  pingQuit: false,
  inGame: false,
  firstLogin: true,
  firstRun: false,
  isUp: "no",
  loginRetry: 0,
  deadCheck: false,
  chatActionsDone: false,
  gameStart: 0,
  gameCount: 0,
  lastGameStatus: "ready",
  handle: undefined,
  connectFail: false,
  connectFailRetry: 0,
  makeAccount: false,
  channelNotify: false,
  chanInfo: {
    joinChannel: "",
    firstMsg: "",
    afterMsg: "",
    announce: false,
  },
  gameMode: 0,
  lastGameTick: 0,
  lastGame: [],
  leader: [],
  announced: false,
  gameInfo: {},
  joinInfo: {},
  profileInfo: {},

  sayMsg(string) {
    if (!this.useChat) return;
    say(string);
  },

  timer(tick) {
    return (
      " (" + new Date(getTickCount() - tick).toISOString().slice(11, -5) + ")"
    );
  },

  locationTimeout(time, location) {
    let endtime = getTickCount() + time;

    while (
      !me.ingame &&
      getLocation() === location &&
      endtime > getTickCount()
    ) {
      delay(500);
    }

    return getLocation() !== location;
  },

  setNextGame(gameInfo = {}) {
    let nextGame = gameInfo.gameName || this.randomString(null, true);

    if (
      this.gameCount + 1 >= Starter.Config.ResetCount ||
      nextGame.length + this.gameCount + 1 > 15
    ) {
      nextGame += "1";
    } else {
      nextGame += this.gameCount + 1;
    }

    DataFile.updateStats("nextGame", nextGame);
  },

  updateCount() {
    D2Bot.updateCount();
    delay(1000);
    Controls.BattleNet.click();

    try {
      login(me.profile);
    } catch (e) {
      return;
    }

    delay(1000);
    Controls.CharSelectExit.click();
  },

  scriptMsgEvent(msg) {
    if (msg && typeof msg !== "string") return;
    switch (msg) {
      case "mule":
        AutoMule.check = true;

        break;
      case "muleTorch":
        AutoMule.torchAnniCheck = 1;

        break;
      case "muleAnni":
        AutoMule.torchAnniCheck = 2;

        break;
      case "torch":
        TorchSystem.check = true;

        break;
      case "crafting":
        CraftingSystem.check = true;

        break;
      case "getMuleMode":
        if (AutoMule.torchAnniCheck === 2) {
          scriptBroadcast("2");
        } else if (AutoMule.torchAnniCheck === 1) {
          scriptBroadcast("1");
        } else if (AutoMule.check) {
          scriptBroadcast("0");
        }

        break;
      case "pingquit":
        this.pingQuit = true;

        break;
    }
  },

  receiveCopyData({ mode, msg }) {
    msg === "Handle" && typeof mode === "number" && (Starter.handle = mode);

    switch (mode) {
      case sdk.oog.message.JoinMe: // JoinInfo
        // obj = JSON.parse(msg);
        // Object.assign(Starter.joinInfo, obj);
        Object.assign(Starter.joinInfo, msg);

        break;
      case sdk.oog.message.GameInfo: // Game info
        print("Recieved Game Info");
        // obj = JSON.parse(msg);
        // Object.assign(Starter.gameInfo, obj);
        Object.assign(Starter.gameInfo, msg);

        break;
      case sdk.oog.message.RequestGame: // Game request
        // Don't let others join mule/torch/key/gold drop game
        if (
          AutoMule.inGame ||
          Gambling.inGame ||
          TorchSystem.inGame ||
          CraftingSystem.inGame
        ) {
          break;
        }

        if (Object.keys(Starter.gameInfo).length) {
          // obj = JSON.parse(msg);

          if (
            [
              sdk.game.profiletype.TcpIpHost,
              sdk.game.profiletype.TcpIpJoin,
            ].includes(new Profile().type)
          ) {
            me.gameReady &&
              D2Bot.joinMe(
                msg.profile,
                me.gameserverip.toString(),
                "",
                "",
                Starter.isUp
              );
          } else {
            if (me.gameReady) {
              D2Bot.joinMe(
                msg.profile,
                me.gamename.toLowerCase(),
                "",
                me.gamepassword.toLowerCase(),
                Starter.isUp
              );
            } else {
              D2Bot.joinMe(
                msg.profile,
                Starter.gameInfo.gameName.toLowerCase(),
                Starter.gameCount,
                Starter.gameInfo.gamePass.toLowerCase(),
                Starter.isUp
              );
            }
          }
        }
        break;
      case sdk.oog.message.Pingreq: // Heartbeat ping
        msg === "pingreq" &&
          sendCopyData(
            null,
            me.windowtitle,
            sdk.oog.message.Pingreq,
            "pingrep"
          );

        break;
      case sdk.oog.message.CrashInfo: // Cached info retreival
        msg !== "null" && (Starter.gameInfo.crashInfo = JSON.parse(msg));

        break;
      case sdk.oog.message.GetProfile: // getProfile
        try {
          // obj = JSON.parse(msg);
          Starter.profileInfo.profile = me.profile;
          Starter.profileInfo.account = msg.account;
          Starter.profileInfo.charName = msg.Character;
          msg.Realm = msg.Realm.toLowerCase();
          Starter.profileInfo.realm = ["east", "west"].includes(msg.Realm)
            ? "us" + msg.Realm
            : msg.Realm;
        } catch (e) {
          print(e);
        }

        break;
    }
  },

  randomString(len, useNumbers = false) {
    !len && (len = rand(5, 14));

    let rval = "";
    let letters = useNumbers
      ? "abcdefghijklmnopqrstuvwxyz0123456789"
      : "abcdefghijklmnopqrstuvwxyz";

    for (let i = 0; i < len; i += 1) {
      rval += letters[rand(0, letters.length - 1)];
    }

    return rval;
  },

  randomNumberString(len) {
    !len && (len = rand(2, 5));

    let rval = "";
    let vals = "0123456789";

    for (let i = 0; i < len; i += 1) {
      rval += vals[rand(0, vals.length - 1)];
    }

    return rval;
  },

  LocationEvents: {
    selectDifficultySP() {
      let diff = Starter.gameInfo.difficulty || "Highest";
      diff === "Highest" && (diff = "Hell"); // starts from top with fall-through to select highest

      switch (diff) {
        case "Hell":
          if (
            Controls.HellSP.click() &&
            Starter.locationTimeout(1e3, sdk.game.locations.SelectDifficultySP)
          ) {
            break;
          }
        // eslint-disable-next-line no-fallthrough
        case "Nightmare":
          if (
            Controls.NightmareSP.click() &&
            Starter.locationTimeout(1e3, sdk.game.locations.SelectDifficultySP)
          ) {
            break;
          }
        // eslint-disable-next-line no-fallthrough
        case "Normal":
          Controls.NormalSP.click();

          break;
      }
      return Starter.locationTimeout(
        5e3,
        sdk.game.locations.SelectDifficultySP
      );
    },

    loginError() {
      let cdkeyError = false;
      let defaultPrint = true;
      let string = "";
      let text =
        Controls.LoginErrorText.getText() ||
        Controls.LoginInvalidCdKey.getText();

      if (text) {
        for (let i = 0; i < text.length; i += 1) {
          string += text[i];
          i !== text.length - 1 && (string += " ");
        }

        switch (string) {
          case getLocaleString(sdk.locale.text.UsenameIncludedIllegalChars):
          case getLocaleString(sdk.locale.text.UsenameIncludedDisallowedwords):
          case getLocaleString(sdk.locale.text.UsernameMustBeAtLeast):
          case getLocaleString(sdk.locale.text.PasswordMustBeAtLeast):
          case getLocaleString(sdk.locale.text.AccountMustBeAtLeast):
          case getLocaleString(sdk.locale.text.PasswordCantBeMoreThan):
          case getLocaleString(sdk.locale.text.AccountCantBeMoreThan):
            D2Bot.printToConsole(string);
            D2Bot.stop();

            break;
          case getLocaleString(sdk.locale.text.InvalidPassword):
            D2Bot.printToConsole("Invalid Password");
            ControlAction.timeoutDelay(
              "Invalid password delay",
              Starter.Config.InvalidPasswordDelay * 6e4
            );
            D2Bot.printToConsole("Invalid Password - Restart");
            D2Bot.restart();

            break;
          case getLocaleString(sdk.locale.text.AccountDoesNotExist):
            if (!!Starter.Config.MakeAccountOnFailure) {
              Starter.makeAccount = true;
              Controls.LoginErrorOk.click();

              return;
            } else {
              D2Bot.printToConsole(string);
              D2Bot.updateStatus(string);
            }

            break;
          case getLocaleString(sdk.locale.text.AccountIsCorrupted):
          case getLocaleString(sdk.locale.text.UnableToCreateAccount):
            D2Bot.printToConsole(string);
            D2Bot.updateStatus(string);

            break;
          case getLocaleString(sdk.locale.text.Disconnected):
            D2Bot.updateStatus("Disconnected");
            D2Bot.printToConsole("Disconnected");
            Controls.OkCentered.click();
            Controls.LoginErrorOk.click();

            return;
          case getLocaleString(sdk.locale.text.CdKeyIntendedForAnotherProduct):
          case getLocaleString(sdk.locale.text.LoDKeyIntendedForAnotherProduct):
          case getLocaleString(sdk.locale.text.CdKeyDisabled):
          case getLocaleString(sdk.locale.text.LoDKeyDisabled):
            cdkeyError = true;

            break;
          case getLocaleString(sdk.locale.text.CdKeyInUseBy):
            string += " " + Controls.LoginCdKeyInUseBy.getText();
            D2Bot.printToConsole(
              Starter.gameInfo.mpq + " " + string,
              sdk.colors.D2Bot.Gold
            );
            D2Bot.CDKeyInUse();

            if (Starter.gameInfo.switchKeys) {
              cdkeyError = true;
            } else {
              Controls.UnableToConnectOk.click();
              ControlAction.timeoutDelay(
                "LoD key in use",
                Starter.Config.CDKeyInUseDelay * 6e4
              );

              return;
            }

            break;
          case getLocaleString(sdk.locale.text.LoginError):
          case getLocaleString(sdk.locale.text.OnlyOneInstanceAtATime):
            Controls.LoginErrorOk.click();
            Controls.LoginExit.click();
            D2Bot.printToConsole(string);
            ControlAction.timeoutDelay("Login Error Delay", 5 * 6e4);
            D2Bot.printToConsole("Login Error - Restart");
            D2Bot.restart();

            break;
          default:
            D2Bot.updateStatus("Login Error");
            D2Bot.printToConsole("Login Error - " + string);
            cdkeyError = true;
            defaultPrint = false;

            break;
        }

        if (cdkeyError) {
          defaultPrint &&
            D2Bot.printToConsole(
              string + Starter.gameInfo.mpq,
              sdk.colors.D2Bot.Gold
            );
          defaultPrint && D2Bot.updateStatus(string);
          D2Bot.CDKeyDisabled();
          if (Starter.gameInfo.switchKeys) {
            ControlAction.timeoutDelay(
              "Key switch delay",
              Starter.Config.SwitchKeyDelay * 1000
            );
            D2Bot.restart(true);
          } else {
            D2Bot.stop();
          }
        }

        Controls.LoginErrorOk.click();
        delay(1000);
        Controls.CharSelectExit.click();

        while (true) {
          delay(1000);
        }
      }
    },

    charSelectError() {
      let string = "";
      let text = Controls.CharSelectError.getText();
      let currentLoc = getLocation();

      if (text) {
        for (let i = 0; i < text.length; i += 1) {
          string += text[i];
          i !== text.length - 1 && (string += " ");
        }

        if (
          string === getLocaleString(sdk.locale.text.CdKeyDisabledFromRealm)
        ) {
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
            D2Bot.stop();
          }
        }
      }

      if (
        !Starter.locationTimeout(
          Starter.Config.ConnectingTimeout * 1e3,
          currentLoc
        )
      ) {
        // Click create char button on infinite "connecting" screen
        Controls.CharSelectCreate.click();
        delay(1000);

        Controls.CharSelectExit.click();
        delay(1000);

        if (getLocation() !== sdk.game.locations.CharSelectConnecting)
          return true;

        Controls.CharSelectExit.click();
        Starter.gameInfo.rdBlocker && D2Bot.restart();

        return false;
      }

      return true;
    },

    realmDown() {
      D2Bot.updateStatus("Realm Down");
      delay(1000);

      if (!Controls.CharSelectExit.click()) return;

      Starter.updateCount();
      ControlAction.timeoutDelay(
        "Realm Down",
        Starter.Config.RealmDownDelay * 6e4
      );
      D2Bot.CDKeyRD();

      if (Starter.gameInfo.switchKeys && !Starter.gameInfo.rdBlocker) {
        D2Bot.printToConsole("Realm Down - Changing CD-Key");
        ControlAction.timeoutDelay(
          "Key switch delay",
          Starter.Config.SwitchKeyDelay * 1000
        );
        D2Bot.restart(true);
      } else {
        D2Bot.printToConsole("Realm Down - Restart");
        D2Bot.restart();
      }
    },

    waitingInLine() {
      let queue = ControlAction.getQueueTime();
      let currentLoc = getLocation();

      if (queue > 0) {
        switch (true) {
          case queue < 10000:
            D2Bot.updateStatus("Waiting line... Queue: " + queue);

            // If stuck here for too long, game creation likely failed. Exit to char selection and try again.
            if (queue < 10) {
              if (
                !Starter.locationTimeout(
                  Starter.Config.WaitInLineTimeout * 1e3,
                  currentLoc
                )
              ) {
                print("Failed to create game");
                Controls.CancelCreateGame.click();
                Controls.LobbyQuit.click();
                delay(1000);
              }
            }

            break;
          case queue > 10000:
            if (Starter.Config.WaitOutQueueRestriction) {
              D2Bot.updateStatus("Waiting out Queue restriction: " + queue);
            } else {
              print("Restricted... Queue: " + queue);
              D2Bot.printToConsole(
                "Restricted... Queue: " + queue,
                sdk.colors.D2Bot.Red
              );
              Controls.CancelCreateGame.click();

              if (Starter.Config.WaitOutQueueExitToMenu) {
                Controls.LobbyQuit.click();
                delay(1000);
                Controls.CharSelectExit.click();
              }

              // Wait out each queue as 1 sec and add extra 10 min
              ControlAction.timeoutDelay("Restricted", (queue + 600) * 1000);
            }

            break;
        }
      }
    },

    gameDoesNotExist() {
      let currentLoc = getLocation();
      console.log("Game doesn't exist");

      if (Starter.gameInfo.rdBlocker) {
        D2Bot.printToConsole(
          Starter.gameInfo.mpq + " is probably flagged.",
          sdk.colors.D2Bot.Gold
        );

        if (Starter.gameInfo.switchKeys) {
          ControlAction.timeoutDelay(
            "Key switch delay",
            Starter.Config.SwitchKeyDelay * 1000
          );
          D2Bot.restart(true);
        }
      } else {
        Starter.locationTimeout(
          Starter.Config.GameDoesNotExistTimeout * 1e3,
          currentLoc
        );
      }

      Starter.lastGameStatus = "ready";
    },

    unableToConnect() {
      let currentLoc = getLocation();

      if (getLocation() === sdk.game.locations.TcpIpUnableToConnect) {
        D2Bot.updateStatus("Unable To Connect TCP/IP");
        Starter.connectFail &&
          ControlAction.timeoutDelay(
            "Unable to Connect",
            Starter.Config.TCPIPNoHostDelay * 1e3
          );
        Controls.OkCentered.click();
        Starter.connectFail = !Starter.connectFail;
      } else {
        D2Bot.updateStatus("Unable To Connect");

        if (Starter.connectFailRetry < 2) {
          Starter.connectFailRetry++;
          Controls.UnableToConnectOk.click();

          return;
        }

        Starter.connectFailRetry >= 2 && (Starter.connectFail = true);

        if (Starter.connectFail && !Starter.locationTimeout(10e4, currentLoc)) {
          let string = "";
          let text = Controls.LoginUnableToConnect.getText();

          if (text) {
            for (let i = 0; i < text.length; i++) {
              string += text[i];
              i !== text.length - 1 && (string += " ");
            }
          }

          switch (string) {
            case getLocaleString(sdk.locale.text.UnableToIndentifyVersion):
              Controls.UnableToConnectOk.click();
              ControlAction.timeoutDelay(
                "Version error",
                Starter.Config.VersionErrorDelay * 1000
              );

              break;
            default: // Regular UTC and everything else
              Controls.UnableToConnectOk.click();
              ControlAction.timeoutDelay(
                "Unable to Connect",
                Starter.Config.UnableToConnectDelay * 1000 * 60
              );

              break;
          }

          Starter.connectFail = false;
        }

        if (!Controls.UnableToConnectOk.click()) {
          return;
        }

        Starter.connectFail = true;
        Starter.connectFailRetry = 0;
      }
    },

    openCreateGameWindow() {
      let currentLoc = getLocation();

      if (!Controls.CreateGameWindow.click()) {
        return true;
      }

      // dead HardCore character
      if (
        Controls.CreateGameWindow.control &&
        Controls.CreateGameWindow.disabled === sdk.game.controls.Disabled
      ) {
        if (Starter.Config.StopOnDeadHardcore) {
          D2Bot.printToConsole(
            new Profile().character +
              " has died. They shall be remembered...maybe. Shutting down, better luck next time",
            sdk.colors.D2Bot.Gold
          );
          D2Bot.stop();
        } else {
          D2Bot.printToConsole(
            new Profile().character +
              " has died. They shall be remembered...maybe. Better luck next time",
            sdk.colors.D2Bot.Gold
          );
          D2Bot.updateStatus(
            new Profile().character +
              " has died. They shall be remembered...maybe. Better luck next time"
          );
          Starter.deadCheck = true;
          Controls.LobbyQuit.click();
        }

        return false;
      }

      // in case create button gets bugged
      if (!Starter.locationTimeout(5000, currentLoc)) {
        if (!Controls.CreateGameWindow.click()) {
          return true;
        }

        if (!Controls.JoinGameWindow.click()) {
          return true;
        }
      }

      return getLocation() === sdk.game.locations.CreateGame;
    },

    openJoinGameWindow() {
      let currentLoc = getLocation();

      if (!Controls.JoinGameWindow.click()) {
        return;
      }

      // in case create button gets bugged
      if (!Starter.locationTimeout(5000, currentLoc)) {
        if (!Controls.CreateGameWindow.click()) {
          return;
        }

        if (!Controls.JoinGameWindow.click()) {
          return;
        }
      }
    },

    login(otherMultiCheck = false) {
      Starter.inGame && (Starter.inGame = false);
      if (
        otherMultiCheck &&
        [sdk.game.gametype.SinglePlayer, sdk.game.gametype.BattleNet].indexOf(
          new Profile().type
        ) === -1
      ) {
        return ControlAction.loginOtherMultiplayer();
      }

      if (getLocation() === sdk.game.locations.MainMenu) {
        if (
          new Profile().type === sdk.game.profiletype.SinglePlayer &&
          Starter.firstRun &&
          Controls.SinglePlayer.click()
        ) {
          return true;
        }
      }

      // Wrong char select screen fix
      if (getLocation() === sdk.game.locations.CharSelect) {
        hideConsole(); // seems to fix odd crash with single-player characters if the console is open to type in
        if (
          (new Profile().type === sdk.game.profiletype.Battlenet &&
            !Controls.CharSelectCurrentRealm.control) ||
          (new Profile().type !== sdk.game.profiletype.Battlenet &&
            Controls.CharSelectCurrentRealm.control)
        ) {
          Controls.CharSelectExit.click();

          return false;
        }
      }

      // Multiple realm botting fix in case of R/D or disconnect
      Starter.firstLogin &&
        getLocation() === sdk.game.locations.Login &&
        Controls.CharSelectExit.click();

      D2Bot.updateStatus("Logging In");

      try {
        login(me.profile);
      } catch (e) {
        if (
          getLocation() === sdk.game.locations.CharSelect &&
          Starter.loginRetry < 2
        ) {
          if (!ControlAction.findCharacter(Starter.profileInfo)) {
            // dead hardcore character on sp
            if (getLocation() === sdk.game.locations.OkCenteredErrorPopUp) {
              // Exit from that pop-up
              Controls.OkCentered.click();
              D2Bot.printToConsole("Character died", sdk.colors.D2Bot.Red);
              D2Bot.stop();
            } else {
              Starter.loginRetry++;
            }
          } else {
            login(me.profile);
          }
        } else if (
          getLocation() === sdk.game.locations.TcpIpEnterIp &&
          new Profile().type === sdk.game.profiletype.TcpIpJoin
        ) {
          return true; // handled in its own case
        } else {
          print(e + " " + getLocation());
        }
      }

      return true;
    },

    otherMultiplayerSelect() {
      if (
        [
          sdk.game.profiletype.TcpIpHost,
          sdk.game.profiletype.TcpIpJoin,
        ].includes(new Profile().type)
      ) {
        Controls.TcpIp.click() &&
          (new Profile().type === sdk.game.profiletype.TcpIpHost
            ? Controls.TcpIpHost.click()
            : Controls.TcpIpJoin.click());
      } else if (new Profile().type === sdk.game.profiletype.OpenBattlenet) {
        Controls.OpenBattleNet.click();
      } else {
        Controls.OtherMultiplayerCancel.click();
      }
    },
  },
};

export const D2Bot = {
  handle: 0,

  init() {
    let handle = DataFile.getStats().handle;

    if (handle) {
      this.handle = handle;
    }

    return this.handle;
  },

  sendMessage(handle, mode, msg) {
    sendCopyData(null, handle, mode, msg);
  },

  printToConsole(msg, color, tooltip, trigger) {
    let printObj = {
      msg: msg,
      color: color || 0,
      tooltip: tooltip || "",
      trigger: trigger || "",
    };

    let obj = {
      profile: me.profile,
      func: "printToConsole",
      args: [JSON.stringify(printObj)],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  printToItemLog(itemObj) {
    let obj = {
      profile: me.profile,
      func: "printToItemLog",
      args: [JSON.stringify(itemObj)],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  uploadItem(itemObj) {
    let obj = {
      profile: me.profile,
      func: "uploadItem",
      args: [JSON.stringify(itemObj)],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  writeToFile(filename, msg) {
    let obj = {
      profile: me.profile,
      func: "writeToFile",
      args: [filename, msg],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  postToIRC(ircProfile, recepient, msg) {
    let obj = {
      profile: me.profile,
      func: "postToIRC",
      args: [ircProfile, recepient, msg],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  ircEvent(mode) {
    let obj = {
      profile: me.profile,
      func: "ircEvent",
      args: [mode ? "true" : "false"],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  notify(msg) {
    let obj = {
      profile: me.profile,
      func: "notify",
      args: [msg],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  saveItem(itemObj) {
    let obj = {
      profile: me.profile,
      func: "saveItem",
      args: [JSON.stringify(itemObj)],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  updateStatus(msg) {
    let obj = {
      profile: me.profile,
      func: "updateStatus",
      args: [msg],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  updateRuns() {
    let obj = {
      profile: me.profile,
      func: "updateRuns",
      args: [],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  updateChickens() {
    let obj = {
      profile: me.profile,
      func: "updateChickens",
      args: [],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  updateDeaths() {
    let obj = {
      profile: me.profile,
      func: "updateDeaths",
      args: [],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  requestGameInfo() {
    let obj = {
      profile: me.profile,
      func: "requestGameInfo",
      args: [],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  restart(keySwap) {
    let obj = {
      profile: me.profile,
      func: "restartProfile",
      args: arguments.length > 0 ? [me.profile, keySwap] : [me.profile],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  CDKeyInUse() {
    let obj = {
      profile: me.profile,
      func: "CDKeyInUse",
      args: [],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  CDKeyDisabled() {
    let obj = {
      profile: me.profile,
      func: "CDKeyDisabled",
      args: [],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  CDKeyRD() {
    let obj = {
      profile: me.profile,
      func: "CDKeyRD",
      args: [],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  stop(profile, release) {
    !profile && (profile = me.profile);

    let obj = {
      profile: me.profile,
      func: "stop",
      args: [profile, release ? "True" : "False"],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  start(profile) {
    let obj = {
      profile: me.profile,
      func: "start",
      args: [profile],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  startSchedule(profile) {
    let obj = {
      profile: me.profile,
      func: "startSchedule",
      args: [profile],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  stopSchedule(profile) {
    let obj = {
      profile: me.profile,
      func: "stopSchedule",
      args: [profile],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  updateCount() {
    let obj = {
      profile: me.profile,
      func: "updateCount",
      args: ["1"],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  shoutGlobal(msg, mode) {
    let obj = {
      profile: me.profile,
      func: "shoutGlobal",
      args: [msg, mode],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  heartBeat() {
    let obj = {
      profile: me.profile,
      func: "heartBeat",
      args: [],
    };

    sendCopyData(null, this.handle, 0xbbbb, JSON.stringify(obj));
  },

  sendWinMsg(wparam, lparam) {
    let obj = {
      profile: me.profile,
      func: "winmsg",
      args: [wparam, lparam],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  ingame() {
    //WM_NCACTIVATE
    this.sendWinMsg(0x0086, 0x0000);
    //WM_ACTIVATE
    this.sendWinMsg(0x0006, 0x0002);
    //WM_ACTIVATEAPP
    this.sendWinMsg(0x001c, 0x0000);
  },

  // Profile to profile communication
  joinMe(profile, gameName, gameCount, gamePass, isUp) {
    let obj = {
      gameName: gameName + gameCount,
      gamePass: gamePass,
      inGame: isUp === "yes",
      inviter: me.charname, //supported in game or menu
    };
    sendCopyData(null, profile, sdk.oog.message.JoinMe, JSON.stringify(obj));
  },

  requestGame(profile) {
    let obj = {
      profile: me.profile,
    };

    sendCopyData(
      null,
      profile,
      sdk.oog.message.RequestGame,
      JSON.stringify(obj)
    );
  },

  getProfile() {
    let obj = {
      profile: me.profile,
      func: "getProfile",
      args: [],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  setProfile(
    account,
    password,
    character,
    difficulty,
    realm,
    infoTag,
    gamePath
  ) {
    let obj = {
      profile: me.profile,
      func: "setProfile",
      args: [
        account,
        password,
        character,
        difficulty,
        realm,
        infoTag,
        gamePath,
      ],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  setTag(tag) {
    let obj = {
      profile: me.profile,
      func: "setTag",
      args: [JSON.stringify(tag)],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  // Store info in d2bot# cache
  store(info) {
    this.remove();

    let obj = {
      profile: me.profile,
      func: "store",
      args: [me.profile, info],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  // Get info from d2bot# cache
  retrieve() {
    let obj = {
      profile: me.profile,
      func: "retrieve",
      args: [me.profile],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },

  // Delete info from d2bot# cache
  remove() {
    let obj = {
      profile: me.profile,
      func: "delete",
      args: [me.profile],
    };

    sendCopyData(null, this.handle, sdk.oog.message.D2Bot, JSON.stringify(obj));
  },
};

export const DataFile = {
  create() {
    let obj = {
      runs: 0,
      experience: 0,
      deaths: 0,
      lastArea: "",
      gold: 0,
      torches: [0, 0, 0, 0, 0, 0],
      level: 0,
      name: "",
      gameName: "",
      ingameTick: 0,
      handle: 0,
      nextGame: "",
    };

    let string = JSON.stringify(obj);

    Misc.fileAction(
      "data/" + me.profile + ".json",
      Misc.FileActionMode.write,
      string
    );

    return obj;
  },

  getObj() {
    !FileTools.exists("data/" + me.profile + ".json") && DataFile.create();

    let obj;
    let string = Misc.fileAction(
      "data/" + me.profile + ".json",
      Misc.FileActionMode.read
    );

    try {
      obj = JSON.parse(string);
    } catch (e) {
      // If we failed, file might be corrupted, so create a new one
      obj = this.create();
    }

    if (obj) {
      return obj;
    }

    print("Error reading DataFile. Using null values.");

    return {
      runs: 0,
      experience: 0,
      lastArea: "",
      gold: 0,
      torches: [0, 0, 0, 0, 0, 0],
      level: 0,
      name: "",
      gameName: "",
      ingameTick: 0,
      handle: 0,
      nextGame: "",
    };
  },

  getStats() {
    let obj = this.getObj();

    return Misc.clone(obj);
  },

  updateStats(arg, value) {
    while (me.ingame && !me.gameReady) {
      delay(100);
    }

    let statArr = [];

    typeof arg === "object" && (statArr = arg.slice());
    typeof arg === "string" && statArr.push(arg);

    let obj = this.getObj();

    for (let i = 0; i < statArr.length; i += 1) {
      switch (statArr[i]) {
        case "experience":
          obj.experience = me.getStat(sdk.stats.Experience);
          obj.level = me.getStat(sdk.stats.Level);

          break;
        case "lastArea":
          if (obj.lastArea === Pather.getAreaName(me.area)) {
            return;
          }

          obj.lastArea = Pather.getAreaName(me.area);

          break;
        case "gold":
          if (!me.gameReady) {
            break;
          }

          obj.gold =
            me.getStat(sdk.stats.Gold) + me.getStat(sdk.stats.GoldBank);

          break;
        case "torches":
          obj.torches = [...me.torchKey, ...me.torchOrgan];

          break;
        case "name":
          obj.name = me.name;

          break;
        case "ingameTick":
          obj.ingameTick = getTickCount();

          break;
        case "deaths":
          obj.deaths = (obj.deaths || 0) + 1;

          break;

        default:
          obj[statArr[i]] = value;

          break;
      }
    }

    let string = JSON.stringify(obj);
    Misc.fileAction(
      "data/" + me.profile + ".json",
      Misc.FileActionMode.write,
      string
    );
  },
};

export const ControlAction = {
  // mutedKey: false,

  timeoutDelay(text, time, stopfunc, arg) {
    let currTime = 0;
    let endTime = getTickCount() + time;

    while (getTickCount() < endTime) {
      if (typeof stopfunc === "function" && stopfunc(arg)) {
        break;
      }

      if (currTime !== Math.floor((endTime - getTickCount()) / 1000)) {
        currTime = Math.floor((endTime - getTickCount()) / 1000);

        D2Bot.updateStatus(text + " (" + Math.max(currTime, 0) + "s)");
      }

      delay(10);
    }
  },

  click(type, x, y, xsize, ysize, targetx, targety) {
    let control = getControl(type, x, y, xsize, ysize);
    if (!control) {
      print(
        "control not found " +
          type +
          " " +
          x +
          " " +
          y +
          " " +
          xsize +
          " " +
          ysize +
          " location " +
          getLocation()
      );

      return false;
    }

    control.click(targetx, targety);
    return true;
  },

  setText(type, x, y, xsize, ysize, text) {
    if (!text) return false;

    let control = getControl(type, x, y, xsize, ysize);
    if (!control) return false;

    let currText = control.text;
    if (currText && currText === text) return true;

    currText = control.getText();

    if (
      currText &&
      ((typeof currText === "string" && currText === text) ||
        (typeof currText === "object" && currText.includes(text)))
    ) {
      return true;
    }

    control.setText(text);

    return true;
  },

  getText(type, x, y, xsize, ysize) {
    let control = getControl(type, x, y, xsize, ysize);

    return !!control ? control.getText() : false;
  },

  joinChannel(channel) {
    me.blockMouse = true;

    let tick;
    let rval = false;
    let timeout = 5000;

    MainLoop: while (true) {
      switch (getLocation()) {
        case sdk.game.locations.Lobby:
          Controls.LobbyEnterChat.click();

          break;
        case sdk.game.locations.LobbyChat:
          let currChan = Controls.LobbyChannelName.getText(); // returns array

          if (currChan) {
            for (let i = 0; i < currChan.length; i += 1) {
              if (
                currChan[i].split(" (") &&
                currChan[i].split(" (")[0].toLowerCase() ===
                  channel.toLowerCase()
              ) {
                rval = true;

                break MainLoop;
              }
            }
          }

          !tick && Controls.LobbyChannel.click() && (tick = getTickCount());

          break;
        case sdk.game.locations.ChannelList: // Channel
          Controls.LobbyChannelText.setText(channel);
          Controls.LobbyChannelOk.click();

          break;
      }

      if (getTickCount() - tick >= timeout) {
        break;
      }

      delay(100);
    }

    me.blockMouse = false;

    return rval;
  },

  createGame(name, pass, diff, delay) {
    Controls.CreateGameName.setText(name);
    Controls.CreateGamePass.setText(pass);

    switch (diff) {
      case "Normal":
        Controls.Normal.click();

        break;
      case "Nightmare":
        Controls.Nightmare.click();

        break;
      case "Highest":
        if (Controls.Hell.disabled !== 4 && Controls.Hell.click()) {
          break;
        }

        if (Controls.Nightmare.disabled !== 4 && Controls.Nightmare.click()) {
          break;
        }

        Controls.Normal.click();

        break;
      default:
        Controls.Hell.click();

        break;
    }

    !!delay && this.timeoutDelay("Make Game Delay", delay);

    if (Starter.chanInfo.announce) {
      Starter.sayMsg("Next game is " + name + (pass === "" ? "" : "//" + pass));
    }

    me.blockMouse = true;

    print("Creating Game: " + name);
    Controls.CreateGame.click();

    me.blockMouse = false;
  },

  clickRealm(realm) {
    if (
      realm === undefined ||
      typeof realm !== "number" ||
      realm < 0 ||
      realm > 3
    ) {
      throw new Error("clickRealm: Invalid realm!");
    }

    let currentRealm,
      retry = 0;

    me.blockMouse = true;

    MainLoop: while (true) {
      switch (getLocation()) {
        case sdk.game.locations.MainMenu:
          let control = Controls.Gateway.control;
          if (!control) {
            if (retry > 3) return false;
            retry++;

            break;
          }

          switch (
            control.text.split(
              getLocaleString(sdk.locale.text.Gateway).substring(
                0,
                getLocaleString(sdk.locale.text.Gateway).length - 2
              )
            )[1]
          ) {
            case "U.S. EAST":
              currentRealm = 1;

              break;
            case "U.S. WEST":
              currentRealm = 0;

              break;
            case "ASIA":
              currentRealm = 2;

              break;
            case "EUROPE":
              currentRealm = 3;

              break;
          }

          if (currentRealm === realm) {
            break MainLoop;
          }

          Controls.Gateway.click();

          break;
        case sdk.game.locations.GatewaySelect:
          this.click(4, 257, 500, 292, 160, 403, 350 + realm * 25);
          Controls.GatewayOk.click();

          break;
      }

      delay(500);
    }

    me.blockMouse = false;

    return true;
  },

  loginAccount(info) {
    me.blockMouse = true;

    let locTick;
    let realms = {
      uswest: 0,
      useast: 1,
      asia: 2,
      europe: 3,
    };

    let tick = getTickCount();

    MainLoop: while (true) {
      switch (getLocation()) {
        case sdk.game.locations.PreSplash:
          break;
        case sdk.game.locations.MainMenu:
          info.realm && ControlAction.clickRealm(realms[info.realm]);
          Controls.BattleNet.click();

          break;
        case sdk.game.locations.Login:
          Controls.LoginUsername.setText(info.account);
          Controls.LoginPassword.setText(info.password);
          Controls.Login.click();

          break;
        case sdk.game.locations.LoginUnableToConnect:
        case sdk.game.locations.RealmDown:
          // Unable to connect, let the caller handle it.
          me.blockMouse = false;

          return false;
        case sdk.game.locations.CharSelect:
          break MainLoop;
        case sdk.game.locations.SplashScreen:
          Controls.SplashScreen.click();

          break;
        case sdk.game.locations.CharSelectPleaseWait:
        case sdk.game.locations.MainMenuConnecting:
        case sdk.game.locations.CharSelectConnecting:
          break;
        case sdk.game.locations.CharSelectNoChars:
          // make sure we're not on connecting screen
          locTick = getTickCount();

          while (
            getTickCount() - locTick < 3000 &&
            getLocation() === sdk.game.locations.CharSelectNoChars
          ) {
            delay(25);
          }

          if (getLocation() === sdk.game.locations.CharSelectConnecting) {
            break;
          }

          break MainLoop; // break if we're sure we're on empty char screen
        default:
          print(`OOG: location:${getLocation()}`);

          me.blockMouse = false;

          return false;
      }

      if (getTickCount() - tick >= 20000) {
        return false;
      }

      delay(100);
    }

    delay(1000);

    me.blockMouse = false;

    return (
      getLocation() === sdk.game.locations.CharSelect ||
      getLocation() === sdk.game.locations.CharSelectNoChars
    );
  },

  setEmail(email = "", domain = "@email.com") {
    if (getLocation() !== sdk.game.locations.RegisterEmail) return false;
    if (!email || !email.length) {
      email = Starter.randomString(null, true);
    }

    while (getLocation() !== sdk.game.locations.CharSelect) {
      switch (getLocation()) {
        case sdk.game.locations.RegisterEmail:
          if (
            Controls.EmailSetEmail.setText(email + domain) &&
            Controls.EmailVerifyEmail.setText(email + domain)
          ) {
            Controls.EmailRegister.click();
            delay(100);
          }

          break;
        case sdk.game.locations.LoginError:
          // todo test what conditions get here other than email not matching
          D2Bot.printToConsole("Failed to set email");
          Controls.LoginErrorOk.click();

          return false;
        case sdk.game.locations.CharSelectNoChars:
          // fresh acc
          return true;
      }
    }

    return true;
  },

  makeAccount(info) {
    me.blockMouse = true;

    let openBnet = new Profile().type === sdk.game.profiletype.OpenBattlenet;
    let realms = {
      uswest: 0,
      useast: 1,
      asia: 2,
      europe: 3,
    };
    // cycle until in empty char screen
    MainLoop: while (getLocation() !== sdk.game.locations.CharSelectNoChars) {
      switch (getLocation()) {
        case sdk.game.locations.MainMenu:
          ControlAction.clickRealm(realms[info.realm]);
          if (openBnet) {
            Controls.OtherMultiplayer.click() && Controls.OpenBattleNet.click();
          } else {
            Controls.BattleNet.click();
          }

          break;
        case sdk.game.locations.Login:
          Controls.CreateNewAccount.click();

          break;
        case sdk.game.locations.SplashScreen:
          Controls.SplashScreen.click();

          break;
        case sdk.game.locations.CharacterCreate:
          Controls.CharSelectExit.click();

          break;
        case sdk.game.locations.TermsOfUse:
          Controls.TermsOfUseAgree.click();

          break;
        case sdk.game.locations.CreateNewAccount:
          Controls.CreateNewAccountName.setText(info.account);
          Controls.CreateNewAccountPassword.setText(info.password);
          Controls.CreateNewAccountConfirmPassword.setText(info.password);
          Controls.CreateNewAccountOk.click();

          break;
        case sdk.game.locations.PleaseRead:
          Controls.PleaseReadOk.click();

          break;
        case sdk.game.locations.RegisterEmail:
          Controls.EmailDontRegisterContinue.control
            ? Controls.EmailDontRegisterContinue.click()
            : Controls.EmailDontRegister.click();

          break;
        case sdk.game.locations.CharSelect:
          if (openBnet) {
            break MainLoop;
          }

          break;
        default:
          break;
      }

      delay(100);
    }

    me.blockMouse = false;

    return true;
  },

  findCharacter(info) {
    let count = 0;
    let tick = getTickCount();

    while (getLocation() !== sdk.game.locations.CharSelect) {
      if (getTickCount() - tick >= 5000) {
        break;
      }

      delay(25);
    }

    // start from beginning of the char list
    sendKey(0x24);

    while (getLocation() === sdk.game.locations.CharSelect && count < 24) {
      let control = Controls.CharSelectCharInfo0.control;

      if (control) {
        do {
          let text = control.getText();

          if (text instanceof Array && typeof text[1] === "string") {
            count++;

            if (text[1].toLowerCase() === info.charName.toLowerCase()) {
              return true;
            }
          }
        } while (count < 24 && control.getNext());
      }

      // check for additional characters up to 24
      if (count === 8 || count === 16) {
        if (Controls.CharSelectChar6.click()) {
          me.blockMouse = true;

          sendKey(0x28);
          sendKey(0x28);
          sendKey(0x28);
          sendKey(0x28);

          me.blockMouse = false;
        }
      } else {
        // no further check necessary
        break;
      }
    }

    return false;
  },

  // get all characters
  getCharacters() {
    let count = 0;
    let list = [];

    // start from beginning of the char list
    sendKey(0x24);

    while (getLocation() === sdk.game.locations.CharSelect && count < 24) {
      let control = Controls.CharSelectCharInfo0.control;

      if (control) {
        do {
          let text = control.getText();
          if (text instanceof Array && typeof text[1] === "string") {
            count++;

            if (list.indexOf(text[1]) === -1) {
              list.push(text[1]);
            }
          }
        } while (count < 24 && control.getNext());
      }

      // check for additional characters up to 24
      if (count === 8 || count === 16) {
        if (Controls.CharSelectChar6.click()) {
          me.blockMouse = true;
          sendKey(0x28);
          sendKey(0x28);
          sendKey(0x28);
          sendKey(0x28);

          me.blockMouse = false;
        }
      } else {
        // no further check necessary
        break;
      }
    }

    // back to beginning of the char list
    sendKey(0x24);

    return list;
  },

  getPermStatus(info) {
    let count = 0;
    let tick = getTickCount();
    let expireStr = getLocaleString(sdk.locale.text.ExpiresIn);
    expireStr = expireStr.slice(0, expireStr.indexOf("%")).trim();

    while (getLocation() !== sdk.game.locations.CharSelect) {
      if (getTickCount() - tick >= 5000) {
        break;
      }

      delay(25);
    }

    // start from beginning of the char list
    sendKey(0x24);

    while (getLocation() === sdk.game.locations.CharSelect && count < 24) {
      let control = Controls.CharSelectCharInfo0.control;

      if (control) {
        do {
          let text = control.getText();

          if (text instanceof Array && typeof text[1] === "string") {
            count++;

            if (text[1].toLowerCase() === info.charName.toLowerCase()) {
              return !text.some((el) => el.includes(expireStr));
            }
          }
        } while (count < 24 && control.getNext());
      }

      // check for additional characters up to 24
      if (count === 8 || count === 16) {
        if (Controls.CharSelectChar6.click()) {
          me.blockMouse = true;

          sendKey(0x28);
          sendKey(0x28);
          sendKey(0x28);
          sendKey(0x28);

          me.blockMouse = false;
        }
      } else {
        // no further check necessary
        break;
      }
    }

    return false;
  },

  // get character position
  getPosition() {
    let position = 0;

    if (getLocation() === sdk.game.locations.CharSelect) {
      let control = Controls.CharSelectCharInfo0.control;

      if (control) {
        do {
          let text = control.getText();

          if (text instanceof Array && typeof text[1] === "string") {
            position += 1;
          }
        } while (control.getNext());
      }
    }

    return position;
  },

  loginCharacter(info, startFromTop = true) {
    me.blockMouse = true;

    let count = 0;

    // start from beginning of the char list
    startFromTop && sendKey(0x24);

    // cycle until in lobby or in game
    MainLoop: while (getLocation() !== sdk.game.locations.Lobby) {
      switch (getLocation()) {
        case sdk.game.locations.CharSelect:
          let control = Controls.CharSelectCharInfo0.control;

          if (control) {
            do {
              let text = control.getText();

              if (text instanceof Array && typeof text[1] === "string") {
                count++;

                if (text[1].toLowerCase() === info.charName.toLowerCase()) {
                  control.click();
                  //just is OK button
                  Controls.CreateNewAccountOk.click();
                  me.blockMouse = false;

                  if (getLocation() === sdk.game.locations.SelectDifficultySP) {
                    try {
                      login(info.profile);
                    } catch (err) {
                      break MainLoop;
                    }

                    if (me.ingame) {
                      return true;
                    }
                  }

                  return true;
                }
              }
            } while (control.getNext());
          }

          // check for additional characters up to 24
          if (count === 8 || count === 16) {
            if (Controls.CharSelectChar6.click()) {
              sendKey(0x28);
              sendKey(0x28);
              sendKey(0x28);
              sendKey(0x28);
            }
          } else {
            // no further check necessary
            break MainLoop;
          }

          break;
        case sdk.game.locations.CharSelectNoChars:
          Controls.CharSelectExit.click();

          break;
        case sdk.game.locations.Disconnected:
        case sdk.game.locations.OkCenteredErrorPopUp:
          break MainLoop;
        default:
          break;
      }

      delay(100);
    }

    me.blockMouse = false;

    return false;
  },

  makeCharacter(info) {
    me.blockMouse = true;
    !info.charClass && (info.charClass = "barbarian");

    if (info.charName.match(/\d+/g)) {
      console.warn("Invalid character name, cannot contain numbers");

      return false;
    }

    let clickCoords = [];

    // cycle until in lobby
    while (getLocation() !== sdk.game.locations.Lobby) {
      switch (getLocation()) {
        case sdk.game.locations.CharSelect:
        case sdk.game.locations.CharSelectNoChars:
          // Create Character greyed out
          if (
            Controls.CharSelectCreate.disabled === sdk.game.controls.Disabled
          ) {
            me.blockMouse = false;

            return false;
          }

          Controls.CharSelectCreate.click();

          break;
        case sdk.game.locations.CharacterCreate:
          switch (info.charClass) {
            case "barbarian":
              clickCoords = [400, 280];

              break;
            case "amazon":
              clickCoords = [100, 280];

              break;
            case "necromancer":
              clickCoords = [300, 290];

              break;
            case "sorceress":
              clickCoords = [620, 270];

              break;
            case "assassin":
              clickCoords = [200, 280];

              break;
            case "druid":
              clickCoords = [700, 280];

              break;
            case "paladin":
              clickCoords = [521, 260];

              break;
          }

          // coords:
          // zon: 100, 280
          // barb: 400, 280
          // necro: 300, 290
          // sin: 200, 280
          // paladin: 521 260
          // sorc: 620, 270
          // druid: 700, 280

          getControl().click(clickCoords[0], clickCoords[1]);
          delay(500);

          break;
        case sdk.game.locations.NewCharSelected:
          if (Controls.CharCreateHCWarningOk.control) {
            Controls.CharCreateHCWarningOk.click();
          } else {
            Controls.CharCreateCharName.setText(info.charName);

            if (!info.expansion) {
              switch (info.charClass) {
                case "druid":
                case "assassin":
                  D2Bot.printToConsole(
                    "Error in profile name. Expansion characters cannot be made in classic",
                    sdk.colors.D2Bot.Red
                  );
                  D2Bot.stop();

                  break;
                default:
                  break;
              }

              Controls.CharCreateExpansion.click();
            }

            !info.ladder && Controls.CharCreateLadder.click();
            info.hardcore && Controls.CharCreateHardcore.click();

            Controls.CreateNewAccountOk.click();
          }

          break;
        case sdk.game.locations.OkCenteredErrorPopUp:
          // char name exists (text box 4, 268, 320, 264, 120)
          Controls.OkCentered.click();
          Controls.CharSelectExit.click();

          me.blockMouse = false;

          return false;
        default:
          break;
      }

      // Singleplayer loop break fix.
      if (me.ingame) {
        break;
      }

      delay(500);
    }

    me.blockMouse = false;

    return true;
  },

  // Test version - modified core only
  getGameList() {
    let text = Controls.JoinGameList.getText();

    if (text) {
      let gameList = [];

      for (let i = 0; i < text.length; i += 1) {
        gameList.push({
          gameName: text[i][0],
          players: text[i][1],
        });
      }

      return gameList;
    }

    return false;
  },

  deleteCharacter(info) {
    me.blockMouse = true;

    // start from beginning of the char list
    sendKey(0x24);

    // cycle until in lobby
    while (getLocation() === sdk.game.locations.CharSelect) {
      let count = 0;
      let control = Controls.CharSelectCharInfo0.control;

      if (control) {
        do {
          let text = control.getText();

          if (text instanceof Array && typeof text[1] === "string") {
            count++;

            if (text[1].toLowerCase() === info.charName.toLowerCase()) {
              print("delete character " + info.charName);

              control.click();
              Controls.CharSelectDelete.click();
              delay(500);
              Controls.CharDeleteYes.click();
              delay(500);
              me.blockMouse = false;

              return true;
            }
          }
        } while (control.getNext());
      }

      // check for additional characters up to 24
      if (count === 8 || count === 16) {
        if (Controls.CharSelectChar6.click()) {
          sendKey(0x28);
          sendKey(0x28);
          sendKey(0x28);
          sendKey(0x28);
        }
      } else {
        // no further check necessary
        break;
      }

      delay(100);
    }

    me.blockMouse = false;

    return false;
  },

  getQueueTime() {
    // You are in line to create a game.,Try joining a game to avoid waiting.,,Your position in line is: ÿc02912
    const text = Controls.CreateGameInLine.getText();
    if (
      text &&
      text.indexOf(getLocaleString(sdk.locale.text.YourPositionInLineIs)) > -1
    ) {
      const result = /ÿc0(\d*)/gm.exec(text);
      if (result && typeof result[1] === "string") {
        return parseInt(result[1]) || 0;
      }
    }

    return 0; // You're in line 0, aka no queue
  },

  loginOtherMultiplayer() {
    MainLoop: while (true) {
      switch (getLocation()) {
        case sdk.game.locations.CharSelect:
          if (Controls.CharSelectCurrentRealm.control) {
            console.log("Not in single player character select screen");
            Controls.CharSelectExit.click();

            break;
          }

          Starter.LocationEvents.login(false);

          break;
        case sdk.game.locations.SelectDifficultySP:
          Starter.LocationEvents.selectDifficultySP();

          break;
        case sdk.game.locations.SplashScreen:
          ControlAction.click();

          break;
        case sdk.game.locations.MainMenu:
          if (new Profile().type === sdk.game.profiletype.OpenBattlenet) {
            // check we are on the correct gateway
            let realms = { west: 0, east: 1, asia: 2, europe: 3 };
            ControlAction.clickRealm(
              realms[new Profile().gateway.toLowerCase()]
            );
            try {
              login(me.profile);
            } catch (e) {
              print(e);
            }

            break;
          }

          Controls.OtherMultiplayer.click();

          break;
        case sdk.game.locations.OtherMultiplayer:
          Starter.LocationEvents.otherMultiplayerSelect();

          break;
        case sdk.game.locations.TcpIp:
          // handle this in otherMultiplayerSelect
          // not sure how to handle enter ip though, should that be left to the starter to decide?
          Controls.TcpIpCancel.click();

          break;
        case sdk.game.locations.TcpIpEnterIp:
          break MainLoop;
        case sdk.game.locations.Login:
          login(me.profile);

          break;
        case sdk.game.locations.LoginUnableToConnect:
        case sdk.game.locations.TcpIpUnableToConnect:
          Starter.LocationEvents.unableToConnect();

          break;
        case sdk.game.locations.Lobby:
        case sdk.game.locations.LobbyChat:
          D2Bot.updateStatus("Lobby");

          if (me.charname !== Starter.profileInfo.charName) {
            Controls.LobbyQuit.click();

            break;
          }

          me.blockKeys = false;
          !Starter.firstLogin && (Starter.firstLogin = true);

          break MainLoop;
        default:
          if (me.ingame) {
            break MainLoop;
          }

          break;
      }
    }

    // handling Enter Ip inside entry for now so that location === sucess
    return me.ingame || getLocation() === sdk.game.locations.TcpIpEnterIp;
  },

  joinCheck(profile) {
    D2Bot.requestGame(profile);
    delay(500);

    if (
      !Starter.joinInfo.inGame ||
      (Starter.lastGame.length &&
        (Starter.Config.JoinSameGame ||
          Starter.lastGame.indexOf(Starter.joinInfo.gameName) === -1))
    ) {
      D2Bot.printToConsole("Game is finished. Stopping join delay.");

      return true;
    }

    return false;
  },

  actionEvent: {
    deforeCreate() {
      Starter.lastGameStatus === "pending" && (Starter.gameCount += 1);

      if (Starter.Config.PingQuitDelay && Starter.pingQuit) {
        ControlAction.timeoutDelay(
          "Ping Delay",
          Starter.Config.PingQuitDelay * 1e3
        );
        Starter.pingQuit = false;
      }

      if (Starter.inGame || Starter.gameInfo.error) {
        !Starter.gameStart &&
          (Starter.gameStart = DataFile.getStats().ingameTick);

        if (
          getTickCount() - Starter.gameStart <
          Starter.Config.MinGameTime * 1e3
        ) {
          ControlAction.timeoutDelay(
            "Min game time wait",
            Starter.Config.MinGameTime * 1e3 +
              Starter.gameStart -
              getTickCount()
          );
        }
      }
    },
    updateRuns(chan = false) {
      if (Starter.inGame) {
        if (
          AutoMule.outOfGameCheck() ||
          TorchSystem.outOfGameCheck() ||
          Gambling.outOfGameCheck() ||
          CraftingSystem.outOfGameCheck()
        ) {
          return false;
        }

        print("updating runs");
        D2Bot.updateRuns();

        Starter.lastGameTick = getTickCount();
        Starter.gameCount += 1;
        Starter.lastGameStatus = "ready";
        Starter.inGame = false;

        if (
          Starter.Config.ResetCount &&
          Starter.gameCount > Starter.Config.ResetCount
        ) {
          Starter.gameCount = 1;
          DataFile.updateStats("runs", Starter.gameCount);
        }

        if (chan) {
          if (
            AdvancedConfig[me.profile] &&
            AdvancedConfig[me.profile].hasOwnProperty("AfterGameMessage")
          ) {
            Starter.chanInfo.afterMsg =
              AdvancedConfig[me.profile].AfterGameMessage;
          } else {
            Starter.chanInfo.afterMsg = Starter.Config.AfterGameMessage;
          }

          // check that we are in the channel we are supposed to be in
          if (Starter.chanInfo.joinChannel.length) {
            let chanName = Controls.LobbyChannelName.getText();
            chanName && (chanName = chanName.toString());
            chanName &&
              (chanName = chanName.slice(0, chanName.indexOf("(") - 1));
            Starter.chanInfo.joinChannel.indexOf(chanName) === -1 &&
              (Starter.chatActionsDone = false);
          }

          if (Starter.chanInfo.afterMsg) {
            if (typeof Starter.chanInfo.afterMsg === "string") {
              Starter.chanInfo.afterMsg = [Starter.chanInfo.afterMsg];
            }

            for (let i = 0; i < Starter.chanInfo.afterMsg.length; i += 1) {
              Starter.sayMsg(Starter.chanInfo.afterMsg[i]);
              delay(500);
            }
          }
        }
      }
      return true;
    },
    chatActions() {
      if (Starter.gameMode === sdk.game.action.Create) {
        if (!Starter.chatActionsDone) {
          Starter.chatActionsDone = true;

          if (
            AdvancedConfig[me.profile] &&
            AdvancedConfig[me.profile].hasOwnProperty("JoinChannel")
          ) {
            Starter.chanInfo.joinChannel =
              AdvancedConfig[me.profile].JoinChannel;
          } else {
            Starter.chanInfo.joinChannel = Starter.Config.JoinChannel;
          }

          if (
            AdvancedConfig[me.profile] &&
            AdvancedConfig[me.profile].hasOwnProperty("FirstJoinMessage")
          ) {
            Starter.chanInfo.firstMsg =
              AdvancedConfig[me.profile].FirstJoinMessage;
          } else {
            Starter.chanInfo.firstMsg = Starter.Config.FirstJoinMessage;
          }

          if (Starter.chanInfo.joinChannel) {
            typeof Starter.chanInfo.joinChannel === "string" &&
              (Starter.chanInfo.joinChannel = [Starter.chanInfo.joinChannel]);
            typeof Starter.chanInfo.firstMsg === "string" &&
              (Starter.chanInfo.firstMsg = [Starter.chanInfo.firstMsg]);

            for (let i = 0; i < Starter.chanInfo.joinChannel.length; i += 1) {
              ControlAction.timeoutDelay(
                "Chat delay",
                Starter.Config.ChatActionsDelay * 1e3
              );

              if (this.joinChannel(Starter.chanInfo.joinChannel[i])) {
                Starter.useChat = true;
              } else {
                print("\xFFc1Unable to join channel, disabling chat messages.");
                Starter.useChat = false;
              }

              if (Starter.chanInfo.firstMsg[i] !== "") {
                Starter.sayMsg(Starter.chanInfo.firstMsg[i]);
                delay(500);
              }
            }
          }
        }

        // Announce game
        if (
          AdvancedConfig[me.profile] &&
          AdvancedConfig[me.profile].hasOwnProperty("AnnounceGames")
        ) {
          Starter.chanInfo.announce = AdvancedConfig[me.profile].AnnounceGames;
        } else {
          Starter.chanInfo.announce = Starter.Config.AnnounceGames;
        }
      } else {
        if (!Starter.chatActionsDone) {
          Starter.chatActionsDone = true;

          ControlAction.timeoutDelay(
            "Chat delay",
            Starter.Config.ChatActionsDelay * 1e3
          );
          say("/join " + Starter.Config.JoinChannel);
          delay(1000);

          if (Starter.Config.FirstJoinMessage !== "") {
            say(Starter.Config.FirstJoinMessage);
            delay(500);
          }
        }
      }
    },
    createNow() {
      D2Bot.updateStatus("Creating Game");

      if (typeof Starter.Config.CharacterDifference === "number") {
        Controls.CharacterDifference.disabled === sdk.game.controls.Disabled &&
          Controls.CharacterDifferenceButton.click();
        Controls.CharacterDifference.setText(
          Starter.Config.CharacterDifference.toString()
        );
      } else if (
        !Starter.Config.CharacterDifference &&
        Controls.CharacterDifference.disabled === 5
      ) {
        Controls.CharacterDifferenceButton.click();
      }

      typeof Starter.Config.MaxPlayerCount === "number" &&
        Controls.MaxPlayerCount.setText(
          Starter.Config.MaxPlayerCount.toString()
        );

      // Get game name if there is none
      while (!Starter.gameInfo.gameName) {
        D2Bot.requestGameInfo();
        delay(500);
      }

      // FTJ handler
      if (Starter.lastGameStatus === "pending") {
        Starter.isUp = "no";
        D2Bot.printToConsole("Failed to create game");
        ControlAction.timeoutDelay("FTJ delay", Starter.Config.FTJDelay * 1e3);
        D2Bot.updateRuns();
      }

      let gameName =
        Starter.gameInfo.gameName === "?"
          ? Starter.randomString(null, true)
          : Starter.gameInfo.gameName + Starter.gameCount;
      let gamePass =
        Starter.gameInfo.gamePass === "?"
          ? Starter.randomString(null, true)
          : Starter.gameInfo.gamePass;

      //create game here
      ControlAction.createGame(
        gameName,
        gamePass,
        Starter.gameInfo.difficulty,
        Starter.Config.CreateGameDelay * 1000
      );

      Starter.lastGameStatus = "pending";
      Starter.setNextGame(Starter.gameInfo);
      Starter.locationTimeout(5000, sdk.game.locations.CreateGame);
    },
    joinNow() {
      D2Bot.updateStatus("Join Game");
      if (!Starter.leader || !Starter.leader.length) {
        Starter.leader = [];

        for (let i in JoinSettings) {
          if (JoinSettings.hasOwnProperty(i) && typeof i === "string") {
            for (let j = 0; j < JoinSettings[i].length; j += 1) {
              if (
                JoinSettings[i][j] === me.profile ||
                JoinSettings[i][j] === "all"
              ) {
                Starter.leader.push(i);
              }
            }
          }
        }
      }

      if (!Starter.leader || !Starter.leader.length) {
        print("No leader");
        D2Bot.printToConsole("No leader");
        Starter.announced = true;

        return false;
      }

      JoinLoop2: for (let i = 0; i < 5; i += 1) {
        for (let j = 0; j < Starter.leader.length; j += 1) {
          Starter.joinInfo = {};
          D2Bot.requestGame(Starter.leader[j]);
          delay(200);

          if (
            Object.keys(Starter.joinInfo).length &&
            Starter.joinInfo.gameName !== "" &&
            (Starter.Config.JoinSameGame ||
              Starter.lastGame.indexOf(Starter.joinInfo.gameName) === -1 ||
              Starter.lastGameStatus === "pending")
          ) {
            Controls.JoinGameName.setText(Starter.joinInfo.gameName);
            Controls.JoinGamePass.setText(Starter.joinInfo.gamePass);

            if (
              Starter.lastGameStatus === "pending" ||
              (Starter.gameInfo.error &&
                DataFile.getStats().gameName === Starter.joinInfo.gameName)
            ) {
              D2Bot.printToConsole("Failed to join game");
              ControlAction.timeoutDelay(
                "Join Delay",
                Starter.Config.JoinRetryDelay * 1000,
                ControlAction.joinCheck(Starter.leader[j])
              );
              D2Bot.updateRuns();
              D2Bot.requestGame(Starter.leader[j]);
              delay(200);

              if (!Starter.joinInfo.inGame) {
                Starter.lastGameStatus = "ready";

                break;
              }
            }

            if (!Starter.joinInfo.inGame) {
              continue;
            }

            // Don't join immediately after previous game to avoid FTJ
            if (getTickCount() - Starter.lastGameTick < 5000) {
              ControlAction.timeoutDelay(
                "Game Delay",
                Starter.lastGameTick - getTickCount() + 5000
              );
            }

            print(`joining game \xFFc2${Starter.joinInfo.gameName}\xFFc0`);

            if (
              typeof AdvancedConfig[me.profile] === "object" &&
              typeof AdvancedConfig[me.profile].JoinDelay === "number"
            ) {
              ControlAction.timeoutDelay(
                "Custom Join Delay",
                AdvancedConfig[me.profile].JoinDelay * 1e3
              );
            }

            //iomars
            if (Starter.Config.JoinDelay > 0) {
              ControlAction.timeoutDelay(
                "Join Delay",
                Starter.Config.JoinDelay * 1e3
              );
            }

            me.blockMouse = true;

            DataFile.updateStats("gameName", Starter.joinInfo.gameName);
            Controls.JoinGame.click();

            me.blockMouse = false;

            Starter.lastGame.push(Starter.joinInfo.gameName);

            // Might need a fixed number. Right now it stores 1 game per Starter.leader.
            Starter.lastGame.length > Starter.leader.length &&
              Starter.lastGame.shift();

            Starter.lastGameStatus = "pending";
            Starter.locationTimeout(15000, sdk.game.locations.JoinGame);

            break JoinLoop2;
          }
        }
      }
      return true;
    },
    tcpJoinNow() {
      try {
        if (!Starter.leader || !Starter.leader.length) {
          Starter.leader = [];

          for (let i in JoinSettings) {
            if (JoinSettings.hasOwnProperty(i) && typeof i === "string") {
              for (let j = 0; j < JoinSettings[i].length; j += 1) {
                if (
                  JoinSettings[i][j] === me.profile ||
                  JoinSettings[i][j] === "all"
                ) {
                  Starter.leader.push(i);
                }
              }
            }
          }
        }

        mainLoop: for (let i = 0; i < 3; i++) {
          for (let j = 0; j < Starter.leader.length; j++) {
            D2Bot.requestGame(Starter.leader[j]);
            delay(200);

            if (
              Object.keys(Starter.joinInfo).length &&
              Starter.joinInfo.gameName !== ""
            ) {
              break mainLoop;
            }
          }
        }

        if (
          Controls.IPAdress.setText(
            Object.keys(Starter.joinInfo).length
              ? Starter.joinInfo.gameName
              : "localhost"
          ) &&
          Controls.IPAdressOk.click() &&
          Starter.locationTimeout(2e3, sdk.game.locations.TcpIpEnterIp)
        ) {
          getLocation() === sdk.game.locations.CharSelect && login(me.profile);
        }
      } catch (e) {
        print(e);
      }
    },
    [sdk.game.locations.PreSplash]: function () {
      this.click();
      Starter.locationTimeout(5000, sdk.game.locations.TcpIpEnterIp);
      getLocation() === sdk.game.locations.PreSplash && sendKey(0x0d);
    },
    [sdk.game.locations.Lobby]: function () {
      D2Bot.updateStatus("Lobby");

      if (Starter.Config.JoinChannel !== "") {
        Controls.LobbyEnterChat.click();
        return;
      }

      me.blockKeys = false;
      Starter.loginRetry = 0;
      !Starter.firstLogin && (Starter.firstLogin = true);

      Starter.gameMode === sdk.game.action.Create && this.deforeCreate();

      if (!this.updateRuns()) return;

      if (Starter.gameMode === sdk.game.action.Create)
        Starter.LocationEvents.openCreateGameWindow();
      else Starter.LocationEvents.openJoinGameWindow();
    },
    [sdk.game.locations.WaitingInLine]: function () {
      if (Starter.gameMode === sdk.game.action.Create) {
        Starter.LocationEvents.waitingInLine();
      } else {
        Controls.CancelCreateGame.click();
        Controls.JoinGameWindow.click();
      }
    },
    [sdk.game.locations.LobbyChat]: function () {
      D2Bot.updateStatus("Lobby Chat");

      Starter.gameMode === sdk.game.action.Create && this.deforeCreate();

      if (!this.updateRuns(true)) return;

      this.chatActions();

      if (Starter.gameMode === sdk.game.action.Create)
        Starter.LocationEvents.openCreateGameWindow();
      else Starter.LocationEvents.openJoinGameWindow();
    },
    [sdk.game.locations.CreateGame]: function () {
      if (Starter.gameMode === sdk.game.action.Create) this.createNow();
      else {
        Controls.CancelCreateGame.click();
        Controls.JoinGameWindow.click();
      }
    },
    [sdk.game.locations.JoinGame]: function () {
      if (Starter.gameMode === sdk.game.action.Create) {
        Starter.LocationEvents.openCreateGameWindow();
      } else {
        this.joinNow();
      }
    },
    [sdk.game.locations.Ladder]: function () {
      if (Starter.gameMode === sdk.game.action.Create)
        Starter.LocationEvents.openCreateGameWindow();
      else Starter.LocationEvents.openJoinGameWindow();
    },
    [sdk.game.locations.ChannelList]: function () {
      this[sdk.game.locations.Ladder]();
    },
    [sdk.game.locations.MainMenu]: function () {
      if (Starter.gameMode === sdk.game.action.Create)
        Starter.LocationEvents.login(
          [
            sdk.game.gametype.TcpIpHost,
            sdk.game.profiletype.OpenBattlenet,
          ].includes(new Profile().type)
        );
      else
        Starter.LocationEvents.login(
          [
            sdk.game.gametype.TcpIpJoin,
            sdk.game.profiletype.OpenBattlenet,
          ].includes(new Profile().type)
        );
    },
    [sdk.game.locations.SplashScreen]: function () {
      this[sdk.game.locations.MainMenu]();
    },
    [sdk.game.locations.Login]: function () {
      this[sdk.game.locations.MainMenu]();
    },
    [sdk.game.locations.CharSelect]: function () {
      this[sdk.game.locations.MainMenu]();
    },
    [sdk.game.locations.LoginError]: function () {
      Starter.LocationEvents.loginError();
    },
    [sdk.game.locations.InvalidCdKey]: function () {
      this[sdk.game.locations.LoginError]();
    },
    [sdk.game.locations.CdKeyInUse]: function () {
      this[sdk.game.locations.LoginError]();
    },
    [sdk.game.locations.LoginUnableToConnect]: function () {
      Starter.LocationEvents.unableToConnect();
    },
    [sdk.game.locations.TcpIpUnableToConnect]: function () {
      this[sdk.game.locations.LoginUnableToConnect]();
    },
    [sdk.game.locations.RealmDown]: function () {
      Starter.LocationEvents.realmDown();
    },
    [sdk.game.locations.Disconnected]: function () {
      D2Bot.updateStatus("Disconnected/LostConnection");
      delay(1000);
      Controls.OkCentered.click();
    },
    [sdk.game.locations.LobbyLostConnection]: function () {
      this[sdk.game.locations.Disconnected]();
    },
    [sdk.game.locations.NewCharSelected]: function () {
      Controls.CharSelectExit.click();
    },
    [sdk.game.locations.CharSelectPleaseWait]: function () {
      !Starter.locationTimeout(
        Starter.Config.PleaseWaitTimeout * 1e3,
        getLocation()
      ) && Controls.OkCentered.click();
    },
    [sdk.game.locations.SelectDifficultySP]: function () {
      Starter.LocationEvents.selectDifficultySP();
    },
    [sdk.game.locations.MainMenuConnecting]: function () {
      !Starter.locationTimeout(
        Starter.Config.ConnectingTimeout * 1e3,
        getLocation()
      ) && Controls.LoginCancelWait.click();
    },
    [sdk.game.locations.CharSelectConnecting]: function () {
      Starter.LocationEvents.charSelectError();
    },
    [sdk.game.locations.CharSelectNoChars]: function () {
      this[sdk.game.locations.CharSelectConnecting]();
    },
    [sdk.game.locations.ServerDown]: function () {},
    [sdk.game.locations.LobbyPleaseWait]: function () {
      !Starter.locationTimeout(
        Starter.Config.PleaseWaitTimeout * 1e3,
        getLocation()
      ) && Controls.OkCentered.click();
    },
    [sdk.game.locations.GameNameExists]: function () {
      if (Starter.gameMode === sdk.game.action.Create) {
        Controls.CreateGameWindow.click();
        Starter.gameCount += 1;
        Starter.lastGameStatus = "ready";
      }
    },
    [sdk.game.locations.GameIsFull]: function () {
      if (Starter.gameMode === sdk.game.action.Create) {
        Controls.CreateGameWindow.click();
        Starter.gameCount += 1;
        Starter.lastGameStatus = "ready";
      } else {
        D2Bot.printToConsole("Game is full");
        Controls.JoinGameWindow.click();
        Starter.lastGame.push(Starter.joinInfo.gameName);
        Starter.lastGameStatus = "ready";
      }
    },
    [sdk.game.locations.GatewaySelect]: function () {
      Controls.GatewayCancel.click();
    },
    [sdk.game.locations.GameDoesNotExist]: function () {
      Starter.LocationEvents.gameDoesNotExist();
    },
    [sdk.game.locations.CharacterCreate]: function () {
      Controls.CharSelectExit.click();
    },
    [sdk.game.locations.OtherMultiplayer]: function () {
      if (Starter.gameMode === sdk.game.action.Create) {
        Starter.LocationEvents.otherMultiplayerSelect();
      } else {
        new Profile().type === sdk.game.profiletype.TcpIpJoin
          ? Controls.TcpIp.click()
          : Controls.OtherMultiplayerCancel.click();
      }
    },
    [sdk.game.locations.TcpIp]: function () {
      if (Starter.gameMode === sdk.game.action.Create) {
        new Profile().type === sdk.game.profiletype.TcpIpHost
          ? Controls.TcpIpHost.click()
          : Controls.TcpIpCancel.click();
      } else {
        new Profile().type === sdk.game.profiletype.TcpIpJoin
          ? Controls.TcpIpJoin.click()
          : Controls.TcpIpCancel.click();
      }
    },
    [sdk.game.locations.TcpIpEnterIp]: function () {
      if (Starter.gameMode === sdk.game.action.Create) {
        Controls.TcpIpCancel.click();
      } else {
        this.tcpJoinNow();
      }
    },
  },

  locationAction() {
    let location = getLocation();

    if (this.actionEvent[location]) {
      this.actionEvent[location]();
    } else {
      if (location !== undefined) {
        D2Bot.printToConsole("Unhandled location " + location);
        delay(500);
        D2Bot.restart();
      }
    }
  },
};

export const ShitList = {
  create: function () {
    let obj = {
      shitlist: [],
    };

    let string = JSON.stringify(obj);

    //FileTools.writeText("shitlist.json", string);
    Misc.fileAction("shitlist.json", Misc.FileActionMode.write, string);

    return obj;
  },

  getObj: function () {
    let obj;
    let string = Misc.fileAction("shitlist.json", Misc.FileActionMode.read);
    //string = FileTools.readText("shitlist.json");

    try {
      obj = JSON.parse(string);
    } catch (e) {
      obj = this.create();
    }

    if (obj) {
      return obj;
    }

    print("Failed to read ShitList. Using null values");

    return { shitlist: [] };
  },

  read: function () {
    !FileTools.exists("shitlist.json") && this.create();

    let obj = this.getObj();

    return obj.shitlist;
  },

  add: function (name) {
    let obj = this.getObj();

    obj.shitlist.push(name);

    let string = JSON.stringify(obj);

    //FileTools.writeText("shitlist.json", string);
    Misc.fileAction("shitlist.json", Misc.FileActionMode.read, string);
  },
};
