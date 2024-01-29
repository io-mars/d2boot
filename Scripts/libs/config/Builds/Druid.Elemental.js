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
      Config.Inventory[0] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[1] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[2] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
      Config.Inventory[3] = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1];
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
      Config.Follower.PickGold = true;
      Config.Follower.teleportOff = true; //mars set teleport off
      Config.Follower.SwitchAct = false; //跟随Leader自动切换act
    },
  },

  2: {
    SkillPoints: [sdk.skills.PoisonCreeper], //
  },

  3: {
    SkillPoints: [sdk.skills.Raven], //
    // StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {
      Config.SummonRaven = true;
      Config.SummonVine = "Poison Creeper"; // 0 = disabled, 1 / "Poison Creeper", 2 / "Carrion Vine", 3 / "Solar Creeper"
    },
  },

  6: {
    SkillPoints: [
      sdk.skills.OakSage,
      sdk.skills.SummonSpiritWolf,
      sdk.skills.ArcticBlast,
    ], // Shout + 1, Leap + 1 (level 1) (level 1) (1 saved point remains)
    Update: function () {
      Config.BeltColumn = ["hp", "hp", "hp", "mp"]; // Start keeping rejuvs
      Config.MinColumn = [1, 1, 1, 1];
      Config.HPBuffer = 4; // Number of healing potions to keep in inventory.
      Config.MPBuffer = 4; // Number of mana potions to keep in inventory.
      Config.SummonSpirit = "Oak Sage"; // 0 = disabled, 1 / "Oak Sage", 2 / "Heart of Wolverine", 3 / "Spirit of Barbs"
    },
  },

  12: {
    SkillPoints: [sdk.skills.CycloneArmor], //
    Update: function () {
      Config.LowGold = 2000; //Turning off picking up trash items for gold
      Config.UseMerc = true; // 是否使用佣兵。这个设定在非资料片中总是为false。 // Use merc. This is ignored and always false in d2classic.
    },
  },

  18: {
    SkillPoints: [sdk.skills.SummonDireWolf, sdk.skills.Twister], //
    Update: function () {
      Config.MPBuffer = 8; // Need lots of mana
    },
  },

  24: {
    SkillPoints: [sdk.skills.Tornado], //
  },

  30: {
    SkillPoints: [sdk.skills.Hurricane, sdk.skills.SummonGrizzly], // Battle Command + 1, Natural Resistance + 1 , Leap + 2 (level 1) (level 1) (level 6) (Norm Izual)
    Update: function () {
      Config.LowGold = 20000;

      Config.AttackSkill = [
        -1,
        sdk.skills.Tornado,
        sdk.skills.Tornado,
        sdk.skills.Tornado,
        sdk.skills.Tornado,
        -1,
        -1,
      ];
      Config.SummonRaven = true;
      Config.SummonRaven = false;
      Config.SummonAnimal = "Grizzly"; // 0 = disabled, 1 or "Spirit Wolf" = summon spirit wolf, 2 or "Dire Wolf" = summon dire wolf, 3 or "Grizzly" = summon grizzly
      Config.SummonSpirit = "Oak Sage"; // 0 = disabled, 1 / "Oak Sage", 2 / "Heart of Wolverine", 3 / "Spirit of Barbs"
      Config.SummonVine = "Poison Creeper"; // 0 = disabled, 1 / "Poison Creeper", 2 / "Carrion Vine", 3 / "Solar Creeper"
    },
  },
};
