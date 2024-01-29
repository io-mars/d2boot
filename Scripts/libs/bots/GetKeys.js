import { me, print } from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Town } from "../common/Town.js";
import { Loader } from "../common/Loader.js";

export const GetKeys = function () {
  Town.doChores();

  if (!me.findItems("pk1") || me.findItems("pk1").length < 3) {
    try {
      Loader.runScript("Countess");
    } catch (countessError) {
      print("\xFFc1Countess failed");
    }
  }

  if (!me.findItems("pk2") || me.findItems("pk2").length < 3) {
    try {
      Loader.runScript("Summoner", () => (Config.Summoner.FireEye = false));
    } catch (summonerError) {
      print("\xFFc1Summoner failed");
    }
  }

  if (!me.findItems("pk3") || me.findItems("pk3").length < 3) {
    try {
      Loader.runScript("Nihlathak");
    } catch (nihlathakError) {
      print("\xFFc1Nihlathak failed");
    }
  }

  return true;
};
