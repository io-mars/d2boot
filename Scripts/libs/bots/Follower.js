import {
  addEventListener,
  copyUnit,
  delay,
  getArea,
  me,
  quit,
  rand,
  say,
  print,
  getTickCount,
  getParty,
  submitItem,
  getSkillById,
  transmute,
} from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { CollMap } from "../common/CollMap.js";
import { Skill, Game, Misc, Packet, Time } from "../common/Misc.js";
import { Precast } from "../common/Precast.js";
import { Town, NPC } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Pickit } from "../common/Pickit.js";
import { Storage } from "../common/Storage.js";
import { Cubing } from "../common/Cubing.js";
import { NTIP } from "../NTItemParser.js";
import { NTIPAliasClassID } from "../NTItemAlias.js";

/**
 *  @filename    Follower.js
 *  @author      kolton, theBGuy
 *  @desc        Controllable bot to follow around leader like an additonal merc
 *  @Commands
 *  @Main
 *      1 - take leader's tp from town / move to leader's town
 *      2 - take leader's tp to town
 *      3 - town manager
 *      c - get corpse
 *      p - pick items
 *      s - toggle stop
 *      <charname> s - toggle stop <charname>
 *  @Attack
 *      a - attack toggle for all
 *      <charname> a - attack toggle for <charname>
 *      aon - attack on for all
 *      <charname> aon - attack on for <charname>
 *      aoff - attack off for all
 *      <charname> aoff - attack off for <charname>
 *  @Teleport *** characters without teleport skill will ignore tele command ***
 *      tele - toggle teleport for all
 *      <charname> tele - toggle teleport for <charname>
 *      tele on - teleport on for all
 *      <charname> tele on - teleport on for <charname>
 *      tele off - teleport off for all
 *      <charname> tele off - teleport off for <charname>
 *  @Skills *** refer to skills.txt ***
 *      all skill <skillid> - change skill for all. refer to skills.txt
 *      <charname> skill <skillid> - change skill for <charname>
 *      <class> skill <skillid> - change skill for all characters of certain class *** any part of class name will do *** for example: "sorc skill 36", "zon skill 0", "din skill 106"
 *      Auras: *** refer to skills.txt ***
 *      all aura <skillid> - change aura for all paladins
 *      <charname> aura <skillid> - change aura for <charname>
 *  @Town
 *      a2-5 - move to appropriate act (after quest) !NOTE: Disable 'no sound' or game will crash!
 *      talk <npc name> - talk to a npc in town
 *  @Misc
 *      quiet - stop announcing in chat
 *      cow - enter red cow portal
 *      wp - all players activate a nearby wp
 *      <charname> wp - <charname> activates a nearby wp
 *      bo - barbarian precast
 *      <charname> tp - make a TP. Needs a TP tome if not using custom libs.
 *      move - move in a random direction (use if you're stuck by followers)
 *      reload - reload script. Use only in case of emergency, or after editing character config.
 *      quit - exit game
 *
 */

export const Follower = function () {
  let leader, charClass;
  let commanders = [Config.Leader];
  let [allowSay, attack, openContainers, stop] = [true, true, true, false];
  let actions = [];
  //iomars
  let minGold = 100;

  this.announce = function (msg = "") {
    if (!allowSay) return;
    say(msg);
  };

  // Change areas to where leader is
  this.checkExit = function (player, area) {
    // if (player.inTown) return false;

    let target = Game.getObject("portal");
    if (target) {
      do {
        if (target.objtype === area) {
          this.announce(`Taking portal ${Pather.getAreaName(area)}.`);
          return Pather.usePortal(null, null, target);
        }
      } while (target.getNext());
    }

    if (player.inTown) {
      target = Game.getObject("waypoint");

      if (target && target.distance < 20) {
        this.announce(`Taking waypoint ${Pather.getAreaName(area)}.`);
        return Pather.useWaypoint(area, true);
      } else {
        this.announce(`Backing town ${Pather.getAreaName(area)}.`);
        return Pather.makePortal(true);
      }
    }

    let exits = getArea()?.exits;
    for (let exit of exits) {
      if (exit.target === area) {
        this.announce(`Taking exit ${Pather.getAreaName(area)}.`);
        return Pather.moveToExit(area, true);
      }
    }

    // Arcane<->Cellar portal
    if (
      (me.inArea(sdk.areas.ArcaneSanctuary) &&
        area === sdk.areas.PalaceCellarLvl3) ||
      (me.inArea(sdk.areas.PalaceCellarLvl3) &&
        area === sdk.areas.ArcaneSanctuary)
    ) {
      this.announce(`Special transit ${Pather.getAreaName(area)}.`);
      return Pather.usePortal(null);
    }

    // Tal-Rasha's tomb->Duriel's lair
    if (
      me.area >= sdk.areas.TalRashasTomb1 &&
      me.area <= sdk.areas.TalRashasTomb7 &&
      area === sdk.areas.DurielsLair
    ) {
      this.announce(`Special transit ${Pather.getAreaName(area)}.`);
      return Pather.useUnit(
        sdk.unittype.Object,
        sdk.objects.PortaltoDurielsLair,
        area
      );
    }

    // Throne->Chamber
    if (
      me.inArea(sdk.areas.ThroneofDestruction) &&
      area === sdk.areas.WorldstoneChamber
    ) {
      target = Game.getObject(sdk.objects.WorldstonePortal);

      if (target) {
        this.announce(`Special transit ${Pather.getAreaName(area)}.`);
        return Pather.usePortal(null, null, target);
      }
    }

    this.announce(`Back oneself ${Pather.getAreaName(area)}.`);

    return Pather.makePortal(true);
  };

  // Talk to a NPC
  this.talk = function (name) {
    if (!me.inTown) {
      this.announce("I'm not in town!");

      return false;
    }

    if (typeof name !== "string") {
      this.announce("No NPC name given.");

      return false;
    }

    try {
      Town.npcInteract(name);
    } catch (e) {
      this.announce(
        typeof e === "object" && e.message
          ? e.message
          : typeof e === "string"
          ? e
          : "Failed to talk to " + name
      );
    }

    Town.move("portalspot");

    return false;
  };

  // Change act after completing last act quest
  this.changeAct = function (act) {
    let preArea = me.area;

    if (me.area >= sdk.areas.townOfAct(act)) {
      this.announce("My current act is higher than " + act);
      return false;
    }

    switch (act) {
      case 2:
        Town.npcInteract(NPC.Warriv, false) && Misc.useMenu(sdk.menu.GoEast);

        break;
      case 3:
        Town.npcInteract(NPC.Jerhyn);
        Town.npcInteract(NPC.Meshif, false) && Misc.useMenu(sdk.menu.SailEast);

        break;
      case 4:
        if (me.inTown) {
          Town.npcInteract(NPC.Cain);
          Town.move("portalspot");
          Pather.usePortal(sdk.areas.DuranceofHateLvl3, null);
        }

        delay(1500);

        let target = Game.getObject(sdk.objects.RedPortalToAct4);
        target && Pather.moveTo(target.x - 3, target.y - 1);

        Pather.usePortal(null);

        break;
      case 5:
        if (Town.npcInteract(NPC.Tyrael)) {
          try {
            Pather.useUnit(
              sdk.unittype.Object,
              sdk.objects.RedPortalToAct5,
              sdk.areas.Harrogath
            );
          } catch (a5e) {
            break;
          }
        }

        break;
    }

    delay(2000);

    while (!me.area) {
      delay(500);
    }

    if (me.area === preArea) {
      me.cancel();
      Town.move("portalspot");
      this.announce("Act change failed.");

      return false;
    }

    Town.move("portalspot");
    this.announce("Act change successful.");
    act === 2 &&
      this.announce(
        "Don't forget to talk to Drognan after getting the Viper Amulet!"
      );

    act === 3 && this.announce("Don't forget drop the cube first!");

    return true;
  };

  // Get leader's act from Party Unit
  this.checkLeaderAct = function (player) {
    //iomars fix area null/zero bug
    while (!player.area) {
      delay(100);
    }

    return sdk.areas.actOf(player.area);
  };

  this.pickPotions = function (range = 5) {
    if (me.dead) return false;

    Town.clearBelt();

    while (!me.idle) {
      delay(40);
    }

    let pickList = [];
    let item = Game.getItem();

    if (item) {
      do {
        if (
          item.onGroundOrDropping &&
          ((item.itemType >= sdk.items.type.HealingPotion &&
            item.itemType <= sdk.items.type.RejuvPotion) ||
            (Config.Follower.PickGold &&
              item.itemType == sdk.items.type.Gold &&
              item.classid == sdk.items.Gold &&
              item.getStat(sdk.stats.Gold) >= minGold)) &&
          item.distance <= range
        ) {
          pickList.push(copyUnit(item));
        }
      } while (item.getNext());
    }

    pickList.sort(Pickit.sortItems);

    while (pickList.length > 0) {
      item = pickList.shift();

      // if (item && copyUnit(item).x) {
      if (item && item.x) {
        let status = Pickit.checkItem(item).result;

        if (status && Pickit.canPick(item)) {
          //iomars the item is still here
          Pickit.pickItem(item, status);
        }
      }
    }

    return true;
  };

  //iomars
  this.offerRune = function (runes) {
    let runeNo, classId, item;

    while (runes.length > 0) {
      runeNo = runes.shift();

      if (runeNo.length < 2) {
        runeNo = "0" + runeNo;
      }

      runeNo = ("r" + runeNo).replace(/\s+/g, "").toLowerCase();

      if (NTIPAliasClassID.hasOwnProperty(runeNo)) {
        classId = NTIPAliasClassID[runeNo];
      } else {
        return false;
      }

      //NOTE: need open statsh every time!
      if (!Town.openStash()) {
        return false;
      }

      // findItem(603, 0, -1, 7);
      item = me.getItem(classId);
      if (item) {
        say("found:[" + item.code + "], get here!");
        item.drop();
        delay(1000);
      } else {
        me.overhead(
          "sorry, I don't have this rune: [\xFFc2" + runeNo + "\xFFc0]:("
        );
        say("sorry, I don't have this rune: [\xFFc2" + runeNo + "\xFFc0]:(");
      }
      me.cancel();
    }

    this.runeSummary();
    Town.move("portalspot");
    return true;
  };

  this.pickAction = function (mode) {
    if (!me.inTown) {
      this.announce("I'm not in town!");

      return false;
    }

    if (me.dead) {
      return false;
    }

    while (!me.idle) {
      delay(40);
    }

    let pu = Misc.getPlayerUnit(Config.Leader);
    pu && Pather.moveToUnit(pu);

    let item = Game.getUnits(sdk.unittype.Item);

    if (item) {
      do {
        //mode 3 on ground
        if (
          item.mode === sdk.items.mode.onGround &&
          (item.itemType === sdk.items.type.Rune ||
            (item.classid >= sdk.items.quest.KeyofTerror &&
              item.classid <= sdk.items.quest.MephistosBrain))
        ) {
          Pickit.pickItem(item);
        }
      } while (item.getNext());
    }

    if (!Town.openStash()) {
      return false;
    }

    let items = me.getItems();

    for (let item of items) {
      if (
        item.mode === sdk.items.mode.inStorage &&
        item.location === sdk.storage.Inventory &&
        (item.itemType === sdk.items.type.Rune ||
          (item.classid >= sdk.items.quest.KeyofTerror &&
            item.classid <= sdk.items.quest.MephistosBrain))
      ) {
        if (Storage.Stash.CanFit(item)) {
          Storage.Stash.MoveTo(item);
        } else {
          me.overhead(
            "sorry, inventory is full, drop the item:[" + item.code + "]:("
          );
          say(", inventory is full, drop the item:[" + item.code + "]:(");
          item.drop();
          delay(1000);
          me.cancel();
        }
      }
    }
    switch (mode) {
      case 0:
        this.runeSummary();

        break;
      case 1:
        this.keyAction(0);

        break;
      default:
        break;
    }

    // say("rune storage over");
    Town.move("portalspot");

    return true;
  };

  this.runeSummary = function () {
    let idx,
      items,
      total = 0,
      sumString = "RuneSummary:",
      summary = new Array(33);

    items = me.getItems();
    for (let item of items) {
      if (item.mode === 0 && item.itemType === 74) {
        total += 1;
        // parseInt must set radix:10
        idx = parseInt(item.code.replace(/[^0-9]/gi, ""), 10);

        if (summary[idx] === undefined) {
          summary[idx] = 0;
        }

        summary[idx] += 1;
      }
    }
    summary.forEach((item, index) => {
      if (item) sumString += " #" + index + ":[" + item + "]";
    });
    // say("/m " + Config.Leader + " " + sumString);
    say("Total:" + total + " " + sumString);
  };

  this.offerKey = function (classid) {
    let item = me.getItem(classid);
    if (item) {
      say(`found:[${item.name.omitColor()}], get here!`);
      item.drop();
      delay(1000);
    } else {
      me.overhead("sorry, I don't have this key: [" + classid + "]:(");
      say("sorry, I don't have this key: [" + classid + "]:(");
    }

    return true;
  };

  this.keyAction = function (mode, subMode) {
    let tkeys, hkeys, dkeys, brains, eyes, horns;
    tkeys = me.findItems("pk1", 0);
    hkeys = me.findItems("pk2", 0);
    dkeys = me.findItems("pk3", 0);
    brains = me.findItems("mbr", 0);
    eyes = me.findItems("bey", 0);
    horns = me.findItems("dhn", 0);
    let keys = [
      tkeys.length || 0,
      hkeys.length || 0,
      dkeys.length || 0,
      brains.length || 0,
      eyes.length || 0,
      horns.length || 0,
    ];
    let total = keys.reduce((val, current) => val + current);

    switch (mode) {
      case 0:
        if (total > 0) {
          say(
            `Key1:[${keys[0]}] Key2:[${keys[1]}] Key3:[${keys[2]}] brains:[${keys[3]}] eyes:[${keys[4]}] horns:[${keys[5]}]`
          );
        }

        break;
      case 1:
        break;
      case 2:
        if (!total) return false;

        if (!Town.openStash()) {
          return false;
        }

        if (!subMode) {
          if (tkeys.length > 0) {
            this.offerKey(tkeys[0].classid);
          }
          if (hkeys.length > 0) {
            this.offerKey(hkeys[0].classid);
          }
          if (dkeys.length > 0) {
            this.offerKey(dkeys[0].classid);
          }
        } else {
          if (brains.length > 0) {
            this.offerKey(brains[0].classid);
          }
          if (eyes.length > 0) {
            this.offerKey(eyes[0].classid);
          }
          if (horns.length > 0) {
            this.offerKey(horns[0].classid);
          }
        }

        me.cancel();

        Town.move("portalspot");

        break;
      default:
        break;
    }
    return true;
  };

  this.talkHealth = function () {
    if (!me.inTown) return false;

    let npc = [NPC.Akara, NPC.Atma, NPC.Ormus, NPC.Jamella, NPC.Malah][
      me.act - 1
    ];

    Town.npcInteract(npc);
    Town.move("portalspot");
    this.announce("talk health done!");
  };

  this.findTristram = function (mode) {
    let portal, area;

    if (mode === 1) area = sdk.areas.UberTristram;
    else area = sdk.areas.Harrogath;

    portal = Game.getObject("portal");

    if (portal) {
      do {
        if (portal.objtype === area) {
          return copyUnit(portal);
        }
      } while (portal.getNext());
    }
    return false;
  };

  this.getQuestItem = function (classid, chestid) {
    let tick = getTickCount();

    if (me.getItem(classid)) {
      // this.announce("Already have: " + classid);
      return true;
    }

    if (me.inTown) return false;

    let chest = Game.getObject(chestid);

    if (!chest) {
      this.announce("Couldn't find: " + chestid);
      return false;
    }

    for (let i = 0; i < 5; i++) {
      if (Misc.openChest(chest)) {
        break;
      }
      // this.announce("Failed to open chest: Attempt[" + (i + 1) + "]");
      let coord = CollMap.getRandCoordinate(chest.x, -4, 4, chest.y, -4, 4);
      coord && Pather.moveTo(coord.x, coord.y);
    }

    let item = Game.getItem(classid);

    if (!item) {
      if (getTickCount() - tick < 500) {
        delay(500);
      }

      return false;
    }

    return (
      item &&
      item.name &&
      Pickit.pickItem(item) &&
      this.announce(`get quest item: ${item.name.omitColor()}.`) &&
      delay(1000)
    );
  };

  this.cubeStaff = function () {
    let shaft = me.shaft;
    let amulet = me.amulet;

    if (!shaft || !amulet) return false;

    Storage.Cube.MoveTo(amulet);
    Storage.Cube.MoveTo(shaft);
    Cubing.openCube();
    print("making staff");
    transmute();
    delay(750 + me.ping);

    let staff = me.completestaff;

    if (!staff) return false;

    Storage.Inventory.MoveTo(staff);
    me.cancel();

    return true;
  };

  this.placeStaff = function () {
    let tick = getTickCount();
    let orifice = Game.getObject(sdk.quest.chest.HoradricStaffHolder);
    if (!orifice) return false;

    Misc.openChest(orifice);

    let staff = me.completestaff;

    if (!staff) {
      if (getTickCount() - tick < 500) {
        delay(500);
      }

      return false;
    }

    staff.toCursor();
    submitItem();
    delay(750 + me.ping);

    // unbug cursor
    let item = me.findItem(-1, sdk.items.mode.inStorage, sdk.storage.Inventory);

    if (item && item.toCursor()) {
      Storage.Inventory.MoveTo(item);
    }

    return true;
  };

  this.doQuestNow = function () {
    switch (me.area) {
      case sdk.areas.RogueEncampment: //Rogue Encampment get Merc
        this.talk(NPC.Kashya);

        break;
      case sdk.areas.LutGholein: //Lut Gholein after get the staff
        this.talk(NPC.Drognan);

        break;
      // case sdk.areas.KurastDocktown: //Kurast Docktown
      //   this.talkNPC(NPC.Cain);

      //   break;
      case sdk.areas.PandemoniumFortress: //The Pandemonium Fortress
        this.talk(NPC.Tyrael);

        break;
      // case 109: //The Pandemonium Fortress
      //   this.talkNPC(NPC["Qual-Kehk"]);

      //   break;
      case sdk.areas.A2SewersLvl3: //Sewers Level 3 book of skill
        while (true) {
          let target = Game.getItem(sdk.quest.item.BookofSkill);
          if (!target) {
            break;
          }

          Pickit.pickItem(target);
          delay(250);

          let book = me.getItem(sdk.quest.item.BookofSkill);
          if (book) {
            book.isInStash && Town.openStash() && delay(300 + me.ping);
            book.use();
            say("Using book of skill");
            break;
          }
        }
        break;
      case sdk.areas.HallsoftheDeadLvl3: // Halls of the Dead level 3 cube
        this.getQuestItem(
          sdk.quest.item.Cube,
          sdk.quest.chest.HoradricCubeChest
        );
        this.cubeStaff();

        break;
      case sdk.areas.ClawViperTempleLvl2: // Claw Viper Temple level 2  amult
        this.getQuestItem(
          sdk.quest.item.ViperAmulet,
          sdk.quest.chest.ViperAmuletChest
        );

        this.cubeStaff();
        break;
      case sdk.areas.MaggotLairLvl3: // Maggot Lair level 3 staff
        this.getQuestItem(
          sdk.quest.item.ShaftoftheHoradricStaff,
          sdk.quest.chest.ShaftoftheHoradricStaffChest
        );
        this.cubeStaff();
        break;
      case sdk.areas.TalRashasTomb1: // Tal Rasha's Tombs
      case sdk.areas.TalRashasTomb2:
      case sdk.areas.TalRashasTomb3:
      case sdk.areas.TalRashasTomb4:
      case sdk.areas.TalRashasTomb5:
      case sdk.areas.TalRashasTomb6:
      case sdk.areas.TalRashasTomb7:
        this.placeStaff();
        break;
      case sdk.areas.KurastDocktown: // act3 Kurast Docktown potion of life
        //get potion one by one
        delay((Config.QuitTimeout - 4000) * 2);
        this.talk(NPC.Alkor);

        // Potion of life
        let pol = me.getItem(sdk.quest.item.PotofLife);
        if (pol) {
          pol.isInStash && Town.openStash() && delay(300 + me.ping);
          pol.use();
          say("Using potion of life");
        }

        break;
      case sdk.areas.SpiderCavern: //spider cavern khalim's eye
        this.getQuestItem(
          sdk.quest.item.KhalimsEye,
          sdk.quest.chest.KhalimsEyeChest
        );
        break;
      case sdk.areas.FlayerDungeonLvl3: //flayer dungeon level3 khalim's brain
        this.getQuestItem(
          sdk.quest.item.KhalimsBrain,
          sdk.quest.chest.KhalimsBrainChest
        );
        break;
      case sdk.areas.A3SewersLvl2: //sewers level 2 khalim's heart
        this.getQuestItem(
          sdk.quest.item.KhalimsHeart,
          sdk.quest.chest.KhalimsHeartChest
        );
        break;
      case sdk.areas.Harrogath: // Harrogath saved Anya
        if (me.act === 5) {
          this.talk(NPC.Malah);

          // Scroll of resistance
          let sor = me.getItem(sdk.items.quest.ScrollofResistance);
          if (sor) {
            sor.isInStash && this.openStash() && delay(300 + me.ping);
            sor.use();
            say("Using scroll of resistance");
          }
        }

        break;
      default:
        break;
    }
  };

  this.switchAura = function () {
    let idx, skill, nextSkill;
    //get the right hand skill
    skill = me.getSkill(sdk.skills.get.RightId);
    if (skill < 0) return false;

    idx = Config.Follower.AuraSkills.indexOf(skill);
    if (idx === -1 || idx === Config.Follower.AuraSkills.length - 1) idx = 0;
    else idx += 1;

    nextSkill = Config.Follower.AuraSkills[idx];
    Config.AttackSkill[2] = nextSkill;
    Config.AttackSkill[4] = nextSkill;

    if (Skill.setSkill(nextSkill, sdk.skills.hand.Right)) {
      this.announce(`active aura: ${getSkillById(nextSkill)}(${nextSkill})`);
      return true;
    }

    this.announce(`cant set aura: ${getSkillById(nextSkill)}(${nextSkill})`);
    return false;
  };

  //get min gold from NIP, default 100
  this.getNTIPGoldQuantity = function () {
    // print(`---00--> ${NTIP.CheckList.length} list:${NTIP.CheckList[0]}`);

    //const [type, stat, wanted] = NTIP.CheckList[i];
    //type, stat is a function
    let goldLines,
      goldList,
      quantity = -1;

    goldLines = NTIP.CheckList.filter((line) => {
      //support name and type
      return /(item.classid==523\D|item.itemType==4\D)/.test(line[0]);
    });

    //get the min quantity of gold
    goldList = goldLines.map((line) => {
      return parseInt(
        line[1].toString().match(/getStatEx\(14\)>=(\d+)/)[1],
        10
      );
    });

    quantity = Math.min.apply(null, goldList);

    return quantity == -1 ? 100 : quantity;
  };

  this.specialAction = function (action) {
    switch (action) {
      case "cow":
        if (me.inArea(sdk.areas.RogueEncampment)) {
          Town.move("portalspot");
          !Pather.usePortal(sdk.areas.MooMooFarm) &&
            this.announce("Failed to use cow portal.");
        }

        break;
      case "move":
        let coord = CollMap.getRandCoordinate(me.x, -5, 5, me.y, -5, 5);
        Pather.moveTo(coord.x, coord.y);

        break;
      case "wp":
      case me.name + "wp":
        if (me.inTown) {
          break;
        }

        delay(rand(1, 3) * 500);

        let wp = Game.getObject("waypoint");

        if (wp) {
          for (let i = 0; i < 3; i += 1) {
            if (Pather.getWP(me.area)) {
              this.announce("Got wp.");
              break;
            }
          }

          this.announce("Failed to get wp.");
        }

        me.cancel();

        break;
      case "c":
        !me.inTown && Town.getCorpse();

        break;
      case "p":
        this.announce("!Picking items.");
        Pickit.pickItems();
        openContainers && Misc.openChests(20);
        this.announce("!Done picking.");

        break;
      case "1":
        !me.inTown && !me.inArea(leader.area) && Pather.makePortal(true);

        if (leader.inTown && Misc.getPlayerAct(Config.Leader) !== me.act) {
          this.announce("Going to leader's town.");
          Town.goToTown(Misc.getPlayerAct(Config.Leader));
          Town.move("portalspot");
        }

        if (me.inTown) {
          delay(rand(1, 8) * 50);
          this.announce("Going outside.");
          Town.move("portalspot");

          for (let i = 0; i < 5; i += 1) {
            if (me.inTown && Pather.usePortal(null, leader.name)) {
              break;
            }
            delay(500 + me.ping);
          }
        }

        break;
      case "2":
        if (!me.inTown) {
          this.announce("Going to town.");

          for (let i = 0; i < 5; i += 1) {
            if (!me.inTown && Pather.usePortal(null, leader.name)) {
              break;
            }
            delay(500 + me.ping);
          }

          Town.doChores();
          Town.move("portalspot");
        }

        break;
      case "3":
        if (me.inTown) {
          this.announce("Running town chores");
          Town.doChores();
          Town.move("portalspot");
          this.announce("Ready");
        }

        break;
      case "h":
        me.barbarian && Skill.cast(sdk.skills.Howl);

        break;
      case "bo":
        // checks if we have cta or warcries
        me.barbarian && Precast.needOutOfTownCast() && Precast.doPrecast(true);

        break;
      case "a2":
      case "a3":
      case "a4":
      case "a5":
        this.changeAct(parseInt(action[1], 10));

        break;
      case me.name + " tp":
        let tp = Town.getTpTool();

        if (tp) {
          tp.interact();

          break;
        }

        this.announce("No TP scrolls or tomes.");

        break;
    }

    if (action.indexOf("talk") > -1) {
      this.talk(action.split(" ")[1]);
    }
  };

  this.chatAction = function (nick, msg) {
    let piece, skill;

    if (msg && nick === Config.Leader) {
      switch (msg) {
        case "tele":
        case me.name + " tele":
          if (Pather.teleport) {
            Pather.teleport = false;

            this.announce("Teleport off.");
          } else {
            Pather.teleport = true;

            this.announce("Teleport on.");
          }

          break;
        case "tele off":
        case me.name + " tele off":
          Pather.teleport = false;

          this.announce("Teleport off.");

          break;
        case "tele on":
        case me.name + " tele on":
          Pather.teleport = true;

          this.announce("Teleport on.");

          break;
        case "a":
        case me.name + " a":
          if (attack) {
            attack = false;

            this.announce("Attack off.");
          } else {
            attack = true;

            this.announce("Attack on.");
          }

          break;
        case "flash":
          Packet.flash(me.gid);

          break;
        case "quiet":
          allowSay = !allowSay;

          break;
        case "aoff":
        case me.name + " aoff":
          attack = false;

          this.announce("Attack off.");

          break;
        case "aon":
        case me.name + " aon":
          attack = true;

          this.announce("Attack on.");

          break;
        case "quit":
        case me.name + " quit":
          quit();

          break;
        case "s":
        case me.name + " s":
          if (stop) {
            stop = false;

            this.announce("Resuming.");
          } else {
            stop = true;

            this.announce("Stopping.");
          }

          break;
        case "r":
          me.dead && me.revive();

          break;
        //iomars
        case "th":
          this.talkHealth();

          break;

        case "3b":
          {
            let portal = this.findTristram(1);

            if (portal) {
              Pather.usePortal(null, null, portal);
            } else {
              this.announce("Tristram not found!");
            }
          }

          break;
        case "3bt":
          {
            let portal = this.findTristram(0);

            if (portal) {
              Pather.usePortal(null, null, portal);
            } else {
              this.announce("Harrogath not found!");
            }
          }

          break;

        case "q":
          this.doQuestNow();

          break;
        case "g":
          this.pickGold();

          break;
        case "pbox":
          {
            let cube = Game.getItem(sdk.quest.item.Cube);
            Pickit.pickItem(cube);
            this.announce("pick cube, ilvl:[" + cube.ilvl + "]");
          }

          break;
        case "dbox":
          {
            let cube = Game.getItem(sdk.quest.item.Cube);
            //hell cube ilvl:85
            if (cube && cube.ilvl < 85) {
              this.announce("drop low cube, ilvl:[" + cube.ilvl + "]");
              cube.drop();
            }
          }

          break;
        case "rp":
          Config.Follower.Runer && this.pickAction(0);

          break;
        case "rs":
          Config.Follower.Runer && this.runeSummary();

          break;
        case "ah":
          Config.Follower.AuraSkills.length && this.switchAura();

          break;
        case "dp":
          {
            let potion = me.malahspotion;
            if (potion) {
              this.announce("the Anya's potion here.");
              potion.drop();
            }
          }

          break;
        case "ks":
          this.keyAction(0);

          break;
        case "kp":
          Config.Follower.Picker && this.pickAction(1);

          break;
        case "ko":
          this.keyAction(2);

          break;
        case "koo":
          this.keyAction(2, 1);

          break;

        default:
          if (me.paladin && msg.includes("aura ")) {
            piece = msg.split(" ")[0];

            if (piece === me.name || piece === "all") {
              skill = parseInt(msg.split(" ")[2], 10);

              if (me.getSkill(skill, sdk.skills.subindex.SoftPoints)) {
                this.announce("Active aura is: " + skill);

                Config.AttackSkill[2] = skill;
                Config.AttackSkill[4] = skill;

                Skill.setSkill(skill, sdk.skills.hand.Right);
              } else {
                this.announce("I don't have that aura.");
              }
            }

            break;
          }

          if (msg.includes("skill ")) {
            piece = msg.split(" ")[0];

            if (
              charClass.includes(piece) ||
              piece === me.name ||
              piece === "all"
            ) {
              skill = parseInt(msg.split(" ")[2], 10);

              if (me.getSkill(skill, sdk.skills.subindex.SoftPoints)) {
                this.announce("Attack skill is: " + skill);

                Config.AttackSkill[1] = skill;
                Config.AttackSkill[3] = skill;
              } else {
                this.announce("I don't have that skill.");
              }
            }

            break;
          }

          //iomars
          if (msg.indexOf("ro") > -1) {
            if (Config.Follower.Runer) {
              let runes = msg.split(" ").slice(1);
              this.offerRune(runes);
            }

            break;
          }

          actions.push(msg);

          break;
      }
    }

    if (
      msg &&
      msg.split(" ")[0] === "leader" &&
      commanders.indexOf(nick) > -1
    ) {
      piece = msg.split(" ")[1];

      if (typeof piece === "string") {
        if (commanders.indexOf(piece) === -1) {
          commanders.push(piece);
        }

        this.announce("Switching leader to " + piece);

        Config.Leader = piece;
      }
    }
  };

  this.chatEvent = function ({ nick, msg }) {
    this.chatAction(nick, msg);
  };

  this.gameEvent = function ({ mode, param1, param2, name1, name2 }) {
    // console.log("gameevent", mode, param1, param2, name1, name2);
    if (
      name1 === Config.Leader &&
      ((mode === 0x07 && param1 === 0x02 && param2 === 0x09) || mode === 0x03)
    ) {
      recheck = true;
    }
  };

  this.getLocation = function (player) {
    if (!player) this.announce("can't found leader's location.");

    // fixed area is null or zero
    while (!player.area) {
      delay(100);
    }

    return { area: player.area, x: player.x, y: player.y };
  };

  this.getLeaderPlayer = function () {
    let player = Misc.getPlayerUnit(Config.Leader);
    if (player) return player;

    // found other player
    // player = Game.getPlayer();
    // if (player) {
    //   do {
    //     if (player.name !== me.name) {
    //       return player;
    //     }
    //   } while (player.getNext());
    // }

    return Misc.findPlayer(Config.Leader);
  };

  // START
  let recheck = false;
  let leaderUnit, location, distance;
  addEventListener("chatmsg", this.chatEvent, this);
  addEventListener("gameevent", this.gameEvent, this);

  openContainers &&
    Config.OpenChests.Enabled &&
    Config.OpenChests.Types.push("all");

  // Override config values that use TP
  Config.TownCheck = false;
  Config.TownHP = 0;
  Config.TownMP = 0;
  charClass = sdk.player.class.nameOf(me.classid).toLowerCase();

  leader = Misc.poll(
    () => Misc.findPlayer(Config.Leader),
    Time.seconds(20),
    Time.seconds(1)
  );

  if (!leader) {
    this.announce("Leader not found.");
    delay(1000);
    quit();
  }

  //iomars
  if (Config.Follower.Runer || Config.Follower.Picker) {
    this.announce(
      "Leader found, i'm a" +
        (Config.Follower.Runer ? " \xFFc8Runer\xFFc0" : "") +
        (Config.Follower.Picker ? " \xFFc8Picker\xFFc0" : "")
    );
  } else {
    this.announce("Leader found.");
  }

  if (Config.Follower.AuraSkills.length) {
    this.announce("i'm a \xFFc;AuraHelper\xFFc0, command:[ah].");
  }

  if (Config.Follower.teleportOff) {
    Pather.teleport = false;
    this.announce("teleport off.");
  }

  //get gold quantity after in game, avoid checkItem lag
  if (Config.Follower.PickGold) {
    minGold = this.getNTIPGoldQuantity();
    print(
      "follower.pickGold set [\xFFc2True\xFFc0], pick min gold:[\xFFc2" +
        minGold.toString() +
        "\xFFc0]"
    );
  }

  while (!Misc.inMyParty(Config.Leader)) {
    delay(500);
  }

  this.announce("Partied.");

  me.inTown && Town.doChores() && Town.move("portalspot");

  // Main Loop
  while (true) {
    if (recheck) {
      if (
        !Misc.poll(() => Misc.inMyParty(Config.Leader), Time.seconds(2), 200)
      ) {
        this.announce("Leader left party.");
        break;
      }
      recheck = false;
    }

    if (me.mode === sdk.player.mode.Dead) {
      while (!me.inTown) {
        me.revive();
        delay(1000);
      }

      Town.move("portalspot");
      this.announce("I'm alive!");
    }

    while (stop) {
      delay(500);
    }

    if (!me.inTown) {
      if (!leaderUnit || !copyUnit(leaderUnit).x) {
        leaderUnit = this.getLeaderPlayer();

        if (!leaderUnit) {
          this.announce("Leader not found.");
          delay(500);
          break;
        }
      }

      location = this.getLocation(leaderUnit);
      distance = [location.x, location.y].distance;

      // iomars fixed area lag bug when leader enter a exist,check leader again and waiting
      // the getUnit's range is 60?
      if (me.inArea(location.area) && distance >= 60) {
        Misc.poll(
          () => {
            leaderUnit = this.getLeaderPlayer();
            return leaderUnit.area && leaderUnit.area !== location.area;
          },
          Time.seconds(2),
          500
        );

        print(
          `\xFFc4Follower\xFFc0: check area:${leaderUnit.area}-${
            location.area
          } distance ${Math.round(distance)}.`
        );
        //set again
        location = this.getLocation(leaderUnit);
        distance = [location.x, location.y].distance;
      }

      if (me.inArea(location.area)) {
        distance >= 60 &&
          print(
            `\xFFc4Follower\xFFc0: faraway distance from leader in ${Pather.getAreaName(
              location.area
            )} distance ${Math.round(distance)}.`
          );
        distance > 4 && Pather.moveTo(location.x, location.y);
      } else {
        this.checkExit(leaderUnit, location.area);
      }

      if (attack) {
        Attack.clear(20, false, false, false, false);
        //iomars
        if (Config.Follower.Picker) Pickit.pickItems();
        else this.pickPotions(20);
      }

      me.paladin &&
        Config.AttackSkill[2] > 0 &&
        Skill.setSkill(Config.AttackSkill[2], sdk.skills.hand.Right);
    } else {
      //iomars change Act
      if (Config.Follower.SwitchAct) {
        let leaderAct = this.checkLeaderAct(leader);

        if (me.inTown && leaderAct !== me.act) {
          this.announce("going act" + leaderAct);
          Town.goToTown(leaderAct);
          Town.move("portalspot");
        }
      }
    }

    if (actions.length) {
      let action = actions.shift();
      this.specialAction(action);
    }

    delay(100);
  }

  return true;
};
