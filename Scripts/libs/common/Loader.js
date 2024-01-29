import { me, print, say, getTickCount } from "boot";
import { Scripts, Config } from "./Config.js";
import { Misc, Time, Messaging } from "./Misc.js";
import { Town } from "./Town.js";

export const Loader = {
  scriptList: [],
  scriptIndex: -1,
  skipTown: ["Test", "Follower"],
  tempList: [],
  scriptMFHelper: "MFHelper",

  async init() {
    await this.loadScripts();
  },

  async loadScripts() {
    for (let bot in Scripts) {
      if (Scripts.hasOwnProperty(bot) && Scripts[bot]) {
        this.scriptList.push(bot);
      }
    }

    this.scriptList.includes(this.scriptMFHelper) &&
      this.scriptList[this.scriptList.length - 1] !== this.scriptMFHelper &&
      this.scriptList.push(this.scriptMFHelper);

    for (
      this.scriptIndex = 0;
      this.scriptIndex < this.scriptList.length;
      this.scriptIndex++
    ) {
      let script = this.scriptList[this.scriptIndex];

      if (this.skipTown.includes(script) || Town.goToTown()) {
        try {
          let { [script]: boter } = await import(`../bots/${script}.js`);

          print("\xFFc2Starting script: \xFFc9" + script);

          Messaging.sendToScript(
            "tools/toolsthread.js",
            JSON.stringify({ currScript: script })
          );

          let tick = getTickCount();

          // kinda hacky, but faster for mfhelpers to stop
          if (
            Config.MFLeader &&
            Config.PublicMode &&
            ["Diablo", "Baal"].includes(script)
          ) {
            say("nextup " + script);
          }

          if (me.inTown) {
            Config.StackThawingPots.enabled &&
              Town.buyPots(
                Config.StackThawingPots.quantity,
                sdk.items.ThawingPotion,
                true
              );
            Config.StackAntidotePots.enabled &&
              Town.buyPots(
                Config.StackAntidotePots.quantity,
                sdk.items.AntidotePotion,
                true
              );
            Config.StackStaminaPots.enabled &&
              Town.buyPots(
                Config.StackStaminaPots.quantity,
                sdk.items.StaminaPotion,
                true
              );
          }

          if (boter.call(boter)) {
            console.log(
              `\xFFc7${script}\xFFc0 :: Complete - \xFFc7Duration: \xFFc0${Time.format(
                getTickCount() - tick
              )}`
            );
          }
        } catch (error) {
          console.error(error);
        } finally {
          // // Dont run for last script as that will clear everything anyway
          // if (this.scriptIndex < this.scriptList.length) {
          //   // remove script function from global scope, so it can be cleared by GC
          //   delete global[script];
          // }
          // if (reconfiguration) {
          //   print("\xFFc2Reverting back unmodified config properties.");
          //   this.copy(unmodifiedConfig, Config);
          // }
        }
      }
    }
  },

  async runScript(script, configOverride) {
    let reconfiguration,
      unmodifiedConfig = {};
    let failed = false;
    let mainScript = this.scriptName();

    function buildScriptMsg() {
      let str = "\xFFc9" + mainScript + " \xFFc0:: ";

      if (Loader.tempList.length && Loader.tempList[0] !== mainScript) {
        Loader.tempList.forEach((s) => (str += "\xFFc9" + s + " \xFFc0:: "));
      }

      return str;
    }

    if (this.skipTown.includes(script) || Town.goToTown()) {
      let mainScriptStr = mainScript !== script ? buildScriptMsg() : "";
      this.tempList.push(script);

      print(mainScriptStr + "\xFFc2Starting script: \xFFc9" + script);

      Messaging.sendToScript(
        "tools/toolsthread.js",
        JSON.stringify({ currScript: script })
      );

      if (typeof configOverride === "function") {
        reconfiguration = true;
        Object.assign(unmodifiedConfig, Config);
        configOverride();
      }

      try {
        let { [script]: boter } = await import(`../bots/${script}.js`);
        let tick = getTickCount();

        if (boter.call(boter)) {
          console.log(
            mainScriptStr +
              "\xFFc7" +
              script +
              " :: \xFFc0Complete \xFFc0- \xFFc7Duration: \xFFc0" +
              Time.format(getTickCount() - tick)
          );
        }
      } catch (error) {
        Misc.errorReport(error, script);
        failed = true;
      } finally {
        // // Dont run for last script as that will clear everything anyway
        // if (this.scriptIndex < this.scriptList.length) {
        //   // remove script function from global scope, so it can be cleared by GC
        //   delete global[script];
        // } else if (this.tempList.length) {
        //   delete global[script];
        // }

        this.tempList.pop();

        if (reconfiguration) {
          print("\xFFc2Reverting back unmodified config properties.");
          Object.assign(Config, unmodifiedConfig);
        }
      }
    }

    // }

    return !failed;
  },

  scriptName(offset = 0) {
    let index = this.scriptIndex + offset;

    if (index >= 0 && index < this.scriptList.length) {
      return this.scriptList[index];
    }

    return null;
  },
};
