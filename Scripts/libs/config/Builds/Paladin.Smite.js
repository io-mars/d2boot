import { sdk } from "@/modules/sdk.js";
import { Scripts, Config } from "@/common/Config.js";

export const AutoBuildTemplate = {
  1: {
    Update: function () {
      Config.TownCheck = false; // Don't go to town for more potions
      Config.StashGold = 200; // Minimum amount of gold to stash.
      Config.AttackSkill = [
        -1,
        sdk.skills.Attack,
        sdk.skills.Attack,
        sdk.skills.Attack,
        sdk.skills.Attack,
        -1,
        -1,
      ];
      Config.LowManaSkill = [sdk.skills.Attack, sdk.skills.Attack];
      // Config.ScanShrines = [1, 15, 13, 12, 14, 7, 6, 3, 2];
      Config.BeltColumn = ["hp", "hp", "hp", "hp"]; // Keep tons of health potions!
      Config.MinColumn = [0, 0, 0, 0];
      //Config.PickitFiles.push("belowlevelseven.nip");		// Pick up normal armor, belts, etc. Keep ID scrolls and TP scrolls.
      Config.OpenChests.Enabled = false; // Might as well open em.
      Config.Cubing = false; // Don't cube yet!
      Config.Inventory[0] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[1] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[2] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[3] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.PickitFiles.push("follower-newbie.nip");
      Config.Vigor = false;
      Config.Charge = false;
      Config.ScanShrines = [];
      Config.Follower.PickGold = false;
      Config.Follower.teleportOff = true; //mars set teleport off
      Config.Follower.SwitchAct = false; //跟随Leader自动切换act
    },
  },

  2: {
    SkillPoints: [sdk.skills.Might], // Might + 1 (level 1)
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.Attack,
        sdk.skills.Might,
        sdk.skills.Attack,
        sdk.skills.Might,
        -1,
        -1,
      ]; // Use Might
      Config.LowManaSkill = [sdk.skills.Attack, sdk.skills.Might]; //
      Config.BeltColumn = ["hp", "hp", "mp", "mp"]; // Keep tons of health potions!
    },
  },

  3: {
    SkillPoints: [sdk.skills.Smite], //
    Update: function () {},
  },

  4: {
    SkillPoints: [sdk.skills.Prayer], //
    Update: function () {},
  },

  6: {
    SkillPoints: [sdk.skills.HolyBolt, sdk.skills.Defiance], // Holy Bolt + 1, Defiance + 1 (level 1) (level 2) (0 saved points remain)
    Update: function () {},
  },

  12: {
    SkillPoints: [
      sdk.skills.Charge,
      sdk.skills.BlessedAim,
      sdk.skills.Cleansing,
      // sdk.skills.Sacrifice,
      // sdk.skills.Zeal,
    ], //
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.Smite,
        sdk.skills.BlessedAim,
        sdk.skills.Smite,
        sdk.skills.BlessedAim,
        sdk.skills.HolyBolt,
        sdk.skills.BlessedAim,
      ]; //
      Config.LowManaSkill = [sdk.skills.Smite, sdk.skills.BlessedAim]; //
      Config.BeltColumn = ["hp", "hp", "mp", "rv"]; // Start keeping rejuvs
      Config.LowGold = 2000; //Turning off picking up trash items for gold
      Config.UseMerc = true; // 是否使用佣兵。这个设定在非资料片中总是为false。 // Use merc. This is ignored and always false in d2classic.
      Config.LowManaSkill = [sdk.skills.Attack, sdk.skills.Might]; // Use Might while hitting stuff.
      Config.Charge = false; // Don't waste mana on charging while walking
    },
  },

  18: {
    SkillPoints: [
      sdk.skills.BlessedHammer,
      sdk.skills.Concentration,
      sdk.skills.Vigor,
    ], //
    Update: function () {
      Config.TownCheck = true; // Do go to town for more potions
      Config.MinColumn = [3, 3, 3, 3]; // Should have a decent belt by now
      Config.Charge = false; // Don't waste mana on charging while walking
      Config.MPBuffer = 8; // Need lots of mana for Blessed Hammer!
      Config.Vigor = true;
    },
  },

  24: {
    SkillPoints: [sdk.skills.HolyShield], //
    Update: function () {
      Config.Cubing = false; // Will have a cube by now.
    },
  },

  30: {
    SkillPoints: [sdk.skills.Fanaticism, sdk.skills.Salvation], //
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.Smite,
        sdk.skills.Fanaticism,
        sdk.skills.Smite,
        sdk.skills.Fanaticism,
        sdk.skills.HolyBolt,
        sdk.skills.Fanaticism,
      ]; //
      Config.LowManaSkill = [sdk.skills.Smite, sdk.skills.Fanaticism]; //
      Config.LowGold = 20000;
    },
  },
};
