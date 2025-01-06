import { sdk } from "@/modules/sdk.js";
import { Scripts, Config } from "@/common/Config.js";

export const AutoBuildTemplate = {
  1: {
    //SkillPoints: [-1],										// This doesn't matter. We don't have skill points to spend at lvl 1]
    //StatPoints: [-1,-1,-1,-1,-1],								// This doesn't matter. We don't have stat points to spend at lvl 1
    Update: function () {
      Config.TownCheck = false; // Don't go to town for more potions
      Config.StashGold = 200; // Minimum amount of gold to stash.
      Config.AttackSkill = [-1, 0, -1, 0, -1, -1, -1];
      Config.LowManaSkill = [0, 0];
      Config.BeltColumn = ["hp", "hp", "hp", "hp"]; // Keep tons of health potions!
      Config.MinColumn = [1, 1, 1, 1];
      Config.Cubing = false; // Don't cube yet!
      Config.UseTraps = false; // Set to true to use traps
      Config.Follower.PickGold = true;
      Config.Follower.teleportOff = true; //mars set teleport off
      Config.Follower.SwitchAct = false; //
    },
  },

  2: {
    SkillPoints: [sdk.skills.FireBlast], // Fire Trauma + 1 (level 1)
    StatPoints: [0, 0, 0, 3, 3], // Strength + 1, Vitality + 4 (26) (29)
    Update: function () {
      Config.AttackSkill = [-1, 0, -1, 0, -1, -1, -1]; // Use  bow
      Config.LowManaSkill = [0, -1]; // Use Might while hitting stuff.
      Config.UseTraps = true; // Set to true to use traps
      Config.Traps = [
        sdk.skills.FireBlast,
        sdk.skills.FireBlast,
        sdk.skills.FireBlast,
        sdk.skills.FireBlast,
        sdk.skills.FireBlast,
      ]; // Skill IDs for traps to be cast on all mosters except act bosses.
    },
  },

  3: {
    SkillPoints: [253], // Psychic Hammer + 1 (level 1)
    StatPoints: [0, 0, 0, 3, 3], // Strength + 2, Vitality + 3 (28) (32)
    Update: function () {},
  },

  4: {
    SkillPoints: [255], // Dragon Talon + 1 (level 1)
    StatPoints: [0, 0, 0, 3, 3], // Strength + 3, Vitality + 2 (31) (34)
    Update: function () {},
  },

  5: {
    SkillPoints: [252], // Claw Mastery + 1 (1 saved point remains)
    StatPoints: [0, 0, 0, 3, 3], // Strength + 4, Vitality + 1 (35) (35)
    Update: function () {
      Config.ScanShrines = [15, 13, 12];
      Config.MinColumn = [1, 1, 1, 1];
      Config.AttackSkill = [-1, 0, -1, 0, -1, -1, -1]; // Use  bow
      Config.LowManaSkill = [0, -1];
      // Config.TownCheck = true;
    },
  },

  6: {
    SkillPoints: [258], //Quickness  BOS + 1,  (0 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Strength + 2, Vitality + 3 (37) (38)
    Update: function () {
      Config.AttackSkill = [-1, 0, -1, 0, -1, -1, -1]; // Use  bow
      Config.UseBoS = true;
    },
  },

  7: {
    SkillPoints: [256], // 	Shock Field + 1 (1 saved point remains)
    StatPoints: [0, 0, 0, 3, 3], // Strength + 2, Vitality + 3 (39) (41)
    Update: function () {
      Config.UseTraps = true; // Set to true to use traps
      Config.Traps = [251, 251, 256, 256, 256]; // Skill IDs for traps to be cast on all mosters except act bosses.
      //Config.PickitFiles.splice(Config.PickitFiles.indexOf("belowlevelseven.nip"), 1);	// Will remove index "belowlevel7.nip" from Config.PickitFiles
    },
  },

  8: {
    SkillPoints: [-1], // Save Point + 1 (2 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Strength + 1, Vitality + 4 (40) (45)
    Update: function () {},
  },

  9: {
    SkillPoints: [-1], // Save Point + 1 (3 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (50)
    Update: function () {},
  },

  10: {
    SkillPoints: [-1], // Save Point + 1 (4 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (55)
    Update: function () {
      Config.StashGold = 1000; // Minimum amount of gold to stash.
      Config.BeltColumn = ["hp", "hp", "mp", "mp"]; // Start keeping rejuvs
      Config.MinColumn = [1, 1, 1, 1];
    },
  },

  11: {
    SkillPoints: [-1], // Save Point + 1 (5 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (60)
    Update: function () {},
  },

  12: {
    SkillPoints: [261, 264, 263], // Charge + 1, Blessed Aim + 1, Cleansing + 1 (level 1) (level 1) (level 1) (3 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (65)
    Update: function () {
      Config.AttackSkill = [-1, 0, -1, 0, -1, -1, -1]; // Use  bow
      Config.LowManaSkill = [-1, -1]; // Use Blessed Aim while hitting stuff.
      Config.UseTraps = true;
      Config.Traps = [261, 261, 261, 261, 261]; //261 Charged Bolt Sentry
      Config.BossTraps = [261, 261, 261, 261, 261];
      // Config.LowGold = 2000; //Turning off picking up trash items for gold
      Config.UseMerc = true; // Use merc. This is ignored and always false in d2classic.
    },
  },

  13: {
    SkillPoints: [-1, -1, -1], // Blessed Aim + 1 (level 2) Save Point + 1 (4 saved points remain) (Normal Den of Evil Used)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (70)
    Update: function () {},
  },

  14: {
    SkillPoints: [-1], // Save Point + 1 (5 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (75)
    Update: function () {},
  },

  15: {
    SkillPoints: [-1], // Save Point + 1 (6 saved points remain)
    // StatPoints: [0, 3, 3, 3, 3], // Vitality + 5 (80)
    Update: function () {
      // Config.OpenChests.Enabled = false; // Eyes on the prize!
      // Config.LowGold = 9000;
    },
  },

  16: {
    SkillPoints: [-1], // Save Point + 1 (7 saved points remain)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (85)
    Update: function () {},
  },

  17: {
    SkillPoints: [-1], // Save Point + 1 (8 saved points remain)
    // StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (90)
    Update: function () {},
  },

  18: {
    SkillPoints: [268, 267, -1, -1, -1], // Blessed Hammer + 1, Concentration + 1, Vigor + 1 (level 1) (level 1) (level 1) (6 saved points remain)
    StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (95)
    Update: function () {
      Config.AttackSkill = [-1, 0, 0, 0, 0, -1, -1]; //
      Config.LowManaSkill = [-1, -1]; // Use Concentration while hitting stuff.
      Config.UseTraps = true;
      Config.Traps = [261, 261, 261, 261, 261];
      Config.BossTraps = [261, 261, 261, 261, 261];
      Config.SummonShadow = "Warrior";
      Config.Dodge = true; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
      Config.DodgeRange = 12; // Distance to keep from monsters.
      Config.TownCheck = true; // Do go to town for more potions
      Config.MinColumn = [3, 3, 3, 3]; // Should have a decent belt by now
      Config.Charge = false; // Don't waste mana on charging while walking
      // Config.MPBuffer = 8; // Need lots of mana for Blessed Hammer!
    },
  },

  19: {
    SkillPoints: [-1], // Blessed Hammer + 1, Concentration + 1 (level 2) (level 2) (5 saved points remain)
    // StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (100)
    Update: function () {},
  },

  20: {
    SkillPoints: [-1], // Blessed Hammer + 1, Concentration + 1 (level 3) (level 3) (4 saved points remain)
    // StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (105)
    Update: function () {},
  },

  21: {
    SkillPoints: [-1], // Blessed Hammer + 1, Concentration + 1 (level 4) (level 4) (3 saved points remain)
    // StatPoints: [0, 0, 0, 3, 3], // Vitality + 5 (110)
    Update: function () {},
  },

  22: {
    SkillPoints: [-1], // Blessed Hammer + 1, Concentration + 1 (level 5) (level 5) (2 saved points remain)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (115)
    Update: function () {},
  },

  23: {
    SkillPoints: [-1], // Blessed Hammer + 1 (level 6) (2 saved points remain)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (120)
    Update: function () {},
  },

  24: {
    SkillPoints: [271, 273], // Blessed Hammer + 1, Holy Shield + 1, Meditation + 1 (level 7) (level 1) (level 1) (0 saved points remain)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (125)
    Update: function () {
      Config.AttackSkill = [273, 0, 0, 0, 0, -1, 273]; // Holy Bolt and Meditation for Secondary Skill/Aura.
      Config.LowManaSkill = [-1, -1]; // Use Meditation while hitting stuff.
      Config.UseTraps = true;
      Config.Traps = [271, 271, 271, 271, 271];
      Config.BossTraps = [271, 271, 271, 271, 271];
      Config.Cubing = true; // Will have a cube by now.
      Config.Dodge = true; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
      Config.DodgeRange = 12; // Distance to keep from monsters.
    },
  },

  25: {
    SkillPoints: [271], // Blessed Hammer + 1 (level 8)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (130)
    Update: function () {
      // Config.LowGold = 15000;
    },
  },

  26: {
    SkillPoints: [271], // Blessed Hammer + 1 (level 9)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (135)
    Update: function () {},
  },

  27: {
    SkillPoints: [271], // Blessed Hammer + 1, Blessed Aim + 1 (level 10) (level 3) (Norm Radament)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (140)
    Update: function () {},
  },

  28: {
    SkillPoints: [271], // Blessed Hammer + 1 (level 11)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (145)
    Update: function () {},
  },

  29: {
    SkillPoints: [271], // Blessed Hammer + 1 (level 12)
    // StatPoints: [3, 3, 3, 3, 3], // Vitality + 5 (150)
    Update: function () {},
  },

  30: {
    SkillPoints: [279, 276], // Blessed Hammer + 1, Blessed Aim + 2 (level 13) (level 5) (Norm Izual)
    // StatPoints: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3], // Vitality + 10 (160) (Norm Lam Esen's Tome)
    Update: function () {
      Config.AttackSkill = [273, 255, 0, 255, 0, -1, 273]; // Holy Bolt and Meditation for Secondary Skill/Aura.
      Config.LowManaSkill = [-1, -1];
      Config.UseTraps = true;
      Config.Traps = [271, 271, 276, 271, 271];
      Config.BossTraps = [271, 271, 271, 271, 271];
      Config.DodgeRange = 13; // Distance to keep from monsters.
      Config.SummonShadow = "Master"; // 0 = don't summon, 1 or "Warrior" = summon Shadow Warrior, 2 or "Master" = summon Shadow Master
    },
  },
};
