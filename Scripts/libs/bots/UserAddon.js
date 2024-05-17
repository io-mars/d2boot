import {
  addEventListener,
  showConsole,
  getUIFlag,
  Text,
  delay,
  print,
  me,
  FileTools,
  removeEventListener,
} from "boot";

import { Config } from "../common/Config.js";
import { Game } from "../common/Misc.js";
import { sdk } from "../modules/sdk.js";
import { Pickit } from "../common/Pickit.js";
import { D2Bot } from "../OOG.js";

// include("UnitInfo.js");

export const UserAddon = function () {
  let i,
    title,
    dummy,
    command = "";
  const className = sdk.player.class.nameOf(me.classid);
  const flags = [
    sdk.uiflags.Inventory,
    sdk.uiflags.StatsWindow,
    sdk.uiflags.QuickSkill,
    sdk.uiflags.SkillWindow,
    sdk.uiflags.ChatBox,
    sdk.uiflags.Quest,
    sdk.uiflags.Msgs,
    sdk.uiflags.Stash,
    sdk.uiflags.Shop,
    sdk.uiflags.EscMenu,
    sdk.uiflags.Cube,
  ];

  const keyEvent = function (key) {
    switch (key) {
      case sdk.keys.Spacebar:
        FileTools.copy(
          "libs/config/" + className + ".js",
          "libs/config/" + className + "." + me.name + ".js"
        );
        D2Bot.printToConsole(
          "libs/config/" + className + "." + me.name + ".js has been created."
        );
        D2Bot.printToConsole("Please configure your bot and start it again.");
        D2Bot.stop();

        break;
    }
  };

  const onChatInput = ({ speaker, msg }) => {
    if (msg.length && msg[0] === ".") {
      command = msg.split(" ")[0].split(".")[1];

      return true;
    }

    return false;
  };

  // Make sure the item event is loaded
  !Config.FastPick && addEventListener("itemaction", Pickit.itemEvent);
  addEventListener("chatinputblocker", onChatInput);

  if (!FileTools.exists("libs/config/" + className + "." + me.name + ".js")) {
    showConsole();
    print(
      "\xFFc4UserAddon\xFFc0: Press HOME and then press SPACE if you want to create character config."
    );
    addEventListener("keyup", keyEvent);
  }

  while (true) {
    for (i = 0; i < flags.length; i += 1) {
      if (getUIFlag(flags[i])) {
        if (title) {
          title.remove();
          dummy.remove();

          title = false;
          dummy = false;
        }

        break;
      }
    }

    if (i === flags.length && !title) {
      title = new Text(":: D2Boot user addon ::", 400, 525, 4, 0, 2);
      dummy = new Text("`", 1, 1); // Prevents crash
    }

    // !UnitInfo.cleared && !Game.getSelectedUnit() && UnitInfo.remove();

    !Game.getSelectedUnit();

    if (command && command.toLowerCase() === "done") {
      print("\xFFc4UserAddon \xFFc1ended");
      removeEventListener("keyup", keyEvent);
      removeEventListener("itemaction", Pickit.itemEvent);
      removeEventListener("chatinputblocker", onChatInput);

      return;
    } else {
      print(command);
      command = "";
    }

    Pickit.fastPick();

    let unit = Game.getSelectedUnit();
    // !!unit && UnitInfo.createInfo(unit);
    !!unit;

    delay(20);
  }
};
