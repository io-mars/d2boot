import { sdk } from "@/modules/sdk.js";
import { NPC } from "@/common/Town.js";
import { Runeword } from "@/common/Runewords.js";
import { Recipe, Roll } from "@/common/Cubing.js";
import { Scripts, Config } from "@/common/Config.js";

export const LoadConfig = function () {
  // ########################### //
  /* ##### ATTACK SETTINGS ##### */
  // ########################### //

  /* Attack config
   * To disable an attack, set it to -1
   * Skills MUST be POSITIVE numbers. For reference see ...\kolbot\sdk\skills.txt or use sdk.skills.SkillName see -> \kolbot\libs\modules\sdk.js
   * DO NOT LEAVE THE NEGATIVE SIGN IN FRONT OF THE SKILLID.
   * GOOD: Config.AttackSkill[1] = 56;
   * GOOD: Config.AttackSkill[1] = sdk.skills.Meteor;
   * BAD: Config.AttackSkill[1] = -56;
   * BAD: Config.AttackSkill[1] = "meteor";
   */
  Config.AttackSkill[0] = -1; // Preattack skill.
  Config.AttackSkill[1] = sdk.skills.Blizzard; // Primary skill to bosses.
  Config.AttackSkill[2] = sdk.skills.GlacialSpike; // Primary untimed skill to bosses. Keep at -1 if Config.AttackSkill[1] is untimed skill.
  Config.AttackSkill[3] = sdk.skills.Blizzard; // Primary skill to others.
  Config.AttackSkill[4] = sdk.skills.GlacialSpike; // Primary untimed skill to others. Keep at -1 if Config.AttackSkill[3] is untimed skill.
  Config.AttackSkill[5] = -1; // Secondary skill if monster is immune to primary.
  Config.AttackSkill[6] = -1; // Secondary untimed skill if monster is immune to primary untimed.

  // Low mana skills - these will be used if main skills can't be cast.
  Config.LowManaSkill[0] = -1; // Timed low mana skill.
  Config.LowManaSkill[1] = -1; // Untimed low mana skill.

  /* Advanced Attack config. Allows custom skills to be used on custom monsters.
   *	Format: "Monster Name": [timed skill id, untimed skill id]
   *	Example: "Baal": [38, -1] to use charged bolt on Baal
   *	Multiple entries are separated by commas
   */
  Config.CustomAttack = {
    //"Monster Name": [-1, -1]
  };

  Config.Dodge = true; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
  Config.DodgeRange = 15; // Distance to keep from monsters.

  // ############################ //
  /* ###### CLASS SETTINGS ###### */
  // ############################ //
  Config.CastStatic = 60; // Cast static until the target is at designated life percent. 100 = disabled.
  Config.StaticList.push(); // List of monster NAMES or CLASSIDS to static. Example: Config.StaticList = ["Andariel", 243];
  Config.UseTelekinesis = true; // Use telekinesis on units that allow it. Example: Shrines, Waypoints, Chests, and Portals
  Config.UseEnergyShield = false; // set to true to use energy shield if its available
  Config.UseColdArmor = true; // use armor skills, uses skill ids or set to true to let the bot decide based on skill level or false to disable completely
  // (40 / sdk.skills.FrozenArmor)(50 / sdk.skills.ShiverArmor)(60 / sdk.skills.ChillingArmor)
};
