/**
 *  @filename    CraftingSystem.js
 *  @desc        Multi-profile crafting system
 *  @notes       This system is experimental, there will be no support offered for it.
 *               If you can't get it to work, leave it be.
 */

import {
  addEventListener,
  delay,
  gold,
  joinGame,
  me,
  quit,
  removeEventListener,
  scriptBroadcast,
  sendCopyData,
} from "boot";

import { Town } from "./common/Town.js";
import { Cubing } from "./common/Cubing.js";
import { Sort } from "./common/Misc.js";
import { D2Bot } from "./OOG.js";

export const CraftingSystem = {
  Teams: {
    "Team 1": {
      // List of profiles that will collect ingredients
      Collectors: [],

      // List of profiles that will craft/reroll items
      Workers: [],

      // List of Worker game names (without the numbers)
      CraftingGames: [],

      /*	BaseItems - list of base item class ids
       *	Ingredients - list of recipe ingredients
       *	SetAmount - number of full sets to gather before transfering
       *	Type - the type of recipe. Available options: "crafting", "runewords", "cubing"
       */
      Sets: [
        // LLD Crafting
        // Caster Belt set, char lvl 29
        // Light Belt classid 345, shopped at nightmare Elzix
        // Sharkskin Belt classid 391, shopped at nightmare Elzix
        //{BaseItems: [345, 391], Ingredients: [615, 643, 561], SetAmount: 2, Type: "crafting"},
        // Runeword Making
        // Spirit Runeset + Hel
        //{BaseItems: [29, 30, 31], Ingredients: [616, 618, 619, 620, 624], SetAmount: 2, Type: "runewords"},
        // Misc. Cubing
        // Reroll rare Diadem
        //{BaseItems: [421], Ingredients: [601, 601, 601], SetAmount: 1, Type: "cubing"}
      ],
    },
  },

  check: false,
  inGame: false,
  neededItems: [],
  validGids: [],
  itemList: [],
  fullSets: [],

  // Get the Crafting System information for current profile
  getInfo() {
    for (let i in this.Teams) {
      if (this.Teams.hasOwnProperty(i)) {
        for (let j = 0; j < this.Teams[i].Collectors.length; j += 1) {
          if (
            this.Teams[i].Collectors[j].toLowerCase() ===
            me.profile.toLowerCase()
          ) {
            let info = this.Teams[i];
            info.collector = true;
            info.worker = false;

            return info;
          }
        }

        for (let j = 0; j < this.Teams[i].Workers.length; j += 1) {
          if (
            this.Teams[i].Workers[j].toLowerCase() === me.profile.toLowerCase()
          ) {
            let info = this.Teams[i];
            info.collector = false;
            info.worker = true;

            return info;
          }
        }
      }
    }

    return false;
  },

  // #################################################
  // # Item collector out of game specific functions #
  // #################################################

  outOfGameCheck() {
    if (!this.check) return false;

    let info = this.getInfo();

    function scriptMsg(msg) {
      let obj;

      try {
        obj = JSON.parse(msg);
      } catch (e) {
        return false;
      }

      obj.name === "RequestWorker" &&
        scriptBroadcast(
          JSON.stringify({ name: "WorkerName", value: worker.name })
        );

      return true;
    }

    if (info && info.collector) {
      let worker = getWorker();

      if (worker && worker.game) {
        D2Bot.printToConsole(
          "CraftingSystem: Transfering items.",
          sdk.colors.D2Bot.DarkGold
        );
        D2Bot.updateStatus("CraftingSystem: In game.");
        addEventListener("scriptmsg", scriptMsg);

        this.inGame = true;
        me.blockMouse = true;

        delay(2000);
        joinGame(worker.game[0], worker.game[1]);

        me.blockMouse = false;

        delay(5000);

        while (me.ingame) {
          delay(1000);
        }

        this.inGame = false;
        this.check = false;

        removeEventListener("scriptmsg", scriptMsg);

        return true;
      }
    }

    return false;
  },

  getWorker() {
    let rval = {
      game: false,
      name: false,
    };
    let info = this.getInfo();

    function checkEvent(mode, msg) {
      if (mode === 4) {
        for (let i = 0; i < info.CraftingGames.length; i += 1) {
          if (
            info.CraftingGames[i] &&
            msg.match(new RegExp(info.CraftingGames[i], "i"))
          ) {
            rval.game = msg.split("/");

            break;
          }
        }
      }
    }

    if (info && info.collector) {
      addEventListener("copydata", checkEvent);

      rval.game = false;

      for (let i = 0; i < info.Workers.length; i += 1) {
        sendCopyData(
          null,
          info.Workers[i],
          0,
          JSON.stringify({ name: "GetGame", profile: me.profile })
        );
        delay(100);

        if (rval.game) {
          rval.name = info.Workers[i];

          break;
        }
      }

      removeEventListener("copydata", checkEvent);

      return rval;
    }

    return false;
  },

  // #############################################
  // # Item collector in-game specific functions #
  // #############################################

  inGameCheck() {
    let info = this.getInfo();

    if (info && info.collector) {
      for (let i = 0; i < info.CraftingGames.length; i += 1) {
        if (
          info.CraftingGames[i] &&
          me.gamename.match(new RegExp(info.CraftingGames[i], "i"))
        ) {
          dropItems();
          me.cancel();
          delay(5000);
          quit();

          return true;
        }
      }
    }

    return false;
  },

  // Check whether item can be used for crafting
  validItem(item) {
    switch (item.itemType) {
      case sdk.items.type.Jewel:
        // Use junk jewels only
        return NTIP.CheckItem(item) === Pickit.Result.UNWANTED;
    }

    return true;
  },

  // Check if the item should be picked for crafting
  checkItem(item) {
    let info = this.getInfo();

    if (info) {
      for (let i = 0; i < this.neededItems.length; i += 1) {
        if (item.classid === this.neededItems[i] && validItem(item)) {
          return true;
        }
      }
    }

    return false;
  },

  // Check if the item should be kept or dropped
  keepItem(item) {
    let info = this.getInfo();

    if (info) {
      if (info.collector) return this.validGids.includes(item.gid);

      if (info.worker) {
        // Let pickit decide whether to keep crafted
        return item.crafted ? false : true;
      }
    }

    return false;
  },

  // Collect ingredients only if a worker needs them
  getSetInfoFromWorker(workerName) {
    let setInfo = false;
    let info = this.getInfo();

    function copyData(mode, msg) {
      let obj;

      if (mode === 4) {
        try {
          obj = JSON.parse(msg);
        } catch (e) {
          return false;
        }

        obj && obj.name === "SetInfo" && (setInfo = obj.value);
      }

      return true;
    }

    if (info && info.collector) {
      addEventListener("copydata", copyData);
      sendCopyData(
        null,
        workerName,
        0,
        JSON.stringify({ name: "GetSetInfo", profile: me.profile })
      );
      delay(100);

      if (setInfo !== false) {
        removeEventListener("copydata", copyData);

        return setInfo;
      }

      removeEventListener("copydata", copyData);
    }

    return false;
  },

  init(name) {
    let info = this.getInfo();

    if (info && info.collector) {
      for (let i = 0; i < info.Sets.length; i += 1) {
        info.Sets[i].Enabled = false;
      }

      let setInfo = getSetInfoFromWorker(name);

      if (setInfo) {
        for (let i = 0; i < setInfo.length; i += 1) {
          if (setInfo[i] === 1 && info.Sets[i].Enabled === false) {
            info.Sets[i].Enabled = true;
          }
        }
      }
    }
  },

  // Build global lists of needed items and valid ingredients
  buildLists(onlyNeeded) {
    let info = this.getInfo();

    if (info && info.collector) {
      this.neededItems = [];
      this.validGids = [];
      this.fullSets = [];
      this.itemList = me.findItems(-1, sdk.items.mode.inStorage);

      for (let i = 0; i < info.Sets.length; i += 1) {
        if (!onlyNeeded || info.Sets[i].Enabled) {
          checkSet(info.Sets[i]);
        }
      }

      return true;
    }

    return false;
  },

  // Check which ingredients a set needs and has
  checkSet(set) {
    let rval = {};
    let setNeeds = [];
    let setHas = [];

    // Get what set needs
    // Multiply by SetAmount
    for (let amount = 0; amount < set.SetAmount; amount += 1) {
      for (let i = 0; i < set.Ingredients.length; i += 1) {
        setNeeds.push(set.Ingredients[i]);
      }
    }

    // Remove what set already has
    for (let i = 0; i < setNeeds.length; i += 1) {
      for (let j = 0; j < this.itemList.length; j += 1) {
        if (this.itemList[j].classid === setNeeds[i]) {
          setHas.push(this.itemList[j].gid);
          setNeeds.splice(i, 1);
          this.itemList.splice(j, 1);

          i -= 1;
          j -= 1;
        }
      }
    }

    // The set is complete
    setNeeds.length === 0 && this.fullSets.push(setHas.slice());

    this.neededItems = this.neededItems.concat(setNeeds);
    this.validGids = this.validGids.concat(setHas);

    this.neededItems.sort(Sort.numbers);
    this.validGids.sort(Sort.numbers);

    return rval;
  },

  // Update lists when a valid ingredient is picked
  update(item) {
    this.neededItems.splice(this.neededItems.indexOf(item.classid), 1);
    this.validGids.push(item.gid);

    return true;
  },

  // Cube flawless gems if the ingredient is a perfect gem
  checkSubrecipes() {
    for (let i = 0; i < this.neededItems.length; i += 1) {
      switch (this.neededItems[i]) {
        case sdk.items.gems.Perfect.Amethyst:
        case sdk.items.gems.Perfect.Topaz:
        case sdk.items.gems.Perfect.Sapphire:
        case sdk.items.gems.Perfect.Emerald:
        case sdk.items.gems.Perfect.Ruby:
        case sdk.items.gems.Perfect.Diamond:
        case sdk.items.gems.Perfect.Skull:
          if (Cubing.subRecipes.indexOf(this.neededItems[i]) === -1) {
            Cubing.subRecipes.push(this.neededItems[i]);
            Cubing.recipes.push({
              Ingredients: [
                this.neededItems[i] - 1,
                this.neededItems[i] - 1,
                this.neededItems[i] - 1,
              ],
              Index: 0,
              AlwaysEnabled: true,
              MainRecipe: "Crafting",
            });
          }

          break;
      }
    }

    return true;
  },

  // Check if there are any complete ingredient sets
  checkFullSets() {
    let info = this.getInfo();

    if (info && info.collector) {
      for (let i = 0; i < info.Workers.length; i += 1) {
        init(info.Workers[i]);
        buildLists(true);

        if (this.fullSets.length) {
          return true;
        }
      }
    }

    return false;
  },

  // Drop complete ingredient sets
  dropItems() {
    Town.goToTown(1);
    Town.move("stash");
    Town.openStash();

    let worker;

    function scriptMsg(msg) {
      let obj;

      try {
        obj = JSON.parse(msg);
      } catch (e) {
        return false;
      }

      !!obj && obj.name === "WorkerName" && (worker = obj.value);

      return true;
    }

    addEventListener("scriptmsg", scriptMsg);
    scriptBroadcast(JSON.stringify({ name: "RequestWorker" }));
    delay(100);

    if (worker) {
      init(worker);
      buildLists(true);
      removeEventListener("scriptmsg", scriptMsg);

      while (this.fullSets.length) {
        let gidList = this.fullSets.shift();

        while (gidList.length) {
          let item = me.getItem(-1, -1, gidList.shift());
          !!item && item.drop();
        }
      }

      dropGold();
      delay(1000);
      me.cancel();
    }

    return true;
  },

  dropGold() {
    Town.goToTown(1);
    Town.move("stash");

    if (me.getStat(sdk.stats.Gold) >= 10000) {
      gold(10000);
    } else if (
      me.getStat(sdk.stats.GoldBank) + me.getStat(sdk.stats.Gold) >=
      10000
    ) {
      Town.openStash();
      gold(10000 - me.getStat(sdk.stats.Gold), 4);
      gold(10000);
    }
  },
};
