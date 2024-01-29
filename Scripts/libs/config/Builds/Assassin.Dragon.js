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
      Config.BeltColumn = ["hp", "hp", "hp", "hp"]; // Keep tons of health potions!
      Config.MinColumn = [1, 1, 1, 1];
      Config.OpenChests.Enabled = true; // Might as well open em.
      Config.OpenChests.Range = 15; // radius to scan for chests while pathing
      Config.OpenChests.Types = ["all"]; // which chests to open, use "all" to open all chests. See sdk/chests.txt for full list of chest names
      Config.Cubing = false; // Don't cube yet!
      Config.UseTraps = false; // Set to true to use traps
      Config.Follower.PickGold = true;
      Config.Follower.teleportOff = true; //mars set teleport off
      Config.Follower.SwitchAct = false; //跟随Leader自动切换act
    },
  },

  2: {
    SkillPoints: [sdk.skills.FireBlast], // Fire Trauma + 1 (level 1)
    StatPoints: [
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Vitality,
      sdk.stats.Vitality,
    ], // Strength + 3, Vitality + 2 (26) (29)
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.Attack,
        -1,
        sdk.skills.Attack,
        -1,
        -1,
        -1,
      ]; // Use  bow

      Config.LowManaSkill = [sdk.skills.Attack, -1]; // Use Might while hitting stuff.
      Config.BeltColumn = ["hp", "hp", "mp", "mp"];
      Config.HPBuffer = 4; // Number of healing potions to keep in inventory.
      Config.MPBuffer = 8; // Number of mana potions to keep in inventory.
      Config.UseTraps = true; // Set to true to use traps
      Config.Traps = [
        sdk.skills.FireBlast,
        sdk.skills.FireBlast,
        sdk.skills.FireBlast,
        -1,
        -1,
      ]; // Skill IDs for traps to be cast on all mosters except act bosses.
    },
  },

  3: {
    SkillPoints: [sdk.skills.DragonTalon], // Dragon Talon + 1 (level 1)
    StatPoints: [
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Vitality,
      sdk.stats.Vitality,
    ], // Strength + 3, Vitality + 2 (28) (32)
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.DragonTalon,
        sdk.skills.Attack,
        sdk.skills.DragonTalon,
        sdk.skills.Attack,
        -1,
        -1,
      ]; // Use  bow
      Config.LowManaSkill = [sdk.skills.Attack, sdk.skills.Attack]; // Use Might while hitting stuff.
    },
  },

  4: {
    SkillPoints: [sdk.skills.PsychicHammer], // Psychic Hammer + 1 (level 1)
    StatPoints: [
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Vitality,
      sdk.stats.Vitality,
    ], // Strength + 3, Vitality + 2 (31) (34)
    Update: function () {},
  },

  5: {
    SkillPoints: [sdk.skills.ClawMastery], // Claw Mastery + 1 (1 saved point remains)
    StatPoints: [
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Vitality,
      sdk.stats.Vitality,
    ], // Strength + 4, Vitality + 1 (35) (35)
    Update: function () {
      Config.MinColumn = [1, 1, 1, 1];
      Config.TownCheck = true;
    },
  },

  6: {
    SkillPoints: [sdk.skills.BurstofSpeed], //Quickness  BOS + 1,  (0 saved points remain)
    StatPoints: [
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Strength,
      sdk.stats.Vitality,
      sdk.stats.Vitality,
    ], // Strength + 2, Vitality + 3 (37) (38)
    Update: function () {
      Config.UseBoS = true;
    },
  },

  7: {
    SkillPoints: [sdk.skills.ShockWeb], // 	Shock Field + 1 (1 saved point remains)
    Update: function () {
      Config.UseTraps = true; // Set to true to use traps
      Config.Traps = [
        sdk.skills.FireBlast,
        sdk.skills.FireBlast,
        sdk.skills.ShockWeb,
        sdk.skills.ShockWeb,
        sdk.skills.ShockWeb,
      ]; // Skill IDs for traps to be cast on all mosters except act bosses.
      //Config.PickitFiles.splice(Config.PickitFiles.indexOf("belowlevelseven.nip"), 1);	// Will remove index "belowlevel7.nip" from Config.PickitFiles
    },
  },

  10: {
    Update: function () {
      Config.StashGold = 1000; // Minimum amount of gold to stash.
      Config.MinColumn = [1, 1, 1, 1];
    },
  },

  12: {
    SkillPoints: [
      sdk.skills.ChargedBoltSentry,
      sdk.skills.WeaponBlock,
      sdk.skills.CloakofShadows,
    ], // Charge + 1, Blessed Aim + 1, Cleansing + 1 (level 1) (level 1) (level 1) (3 saved points remain)
    Update: function () {
      Config.UseTraps = true;
      Config.Traps = [
        sdk.skills.ChargedBoltSentry,
        sdk.skills.ChargedBoltSentry,
        sdk.skills.ChargedBoltSentry,
        sdk.skills.ChargedBoltSentry,
        sdk.skills.ChargedBoltSentry,
      ]; //261 Charged Bolt Sentry
      Config.BossTraps = [
        sdk.skills.ChargedBoltSentry,
        sdk.skills.ChargedBoltSentry,
        sdk.skills.ChargedBoltSentry,
        sdk.skills.ChargedBoltSentry,
        sdk.skills.ChargedBoltSentry,
      ];
      Config.LowGold = 2000; //Turning off picking up trash items for gold
      Config.UseMerc = true; // 是否使用佣兵。这个设定在非资料片中总是为false。 // Use merc. This is ignored and always false in d2classic.
    },
  },

  18: {
    SkillPoints: [sdk.skills.ShadowWarrior, sdk.skills.Fade, -1, -1, -1], // Blessed Hammer + 1, Concentration + 1, Vigor + 1 (level 1) (level 1) (level 1) (6 saved points remain)
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.DragonTalon,
        sdk.skills.DragonTalon,
        sdk.skills.DragonTalon,
        sdk.skills.DragonTalon,
        -1,
        -1,
      ]; //
      Config.LowManaSkill = [-1, -1]; // Use Might while hitting stuff.
      Config.UseTraps = true;
      Config.SummonShadow = "Warrior";
      Config.Dodge = true; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
      Config.DodgeRange = 12; // Distance to keep from monsters.
      Config.TownCheck = true; // Do go to town for more potions
      Config.MinColumn = [3, 3, 3, 3]; // Should have a decent belt by now
      Config.Charge = false; // Don't waste mana on charging while walking
      Config.MPBuffer = 4; // Need lots of mana for Blessed Hammer!
    },
  },

  24: {
    SkillPoints: [sdk.skills.LightningSentry, sdk.skills.MindBlast], // Blessed Hammer + 1, Holy Shield + 1, Meditation + 1 (level 7) (level 1) (level 1) (0 saved points remain)
    Update: function () {
      Config.UseTraps = true;
      Config.Traps = [
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
      ];
      Config.BossTraps = [
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
      ];
      Config.Cubing = true; // Will have a cube by now.
      Config.Dodge = true; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
      Config.DodgeRange = 12; // Distance to keep from monsters.
    },
  },

  30: {
    SkillPoints: [sdk.skills.ShadowMaster, sdk.skills.DeathSentry], // Blessed Hammer + 1, Blessed Aim + 2 (level 13) (level 5) (Norm Izual)
    Update: function () {
      Config.UseTraps = true;
      Config.Traps = [
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.DeathSentry,
        sdk.skills.DeathSentry,
      ];
      Config.BossTraps = [
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.LightningSentry,
        sdk.skills.DeathSentry,
        sdk.skills.DeathSentry,
      ];
      Config.DodgeRange = 13; // Distance to keep from monsters.
      Config.SummonShadow = "Master"; // 0 = don't summon, 1 or "Warrior" = summon Shadow Warrior, 2 or "Master" = summon Shadow Master
    },
  },
};
