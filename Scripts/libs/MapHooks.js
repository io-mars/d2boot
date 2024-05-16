import {
  PresetUnit,
  copyUnit,
  delay,
  getArea,
  getRoom,
  getTickCount,
  getUIFlag,
  me,
  print,
  showConsole,
  Text,
  Line,
  Box,
  Frame,
  getParty,
  getTextSize,
} from "boot";

import { sdk } from "./modules/sdk.js";
import { Game } from "./common/Misc.js";
import { Pather } from "./common/Pather.js";

export const ActionHooks = {
  hooks: [],
  portals: [],
  frame: [],
  action: null,
  currArea: 0,
  enabled: true,
  prevAreas: [
    sdk.areas.None,
    sdk.areas.None,
    sdk.areas.RogueEncampment,
    sdk.areas.BloodMoor,
    sdk.areas.ColdPlains,
    sdk.areas.UndergroundPassageLvl1,
    sdk.areas.DarkWood,
    sdk.areas.BlackMarsh,
    sdk.areas.BloodMoor,
    sdk.areas.ColdPlains,
    sdk.areas.StonyField,
    sdk.areas.BlackMarsh,
    sdk.areas.TamoeHighland,
    sdk.areas.CaveLvl1,
    sdk.areas.UndergroundPassageLvl1,
    sdk.areas.HoleLvl1,
    sdk.areas.PitLvl1,
    sdk.areas.ColdPlains,
    sdk.areas.BurialGrounds,
    sdk.areas.BurialGrounds,
    sdk.areas.BlackMarsh,
    sdk.areas.ForgottenTower,
    sdk.areas.TowerCellarLvl1,
    sdk.areas.TowerCellarLvl2,
    sdk.areas.TowerCellarLvl3,
    sdk.areas.TowerCellarLvl4,
    sdk.areas.TamoeHighland,
    sdk.areas.MonasteryGate,
    sdk.areas.OuterCloister,
    sdk.areas.Barracks,
    sdk.areas.JailLvl1,
    sdk.areas.JailLvl2,
    sdk.areas.JailLvl3,
    sdk.areas.InnerCloister,
    sdk.areas.Cathedral,
    sdk.areas.CatacombsLvl1,
    sdk.areas.CatacombsLvl2,
    sdk.areas.CatacombsLvl3,
    sdk.areas.StonyField,
    sdk.areas.RogueEncampment,
    sdk.areas.RogueEncampment,
    sdk.areas.LutGholein,
    sdk.areas.RockyWaste,
    sdk.areas.DryHills,
    sdk.areas.FarOasis,
    sdk.areas.LostCity,
    sdk.areas.ArcaneSanctuary,
    sdk.areas.LutGholein,
    sdk.areas.A2SewersLvl1,
    sdk.areas.A2SewersLvl2,
    sdk.areas.LutGholein,
    sdk.areas.HaremLvl1,
    sdk.areas.HaremLvl2,
    sdk.areas.PalaceCellarLvl1,
    sdk.areas.PalaceCellarLvl2,
    sdk.areas.RockyWaste,
    sdk.areas.DryHills,
    sdk.areas.HallsoftheDeadLvl1,
    sdk.areas.ValleyofSnakes,
    sdk.areas.StonyTombLvl1,
    sdk.areas.HallsoftheDeadLvl2,
    sdk.areas.ClawViperTempleLvl1,
    sdk.areas.FarOasis,
    sdk.areas.MaggotLairLvl1,
    sdk.areas.MaggotLairLvl2,
    sdk.areas.LostCity,
    sdk.areas.CanyonofMagic,
    sdk.areas.CanyonofMagic,
    sdk.areas.CanyonofMagic,
    sdk.areas.CanyonofMagic,
    sdk.areas.CanyonofMagic,
    sdk.areas.CanyonofMagic,
    sdk.areas.CanyonofMagic,
    sdk.areas.RogueEncampment,
    sdk.areas.PalaceCellarLvl3,
    sdk.areas.RogueEncampment,
    sdk.areas.KurastDocktown,
    sdk.areas.SpiderForest,
    sdk.areas.SpiderForest,
    sdk.areas.FlayerJungle,
    sdk.areas.LowerKurast,
    sdk.areas.KurastBazaar,
    sdk.areas.UpperKurast,
    sdk.areas.KurastCauseway,
    sdk.areas.SpiderForest,
    sdk.areas.SpiderForest,
    sdk.areas.FlayerJungle,
    sdk.areas.SwampyPitLvl1,
    sdk.areas.FlayerJungle,
    sdk.areas.FlayerDungeonLvl1,
    sdk.areas.SwampyPitLvl2,
    sdk.areas.FlayerDungeonLvl2,
    sdk.areas.UpperKurast,
    sdk.areas.A3SewersLvl1,
    sdk.areas.KurastBazaar,
    sdk.areas.KurastBazaar,
    sdk.areas.UpperKurast,
    sdk.areas.UpperKurast,
    sdk.areas.KurastCauseway,
    sdk.areas.KurastCauseway,
    sdk.areas.Travincal,
    sdk.areas.DuranceofHateLvl1,
    sdk.areas.DuranceofHateLvl2,
    sdk.areas.DuranceofHateLvl3,
    sdk.areas.PandemoniumFortress,
    sdk.areas.OuterSteppes,
    sdk.areas.PlainsofDespair,
    sdk.areas.CityoftheDamned,
    sdk.areas.RiverofFlame,
    sdk.areas.PandemoniumFortress,
    sdk.areas.Harrogath,
    sdk.areas.BloodyFoothills,
    sdk.areas.FrigidHighlands,
    sdk.areas.ArreatPlateau,
    sdk.areas.CrystalizedPassage,
    sdk.areas.CrystalizedPassage,
    sdk.areas.GlacialTrail,
    sdk.areas.GlacialTrail,
    sdk.areas.FrozenTundra,
    sdk.areas.AncientsWay,
    sdk.areas.AncientsWay,
    sdk.areas.Harrogath,
    sdk.areas.NihlathaksTemple,
    sdk.areas.HallsofAnguish,
    sdk.areas.HallsofPain,
    sdk.areas.FrigidHighlands,
    sdk.areas.ArreatPlateau,
    sdk.areas.FrozenTundra,
    sdk.areas.ArreatSummit,
    sdk.areas.WorldstoneLvl1,
    sdk.areas.WorldstoneLvl2,
    sdk.areas.WorldstoneLvl3,
    sdk.areas.ThroneofDestruction,
    sdk.areas.Harrogath,
    sdk.areas.Harrogath,
    sdk.areas.Harrogath,
    sdk.areas.Harrogath,
  ],
  areaInfo: {},
};

export const ItemHooks = {
  enabled: true,
  pickitEnabled: false,
  modifier:
    16 *
    (Number(!!me.diff) +
      Number(!!me.gamepassword) +
      Number(!!me.gametype) +
      Number(!!me.gamename)),
  hooks: [],
  ignoreItemTypes: [
    sdk.items.type.Gold,
    sdk.items.type.BowQuiver,
    sdk.items.type.CrossbowQuiver,
    sdk.items.type.Book,
    sdk.items.type.Gem,
    sdk.items.type.Scroll,
    sdk.items.type.MissilePotion,
    sdk.items.type.Key,
    sdk.items.type.Boots,
    sdk.items.type.Gloves,
    sdk.items.type.ThrowingKnife,
    sdk.items.type.ThrowingAxe,
    sdk.items.type.HealingPotion,
    sdk.items.type.ManaPotion,
    sdk.items.type.RejuvPotion,
    sdk.items.type.StaminaPotion,
    sdk.items.type.AntidotePotion,
    sdk.items.type.ThawingPotion,
    sdk.items.type.ChippedGem,
    sdk.items.type.FlawedGem,
    sdk.items.type.StandardGem,
    sdk.items.type.FlawlessGem,
    sdk.items.type.PerfectgGem,
    sdk.items.type.Amethyst,
    sdk.items.type.Diamond,
    sdk.items.type.Emerald,
    sdk.items.type.Ruby,
    sdk.items.type.Sapphire,
    sdk.items.type.Topaz,
    sdk.items.type.Skull,
  ],
  itemCodeByClassId: [],
  itemCodeByClassIdAndQuality: [],
  itemColorCode: [],
  itemskillAlias: {
    [sdk.skills.LowerResist]: "Lo",
    [sdk.skills.Revive]: "Re",
    [sdk.skills.PoisonNova]: "PN",
    [sdk.skills.Decrepify]: "De",
    [sdk.skills.BoneSpear]: "Sp",
    [sdk.skills.BoneSpirit]: "S",
    [sdk.skills.BlessedHammer]: "BH",
    [sdk.skills.Concentration]: "Ct",
    [sdk.skills.Fanaticism]: "Fa",
    [sdk.skills.Conviction]: "Cv",
  },

  addToCodeByClassIdAndQuality(id, setName = "", uniqueName = "") {
    if (!id) return;
    if (setName) {
      this.itemCodeByClassIdAndQuality[id] = [sdk.items.quality.Set];
      this.itemCodeByClassIdAndQuality[id][sdk.items.quality.Set] = setName;
    }
    if (uniqueName) {
      this.itemCodeByClassIdAndQuality[id] = [sdk.items.quality.Unique];
      this.itemCodeByClassIdAndQuality[id][sdk.items.quality.Unique] =
        uniqueName;
    }
  },

  filter(item) {
    if (!item.onGroundOrDropping) return false;

    if (
      (item.normal || item.superior) &&
      (this.ignoreItemTypes.includes(item.itemType) || item.sockets === 1)
    )
      return false;

    return true;
  },

  check() {
    if (!this.enabled) {
      this.flush();

      return;
    }

    for (let i = 0; i < this.hooks.length; i++) {
      if (!copyUnit(this.hooks[i].item).x) {
        for (let j = 0; j < this.hooks[i].hook.length; j++) {
          this.hooks[i].hook[j].remove();
        }

        this.hooks[i].name[0] && this.hooks[i].name[0].remove();
        this.hooks[i].vector[0] && this.hooks[i].vector[0].remove();
        this.hooks.splice(i, 1);
        i -= 1;
        this.flush();
      }
    }

    let item = Game.getItem();

    if (item) {
      try {
        do {
          // // item.area === ActionHooks.currArea &&
          // item.onGroundOrDropping &&
          // (item.quality >= sdk.items.quality.Magic ||
          //   ((item.normal || item.superior) &&
          //     !this.ignoreItemTypes.includes(item.itemType)))
          if (this.filter(item)) {
            if (this.pickitEnabled) {
              if (
                [Pickit.Result.UNWANTED, Pickit.Result.TRASH].indexOf(
                  Pickit.checkItem(item).result
                ) === -1
              ) {
                !this.getHook(item) && this.add(item);
              }
            } else {
              !this.getHook(item) && this.add(item);
            }

            this.getHook(item) && this.update();
          } else {
            this.remove(item);
          }
        } while (item.getNext());
      } catch (e) {
        console.error(e);
        this.flush();
      }
    }
  },

  update() {
    for (let i = 0; i < this.hooks.length; i++) {
      this.hooks[i].vector[0].x = me.x;
      this.hooks[i].vector[0].y = me.y;
    }
  },

  getItemName(item) {
    // let abbr = item.name.split(" ");
    // let abbrName = "";
    // if (abbr[1]) {
    //   abbrName += abbr[0] + "-";
    //   for (let i = 1; i < abbr.length; i++) {
    //     abbrName += abbr[i].substring(0, 1);
    //   }
    // }
    // return !!abbrName ? abbrName : item.name;
    if (item.superior) return item.name.replace(/superior/i, "(\xFFc2s\xFFc0)");
    else return item.name;
  },

  getSkillInfo(item, single = true) {
    let info = [];
    item.getItemSkills(single).forEach((skill) => {
      if (this.itemskillAlias.hasOwnProperty(skill[1])) {
        info.push(
          `\xFFc9${this.itemskillAlias[skill[1]]}\xFFc0:\xFFc2${skill[2]}\xFFc0`
        );
      }
    });

    return !!info.length ? `\xFFc0[${info.join(",")}]` : "";
  },

  getExtInfo(item) {
    switch (item.itemType) {
      case sdk.items.type.Armor:
      case sdk.items.type.Shield:
        let def = item.getStat(sdk.stats.ArmorPercent);
        return !!def ? `\xFFc0[Ed: \xFFc2${def}%\xFFc0]` : "";

      case sdk.items.type.Sword:
      case sdk.items.type.Axe:
      case sdk.items.type.Polearm:
      case sdk.items.type.Bow:
        let ed = item.getStat(sdk.stats.EnhancedDamage);
        return !!ed ? `\xFFc0[Ed: \xFFc2${ed}%\xFFc0]` : "";

      case sdk.items.type.AuricShields:
        let res = item.getStat(sdk.stats.FireResist);
        return !!res
          ? `\xFFc0[R: \xFFc2${res}\xFFc0]`
          : `\xFFc0[Ed: \xFFc2${item.getStat(
              sdk.stats.EnhancedDamage
            )}%\xFFc0 Ar: \xFFc2${item.getStat(sdk.stats.ToHit)}\xFFc0]`;

      case sdk.items.type.Wand:
        return this.getSkillInfo(item);

      case sdk.items.type.Scepter:
        return this.getSkillInfo(item);

      case sdk.items.type.AmazonBow:
        let bs = item.getItemSkills(false);
        let bl = 0;
        bs && bs[0] && (bl = bs[0][2]);

        return `\xFFc0[Ed: \xFFc2${item.getStat(
          sdk.stats.EnhancedDamage
        )}%\xFFc0 Bows: \xFFc2+${bl}\xFFc0]`;

      default:
        break;
    }
    return "";
  },

  newHook(item) {
    let color = 0,
      code = "",
      arr = [],
      name = [],
      vector = [];
    let eth = item.ethereal ? "\xFFc1eth:\xFFc0 " : "";

    switch (item.quality) {
      case sdk.items.quality.Normal:
      case sdk.items.quality.Superior:
        switch (item.itemType) {
          case sdk.items.type.Quest:
            color = 0x9a;
            code += !!this.itemCodeByClassId[item.classid]
              ? this.itemCodeByClassId[item.classid]
              : "\xFFc8" + item.fname;

            break;
          case sdk.items.type.Rune:
            if (item.classid >= sdk.items.runes.Vex) {
              color = 0x9b;
              code = "\xFFc;" + item.fname;
            } else if (item.classid >= sdk.items.runes.Lum) {
              color = 0x9a;
              code = "\xFFc8" + item.fname;
            } else {
              color = 0xa1;
              code = item.fname;
            }

            break;
          default:
            if (item.name) {
              color = 0x20;

              if (item.runeword) {
                code = item.fname.split("\n").reverse().join(" ");
              } else {
                code =
                  "\xFFc0" +
                  (item.sockets > 0
                    ? "[\xFFc9" + item.sockets + "\xFFc0]"
                    : "");
                code += `${this.getItemName(item)}${this.getExtInfo(item)}`;
                code += "(" + item.ilvl + ")";
              }
            }

            break;
        }

        break;
      case sdk.items.quality.Set:
      case sdk.items.quality.Unique:
        ({ color, code } = this.itemColorCode[item.quality]);

        if (!this.itemCodeByClassId[item.classid]) {
          switch (item.classid) {
            case sdk.items.Ring:
            case sdk.items.Amulet:
              code += item.name + "(" + item.ilvl + ")";

              break;
            default:
              code += !!this.itemCodeByClassIdAndQuality[item.classid]
                ? this.itemCodeByClassIdAndQuality[item.classid][item.quality]
                : item.name;

              break;
          }
        } else {
          code += this.itemCodeByClassId[item.classid];
        }

        break;
      case sdk.items.quality.Magic:
      case sdk.items.quality.Rare:
        if (item.name) {
          ({ color, code } = this.itemColorCode[item.quality]);

          code += item.sockets > 0 ? "[" + item.sockets + "]" : "";
          code += this.getItemName(item);
          code += "(" + item.ilvl + ")";
        }

        break;
    }

    !!code &&
      name.push(
        new Text(
          eth + code,
          785 - getTextSize(eth + code, 0)[0] + Hooks.resfix.x,
          // 665 + Hooks.resfix.x,
          136 + this.modifier + this.hooks.length * 14,
          color,
          0,
          0
        )
      );
    vector.push(new Line(me.x, me.y, item.x, item.y, color, true));
    arr.push(new Line(item.x - 3, item.y, item.x + 3, item.y, color, true));
    arr.push(new Line(item.x, item.y - 3, item.x, item.y + 3, color, true));

    return {
      itemLoc: arr,
      itemName: name,
      vector: vector,
    };
  },

  add(item) {
    if (item === undefined || !item.classid) {
      return;
    }

    let temp = this.newHook(item);

    temp &&
      this.hooks.push({
        item: copyUnit(item),
        area: item.area,
        hook: temp.itemLoc,
        name: temp.itemName,
        vector: temp.vector,
      });
  },

  getHook(item) {
    for (let i = 0; i < this.hooks.length; i++) {
      if (this.hooks[i].item.gid === item.gid) {
        return this.hooks[i].hook;
      }
    }

    return false;
  },

  remove(item) {
    for (let i = 0; i < this.hooks.length; i++) {
      if (this.hooks[i].item.gid === item.gid) {
        for (let j = 0; j < this.hooks[i].hook.length; j++) {
          this.hooks[i].hook[j].remove();
        }

        this.hooks[i].name[0] && this.hooks[i].name[0].remove();
        this.hooks[i].vector[0] && this.hooks[i].vector[0].remove();
        this.hooks.splice(i, 1);

        return true;
      }
    }

    return false;
  },

  flush() {
    while (this.hooks.length) {
      for (let j = 0; j < this.hooks[0].hook.length; j++) {
        this.hooks[0].hook[j].remove();
      }

      this.hooks[0].name[0] && this.hooks[0].name[0].remove();
      this.hooks[0].vector[0] && this.hooks[0].vector[0].remove();
      this.hooks.shift();
    }
  },
};

ItemHooks.itemColorCode[sdk.items.quality.Magic] = {
  color: 0x97,
  code: "\xFFc3",
};
ItemHooks.itemColorCode[sdk.items.quality.Set] = {
  color: 0x84,
  code: "\xFFc2",
};
ItemHooks.itemColorCode[sdk.items.quality.Rare] = {
  color: 0x6f,
  code: "\xFFc9",
};
ItemHooks.itemColorCode[sdk.items.quality.Unique] = {
  color: 0xa8,
  code: "\xFFc4",
};

export const MonsterHooks = {
  hooks: [],
  enabled: true,

  check() {
    if (!this.enabled || me.inTown) {
      this.flush();

      return;
    }

    for (let i = 0; i < this.hooks.length; i += 1) {
      if (!copyUnit(this.hooks[i].unit).x) {
        this.hooks[i].hook.remove();
        this.hooks.splice(i, 1);

        i -= 1;
      }
    }

    let unit = Game.getMonster();

    if (unit) {
      do {
        if (unit.attackable) {
          !this.getHook(unit) ? this.add(unit) : this.updateCoords(unit);
        } else {
          this.remove(unit);
        }
      } while (unit.getNext());
    }
  },

  // credit DetectiveSquirrel from his maphack https://github.com/DetectiveSquirrel/Kolbot-MapThread/blob/9c721a72a934518cfca1d1a05211b5e03b5b624f/kolbot/tools/MapThread.js#L2353
  specTypeColor(unit) {
    if (
      (unit.classid >= sdk.monsters.UberMephisto &&
        unit.classid <= sdk.monsters.UberDiablo) ||
      unit.classid == sdk.monsters.DiabloClone ||
      unit.classid == sdk.monsters.TombViper2
    )
      return 2;

    switch (unit.spectype) {
      case sdk.monsters.spectype.Minion:
        return 3;
      case sdk.monsters.spectype.Magic:
        return 9;
      case sdk.monsters.spectype.Unique:
        return 11;
      case sdk.monsters.spectype.SuperUnique:
        return 2;
      default:
        return 8;
    }
  },

  add(unit) {
    this.hooks.push({
      unit: copyUnit(unit),
      hook: new Text(
        unit.spectype & 0xf ? "O" : "X",
        unit.x,
        unit.y,
        this.specTypeColor(unit),
        1,
        null,
        true
      ),
    });
  },

  updateCoords(unit) {
    let hook = this.getHook(unit);

    if (!hook) {
      return false;
    }

    hook.x = unit.x;
    hook.y = unit.y;

    return true;
  },

  getHook(unit) {
    for (let i = 0; i < this.hooks.length; i += 1) {
      if (this.hooks[i].unit.gid === unit.gid) {
        return this.hooks[i].hook;
      }
    }

    return false;
  },

  remove(unit) {
    for (let i = 0; i < this.hooks.length; i += 1) {
      if (this.hooks[i].unit.gid === unit.gid) {
        this.hooks[i].hook.remove();
        this.hooks.splice(i, 1);

        return true;
      }
    }

    return false;
  },

  flush() {
    while (this.hooks.length) {
      this.hooks[0].hook.remove();
      this.hooks.shift();
    }
  },
};

export const ShrineHooks = {
  enabled: true,
  hooks: [],
  shrines: {},

  check() {
    if (!this.enabled || me.inTown) {
      this.flush();

      return;
    }

    for (let i = 0; i < this.hooks.length; i++) {
      if (!copyUnit(this.hooks[i].shrine).objtype) {
        this.hooks[i].hook[0].remove();
        this.hooks.splice(i, 1);

        i -= 1;
      }
    }

    let shrine = Game.getObject("shrine");

    if (shrine) {
      do {
        if (shrine.mode === sdk.objects.mode.Inactive) {
          if (!this.getHook(shrine)) {
            this.add(shrine);
          }
        } else {
          this.remove(shrine);
        }
      } while (shrine.getNext());
    }
  },

  newHook(shrine) {
    let arr = [];
    let typeName;

    typeName = this.shrines[shrine.objtype];
    typeName && arr.push(new Text(typeName, shrine.x, shrine.y, 4, 6, 2, true));

    return arr;
  },

  add(shrine) {
    if (!shrine.objtype) return;

    this.hooks.push({
      shrine: copyUnit(shrine),
      hook: this.newHook(shrine),
    });
  },

  getHook(shrine) {
    for (let i = 0; i < this.hooks.length; i++) {
      if (this.hooks[i].shrine.gid === shrine.gid) {
        return this.hooks[i].hook;
      }
    }

    return false;
  },

  remove(shrine) {
    for (let i = 0; i < this.hooks.length; i++) {
      if (this.hooks[i].shrine.gid === shrine.gid) {
        this.hooks[i].hook[0].remove();
        this.hooks.splice(i, 1);

        return true;
      }
    }

    return false;
  },

  flush() {
    while (this.hooks.length) {
      this.hooks[0].hook[0].remove();
      this.hooks.shift();
    }
  },
};

ShrineHooks.shrines[sdk.shrines.Refilling] = "Refilling";
ShrineHooks.shrines[sdk.shrines.Health] = "Health";
ShrineHooks.shrines[sdk.shrines.Mana] = "Mana";
ShrineHooks.shrines[sdk.shrines.HealthExchange] = "Health Exchange";
ShrineHooks.shrines[sdk.shrines.ManaExchange] = "Mana Exchange";
ShrineHooks.shrines[sdk.shrines.Armor] = "Armor";
ShrineHooks.shrines[sdk.shrines.Combat] = "Combat";
ShrineHooks.shrines[sdk.shrines.ResistFire] = "Resist Fire";
ShrineHooks.shrines[sdk.shrines.ResistCold] = "Resist Cold";
ShrineHooks.shrines[sdk.shrines.ResistLightning] = "Resist Lightning";
ShrineHooks.shrines[sdk.shrines.ResistPoison] = "Resist Poison";
ShrineHooks.shrines[sdk.shrines.Skill] = "Skill";
ShrineHooks.shrines[sdk.shrines.ManaRecharge] = "Mana Recharge";
ShrineHooks.shrines[sdk.shrines.Stamina] = "Stamina";
ShrineHooks.shrines[sdk.shrines.Experience] = "Experience";
ShrineHooks.shrines[sdk.shrines.Enirhs] = "Enirhs";
ShrineHooks.shrines[sdk.shrines.Portal] = "Portal";
ShrineHooks.shrines[sdk.shrines.Gem] = "Gem";
ShrineHooks.shrines[sdk.shrines.Fire] = "Fire";
ShrineHooks.shrines[sdk.shrines.Monster] = "Monster";
ShrineHooks.shrines[sdk.shrines.Exploding] = "Exploding";
ShrineHooks.shrines[sdk.shrines.Poison] = "Poison";

export const TextHooks = {
  enabled: true,
  lastAct: 0,
  wasInTown: true,
  displayTitle: true,
  displaySettings: true,
  frameworkDisplayed: false,
  frameYSizeScale: 0,
  frameYLocScale: 0,
  settingsModifer: 0,
  dashBoardWidthScale: 0,
  statusFrameYSize: 0,
  qolFrameYSize: 0,
  statusHookNames: [
    "pickitStatus",
    "vectorStatus",
    "monsterStatus",
    "itemStatus",
  ],
  qols: ["previousAct", "nextAct", "key6", "key5"],
  statusHooks: [],
  dashBoard: [],
  qolHooks: [],
  hooks: [],
  yLocMapScale: { 1: 40, 2: 30, 3: 20, 4: 10, 6: -10, 9: -40 },
  modifier:
    16 *
    (Number(!!me.diff) +
      Number(!!me.gamepassword) +
      Number(!!me.gametype) +
      Number(!!me.gamename) +
      Number(!!me.gameserverip && !me.realm)),
  currArea: 0,

  getScale(hkLen) {
    if (!!this.yLocMapScale[hkLen]) {
      this.frameYSizeScale = -1 * this.yLocMapScale[hkLen];
      this.frameYLocScale = this.yLocMapScale[hkLen];
    } else {
      this.frameYSizeScale = 0;
      this.frameYLocScale = 0;
    }

    this.settingsModifer = Math.max(0, hkLen - 3);
  },

  check() {
    if (!this.enabled) {
      this.flush();

      return;
    }

    if (!this.frameworkDisplayed) {
      !!me.gameserverip && !this.getHook("ip", this.hooks) && this.add("ip");

      this.lastAct = 0; // sorta hacky solution, but works this will cause qolBoard to update after being flushed from a uiflag
      this.frameworkDisplayed = true;
    }

    !this.getHook("ping", this.hooks)
      ? this.add("ping")
      : (this.getHook("ping", this.hooks).hook.text = "Ping: " + me.ping);
    !this.getHook("time", this.hooks)
      ? this.add("time")
      : (this.getHook("time", this.hooks).hook.text = this.timer());

    if (!this.getHook("level", this.hooks)) {
      this.add("level");
    } else {
      if (me.area !== this.currArea) {
        this.getHook("level", this.hooks).hook.text = this.getLevel();
        this.currArea = me.area;
      }
    }

    if (!this.getHook("follows", this.hooks)) {
      this.add("follows");
      this.add("followTome");
    }

    if (!this.getHook("followStatus", this.hooks)) {
      this.add("followStatus");
      this.add("followTomeQuantity");
    } else {
      let status = this.getFollowStatus();

      if (status.follows < status.players)
        this.getHook("followStatus", this.hooks).hook.color = 2;
      else this.getHook("followStatus", this.hooks).hook.color = 4;

      this.getHook("followStatus", this.hooks).hook.text =
        status.follows + "/" + status.players;

      if (status.tome > 15)
        this.getHook("followTomeQuantity", this.hooks).hook.color = 4;
      else if (status.tome > 10)
        this.getHook("followTomeQuantity", this.hooks).hook.color = 9;
      else this.getHook("followTomeQuantity", this.hooks).hook.color = 2;

      this.getHook("followTomeQuantity", this.hooks).hook.text =
        status.tome <= 9 ? "0" + status.tome : status.tome.toString();
    }
  },

  update(hkLen = 0) {
    // let updateSettingsDisplay =
    //   this.displaySettings && this.settingsModifer < Math.max(0, hkLen - 3);
    // this.getScale(hkLen);
    // this.add("dashboard");
    // updateSettingsDisplay && this.add("showSettings");
    // (this.lastAct !== me.act ||
    //   this.wasInTown !== me.inTown ||
    //   !this.getHook("qolBoard", this.qolHooks)) &&
    //   this.add("qolBoard");
  },

  hookHandler(click, x, y) {
    function sortHooks(h1, h2) {
      return Math.abs(h1.hook.y - y) - Math.abs(h2.hook.y - y);
    }

    if (click === 0) {
      TextHooks.statusHooks.sort(sortHooks);
    }

    return false;
  },

  add(name, hookArr = []) {
    let orginalLen = hookArr.length;

    switch (name) {
      case "ping":
        this.hooks.push({
          name: "ping",
          hook: new Text(
            "Ping: " + me.ping,
            785 + Hooks.resfix.x,
            56 + this.modifier,
            4,
            1,
            1
          ),
        });

        break;
      case "time":
        this.hooks.push({
          name: "time",
          hook: new Text(
            this.timer(),
            785 + Hooks.resfix.x,
            72 + this.modifier,
            4,
            1,
            1
          ),
        });

        break;
      case "ip":
        this.hooks.push({
          name: "ip",
          hook: new Text(
            "IP: " +
              (me.gameserverip.length > 0
                ? me.gameserverip.split(".")[3]
                : "0"),
            785 + Hooks.resfix.x,
            88 + this.modifier,
            4,
            1,
            1
          ),
        });

        break;
      case "level":
        this.hooks.push({
          name: "level",
          hook: new Text(
            this.getLevel(),
            785 + Hooks.resfix.x,
            104 + this.modifier,
            4,
            1,
            1
          ),
        });

        break;
      case "follows":
        this.hooks.push({
          name: "follows",
          hook: new Text(
            "follows:",
            736 + Hooks.resfix.x,
            120 + this.modifier,
            4,
            1,
            1
          ),
        });

        break;
      case "followTome":
        this.hooks.push({
          name: "followTome",
          hook: new Text(
            ":",
            766 + Hooks.resfix.x,
            120 + this.modifier,
            4,
            1,
            1
          ),
        });

        break;
      case "followStatus":
        this.hooks.push({
          name: "followStatus",
          hook: new Text(
            "-/-",
            760 + Hooks.resfix.x,
            120 + this.modifier,
            4,
            1,
            1
          ),
        });

        break;
      case "followTomeQuantity":
        this.hooks.push({
          name: "followTomeQuantity",
          hook: new Text(
            "--",
            785 + Hooks.resfix.x,
            120 + this.modifier,
            4,
            1,
            1
          ),
        });

        break;
    }

    return hookArr.length > orginalLen;
  },

  getHook(name, hookArr = []) {
    for (let i = 0; i < hookArr.length; i++) {
      if (hookArr[i].name === name) {
        return hookArr[i];
      }
    }

    return false;
  },

  timer() {
    return (
      " (" +
      new Date(getTickCount() - me.gamestarttime).toISOString().slice(11, -5) +
      ")"
    );
  },

  //iomars
  getLevel() {
    let level = getArea().level;
    if (level === undefined) return "Level/MF:--/---";

    return "Level/MF:" + level + "/" + me.getStat(80);
  },

  getFollowStatus() {
    let status = { players: 0, follows: 1, tome: 0 };

    let party = getParty();
    if (party) {
      do {
        status.players++;
        if (party.area === me.area) {
          status.follows++;
        }
      } while (party.getNext());
    }

    //get the tome of townportal's quantity
    let tome = me.findItem(
      sdk.items.TomeofTownPortal,
      sdk.items.mode.inStorage,
      sdk.storage.Inventory
    );
    if (tome) {
      status.tome = !!tome ? tome.getStat(sdk.stats.Quantity) : 0;
    }

    return status;
  },

  flush() {
    if (!Hooks.enabled) {
      while (this.hooks.length) {
        this.hooks.shift().hook.remove();
      }

      this.frameworkDisplayed = false;
    }

    // while (this.statusHooks.length) {
    //   this.statusHooks.shift().hook.remove();
    // }

    // while (this.dashBoard.length) {
    //   this.dashBoard.shift().hook.remove();
    // }

    // while (this.qolHooks.length) {
    //   this.qolHooks.shift().hook.remove();
    // }
  },
};

export const VectorHooks = {
  enabled: true,
  currArea: 0,
  lastLoc: { x: 0, y: 0 },
  names: [],
  hooks: [],

  check() {
    if (!this.enabled) {
      this.flush();

      return;
    }

    if (me.area !== this.currArea) {
      this.flush();

      if (!me.area || !me.gameReady) return;

      let nextAreas = [];

      // Specific area override
      nextAreas[sdk.areas.TamoeHighland] = sdk.areas.MonasteryGate;
      nextAreas[sdk.areas.SpiderForest] = sdk.areas.FlayerJungle;
      nextAreas[sdk.areas.GreatMarsh] = sdk.areas.FlayerJungle;
      nextAreas[sdk.areas.CrystalizedPassage] = sdk.areas.GlacialTrail;
      nextAreas[sdk.areas.GlacialTrail] = sdk.areas.FrozenTundra;
      nextAreas[sdk.areas.AncientsWay] = sdk.areas.ArreatSummit;
      nextAreas[sdk.areas.ThroneofDestruction] = sdk.areas.WorldstoneChamber;

      try {
        let exits = getArea().exits;
        this.currArea = me.area;

        if (exits) {
          for (let i = 0; i < exits.length; i++) {
            if (me.inArea(sdk.areas.CanyonofMagic)) {
              this.add(
                exits[i].x,
                exits[i].y,
                exits[i].target === getRoom().correcttomb ? 0x69 : 0x99
              );
            } else if (
              exits[i].target === nextAreas[me.area] &&
              nextAreas[me.area]
            ) {
              this.add(exits[i].x, exits[i].y, 0x1f);
            } else if (
              exits[i].target === ActionHooks.prevAreas.indexOf(me.area) &&
              nextAreas[me.area]
            ) {
              this.add(exits[i].x, exits[i].y, 0x99);
            } else if (
              exits[i].target === ActionHooks.prevAreas.indexOf(me.area)
            ) {
              this.add(exits[i].x, exits[i].y, 0x1f);
            } else if (exits[i].target === ActionHooks.prevAreas[me.area]) {
              this.add(exits[i].x, exits[i].y, 0x0a);
            } else {
              this.add(exits[i].x, exits[i].y, 0x99);
            }

            this.addNames(exits[i]);
          }
        }

        let wp = this.getWP();
        wp && this.add(wp.x, wp.y, 0xa8);
        let poi = this.getPOI();
        poi && this.add(poi.x, poi.y, 0x7d);
      } catch (e) {
        console.error(e);
      }
    } else if (me.x !== this.lastLoc.x || me.y !== this.lastLoc.y) {
      this.update();
    }
  },

  add(x, y, color) {
    this.hooks.push(new Line(me.x, me.y, x, y, color, true));
  },

  addNames(area) {
    this.names.push(
      new Text(Pather.getAreaName(area.target), area.x, area.y, 0, 6, 2, true)
    );
  },

  update() {
    this.lastLoc = { x: me.x, y: me.y };

    for (let i = 0; i < this.hooks.length; i++) {
      this.hooks[i].x = me.x;
      this.hooks[i].y = me.y;
    }
  },

  flush() {
    while (this.hooks.length) {
      this.hooks.shift().remove();
    }

    while (this.names.length) {
      this.names.shift().remove();
    }

    this.currArea = 0;
  },

  getWP() {
    if (Pather.wpAreas.indexOf(me.area) === -1) return false;

    for (let i = 0; i < sdk.waypoints.Ids.length; i++) {
      let preset = Game.getPresetObject(me.area, sdk.waypoints.Ids[i]);

      if (preset) {
        return {
          x: preset.roomx * 5 + preset.x,
          y: preset.roomy * 5 + preset.y,
        };
      }
    }

    return false;
  },

  getPOI() {
    let unit, name;
    let poi = {};

    switch (me.area) {
      case sdk.areas.CaveLvl2:
      case sdk.areas.HoleLvl2:
      case sdk.areas.PitLvl2:
      case sdk.areas.Crypt:
      case sdk.areas.Mausoleum:
      case sdk.areas.StonyTombLvl2:
      case sdk.areas.AncientTunnels:
      case sdk.areas.GreatMarsh:
      case sdk.areas.SpiderCave:
      case sdk.areas.SwampyPitLvl3:
      case sdk.areas.DisusedFane:
      case sdk.areas.ForgottenReliquary:
      case sdk.areas.ForgottenTemple:
      case sdk.areas.DisusedReliquary:
      case sdk.areas.DrifterCavern:
      case sdk.areas.IcyCellar:
      case sdk.areas.Abaddon:
      case sdk.areas.PitofAcheron:
      case sdk.areas.InfernalPit:
        unit = Game.getPresetObject(me.area, sdk.objects.SmallSparklyChest);
        poi = {
          name: "SuperChest",
          action: { do: "openChest", id: sdk.objects.SmallSparklyChest },
        };

        break;
      case sdk.areas.GlacialTrail:
      case sdk.areas.HallsofAnguish:
      case sdk.areas.HallsofPain:
        unit = Game.getPresetObject(me.area, sdk.objects.LargeSparklyChest);
        poi = {
          name: "SuperChest",
          action: { do: "openChest", id: sdk.objects.LargeSparklyChest },
        };

        break;
      case sdk.areas.ColdPlains:
        unit = Game.getPresetStair(me.area, sdk.exits.preset.AreaEntrance);
        name = "Cave Level 1";

        break;
      case sdk.areas.StonyField:
        unit = Game.getPresetMonster(me.area, sdk.monsters.preset.Rakanishu);
        poi = {
          name: "Cairn Stones",
          action: { do: "usePortal", id: sdk.areas.Tristram },
        };

        break;
      case sdk.areas.DarkWood:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.InifussTree);
        name = "Tree";

        break;
      case sdk.areas.BlackMarsh:
        unit = Game.getPresetStair(me.area, sdk.exits.preset.AreaEntrance);
        name = "Hole Level 1";

        break;
      case sdk.areas.DenofEvil:
        unit = Game.getPresetMonster(me.area, sdk.monsters.preset.Corpsefire);
        name = "Corpsefire";

        break;
      case sdk.areas.BurialGrounds:
        unit = Game.getPresetMonster(me.area, sdk.monsters.preset.BloodRaven);
        name = "Bloodraven";

        break;
      case sdk.areas.TowerCellarLvl5:
        unit = Game.getPresetObject(me.area, sdk.objects.SuperChest);
        name = "Countess";

        break;
      case sdk.areas.Barracks:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.MalusHolder);
        name = "Smith";

        break;
      case sdk.areas.Cathedral:
        unit = { x: 20047, y: 4898 };
        name = "BoneAsh";

        break;
      case sdk.areas.CatacombsLvl4:
        unit = { x: 22549, y: 9520 };
        name = "Andariel";

        break;
      case sdk.areas.Tristram:
        unit = Game.getMonster(sdk.monsters.Griswold)
          ? Game.getMonster(sdk.monsters.Griswold)
          : { x: 25163, y: 5170 };
        name = "Griswold";

        break;
      case sdk.areas.MooMooFarm:
        unit = Game.getMonster(sdk.monsters.TheCowKing)
          ? Game.getMonster(sdk.monsters.TheCowKing)
          : Game.getPresetMonster(me.area, sdk.monsters.preset.TheCowKing);
        name = "Cow King";

        break;
      case sdk.areas.LutGholein:
        unit = Game.getPresetStair(me.area, sdk.exits.preset.A2EnterSewersDoor);
        name = "Sewer's Level 1";

        break;
      case sdk.areas.A2SewersLvl3:
        unit = Game.getPresetObject(
          me.area,
          sdk.quest.chest.HoradricScrollChest
        );
        name = "Radament";

        break;
      case sdk.areas.PalaceCellarLvl3:
        unit = { x: 10073, y: 8670 };
        poi = { name: "Arcane Sanctuary", action: { do: "usePortal" } };

        break;
      case sdk.areas.HallsoftheDeadLvl3:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.HoradricCubeChest);
        poi = {
          name: "Cube",
          action: { do: "openChest", id: sdk.quest.chest.HoradricCubeChest },
        };

        break;
      case sdk.areas.ClawViperTempleLvl2:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.ViperAmuletChest);
        poi = {
          name: "Amulet",
          action: { do: "openChest", id: sdk.quest.chest.ViperAmuletChest },
        };

        break;
      case sdk.areas.MaggotLairLvl3:
        unit = Game.getPresetObject(
          me.area,
          sdk.quest.chest.ShaftoftheHoradricStaffChest
        );
        poi = {
          name: "Staff",
          action: {
            do: "openChest",
            id: sdk.quest.chest.ShaftoftheHoradricStaffChest,
          },
        };

        break;
      case sdk.areas.ArcaneSanctuary:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.Journal);
        name = "Summoner";

        break;
      case sdk.areas.TalRashasTomb1:
      case sdk.areas.TalRashasTomb2:
      case sdk.areas.TalRashasTomb3:
      case sdk.areas.TalRashasTomb4:
      case sdk.areas.TalRashasTomb5:
      case sdk.areas.TalRashasTomb6:
      case sdk.areas.TalRashasTomb7:
        unit = Game.getPresetObject(
          me.area,
          sdk.quest.chest.HoradricStaffHolder
        );
        name = "Orifice";

        if (!unit) {
          unit = Game.getPresetObject(me.area, sdk.objects.SmallSparklyChest);
          name = "SuperChest";
        }

        break;
      case sdk.areas.DurielsLair:
        unit = { x: 22577, y: 15609 };
        name = "Tyrael";

        break;
      case sdk.areas.FlayerJungle:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.GidbinnAltar);
        name = "Gidbinn";

        break;
      case sdk.areas.KurastBazaar:
        unit = Game.getPresetStair(me.area, sdk.exits.preset.A3EnterSewers);
        name = "Sewer's Level 1";

        break;
      case sdk.areas.SpiderCavern:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.KhalimsEyeChest);
        poi = {
          name: "Eye",
          action: { do: "openChest", id: sdk.quest.chest.KhalimsEyeChest },
        };

        break;
      case sdk.areas.FlayerDungeonLvl3:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.KhalimsBrainChest);
        poi = {
          name: "Brain",
          action: { do: "openChest", id: sdk.quest.chest.KhalimsBrainChest },
        };

        break;
      case sdk.areas.A3SewersLvl2:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.KhalimsHeartChest);
        poi = {
          name: "Heart",
          action: { do: "openChest", id: sdk.quest.chest.KhalimsHeartChest },
        };

        break;
      case sdk.areas.RuinedTemple:
        unit = Game.getPresetObject(
          me.area,
          sdk.quest.chest.LamEsensTomeHolder
        );
        poi = {
          name: "Lam Esen",
          action: { do: "openChest", id: sdk.quest.chest.LamEsensTomeHolder },
        };

        break;
      case sdk.areas.Travincal:
        unit = Game.getPresetObject(me.area, sdk.objects.CompellingOrb);
        name = "Orb";

        break;
      case sdk.areas.DuranceofHateLvl3:
        unit = { x: 17588, y: 8069 };
        name = "Mephisto";

        break;
      case sdk.areas.PlainsofDespair:
        unit = Game.getPresetMonster(me.area, sdk.monsters.Izual);
        name = "Izual";

        break;
      case sdk.areas.RiverofFlame:
        unit = Game.getPresetObject(me.area, sdk.quest.chest.HellForge);
        name = "Hephasto";

        break;
      case sdk.areas.ChaosSanctuary:
        unit = Game.getPresetObject(me.area, sdk.objects.DiabloStar);
        name = "Star";

        break;
      case sdk.areas.Harrogath:
        unit = { x: 5112, y: 5120 };
        poi = {
          name: "Anya Portal",
          action: { do: "usePortal", id: sdk.areas.NihlathaksTemple },
        };

        break;
      case sdk.areas.BloodyFoothills:
        unit = { x: 3899, y: 5113 };
        name = "Shenk";

        break;
      case sdk.areas.FrigidHighlands:
      case sdk.areas.ArreatPlateau:
      case sdk.areas.FrozenTundra:
        unit = Game.getPresetObject(me.area, sdk.objects.RedPortal);
        poi = { name: "Hell Entrance", action: { do: "usePortal" } };

        break;
      case sdk.areas.FrozenRiver:
        unit = Game.getPresetObject(me.area, sdk.objects.FrozenAnyasPlatform);
        name = "Frozen Anya";

        break;
      case sdk.areas.NihlathaksTemple:
        unit = { x: 10058, y: 13234 };
        name = "Pindle";

        break;
      case sdk.areas.HallsofVaught:
        unit = Game.getPresetObject(me.area, sdk.objects.NihlathaksPlatform);
        name = "Nihlathak";

        break;
      case sdk.areas.ThroneofDestruction:
        unit = { x: 15118, y: 5002 };
        name = "Throne Room";

        break;
      case sdk.areas.WorldstoneChamber:
        unit = Game.getMonster(sdk.monsters.Baal)
          ? Game.getMonster(sdk.monsters.Baal)
          : { x: 15134, y: 5923 };
        name = "Baal";

        break;
      case sdk.areas.MatronsDen:
        unit = Game.getPresetObject(me.area, sdk.objects.SmallSparklyChest);
        name = "Lilith";

        break;
      case sdk.areas.ForgottenSands:
        unit = Game.getMonster(sdk.monsters.UberDuriel);
        name = "Duriel";

        break;
      case sdk.areas.FurnaceofPain:
        unit = Game.getPresetObject(me.area, sdk.objects.SmallSparklyChest);
        name = "Izual";

        break;
    }

    if (unit) {
      name && !poi.name && (poi.name = name);

      if (unit instanceof PresetUnit) {
        poi.x = unit.roomx * 5 + unit.x;
        poi.y = unit.roomy * 5 + unit.y;
      } else {
        poi.x = unit.x;
        poi.y = unit.y;
      }

      return poi;
    }

    return false;
  },
};

export const Hooks = {
  dashBoard: { x: 113, y: 490 },
  portalBoard: { x: 12, y: 432 },
  qolBoard: { x: 545, y: 490 },
  resfix: { x: me.screensize ? 0 : -160, y: me.screensize ? 0 : -120 },
  saidMessage: false,
  userAddon: false,
  enabled: true,
  flushed: false,

  init() {
    // let files = dopen("libs/manualplay/hooks/").getFiles();
    // Array.isArray(files) &&
    //   files
    //     .filter((file) => file.endsWith(".js"))
    //     .forEach(function (x) {
    //       if (!isIncluded("manualplay/hooks/" + x)) {
    //         if (!include("manualplay/hooks/" + x)) {
    //           throw new Error("Failed to include " + "manualplay/hooks/" + x);
    //         }
    //       }
    //     });
  },

  update() {
    while (!me.gameReady) {
      delay(100);
    }

    if (!this.enabled) {
      this.enabled = getUIFlag(sdk.uiflags.AutoMap);

      return;
    }

    // ActionHooks.check();
    VectorHooks.check();
    MonsterHooks.check();
    ShrineHooks.check();
    ItemHooks.check();
    TextHooks.check();
    Hooks.flushed = false;
  },

  flush(flag) {
    if (Hooks.flushed === flag) return true;

    if (flag === true) {
      this.enabled = false;

      MonsterHooks.flush();
      ShrineHooks.flush();
      TextHooks.flush();
      VectorHooks.flush();
      // ActionHooks.flush();
      ItemHooks.flush();
    } else {
      if (sdk.uiflags.Waypoint === flag) {
        VectorHooks.flush();
        TextHooks.displaySettings = false;
        TextHooks.check();
      } else if (
        sdk.uiflags.Inventory === flag &&
        [sdk.uiflags.Stash, sdk.uiflags.Cube, sdk.uiflags.TradePrompt].every(
          (el) => !getUIFlag(el)
        )
      ) {
        ItemHooks.flush();
        TextHooks.check();
      } else {
        MonsterHooks.flush();
        ShrineHooks.flush();
        TextHooks.flush();
        VectorHooks.flush();
        // ActionHooks.flush();
        ItemHooks.flush();
      }
    }

    Hooks.flushed = flag;

    return true;
  },
};
