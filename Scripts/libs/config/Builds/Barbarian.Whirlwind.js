import { sdk } from "@/modules/sdk.js";
import { Scripts, Config } from "@/common/Config.js";

export const AutoBuildTemplate = {
  1: {
    // SkillPoints: [-1], // This doesn't matter. We don't have skill points to spend at lvl 1
    // StatPoints: [-1, -1, -1, -1, -1], // This doesn't matter. We don't have stat points to spend at lvl 1
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
      Config.MinColumn = [0, 0, 0, 0];
      Config.OpenChests.Enabled = false; // Might as well open em.
      Config.Cubing = false; // Don't cube yet!
      Config.Inventory[0] = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
      Config.Inventory[1] = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
      Config.Inventory[2] = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
      Config.Inventory[3] = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
      Config.PickitFiles.push("follower-newbie.nip");
      Config.ScanShrines = [
        sdk.shrines.Refilling,
        sdk.shrines.Health,
        sdk.shrines.Stamina,
        sdk.shrines.Experience,
        sdk.shrines.ResistFire,
        sdk.shrines.ResistCold,
        sdk.shrines.ResistLightning,
        sdk.shrines.ResistPoison,
      ];
      Config.Follower.PickGold = false;
      Config.Follower.teleportOff = true; //mars set teleport off
      Config.Follower.SwitchAct = false; //跟随Leader自动切换act
    },
  },

  2: {
    SkillPoints: [sdk.skills.Bash], // Bash + 1 (level 1)
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.Attack,
        sdk.skills.Attack,
        sdk.skills.Attack,
        sdk.skills.Attack,
        -1,
        -1,
      ];
    },
  },

  3: {
    SkillPoints: [sdk.skills.Howl], // Howl + 1 (level 1)
    // StatPoints: [-1, -1, -1, -1, -1],
    // Update: function () {},
  },

  6: {
    SkillPoints: [sdk.skills.Shout, sdk.skills.Leap], // Shout + 1, Leap + 1 (level 1) (level 1) (1 saved point remains)
    Update: function () {
      Config.BeltColumn = ["hp", "hp", "hp", "mp"]; // Start keeping rejuvs
      Config.MinColumn = [1, 1, 1, 1];
      Config.HPBuffer = 4; // Number of healing potions to keep in inventory.
      Config.MPBuffer = 4; // Number of mana potions to keep in inventory.
    },
  },

  12: {
    SkillPoints: [sdk.skills.Stun, sdk.skills.IncreasedStamina], // Find Item + 1, Increased Stamina + 1 (level 1) (level 1) (0 saved points remain)
    Update: function () {
      Config.LowGold = 2000; //Turning off picking up trash items for gold
      Config.UseMerc = true; // 是否使用佣兵。这个设定在非资料片中总是为false。 // Use merc. This is ignored and always false in d2classic.
    },
  },

  18: {
    SkillPoints: [
      sdk.skills.LeapAttack,
      sdk.skills.Concentrate,
      sdk.skills.IronSkin,
    ], // Iron Skin + 1 (level 1)
    Update: function () {
      Config.MPBuffer = 8; // Need lots of mana for Blessed Hammer!
    },
  },

  24: {
    SkillPoints: [sdk.skills.BattleOrders, sdk.skills.IncreasedSpeed], // Battle Orders + 1, Increased Speed + 1 (level 1) (level 1) (0 saved points remain)
    Update: function () {
      // Config.Cubing = true; // Will have a cube by now.
    },
  },

  30: {
    SkillPoints: [
      sdk.skills.Whirlwind,
      sdk.skills.BattleCommand,
      sdk.skills.NaturalResistance,
    ], // Battle Command + 1, Natural Resistance + 1 , Leap + 2 (level 1) (level 1) (level 6) (Norm Izual)
    Update: function () {
      Config.LowGold = 20000;
      Config.AttackSkill = [
        -1,
        sdk.skills.Whirlwind,
        sdk.skills.Whirlwind,
        sdk.skills.Whirlwind,
        sdk.skills.Whirlwind,
        -1,
        -1,
      ];
    },
  },
};
