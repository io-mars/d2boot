import { sdk } from "@/modules/sdk.js";
import { NPC } from "@/common/Town.js";
import { Runeword } from "@/common/Runewords.js";
import { Recipe, Roll } from "@/common/Cubing.js";
import { Scripts, Config } from "@/common/Config.js";

export const LoadConfig = function () {
  Config.OpenChests.Enabled = true; // Open chests. Controls key buying.

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
  Config.AttackSkill[1] = sdk.skills.DragonTalon; // Primary skill to bosses.
  Config.AttackSkill[2] = sdk.skills.DragonTalon; // Primary untimed skill to bosses. Keep at -1 if Config.AttackSkill[1] is untimed skill.
  Config.AttackSkill[3] = sdk.skills.DragonTalon; // Primary skill to others.
  Config.AttackSkill[4] = sdk.skills.DragonTalon; // Primary untimed skill to others. Keep at -1 if Config.AttackSkill[3] is untimed skill.
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

  Config.Dodge = false; // Move away from monsters that get too close. Don't use with short-ranged attacks like Poison Dagger.
  Config.DodgeRange = 15; // Distance to keep from monsters.

  // ############################ //
  /* ###### CLASS SETTINGS ###### */
  // ############################ //
  Config.UseTraps = true; // Set to true to use traps
  Config.Traps = [
    sdk.skills.LightningSentry,
    sdk.skills.LightningSentry,
    sdk.skills.LightningSentry,
    sdk.skills.DeathSentry,
    sdk.skills.DeathSentry,
  ]; // Skill IDs for traps to be cast on all mosters except act bosses.
  Config.BossTraps = [
    sdk.skills.LightningSentry,
    sdk.skills.LightningSentry,
    sdk.skills.LightningSentry,
    sdk.skills.DeathSentry,
    sdk.skills.DeathSentry,
  ]; // Skill IDs for traps to be cast on act bosses.

  Config.SummonShadow = "Master"; // 0 = don't summon, 1 or "Warrior" = summon Shadow Warrior, 2 or "Master" = summon Shadow Master
  Config.UseFade = false; // Set to true to use Fade prebuff.
  Config.UseBoS = true; // Set to true to use Burst of Speed prebuff. TODO: Casting in town + UseFade compatibility
  Config.UseVenom = true; // Set to true to use Venom prebuff. Set to false if you don't have the skill and have Arachnid Mesh - it will cause connection drop otherwise.
  Config.UseBladeShield = false; // Set to true to use blade shield armor
  Config.UseCloakofShadows = true; // Set to true to use Cloak of Shadows while fighting. Useful for blinding regular monsters/minions.
  Config.AggressiveCloak = false; // Move into Cloak range or cast if already close

  Config.AutoBuild.Template = "Traps"; //	The name of the build associated with an existing
};
