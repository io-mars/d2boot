import { sdk } from "@/modules/sdk.js";
import { Scripts, Config } from "@/common/Config.js";

export const AutoBuildTemplate = {
  1: {
    SkillPoints: [-1], // This doesn't matter. We don't have skill points to spend at lvl 1
    StatPoints: [-1, -1, -1, -1, -1], // This doesn't matter. We don't have stat points to spend at lvl 1
    Update: function () {
      Config.TownCheck = false; // Don't go to town for more potions
      Config.StashGold = 200; // Minimum amount of gold to stash.
      Config.AttackSkill = [-1, 36, -1, 36, -1, 0, 0]; // At level 1 we start with a +1 Fire Bolt staff
      Config.LowManaSkill = [0, -1]; // Hit stuff when out of Mana.
      Config.ScanShrines = [15, 13, 12, 14, 7, 6, 3, 2, 1];
      Config.BeltColumn = ["hp", "hp", "hp", "hp"]; // Keep tons of health potions!
      Config.MinColumn = [0, 0, 0, 0];
      //Config.PickitFiles.push("belowlevelseven.nip");		// Pick up normal armor, belts, etc. Keep ID scrolls and TP scrolls.
      Config.OpenChests.Enabled = true; // Might as well open em.
      Config.Cubing = false; // Don't cube yet!
      Config.Inventory[0] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[1] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[2] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[3] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.PickitFiles.push("follower-newbie.nip");
      Config.StashGold = 500; // Minimum amount of gold to stash.
      Config.Follower.PickGold = true;
      Config.Follower.teleportOff = true; //mars set teleport off
      Config.Follower.SwitchAct = false; //跟随Leader自动切换act
    },
  },

  2: {
    SkillPoints: [39], // Ice Bolt + 1 (level 1)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.AttackSkill = [-1, 39, -1, 39, -1, 0, 0]; // Ice Bolt
      Config.LowManaSkill = [0, -1]; // Hit stuff when out of Mana.
      Config.BeltColumn = ["hp", "hp", "mp", "mp"];
    },
  },

  3: {
    SkillPoints: [40], // Frozen Armor + 1 (level 1)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  4: {
    SkillPoints: [37], // Warmth + 1 (level 1)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  5: {
    SkillPoints: [-1], // Save Point + 1 (1 saved point remains)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.ScanShrines = [15, 13, 12];
      Config.MinColumn = [1, 1, 1, 0];
    },
  },

  6: {
    SkillPoints: [42, 43], // Static Field + 1, Telekinesis + 1 (level 1) (level 1) (0 saved points remain)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.CastStatic = 70; // Cast static until the target is at designated life percent. 100 = disabled.
      Config.HPBuffer = 4; // Number of healing potions to keep in inventory.
      Config.MPBuffer = 8; // Number of mana potions to keep in inventory.
    },
  },

  7: {
    SkillPoints: [45], // Ice Blast + 1, Static Field + 1 (level 1) (level 2) (Normal Den of Evil Used)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      //Config.PickitFiles.splice(Config.PickitFiles.indexOf("belowlevelseven.nip"), 1);	// Will remove index "belowlevel7.nip" from Config.PickitFiles
    },
  },

  8: {
    SkillPoints: [39], // Ice Bolt + 1 (level 3)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  9: {
    SkillPoints: [39], // Ice Bolt + 1 (level 4)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  10: {
    SkillPoints: [-1], // Static Field + 1 (level 3)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.LowGold = 5000;
    },
  },

  11: {
    SkillPoints: [39], // Ice Bolt + 1 (level 5)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  12: {
    SkillPoints: [39], // Ice Bolt + 1 (level 6)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  13: {
    SkillPoints: [50], // Static Field + 1 (level 4)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  14: {
    SkillPoints: [39], // Ice Bolt + 1 (level 7)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  15: {
    SkillPoints: [-1], // Static Field + 1 (level 5)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {
      Config.CastStatic = 20; // Cast static until the target is at designated life percent. 100 = disabled.
      Config.OpenChests.Enabled = false; // Eyes on the prize!
    },
  },

  16: {
    SkillPoints: [39], // Ice Bolt + 1 (level 8)
    StatPoints: [0, 0, 0, 0, 0], // Strength 35
    Update: function () {
      Config.TownCheck = true; // Do go to town for more potions
    },
  },

  17: {
    SkillPoints: [-1], // Save Point + 1 (1 saved point remains)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  18: {
    SkillPoints: [54, 55], // Teleport + 1, Glacial Spike + 1 (level 1) (level 1) (0 saved points remain)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {
      Config.AttackSkill = [-1, 55, -1, 55, -1, 0, 0]; // Glacial Spike
      Config.LowManaSkill = [39, -1]; // Ice Bolt when low Mana.
    },
  },

  19: {
    SkillPoints: [55], // Glacial Spike + 1 (level 2)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  20: {
    SkillPoints: [55], // Glacial Spike + 1 (level 3)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {
      Config.LowGold = 10000;
    },
  },

  21: {
    SkillPoints: [55], // Glacial Spike + 1 (level 4)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  22: {
    SkillPoints: [55], // Glacial Spike + 1 (level 5)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  23: {
    SkillPoints: [44], // Frost Nova + 1 (level 1)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  24: {
    SkillPoints: [59], // Blizzard + 1 (level 1)
    StatPoints: [0, 0, 0, 0, 0], // Strength 40
    Update: function () {
      Config.BeltColumn = ["hp", "mp", "mp", "rv"];
      // Config.Cubing = true; // Will have a cube by now.
      Config.AttackSkill = [-1, 55, 59, 55, 59, -1, -1]; // Use Blizzard
      Config.LowManaSkill = [-1, -1];
    },
  },

  25: {
    SkillPoints: [59], // Blizzard + 1 (level 2)
    StatPoints: [0, 0, 0, 0, 0], // Strength 45
    Update: function () {
      Config.LowGold = 15000;
    },
  },

  26: {
    SkillPoints: [59], // Blizzard + 1 (level 3)
    StatPoints: [0, 0, 0, 0, 0], // Strength 50
    Update: function () {},
  },

  27: {
    SkillPoints: [42], // Static Field + 1 (level 6) Save + 1 (3 saved points remain) (Norm Radament)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  28: {
    SkillPoints: [59], // Blizzard + 1 (level 4)
    StatPoints: [3, 3, 3, 3, 3], // Strength + 1, Vitality + 4
    Update: function () {},
  },

  29: {
    SkillPoints: [59], // Blizzard + 1 (level 5)
    StatPoints: [0, 0, 0, 0, 0], // Strength 55
    Update: function () {},
  },

  30: {
    SkillPoints: [65], // Cold Mastery + 1 (Norm Izual)
    StatPoints: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // Vitality + 10 (Norm Lam Esen's Tome)
    Update: function () {
      //Config.AttackSkill = [-1, 64, 55, 64, 55, -1, -1];		//
      //Config.LowManaSkill = [-1, -1];
      Config.LowGold = 20000;
    },
  },

  31: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  32: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  33: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  34: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  35: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  36: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  37: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  38: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  39: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  40: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.LowGold = 35000;
    },
  },

  41: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  42: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  43: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  44: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  45: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  46: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  47: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  48: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  49: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  50: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  51: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  52: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  53: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  54: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  55: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  56: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  57: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  58: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  59: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  60: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  61: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  62: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  63: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  64: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  65: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  66: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  67: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  68: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  69: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  70: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  71: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  72: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  73: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  74: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  75: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  76: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  77: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  78: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  79: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  80: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  81: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  82: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  83: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  84: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  85: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  86: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  87: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  88: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  89: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  90: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  91: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  92: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  93: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  94: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  95: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  96: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  97: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  98: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  99: {
    SkillPoints: [-1],
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },
};
