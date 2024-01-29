import { quit, delay, getTickCount, me, print, say } from "boot";

import "@/common/Prototypes.js";
import { sdk } from "@/modules/sdk.js";
import { Config } from "@/common/Config.js";
import { Pickit } from "@/common/Pickit.js";
import { Attack } from "@/common/Attack.js";
import { Storage } from "@/common/Storage.js";
import { Runewords } from "@/common/Runewords.js";
import { Cubing } from "@/common/Cubing.js";
import { Misc, Time } from "@/common/Misc.js";
import { D2Bot } from "@/OOG.js";
import { CraftingSystem } from "@/CraftingSystem.js";

async function CloneThread() {
  D2Bot.init();

  await Attack.asyncInit();
  //Storage init first Pickit, Storage-->Pickit-->Cubing
  Storage.init();
  Pickit.init(true);
  CraftingSystem.buildLists();
  Runewords.init();
  Cubing.init();

  try {
    let tick = getTickCount();

    const { KillDclone } = await import(`@/bots/KillDclone.js`);
    if (new KillDclone()) {
      console.log(
        `\xFFc7KillDclone :: \xFFc0Complete \xFFc0- \xFFc7Duration: \xFFc0${Time.format(
          getTickCount() - tick
        )}`
      );
    }
  } catch (error) {
    Misc.errorReport(error, "KillDclone.js");
  }

  quit();

  return true;
}

Config.asyncInit(false)
  .then(() => {
    CloneThread();
  })
  .catch((error) => {
    console.error(error);
  });
