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
  Config.AttackSkill[1] = sdk.skills.PoisonNova; // Primary skill to bosses.
  Config.AttackSkill[2] = sdk.skills.PoisonNova; // Primary untimed skill to bosses. Keep at -1 if Config.AttackSkill[1] is untimed skill.
  Config.AttackSkill[3] = sdk.skills.PoisonNova; // Primary skill to others.
  Config.AttackSkill[4] = sdk.skills.PoisonNova; // Primary untimed skill to others. Keep at -1 if Config.AttackSkill[3] is untimed skill.
  Config.AttackSkill[5] = sdk.skills.Terror; // Secondary skill if monster is immune to primary.
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
  Config.Curse[0] = sdk.skills.Decrepify; // Boss curse. Use skill number or set to 0 to disable.
  Config.Curse[1] = sdk.skills.LowerResist; // Other monsters curse. Use skill number or set to 0 to disable.

  /* Custom curses for monster
   * Can use monster name or classid
   * Format: Config.CustomCurse = [["monstername", skillid], [156, skillid]];
   * Optional 3rd parameter for spectype, leave blank to use on all
      0x00    Normal Monster
    0x01    Super Unique
    0x02    Champion
    0x04    Boss
    0x08    Minion
    Example: Config.CustomCurse = [["HellBovine", 60], [571, 87], ["SkeletonArcher", 71, 0x00]];
   */
  Config.CustomCurse = [];

  Config.ExplodeCorpses = sdk.skills.CorpseExplosion; // Explode corpses. Use skill number or 0 to disable. 74 = Corpse Explosion, 83 = Poison Explosion
  Config.Golem = "Clay"; // Golem. 0 or "None" = don't summon, 1 or "Clay" = Clay Golem, 2 or "Blood" = Blood Golem, 3 or "Fire" = Fire Golem
  Config.Skeletons = "max"; // Number of skeletons to raise. Set to "max" to auto detect, set to 0 to disable.
  Config.SkeletonMages = 0; // Number of skeleton mages to raise. Set to "max" to auto detect, set to 0 to disable.
  Config.Revives = "max"; // Number of revives to raise. Set to "max" to auto detect, set to 0 to disable.
  Config.PoisonNovaDelay = 1; // Delay between two Poison Novas in seconds.
  Config.ActiveSummon = true; // Raise dead between each attack. If false, it will raise after clearing a spot.
  Config.ReviveUnstackable = true; // Revive monsters that can move freely after you teleport.
  Config.IronGolemChicken = 30; // Exit game if Iron Golem's life is less or equal to designated percent.

  Config.AutoBuild.Template = "Bone"; //	The name of the build associated with an existing
};
