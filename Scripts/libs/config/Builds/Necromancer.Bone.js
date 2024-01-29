import { sdk } from "@/modules/sdk.js";
import { Scripts, Config } from "@/common/Config.js";

export const AutoBuildTemplate = {
  1: {
    Update: function () {
      Config.TownCheck = false; // Don't go to town for more potions
      Config.AttackSkill = [
        -1,
        sdk.skills.Attack,
        sdk.skills.Attack,
        sdk.skills.Attack,
        sdk.skills.Attack,
        -1,
        -1,
      ];
      Config.LowManaSkill = [-1, -1];
      Config.ScanShrines = [15, 13, 12, 14, 7, 6, 2];
      Config.BeltColumn = ["hp", "hp", "hp", "mp"]; // Keep tons of health potions!
      Config.MinColumn = [1, 1, 1, 1];
      Config.Inventory[0] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[1] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[2] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[3] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.PickitFiles.push("follower-newbie.nip"); //must in lvl1 for pickit init
      Config.StashGold = 200; // Minimum amount of gold to stash.
      Config.Cubing = false; // Don't cube yet!
      Config.Follower.PickGold = false;
      Config.Follower.teleportOff = true; //mars set teleport off
      Config.Follower.SwitchAct = false; //跟随Leader自动切换act
      // Speedup config. Full packet casting is not recommended for melee skills.
      Config.ExplodeCorpses = 0;
      Config.Golem = "None";
      Config.FCR = 255;
      Config.FHR = 255;
      Config.FBR = 255;
      Config.IAS = 255;
    },
  },

  2: {
    SkillPoints: [sdk.skills.RaiseSkeleton], // Might + 1 (level 1)
    Update: function () {
      Config.BeltColumn = ["hp", "hp", "mp", "mp"];
      Config.HPBuffer = 4; // Number of healing potions to keep in inventory.
      Config.MPBuffer = 12; // Number of mana potions to keep in inventory.
    },
  },

  3: {
    SkillPoints: [sdk.skills.AmplifyDamage], // Amplify Damage + 1 (level 1)
    Update: function () {
      Config.Curse[0] = sdk.skills.AmplifyDamage;

      Config.ActiveSummon = true;
      Config.Skeletons = "max";
    },
  },

  4: {
    SkillPoints: [sdk.skills.BoneArmor], // Prayer + 1 (level 1)
    Update: function () {
      //in Nec's Attack common file, the 500 only for Pure Summoner, stay a good position and do noting
    },
  },

  6: {
    SkillPoints: [sdk.skills.SkeletonMastery, sdk.skills.ClayGolem], // Holy Bolt + 1, Defiance + 1 (level 1) (level 2) (0 saved points remain)
    Update: function () {
      Config.Golem = "Clay";
      Config.Skeletons = "max";
    },
  },

  8: {
    SkillPoints: [sdk.skills.Teeth, sdk.skills.CorpseExplosion], // Holy Bolt + 1, Defiance + 1 (level 1) (level 2) (0 saved points remain)
    Update: function () {
      Config.ExplodeCorpses = sdk.skills.CorpseExplosion;
    },
  },

  12: {
    SkillPoints: [sdk.skills.GolemMastery], //
    Update: function () {
      Config.AttackSkill = [-1, -1, -1, -1, -1, -1, -1]; // Use Might
      Config.LowManaSkill = [-1, -1]; // Use Blessed Aim while hitting stuff.
      Config.SkeletonMages = "max";
      Config.LowGold = 2000; //Turning off picking up trash items for gold
      Config.UseMerc = true; // 是否使用佣兵。这个设定在非资料片中总是为false。 // Use merc. This is ignored and always false in d2classic.
    },
  },

  18: {
    Update: function () {
      Config.TownCheck = true; // Do go to town for more potions
      Config.MinColumn = [3, 3, 3, 0]; // Should have a decent belt by now
      Config.MPBuffer = 8; // Need lots of mana for Blessed Hammer!
    },
  },

  24: {
    SkillPoints: [
      sdk.skills.SummonResist,
      sdk.skills.Weaken,
      sdk.skills.Terror,
      sdk.skills.Decrepify,
    ], // Blessed Hammer + 1, Holy Shield + 1, Meditation + 1 (level 7) (level 1) (level 1) (0 saved points remain)
    Update: function () {
      Config.Curse[0] = sdk.skills.Decrepify;
      Config.Curse[1] = sdk.skills.AmplifyDamage;
      Config.Golem = "1";
      Config.Skeletons = "max";
      Config.SkeletonMages = "max";
      Config.PoisonNovaDelay = 2;
      Config.ActiveSummon = true;
      Config.ReviveUnstackable = false;
      Config.IronGolemChicken = 30;
      // Config.Cubing = true; // Will have a cube by now.
      Config.Dodge = true; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
      Config.DodgeRange = 15; // Distance to keep from monsters.
    },
  },

  30: {
    SkillPoints: [
      sdk.skills.PoisonDagger,
      sdk.skills.PoisonExplosion,
      sdk.skills.PoisonNova,
    ], // Blessed Hammer + 1, Blessed Aim + 2 (level 13) (level 5) (Norm Izual)
    Update: function () {
      Config.Revives = "max";
    },
  },
};
