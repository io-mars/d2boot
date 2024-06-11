import { sdk } from "@/modules/sdk.js";
import { NPC } from "@/common/Town.js";
import { Runeword } from "@/common/Runewords.js";
import { Recipe, Roll } from "@/common/Cubing.js";
import { Scripts, Config } from "@/common/Config.js";

export const LoadConfig = function () {
  Config.ScanShrines.push(sdk.shrines.Armor, sdk.shrines.Combat);

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
  Config.AttackSkill[1] = sdk.skills.ChargedStrike; // Primary skill to bosses.
  Config.AttackSkill[2] = sdk.skills.ChargedStrike; // Primary untimed skill to bosses. Keep at -1 if Config.AttackSkill[1] is untimed skill.
  Config.AttackSkill[3] = sdk.skills.LightningFury; // Primary skill to others.
  Config.AttackSkill[4] = sdk.skills.LightningFury; // Primary untimed skill to others. Keep at -1 if Config.AttackSkill[3] is untimed skill.
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
    Pindleskin: [sdk.skills.LightningFury, sdk.skills.LightningFury],
    Nihlathak: [sdk.skills.LightningFury, sdk.skills.LightningFury],
  };

  // ############################ //
  /* ###### CLASS SETTINGS ###### */
  // ############################ //
  Config.LightningFuryDelay = 5; // Lightning fury interval in seconds. LF is treated as timed skill.
  Config.UseInnerSight = false; // Use inner sight as a precast
  Config.UseSlowMissiles = false; // Use slow missiles as a precast
  Config.UseDecoy = false; // Use decoy with merc stomp
  Config.SummonValkyrie = true; // Summon Valkyrie
  Config.AutoSwitchJavelin = true; // switch replenish javelin when less RepairPercent, like Titan's Revenge, must equipped at main solt
  Config.RepairPercent = 40; // Durability percent of any equipped item that will trigger repairs.

  Config.AutoBuild.Template = "Javelin"; //	The name of the build associated with an existing
};
