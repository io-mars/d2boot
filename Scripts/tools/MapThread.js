import {
  me,
  print,
  getUIFlag,
  getRoom,
  revealLevel,
  delay,
  hideConsole,
  addEventListener,
  say,
  getDistance,
} from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Config } from "@/common/Config.js";
import { Pather } from "@/common/Pather.js";
import { Game } from "@/common/Misc.js";

import {
  ActionHooks,
  VectorHooks,
  MonsterHooks,
  ShrineHooks,
  ItemHooks,
  TextHooks,
  Hooks,
} from "libs/MapHooks.js";

const MapThread = {
  hideFlags: [
    sdk.uiflags.Inventory,
    sdk.uiflags.StatsWindow,
    sdk.uiflags.QuickSkill,
    sdk.uiflags.SkillWindow,
    sdk.uiflags.ChatBox,
    sdk.uiflags.EscMenu,
    sdk.uiflags.Shop,
    sdk.uiflags.Quest,
    sdk.uiflags.Waypoint,
    sdk.uiflags.TradePrompt,
    sdk.uiflags.Msgs,
    sdk.uiflags.Stash,
    sdk.uiflags.Cube,
    sdk.uiflags.Help,
    sdk.uiflags.MercScreen,
  ],

  runCommand(msg) {
    if (msg.length <= 1) {
      return true;
    }

    msg = msg.toLowerCase();
    let cmd = msg.split(" ")[0].split(".")[1];
    let msgList = msg.split(" ");
    let qolObj = { type: "qol", dest: false, action: false };

    switch (cmd) {
      case "useraddon":
        Hooks.userAddon = !Hooks.userAddon;
        me.overhead("userAddon set to " + Hooks.userAddon);

        break;
      case "me":
        print(
          "Character Level: " +
            me.charlvl +
            " | Area: " +
            me.area +
            " | x: " +
            me.x +
            ", y: " +
            me.y
        );
        me.overhead(
          "Character Level: " +
            me.charlvl +
            " | Area: " +
            me.area +
            " | x: " +
            me.x +
            ", y: " +
            me.y
        );

        break;
      case "stash":
        me.inTown && (qolObj.action = "stashItems");

        break;
      case "pick":
      case "cowportal":
      case "uberportal":
      case "filltps":
        qolObj.action = cmd;

        break;
      case "drop":
        if (msgList.length < 2) {
          print("\xFFc1Missing arguments");
          break;
        }

        qolObj.type = "drop";
        qolObj.action = msgList[1];

        break;
      case "stack":
        if (msgList.length < 2) {
          print("\xFFc1Missing arguments");
          break;
        }

        qolObj.type = "stack";
        qolObj.action = msgList[1];

        break;
      case "hide":
        hideConsole();
        TextHooks.displayTitle = false;
        {
          let tHook = TextHooks.getHook("title", TextHooks.hooks);
          !!tHook && tHook.hook.remove();
        }

        break;
      default:
        print("\xFFc1Invalid command : " + cmd);

        break;
    }

    // qolObj.action &&
    //   Messaging.sendToScript(MapMode.mapHelperFilePath, JSON.stringify(qolObj));

    return true;
  },

  // onChatInput({ speaker, msg }) {

  // if (msg.length && msg[0] === ".") {
  //   MapThread.runCommand(msg);
  //   return true;
  // }
  // return false;
  // },

  revealArea(area) {
    !this.revealedAreas && (this.revealedAreas = []);

    if (this.revealedAreas.indexOf(area) === -1) {
      delay(500);

      if (!getRoom()) {
        return;
      }

      revealLevel(true);
      this.revealedAreas.push(area);
    }
  },

  announce(msg = "") {
    say(msg);
  },

  keyEvent(key) {
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

        if (me.area === sdk.areas.MooMooFarm) {
          this.announce("cow");
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
  },

  init() {
    // Storage.Init();
    // Pickit.init(true);
    Hooks.init();
    // load("tools/maphelper.js");
    print("\xFFc9MapThread\xFFc0 \xFFc2Loaded\xFFc0");

    if (Config.MapMode.UseOwnItemFilter) {
      ItemHooks.pickitEnabled = true;
    }

    // const Worker = require("../../modules/Worker");

    // Worker.runInBackground.unitInfo = function () {
    //   if (!Hooks.userAddon || (!UnitInfo.cleared && !Game.getSelectedUnit())) {
    //     UnitInfo.remove();
    //     return true;
    //   }

    //   let unit = Game.getSelectedUnit();
    //   !!unit && UnitInfo.createInfo(unit);

    //   return true;
    // };

    // addEventListener("chatinputblocker", this.onChatInput);
    // addEventListener("chatinput", this.onChatInput, this);
    // addEventListener("keyup", ActionHooks.event);
    addEventListener("keyup", this.keyEvent, this);

    while (true) {
      while (!me.area || !me.gameReady) {
        delay(100);
      }

      let hideFlagFound = false;

      this.revealArea(me.area);

      for (let i = 0; i < this.hideFlags.length; i++) {
        if (getUIFlag(this.hideFlags[i])) {
          Hooks.flush(this.hideFlags[i]);
          // ActionHooks.checkAction();
          hideFlagFound = true;
          delay(100);

          break;
        }
      }

      if (hideFlagFound) continue;

      getUIFlag(sdk.uiflags.AutoMap) ? Hooks.update() : Hooks.flush(true);

      delay(50);

      //LAG!! lock??
      // while (getUIFlag(sdk.uiflags.ShowItem)) {
      //   ItemHooks.flush();
      // }
    }
  },
};

Config.asyncInit(false)
  .then(() => {
    MapThread.init();
  })
  .catch((error) => {
    console.error(error);
  });
