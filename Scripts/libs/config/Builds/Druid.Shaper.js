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
      Config.Follower.SwitchAct = false; //
    },
  },

  2: {
    SkillPoints: [sdk.skills.Werewolf], //
    Update: function () {
      Config.Wereform = "Werewolf"; // 0 / false - don't shapeshift, 1 / "Werewolf" - change to werewolf, 2 / "Werebear" - change to werebear
    },
  },

  3: {
    SkillPoints: [sdk.skills.Lycanthropy], //
    // StatPoints: [-1, -1, -1, -1, -1],
    Update: function () {},
  },

  6: {
    SkillPoints: [sdk.skills.PoisonCreeper, sdk.skills.OakSage], // Shout + 1, Leap + 1 (level 1) (level 1) (1 saved point remains)
    Update: function () {
      Config.BeltColumn = ["hp", "hp", "hp", "mp"]; // Start keeping rejuvs
      Config.MinColumn = [1, 1, 1, 1];
      Config.HPBuffer = 4; // Number of healing potions to keep in inventory.
      Config.MPBuffer = 4; // Number of mana potions to keep in inventory.
      Config.SummonSpirit = "Oak Sage"; // 0 = disabled, 1 / "Oak Sage", 2 / "Heart of Wolverine", 3 / "Spirit of Barbs"
      Config.SummonRaven = true;
      Config.SummonVine = "Poison Creeper"; // 0 = disabled, 1 / "Poison Creeper", 2 / "Carrion Vine", 3 / "Solar Creeper"
    },
  },

  12: {
    SkillPoints: [sdk.skills.FeralRage], //
    Update: function () {
      Config.LowGold = 2000; //Turning off picking up trash items for gold
      Config.UseMerc = true; // Use merc. This is ignored and always false in d2classic.
      Config.AttackSkill = [
        -1,
        sdk.skills.FeralRage,
        sdk.skills.FeralRage,
        sdk.skills.FeralRage,
        sdk.skills.FeralRage,
        -1,
        -1,
      ];
    },
  },

  18: {
    SkillPoints: [sdk.skills.Rabies], //
    Update: function () {
      Config.MPBuffer = 8; // Need lots of mana
    },
  },

  24: {
    SkillPoints: [-1], //
  },

  30: {
    SkillPoints: [sdk.skills.Fury, sdk.skills.SummonGrizzly], // Battle Command + 1, Natural Resistance + 1 , Leap + 2 (level 1) (level 1) (level 6) (Norm Izual)
    Update: function () {
      Config.LowGold = 20000;

      Config.AttackSkill = [
        sdk.skills.FeralRage,
        sdk.skills.Fury,
        sdk.skills.Fury,
        sdk.skills.Fury,
        sdk.skills.Fury,
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
