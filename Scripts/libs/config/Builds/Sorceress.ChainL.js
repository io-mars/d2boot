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
      Config.MinColumn = [0, 0, 0, 0];
      Config.OpenChests.Enabled = true; // Might as well open em.
      Config.Cubing = false; // Don't cube yet!
      Config.PickitFiles.push("follower-newbie.nip");
      Config.Follower.PickGold = true;
      Config.Follower.teleportOff = true; //mars set teleport off
      Config.Follower.SwitchAct = false; //跟随Leader自动切换act
    },
  },

  2: {
    SkillPoints: [sdk.skills.ChargedBolt], // Charged Bolt + 1 (level 1)
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.ChargedBolt,
        -1,
        sdk.skills.ChargedBolt,
        -1,
        0,
        0,
      ]; // Charged Bolt
      Config.BeltColumn = ["hp", "hp", "mp", "mp"];
      Config.HPBuffer = 4; // Number of healing potions to keep in inventory.
      Config.MPBuffer = 12; // Number of mana potions to keep in inventory.
    },
  },

  3: {
    SkillPoints: [sdk.skills.Warmth], // Charged Bolt + 1 (level 2)
    Update: function () {},
  },

  6: {
    SkillPoints: [
      sdk.skills.FrozenArmor,
      sdk.skills.StaticField,
      sdk.skills.Telekinesis,
    ], // Static Field + 1, Telekinesis + 1 (level 1) (level 1) (0 saved points remain)
    Update: function () {
      Config.MinColumn = [1, 1, 1, 0];
      Config.CastStatic = 70; // Cast static until the target is at designated life percent. 100 = disabled.
    },
  },

  12: {
    SkillPoints: [sdk.skills.Nova, sdk.skills.Lightning], // Nova + 1 (level 1)
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.Lightning,
        sdk.skills.Lightning,
        sdk.skills.Lightning,
        sdk.skills.Lightning,
        -1,
        -1,
      ]; //
    },
  },

  18: {
    SkillPoints: [sdk.skills.Teleport, sdk.skills.ChainLightning], // Teleport + 1, ChainLightening + 1 (level 1) (level 1) (0 saved points remain)
    Update: function () {
      Config.AttackSkill = [
        -1,
        sdk.skills.Lightning,
        sdk.skills.Lightning,
        sdk.skills.ChainLightning,
        sdk.skills.ChainLightning,
        -1,
        -1,
      ]; //
      Config.LowManaSkill = [sdk.skills.StaticField, -1]; //
    },
  },

  24: {
    SkillPoints: [sdk.skills.EnergyShield, sdk.skills.ThunderStorm], // EnergyShield + 1 (level 1)
    Update: function () {
      Config.BeltColumn = ["hp", "mp", "mp", "rv"];
      // Config.Cubing = true; // Will have a cube by now.
    },
  },

  30: {
    SkillPoints: [sdk.skills.LightningMastery], // Light Mastery + 1 (Norm Izual)
    Update: function () {
      Config.LowGold = 20000;
    },
  },
};
