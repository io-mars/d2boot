import { sdk } from "@/modules/sdk.js";
import { Scripts, Config } from "@/common/Config.js";

export const AutoBuildTemplate = {
  1: {
    //SkillPoints: [-1],										// This doesn't matter. We don't have skill points to spend at lvl 1]
    //StatPoints: [-1,-1,-1,-1,-1],								// This doesn't matter. We don't have stat points to spend at lvl 1
    Update: function () {
      Config.TownCheck = false; // 回鎮上買藥水.Don't go to town for more potions
      Config.StashGold = 200; // 錢少於多少不要存.Minimum amount of gold to stash.
      Config.AttackSkill = [-1, 500, 0, 500, 0, -1, -1];
      Config.LowManaSkill = [0, -1];
      Config.ScanShrines = [15, 13, 12, 14, 7, 6, 2];
      Config.BeltColumn = ["hp", "hp", "hp", "mp"]; // Keep tons of health potions!
      Config.MinColumn = [1, 1, 1, 1];
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

      // Speedup config. Full packet casting is not recommended for melee skills.
      Config.FCR = 255;
      Config.FHR = 255;
      Config.FBR = 255;
      Config.IAS = 255;
    },
  },

  2: {
    SkillPoints: [70], // Might + 1 (level 1)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.AttackSkill = [-1, -1, -1, -1, -1, -1, -1]; // Use Might
      Config.LowManaSkill = [-1, -1]; // Use Might while hitting stuff.
    },
  },

  3: {
    SkillPoints: [66], // Amplify Damage + 1 (level 1)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.AttackSkill = [66, -1, -1, -1, -1, -1, -1]; // Use Might
      Config.LowManaSkill = [-1, -1]; // Use Might while hitting stuff.
      Config.Curse[0] = 66;

      Config.ActiveSummon = true;
      Config.Skeletons = "max";
    },
  },

  4: {
    SkillPoints: [68], // Prayer + 1 (level 1)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      //in Nec's Attack common file, the 500 only for Pure Summoner, stay a good position and do noting
      Config.AttackSkill = [66, 500, -1, 500, -1, -1, -1];
      Config.LowManaSkill = [-1, -1]; // Use Might while hitting stuff.
    },
  },

  5: {
    SkillPoints: [-1], // Save Point + 1 (1 saved point remains)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.ScanShrines = [15, 13, 12];
      Config.MinColumn = [1, 1, 1, 1];
    },
  },

  6: {
    SkillPoints: [69, 75], // Holy Bolt + 1, Defiance + 1 (level 1) (level 2) (0 saved points remain)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.AttackSkill = [66, 500, -1, 500, -1, -1, -1]; // Use Might
      Config.Golem = 1;
      Config.Skeletons = "max";
      Config.HPBuffer = 4; // Number of healing potions to keep in inventory.
      Config.MPBuffer = 8; // Number of mana potions to keep in inventory.
    },
  },

  7: {
    SkillPoints: [70], // Save Point + 1 (1 saved point remains)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  8: {
    SkillPoints: [70], // Save Point + 1 (2 saved points remain)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  9: {
    SkillPoints: [70], // Save Point + 1 (1 saved points remain)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  10: {
    SkillPoints: [-1], // Save Point + 1 (2 saved points remain)
    StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.StashGold = 10000; // Minimum amount of gold to stash.
      Config.BeltColumn = ["hp", "hp", "mp", "mp"]; // Start keeping rejuvs
      Config.MinColumn = [2, 2, 2, 2];
    },
  },

  11: {
    SkillPoints: [-1], // Save Point + 1 (3 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (60)
    Update: function () {},
  },

  12: {
    SkillPoints: [79, 80], // Charge + 1, Blessed Aim + 1, Cleansing + 1 (level 1) (level 1) (level 1) (2 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (65)
    Update: function () {
      Config.AttackSkill = [66, 500, -1, 500, -1, -1, -1]; // Use Might
      Config.LowManaSkill = [-1, -1]; // Use Blessed Aim while hitting stuff.
      Config.SkeletonMages = "max";
      Config.LowGold = 2000; //Turning off picking up trash items for gold
      Config.UseMerc = true; // 是否使用佣兵。这个设定在非资料片中总是为false。 // Use merc. This is ignored and always false in d2classic.
    },
  },

  13: {
    SkillPoints: [70], // Blessed Aim + 1 (level 2) Save Point + 1 (3 saved points remain) (Normal Den of Evil Used)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (70)
    Update: function () {},
  },

  14: {
    SkillPoints: [70], // Save Point + 1 (4 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (75)
    Update: function () {},
  },

  15: {
    SkillPoints: [-1], // Save Point + 1 (6 saved points remain)
    StatPoints: [0, 3, 3, 3, 3], // Vitality + 5 (80)
    Update: function () {
      Config.OpenChests.Enabled = false; // Eyes on the prize!
      Config.LowGold = 100000;
    },
  },

  16: {
    SkillPoints: [-1], // Save Point + 1 (7 saved points remain)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (85)
    Update: function () {},
  },

  17: {
    SkillPoints: [67, 74], // Save Point + 1 (8 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (90)
    Update: function () {
      Config.Curse[1] = 66;
      Config.AttackSkill = [66, 500, -1, 500, -1, -1, -1]; // Use Might
      Config.LowManaSkill = [-1, -1];
      Config.ExplodeCorpses = 74;
    },
  },

  18: {
    SkillPoints: [70], // Blessed Hammer + 1, Concentration + 1, Vigor + 1 (level 1) (level 1) (level 1) (6 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (95)
    Update: function () {
      Config.AttackSkill = [66, 500, -1, 500, -1, -1, -1]; // Use Might
      Config.LowManaSkill = [-1, -1];
      Config.TownCheck = true; // Do go to town for more potions
      Config.MinColumn = [3, 3, 3, 0]; // Should have a decent belt by now
      Config.Charge = false; // Don't waste mana on charging while walking
      Config.MPBuffer = 8; // Need lots of mana for Blessed Hammer!
      Config.ExplodeCorpses = 74;
    },
  },

  19: {
    SkillPoints: [-1], // Blessed Hammer + 1, Concentration + 1 (level 2) (level 2) (5 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (100)
    Update: function () {},
  },

  20: {
    SkillPoints: [70], // Blessed Hammer + 1, Concentration + 1 (level 3) (level 3) (4 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (105)
    Update: function () {},
  },

  21: {
    SkillPoints: [69], // Blessed Hammer + 1, Concentration + 1 (level 4) (level 4) (3 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (110)
    Update: function () {},
  },

  22: {
    SkillPoints: [69, 69], // Blessed Hammer + 1, Concentration + 1 (level 5) (level 5) (2 saved points remain)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (115)
    Update: function () {},
  },

  23: {
    SkillPoints: [-1], // Blessed Hammer + 1 (level 6) (2 saved points remain)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (120)
    Update: function () {},
  },

  24: {
    SkillPoints: [89, 72, 77, 87], // Blessed Hammer + 1, Holy Shield + 1, Meditation + 1 (level 7) (level 1) (level 1) (0 saved points remain)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (125)
    Update: function () {
      Config.AttackSkill = [66, 500, -1, 500, -1, -1, -1]; // Use Might
      Config.LowManaSkill = [-1, -1]; // Use Meditation while hitting stuff.
      Config.ExplodeCorpses = 74;
      Config.Golem = "1";
      Config.Skeletons = "max";
      Config.SkeletonMages = "max";
      Config.Revives = "max";
      Config.PoisonNovaDelay = 2;
      Config.ActiveSummon = true;
      Config.ReviveUnstackable = false;
      Config.IronGolemChicken = 30;
      // Config.Cubing = true; // Will have a cube by now.
      Config.Dodge = true; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
      Config.DodgeRange = 15; // Distance to keep from monsters.
    },
  },

  25: {
    SkillPoints: [-1], // Blessed Hammer + 1 (level 8)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (130)
    Update: function () {
      Config.LowGold = 15000;
    },
  },

  26: {
    SkillPoints: [85], // Blessed Hammer + 1 (level 9)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (135)
    Update: function () {},
  },

  27: {
    SkillPoints: [70, 90], // Blessed Hammer + 1, Blessed Aim + 1 (level 10) (level 3) (Norm Radament)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (140)
    Update: function () {},
  },

  28: {
    SkillPoints: [70], // Blessed Hammer + 1 (level 11)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (145)
    Update: function () {},
  },

  29: {
    SkillPoints: [70], // Blessed Hammer + 1 (level 12)
    StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (150)
    Update: function () {},
  },

  30: {
    SkillPoints: [70, 70, 95], // Blessed Hammer + 1, Blessed Aim + 2 (level 13) (level 5) (Norm Izual)
    StatPoints: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // Vitality + 10 (160) (Norm Lam Esen's Tome)
    Update: function () {
      Config.Curse[0] = 87;
      Config.Curse[1] = 87;
      //Config.ExplodeCorpses = 74;
      Config.Golem = "Clay";
      Config.Skeletons = "max";
      Config.SkeletonMages = "max";
      Config.Revives = "max";
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
