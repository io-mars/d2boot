import { FileTools, me, getScript, load, print, addEventListener } from "boot";

import { sdk } from "../modules/sdk.js";
import { Skill } from "./Misc.js";
import { Config } from "./Config.js";

export const AutoBuilder = function () {
  Config.AutoBuild.DebugMode && (Config.AutoBuild.Verbose = true);

  let debug = !!Config.AutoBuild.DebugMode;
  let verbose = !!Config.AutoBuild.Verbose;
  let configUpdateLevel = 0;
  let buildTemplate;

  // Apply all Update functions from the build template in order from level 1 to me.charlvl.
  // By reapplying all of the changes to the Config object, we preserve
  // the state of the Config file without altering the saved char config.
  this.applyConfigUpdates = function () {
    debug &&
      this.print(
        "Updating Config from level " + configUpdateLevel + " to " + me.charlvl
      );
    while (configUpdateLevel < me.charlvl) {
      configUpdateLevel += 1;
      Skill.init();
      buildTemplate[configUpdateLevel] &&
        buildTemplate[configUpdateLevel].Update &&
        buildTemplate[configUpdateLevel].Update.apply(Config);
    }
  };

  function getBuildType() {
    let build = Config.AutoBuild.Template;
    if (!build) {
      this.print(
        "Config.AutoBuild.Template is either 'false', or invalid (" +
          build +
          ")"
      );
      throw new Error(
        "Invalid build template, read libs/config/Builds/README.txt for information"
      );
    }
    return build;
  }

  function getCurrentScript() {
    return getScript(true).name.toLowerCase();
  }

  function getLogFilename() {
    let d = new Date();
    let dateString = d.getMonth() + "_" + d.getDate() + "_" + d.getFullYear();
    return (
      "logs/AutoBuild." +
      me.realm +
      "." +
      me.charname +
      "." +
      dateString +
      ".log"
    );
  }

  this.getTemplateFilename = function () {
    let build = getBuildType();
    let template =
      "@/config/Builds/" +
      sdk.player.class.nameOf(me.classid) +
      "." +
      build +
      ".js";
    return template;
    // return template.toLowerCase();
  };

  this.loadTemplate = async function (notify = true) {
    let currentScript = getCurrentScript();
    let template = this.getTemplateFilename();
    notify &&
      this.print(
        "Including build template " + template + " into " + currentScript
      );

    try {
      const { AutoBuildTemplate } = await import(template);

      if (!AutoBuildTemplate)
        throw new Error("Failed to include template: " + template);

      return AutoBuildTemplate;
    } catch (error) {
      print(`Stack trace: ${error} ${error.stack}`);
      throw new Error("Failed to include template: " + template);
    }
  };

  this.levelUpHandler = function (msg) {
    if (
      typeof msg === "object" &&
      msg.hasOwnProperty("event") &&
      msg.event === "level up"
    ) {
      this.applyConfigUpdates();
    }
  };

  this.initialize = async function () {
    let currentScript = getCurrentScript();
    //only init by default.js
    if (currentScript !== "default.js") return;

    //load build template
    buildTemplate = await this.loadTemplate();

    // All threads except autobuildthread.js use this event listener
    // to update their thread-local Config object
    addEventListener("scriptmsg", this.levelUpHandler, this);

    // Resynchronize our Config object with all past changes
    // made to it by AutoBuild system
    this.applyConfigUpdates();
  };

  function log(message) {
    FileTools.appendText(getLogFilename(), message + "\n");
  }

  // Only print to console from autobuildthread.js,
  // but log from all scripts
  this.print = function () {
    let args = Array.prototype.slice.call(arguments);
    args.unshift("\xFFc8AutoBuild:\xFFc0");
    let result = args.join(" ");
    verbose && print.call(this, result);
    debug && log.call(this, result);
  };
};
