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
  Config.AttackSkill[1] = sdk.skills.Tornado; // Primary skill to bosses.
  Config.AttackSkill[2] = sdk.skills.Tornado; // Primary untimed skill to bosses. Keep at -1 if Config.AttackSkill[1] is untimed skill.
  Config.AttackSkill[3] = sdk.skills.Tornado; // Primary skill to others.
  Config.AttackSkill[4] = sdk.skills.Tornado; // Primary untimed skill to others. Keep at -1 if Config.AttackSkill[3] is untimed skill.
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
  Config.SummonRaven = false;
  Config.SummonAnimal = "Grizzly"; // 0 = disabled, 1 or "Spirit Wolf" = summon spirit wolf, 2 or "Dire Wolf" = summon dire wolf, 3 or "Grizzly" = summon grizzly
  Config.SummonSpirit = "Oak Sage"; // 0 = disabled, 1 / "Oak Sage", 2 / "Heart of Wolverine", 3 / "Spirit of Barbs"
  Config.SummonVine = "Poison Creeper"; // 0 = disabled, 1 / "Poison Creeper", 2 / "Carrion Vine", 3 / "Solar Creeper"

  Config.AutoBuild.Template = "Elemental"; //	The name of the build associated with an existing
};
