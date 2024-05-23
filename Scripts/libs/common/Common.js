import {
  FileTools,
  checkCollision,
  copyUnit,
  delay,
  getDistance,
  getLocaleString,
  getParty,
  getPresetUnits,
  getRoom,
  getScript,
  getTickCount,
  me,
  print,
  quit,
  rand,
  say,
  scriptBroadcast,
  clickMap,
  Text,
  Box,
  Frame,
} from "boot";

import { sdk } from "../modules/sdk.js";
import { Scripts, Config } from "./Config.js";
import { Pather } from "./Pather.js";
import { Town } from "./Town.js";
import { Skill, Packet, Misc, Game, Time, Experience } from "./Misc.js";
import { Attack } from "./Attack.js";
import { Precast } from "./Precast.js";
import { Pickit } from "./Pickit.js";
import { Loader } from "./Loader.js";
import { D2Bot } from "@/OOG.js";

/**
 * @description clickMap doesn't return if we sucessfully clicked a unit just that a click was sent, this checks and returns that a units mode has changed
 *		as a result of us clicking it.
 * @returns boolean
 */
const clickUnitAndWait = function (button, shift, unit) {
  if (typeof unit !== "object")
    throw new Error("clickUnitAndWait: Third arg must be a Unit.");

  let before = unit.mode;

  me.blockMouse = true;
  clickMap(button, shift, unit);
  delay(Math.max(me.ping * 2, 250));
  clickMap(button + 2, shift, unit);
  me.blockMouse = false;

  let waitTick = getTickCount();
  let timeOut = Math.min(1000, 100 + me.ping * 4);

  while (getTickCount() - waitTick < timeOut) {
    delay(30);

    // quit the loop if mode has changed
    if (before !== unit.mode) {
      break;
    }
  }

  delay(Math.max(me.ping + 1, 50));

  return before !== unit.mode;
};

export const Common = {
  Questing: {
    activateStone(stone) {
      for (let i = 0; i < 3; i++) {
        // don't use tk if we are right next to it
        let useTK = stone.distance > 5 && Skill.useTK(stone) && i === 0;
        if (useTK) {
          stone.distance > 13 &&
            Attack.getIntoPosition(stone, 13, sdk.collision.Ranged);
          if (
            !Skill.cast(sdk.skills.Telekinesis, sdk.skills.hand.Right, stone)
          ) {
            console.debug("Failed to tk: attempt: " + i);
            continue;
          }
        } else {
          [stone.x + 1, stone.y + 2].distance > 5 &&
            Pather.moveTo(stone.x + 1, stone.y + 2, 3);
          Misc.click(0, 0, stone);
        }

        if (Misc.poll(() => stone.mode, 1000, 50)) {
          return true;
        } else {
          Packet.flash(me.gid);
        }
      }

      // Click to stop walking in case we got stuck
      !me.idle && Misc.click(0, 0, me.x, me.y);

      return false;
    },

    cain() {
      MainLoop: while (true) {
        switch (true) {
          case !Game.getItem(sdk.quest.item.ScrollofInifuss) &&
            !Game.getItem(sdk.quest.item.KeytotheCairnStones) &&
            !Misc.checkQuest(sdk.quest.id.TheSearchForCain, 4):
            Pather.useWaypoint(sdk.areas.DarkWood, true);
            Precast.doPrecast(true);

            if (
              !Pather.moveToPreset(
                sdk.areas.DarkWood,
                sdk.unittype.Object,
                sdk.quest.chest.InifussTree,
                5,
                5
              )
            ) {
              throw new Error("Failed to move to Tree of Inifuss");
            }

            let tree = Game.getObject(sdk.quest.chest.InifussTree);
            !!tree && tree.distance > 5 && Pather.moveToUnit(tree);
            Misc.openChest(tree);
            let scroll = Misc.poll(
              () => Game.getItem(sdk.quest.item.ScrollofInifuss),
              1000,
              100
            );

            Pickit.pickItem(scroll);
            Town.goToTown();
            Town.npcInteract("Akara");

            break;
          case Game.getItem(sdk.quest.item.ScrollofInifuss):
            Town.goToTown(1);
            Town.npcInteract("Akara");

            break;
          case Game.getItem(sdk.quest.item.KeytotheCairnStones) &&
            !me.inArea(sdk.areas.StonyField):
            Pather.journeyTo(sdk.areas.StonyField);
            Precast.doPrecast(true);

            break;
          case Game.getItem(sdk.quest.item.KeytotheCairnStones) &&
            me.inArea(sdk.areas.StonyField):
            Pather.moveToPreset(
              sdk.areas.StonyField,
              sdk.unittype.Monster,
              sdk.monsters.preset.Rakanishu,
              10,
              10,
              false,
              true
            );
            Attack.securePosition(me.x, me.y, 40, 3000, true);
            Pather.moveToPreset(
              sdk.areas.StonyField,
              sdk.unittype.Object,
              sdk.quest.chest.StoneAlpha,
              null,
              null,
              true
            );
            let stones = [
              Game.getObject(sdk.quest.chest.StoneAlpha),
              Game.getObject(sdk.quest.chest.StoneBeta),
              Game.getObject(sdk.quest.chest.StoneGamma),
              Game.getObject(sdk.quest.chest.StoneDelta),
              Game.getObject(sdk.quest.chest.StoneLambda),
            ];

            while (stones.some((stone) => !stone.mode)) {
              for (let i = 0; i < stones.length; i++) {
                let stone = stones[i];

                if (this.activateStone(stone)) {
                  stones.splice(i, 1);
                  i--;
                }
                delay(10);
              }
            }

            let tick = getTickCount();
            // wait up to two minutes
            while (getTickCount() - tick < Time.minutes(2)) {
              if (Pather.getPortal(sdk.areas.Tristram)) {
                Pather.usePortal(sdk.areas.Tristram);

                break;
              }
            }

            break;
          case me.inArea(sdk.areas.Tristram) &&
            !Misc.checkQuest(
              sdk.quest.id.TheSearchForCain,
              sdk.quest.states.Completed
            ):
            let gibbet = Game.getObject(sdk.quest.chest.CainsJail);

            if (gibbet && !gibbet.mode) {
              Pather.moveTo(gibbet.x, gibbet.y);
              if (Misc.poll(() => Misc.openChest(gibbet), 2000, 100)) {
                Town.goToTown(1);
                Town.npcInteract("Akara") && console.log("Akara done");
              }
            }

            break;
          default:
            break MainLoop;
        }
      }

      return true;
    },

    smith() {
      if (
        !Pather.moveToPreset(
          sdk.areas.Barracks,
          sdk.unittype.Object,
          sdk.quest.chest.MalusHolder
        )
      ) {
        throw new Error("Failed to move to the Smith");
      }

      Attack.kill(getLocaleString(sdk.locale.monsters.TheSmith));
      let malusChest = Game.getObject(sdk.quest.chest.MalusHolder);
      !!malusChest && malusChest.distance > 5 && Pather.moveToUnit(malusChest);
      Misc.openChest(malusChest);
      let malus = Misc.poll(
        () => Game.getItem(sdk.quest.item.HoradricMalus),
        1000,
        100
      );
      Pickit.pickItem(malus);
      Town.goToTown();
      Town.npcInteract("Charsi");
    },
  },

  Cows: {
    buildCowRooms() {
      let finalRooms = [];
      let indexes = [];

      let kingPreset = Game.getPresetMonster(
        sdk.areas.MooMooFarm,
        sdk.monsters.preset.TheCowKing
      );
      let badRooms = getRoom(
        kingPreset.roomx * 5 + kingPreset.x,
        kingPreset.roomy * 5 + kingPreset.y
      ).getNearby();

      for (let i = 0; i < badRooms.length; i += 1) {
        let badRooms2 = badRooms[i].getNearby();

        for (let j = 0; j < badRooms2.length; j += 1) {
          if (indexes.indexOf(badRooms2[j].x + "" + badRooms2[j].y) === -1) {
            indexes.push(badRooms2[j].x + "" + badRooms2[j].y);
          }
        }
      }

      let room = getRoom();

      do {
        if (indexes.indexOf(room.x + "" + room.y) === -1) {
          finalRooms.push([
            room.x * 5 + room.xsize / 2,
            room.y * 5 + room.ysize / 2,
          ]);
        }
      } while (room.getNext());

      return finalRooms;
    },

    clearCowLevel() {
      function roomSort(a, b) {
        return (
          getDistance(myRoom[0], myRoom[1], a[0], a[1]) -
          getDistance(myRoom[0], myRoom[1], b[0], b[1])
        );
      }

      Config.MFLeader && Pather.makePortal() && say("cows");

      let myRoom;
      let rooms = this.buildCowRooms();

      while (rooms.length > 0) {
        // get the first room + initialize myRoom var
        !myRoom && (room = getRoom(me.x, me.y));

        if (room) {
          // use previous room to calculate distance
          if (room instanceof Array) {
            myRoom = [room[0], room[1]];
          } else {
            // create a new room to calculate distance (first room, done only once)
            myRoom = [room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2];
          }
        }

        rooms.sort(roomSort);
        let room = rooms.shift();
        let result = Pather.getNearestWalkable(room[0], room[1], 10, 2);

        if (result) {
          Pather.moveTo(result[0], result[1], 3);
          if (!Attack.clear(30)) return false;
        }
      }

      return true;
    },
  },

  Diablo: {
    diabloSpawned: false,
    diaWaitTime: Time.seconds(30),
    clearRadius: 30,
    done: false,
    waitForGlow: false,
    sealOrder: [],
    vizLayout: -1,
    seisLayout: -1,
    infLayout: -1,
    entranceCoords: { x: 7790, y: 5544 },
    starCoords: { x: 7791, y: 5293 },
    // path coordinates
    entranceToStar: [
      7794, 5517, 7791, 5491, 7768, 5459, 7775, 5424, 7817, 5458, 7777, 5408,
      7769, 5379, 7777, 5357, 7809, 5359, 7805, 5330, 7780, 5317, 7791, 5293,
    ],
    starToVizA: [
      7759, 5295, 7734, 5295, 7716, 5295, 7718, 5276, 7697, 5292, 7678, 5293,
      7665, 5276, 7662, 5314,
    ],
    starToVizB: [
      7759, 5295, 7734, 5295, 7716, 5295, 7701, 5315, 7666, 5313, 7653, 5284,
    ],
    starToSeisA: [
      7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7775, 5205, 7804, 5193,
      7814, 5169, 7788, 5153,
    ],
    starToSeisB: [
      7781, 5259, 7805, 5258, 7802, 5237, 7776, 5228, 7811, 5218, 7807, 5194,
      7779, 5193, 7774, 5160, 7803, 5154,
    ],
    starToInfA: [
      7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5295,
      7919, 5290,
    ],
    starToInfB: [
      7809, 5268, 7834, 5306, 7852, 5280, 7852, 5310, 7869, 5294, 7895, 5274,
      7927, 5275, 7932, 5297, 7923, 5313,
    ],
    // check for strays array
    cleared: [],
    //iomars
    MFLeader: undefined,
    clearZone: {
      entrance: 1,
      star: 2,
      vizier: 3,
      seis: 4,
      infector: 5,
      diablo: 6,
    },

    hasDiabloTp() {
      let portal = Pather.getPortal(
        sdk.areas.PandemoniumFortress,
        this.MFLeader
      );
      if (
        portal &&
        Math.abs(portal.x - 7825) < 5 &&
        Math.abs(portal.y - 5285) < 5
      ) {
        return true;
      }
      return false;
    },

    getPlayerZone(player, offset = 15) {
      switch (true) {
        //Entrance
        case player.y > 5350 + offset:
          return this.clearZone.entrance;
        //vizier
        case player.x < 7760 - offset:
          return this.clearZone.vizier;
        //seis
        case player.y < 5260 - offset:
          return this.clearZone.seis;
        //infector
        case player.x > 7830 + offset:
          return this.clearZone.infector;
        //in star
        default:
          if (
            player.x > 7810 &&
            player.x > 7830 &&
            player.y > 5270 &&
            player.y < 5292 &&
            this.hasDiabloTp()
          )
            return this.clearZone.diablo;
          else return this.clearZone.star;
      }
    },

    isSameZone() {
      let leader = this.getLeader();
      // clear continue
      if (!leader || leader.area != sdk.areas.ChaosSanctuary) return true;

      let ldz = this.getPlayerZone(leader);
      let mez = this.getPlayerZone(me);

      if (mez == this.clearZone.entrance && ldz >= this.clearZone.vizier)
        return false;

      if (ldz == this.clearZone.star || mez == this.clearZone.star) return true;

      if (mez < ldz) return true;

      return this.getPlayerZone(me) == ldz;
    },

    getLeaderZone() {
      let player = this.getLeader();
      return this.getPlayerZone(player);
    },

    getLeader() {
      let leader = Misc.getPlayerUnit(this.MFLeader);

      if (!leader) {
        let player = Misc.getNearbyPlayer();

        if (player) {
          Pather.moveToUnit(player);
          leader = Misc.getPlayerUnit(this.MFLeader);
        }
      }

      if (!leader) {
        // console.debug(`find leader from party`);
        leader = Misc.findPlayer(this.MFLeader);
      }
      return leader;
    },

    diabloLightsEvent(bytes = []) {
      if (
        me.inArea(sdk.areas.ChaosSanctuary) &&
        bytes &&
        bytes.length === 2 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x0c
      ) {
        print("\xFFc4Diablo\xFFc0: diablo spawned.");
        Common.Diablo.diabloSpawned = true;
      }
    },

    sort(a, b) {
      if (Config.BossPriority) {
        if (a.isSuperUnique && b.isSuperUnique)
          return getDistance(me, a) - getDistance(me, b);
        if (a.isSuperUnique) return -1;
        if (b.isSuperUnique) return 1;
      }

      // Entrance to Star / De Seis
      if (me.y > 5325 || me.y < 5260) return a.y > b.y ? -1 : 1;
      // Vizier
      if (me.x < 7765) return a.x > b.x ? -1 : 1;
      // Infector
      if (me.x > 7825)
        return !checkCollision(me, a, sdk.collision.BlockWall) && a.x < b.x
          ? -1
          : 1;

      return getDistance(me, a) - getDistance(me, b);
    },

    getLayout(seal, value) {
      let sealPreset = Game.getPresetObject(sdk.areas.ChaosSanctuary, seal);
      if (!seal) throw new Error("Seal preset not found. Can't continue.");

      if (
        sealPreset.roomy * 5 + sealPreset.y === value ||
        sealPreset.roomx * 5 + sealPreset.x === value
      ) {
        return 1;
      }

      return 2;
    },

    initLayout() {
      // 1 = "Y", 2 = "L"
      this.vizLayout = this.getLayout(sdk.objects.DiabloSealVizier, 5275);
      // 1 = "2", 2 = "5"
      this.seisLayout = this.getLayout(sdk.objects.DiabloSealSeis, 7773);
      // 1 = "I", 2 = "J"
      this.infLayout = this.getLayout(sdk.objects.DiabloSealInfector, 7893);
    },

    followPath(path) {
      if (Config.Diablo.Fast) {
        let len = path.length;
        let lastNode = { x: path[len - 2], y: path[len - 1] };
        Pather.moveToUnit(lastNode);
        return;
      }

      for (let i = 0; i < path.length; i += 2) {
        if (this.MFLeader && !this.isSameZone()) {
          return;
        }

        this.cleared.length > 0 && this.clearStrays();

        // no monsters at the next node, skip it
        if (
          [path[i], path[i + 1]].distance < 40 &&
          [path[i], path[i + 1]].mobCount({ range: 35 }) === 0
        ) {
          continue;
        }

        Pather.moveTo(
          path[i],
          path[i + 1],
          3,
          getDistance(me, path[i], path[i + 1]) > 50
        );
        Attack.clear(this.clearRadius, 0, false, Common.Diablo.sort);

        // Push cleared positions so they can be checked for strays
        this.cleared.push([path[i], path[i + 1]]);

        // // After 5 nodes go back 2 nodes to check for monsters
        // if (i === 10 && path.length > 16 && Misc.getNearbyPlayerCount() > 0) {
        //   path = path.slice(6);
        //   i = 0;
        // }
      }
    },

    clearStrays() {
      let oldPos = { x: me.x, y: me.y };
      let monster = Game.getMonster();

      if (monster) {
        do {
          if (monster.attackable) {
            for (let i = 0; i < this.cleared.length; i += 1) {
              if (
                getDistance(monster, this.cleared[i][0], this.cleared[i][1]) <
                  30 &&
                Attack.validSpot(monster.x, monster.y)
              ) {
                Pather.moveToUnit(monster);
                Attack.clear(15, 0, false, Common.Diablo.sort);

                break;
              }
            }
          }
        } while (monster.getNext());
      }

      getDistance(me, oldPos.x, oldPos.y) > 5 &&
        Pather.moveTo(oldPos.x, oldPos.y);

      return true;
    },

    runEntranceToStar() {
      if (this.getLeaderZone() == this.clearZone.entrance)
        Common.Diablo.followPath(Common.Diablo.entranceToStar);
    },

    runSeals(sealOrder, openSeals = true) {
      print(`\xFFc4Diablo\xFFc0: seal order ${sealOrder}`);

      this.sealOrder = sealOrder;
      let seals = {
        1: () => this.vizierSeal(openSeals),
        2: () => this.seisSeal(openSeals),
        3: () => this.infectorSeal(openSeals),
        vizier: () => this.vizierSeal(openSeals),
        seis: () => this.seisSeal(openSeals),
        infector: () => this.infectorSeal(openSeals),
      };
      sealOrder.forEach((seal) => {
        seals[seal]();
      });
    },

    tkSeal(seal) {
      if (!Skill.useTK(seal)) return false;

      for (let i = 0; i < 5; i++) {
        seal.distance > 20 &&
          Attack.getIntoPosition(seal, 18, sdk.collision.WallOrRanged);

        if (
          Skill.cast(sdk.skills.Telekinesis, sdk.skills.hand.Right, seal) &&
          Misc.poll(() => seal.mode, 1000, 100)
        ) {
          break;
        }
      }

      return !!seal.mode;
    },

    openSeal(classid) {
      let seal;
      let warn =
        Config.PublicMode &&
        [
          sdk.objects.DiabloSealVizier,
          sdk.objects.DiabloSealSeis,
          sdk.objects.DiabloSealInfector,
        ].includes(classid) &&
        Loader.scriptName() === "Diablo";
      let usetk =
        Skill.haveTK &&
        (classid !== sdk.objects.DiabloSealSeis || this.seisLayout !== 1);
      let seisSeal = classid === sdk.objects.DiabloSealSeis;

      for (let i = 0; i < 5; i++) {
        if (!seal) {
          usetk
            ? Pather.moveNearPreset(
                sdk.areas.ChaosSanctuary,
                sdk.unittype.Object,
                classid,
                15
              )
            : Pather.moveToPreset(
                sdk.areas.ChaosSanctuary,
                sdk.unittype.Object,
                classid,
                seisSeal ? 5 : 2,
                seisSeal ? 5 : 0
              );
          seal = Misc.poll(() => Game.getObject(classid), 1000, 100);
        }

        if (!seal) {
          console.debug("Couldn't find seal: " + classid);
          return false;
        }

        if (seal.mode) {
          warn && say(Config.Diablo.SealWarning);
          return true;
        }

        // Clear around Infector seal, Any leftover abyss knights casting decrep is bad news with Infector
        if (
          ([
            sdk.objects.DiabloSealInfector,
            sdk.objects.DiabloSealInfector2,
          ].includes(classid) ||
            i > 1) &&
          me.getMobCount() > 1
        ) {
          Attack.clear(15);
          // Move back to seal
          usetk
            ? Pather.moveNearUnit(seal, 15)
            : Pather.moveToUnit(seal, seisSeal ? 5 : 2, seisSeal ? 5 : 0);
        }

        if (usetk && this.tkSeal(seal)) {
          return seal.mode;
        } else {
          usetk && (usetk = false);

          if (
            classid === sdk.objects.DiabloSealInfector &&
            me.assassin &&
            this.infLayout === 1
          ) {
            if (Config.UseTraps) {
              let check = Attack.ClassAttack.checkTraps({ x: 7899, y: 5293 });
              check &&
                Attack.ClassAttack.placeTraps({ x: 7899, y: 5293 }, check);
            }
          }

          seisSeal
            ? Misc.poll(
                function () {
                  // stupid diablo shit, walk around the de-seis seal clicking it until we find "the spot"...sigh
                  if (!seal.mode) {
                    Pather.walkTo(seal.x + rand(-1, 1), seal.y + rand(-1, 1));
                    clickUnitAndWait(0, 0, seal) || seal.interact();
                  }
                  return !!seal.mode;
                },
                3000,
                60
              )
            : seal.interact();

          // de seis optimization
          if (seisSeal && Attack.validSpot(seal.x + 15, seal.y)) {
            Pather.walkTo(seal.x + 15, seal.y);
          } else {
            Pather.walkTo(seal.x - 5, seal.y - 5);
          }
        }

        delay(seisSeal ? 1000 + me.ping : 500 + me.ping);

        if (seal.mode) {
          break;
        }
      }

      return !!seal && seal.mode;
    },

    vizierSeal(openSeal = true) {
      if (this.getLeaderZone() > this.clearZone.vizier) return;
      print(`\xFFc4Diablo\xFFc0: Viz layout ${Common.Diablo.vizLayout}`);

      let path =
        Common.Diablo.vizLayout === 1 ? this.starToVizA : this.starToVizB;
      let distCheck = {
        x: path[path.length - 2],
        y: path.last(),
      };

      if (Config.Diablo.SealLeader || Config.Diablo.Fast) {
        Common.Diablo.vizLayout === 1
          ? Pather.moveTo(7708, 5269)
          : Pather.moveTo(7647, 5267);
        Config.Diablo.SealLeader &&
          Attack.securePosition(me.x, me.y, 35, 3000, true);
        Config.Diablo.SealLeader && Pather.makePortal() && say("in");
      }

      distCheck.distance > 30 &&
        this.followPath(
          Common.Diablo.vizLayout === 1 ? this.starToVizA : this.starToVizB
        );

      if (
        openSeal &&
        (!Common.Diablo.openSeal(sdk.objects.DiabloSealVizier2) ||
          !Common.Diablo.openSeal(sdk.objects.DiabloSealVizier))
      ) {
        throw new Error("Failed to open Vizier seals.");
      }

      delay(1 + me.ping);
      Common.Diablo.vizLayout === 1
        ? Pather.moveTo(7691, 5292)
        : Pather.moveTo(7695, 5316);

      if (this.MFLeader && !this.isSameZone()) {
        return;
      }

      if (
        !Common.Diablo.getBoss(
          getLocaleString(sdk.locale.monsters.GrandVizierofChaos)
        )
      ) {
        throw new Error("Failed to kill Vizier");
      }

      Config.Diablo.SealLeader && say("out");

      return true;
    },

    seisSeal(openSeal = true) {
      if (this.getLeaderZone() > this.clearZone.seis) return;

      print(`\xFFc4Diablo\xFFc0: Seis layout ${Common.Diablo.seisLayout}`);
      let path =
        Common.Diablo.seisLayout === 1 ? this.starToSeisA : this.starToSeisB;
      let distCheck = {
        x: path[path.length - 2],
        y: path.last(),
      };

      if (Config.Diablo.SealLeader || Config.Diablo.Fast) {
        Common.Diablo.seisLayout === 1
          ? Pather.moveTo(7767, 5147)
          : Pather.moveTo(7820, 5147);
        Config.Diablo.SealLeader &&
          Attack.securePosition(me.x, me.y, 35, 3000, true);
        Config.Diablo.SealLeader && Pather.makePortal() && say("in");
      }

      distCheck.distance > 30 &&
        this.followPath(
          Common.Diablo.seisLayout === 1 ? this.starToSeisA : this.starToSeisB
        );

      if (openSeal && !Common.Diablo.openSeal(sdk.objects.DiabloSealSeis))
        throw new Error("Failed to open de Seis seal.");
      Common.Diablo.seisLayout === 1
        ? Pather.moveTo(7798, 5194)
        : Pather.moveTo(7796, 5155);

      if (this.MFLeader && !this.isSameZone()) {
        return;
      }

      if (
        !Common.Diablo.getBoss(getLocaleString(sdk.locale.monsters.LordDeSeis))
      )
        throw new Error("Failed to kill de Seis");

      Config.Diablo.SealLeader && say("out");

      return true;
    },

    infectorSeal(openSeal = true) {
      if (this.getLeaderZone() > this.clearZone.infector) return;

      Precast.doPrecast(true);

      print(`\xFFc4Diablo\xFFc0: Inf layout ${Common.Diablo.infLayout}`);

      let path =
        Common.Diablo.infLayout === 1 ? this.starToInfA : this.starToInfB;
      let distCheck = {
        x: path[path.length - 2],
        y: path.last(),
      };

      if (Config.Diablo.SealLeader || Config.Diablo.Fast) {
        Common.Diablo.infLayout === 1
          ? Pather.moveTo(7860, 5314)
          : Pather.moveTo(7909, 5317);
        Config.Diablo.SealLeader &&
          Attack.securePosition(me.x, me.y, 35, 3000, true);
        Config.Diablo.SealLeader && Pather.makePortal() && say("in");
      }

      distCheck.distance > 70 &&
        this.followPath(
          Common.Diablo.infLayout === 1 ? this.starToInfA : this.starToInfB
        );

      if (Config.Diablo.Fast) {
        if (
          openSeal &&
          !Common.Diablo.openSeal(sdk.objects.DiabloSealInfector2)
        )
          throw new Error("Failed to open Infector seals.");
        if (openSeal && !Common.Diablo.openSeal(sdk.objects.DiabloSealInfector))
          throw new Error("Failed to open Infector seals.");

        if (Common.Diablo.infLayout === 1) {
          (me.sorceress || me.assassin) && Pather.moveTo(7876, 5296);
          delay(1 + me.ping);
        } else {
          delay(1 + me.ping);
          Pather.moveTo(7928, 5295);
        }

        if (
          !Common.Diablo.getBoss(
            getLocaleString(sdk.locale.monsters.InfectorofSouls)
          )
        )
          throw new Error("Failed to kill Infector");
      } else {
        if (openSeal && !Common.Diablo.openSeal(sdk.objects.DiabloSealInfector))
          throw new Error("Failed to open Infector seals.");

        if (Common.Diablo.infLayout === 1) {
          (me.sorceress || me.assassin) && Pather.moveTo(7876, 5296);
          delay(1 + me.ping);
        } else {
          delay(1 + me.ping);
          Pather.moveTo(7928, 5295);
        }

        if (this.MFLeader && !this.isSameZone()) {
          return;
        }

        if (
          !Common.Diablo.getBoss(
            getLocaleString(sdk.locale.monsters.InfectorofSouls)
          )
        )
          throw new Error("Failed to kill Infector");

        if (
          openSeal &&
          !Common.Diablo.openSeal(sdk.objects.DiabloSealInfector2)
        )
          throw new Error("Failed to open Infector seals.");

        // wait until seal has been popped to avoid missing diablo due to wait time ending before he spawns, happens if leader does town chores after seal boss
        !openSeal &&
          [3, "infector"].includes(Common.Diablo.sealOrder.last()) &&
          Misc.poll(
            () => {
              if (Common.Diablo.diabloSpawned) return true;

              let lastSeal = Game.getObject(sdk.objects.DiabloSealInfector2);
              if (lastSeal && lastSeal.mode) {
                return true;
              }
              return false;
            },
            Time.minutes(3),
            1000
          );
      }

      Config.Diablo.SealLeader && say("out");

      return true;
    },

    hammerdinPreAttack(name, amount = 5) {
      if (me.paladin && Config.AttackSkill[1] === sdk.skills.BlessedHammer) {
        let target = Game.getMonster(name);

        if (!target || !target.attackable) return true;

        let positions = [
          [6, 11],
          [0, 8],
          [8, -1],
          [-9, 2],
          [0, -11],
          [8, -8],
        ];

        for (let i = 0; i < positions.length; i += 1) {
          // check if we can move there
          if (
            Attack.validSpot(
              target.x + positions[i][0],
              target.y + positions[i][1]
            )
          ) {
            Pather.moveTo(
              target.x + positions[i][0],
              target.y + positions[i][1]
            );
            Skill.setSkill(Config.AttackSkill[2], sdk.skills.hand.Right);

            for (let n = 0; n < amount; n += 1) {
              Skill.cast(Config.AttackSkill[1], sdk.skills.hand.Left);
            }

            return true;
          }
        }
      }

      return false;
    },

    preattack(id) {
      let coords = (() => {
        switch (id) {
          case getLocaleString(sdk.locale.monsters.GrandVizierofChaos):
            return Common.Diablo.vizLayout === 1 ? [7676, 5295] : [7684, 5318];
          case getLocaleString(sdk.locale.monsters.LordDeSeis):
            return Common.Diablo.seisLayout === 1 ? [7778, 5216] : [7775, 5208];
          case getLocaleString(sdk.locale.monsters.InfectorofSouls):
            return Common.Diablo.infLayout === 1 ? [7913, 5292] : [7915, 5280];
          default:
            return [];
        }
      })();
      if (!coords.length) return false;

      switch (me.classid) {
        case sdk.player.class.Sorceress:
          if (
            [
              sdk.skills.Meteor,
              sdk.skills.Blizzard,
              sdk.skills.FrozenOrb,
              sdk.skills.FireWall,
            ].includes(Config.AttackSkill[1])
          ) {
            me.skillDelay && delay(500);
            Skill.cast(
              Config.AttackSkill[1],
              sdk.skills.hand.Right,
              coords[0],
              coords[1]
            );

            return true;
          }

          break;
        case sdk.player.class.Paladin:
          return Common.Diablo.hammerdinPreAttack(id, 8);
        case sdk.player.class.Assassin:
          if (Config.UseTraps) {
            let trapCheck = Attack.ClassAttack.checkTraps({
              x: coords[0],
              y: coords[1],
            });

            if (trapCheck) {
              Attack.ClassAttack.placeTraps({ x: coords[0], y: coords[1] }, 5);

              return true;
            }
          }

          break;
      }

      return false;
    },

    getBoss(name) {
      let glow = Game.getObject(sdk.objects.SealGlow);

      if (Common.Diablo.waitForGlow) {
        while (true) {
          if (!Common.Diablo.preattack(name)) {
            delay(500);
          }

          glow = Game.getObject(sdk.objects.SealGlow);

          if (glow) {
            break;
          }
        }
      }

      for (let i = 0; i < 16; i += 1) {
        let boss = Game.getMonster(name);

        if (boss) {
          Common.Diablo.hammerdinPreAttack(name, 8);
          return Config.Diablo.Fast
            ? Attack.kill(name)
            : Attack.clear(60, 0, name, this.sort);
        }

        delay(250);
      }

      return !!glow;
    },

    moveToStar() {
      !this.MFLeader && Pather.moveTo(7825, 5285) && Pather.makePortal();

      switch (me.classid) {
        case sdk.player.class.Amazon:
        case sdk.player.class.Sorceress:
        case sdk.player.class.Necromancer:
        case sdk.player.class.Assassin:
          return Pather.moveNear(7791, 5293, me.sorceress ? 35 : 25, {
            returnSpotOnError: true,
          });
        case sdk.player.class.Paladin:
        case sdk.player.class.Druid:
        case sdk.player.class.Barbarian:
          return Pather.moveTo(7788, 5292);
      }

      return false;
    },

    diabloPrep() {
      if (Config.Diablo.SealLeader) {
        Pather.moveTo(7763, 5267);
        Pather.makePortal() && say("in");
        Pather.moveTo(7788, 5292);
      }

      this.moveToStar();

      let tick = getTickCount();

      while (getTickCount() - tick < this.diaWaitTime) {
        if (getTickCount() - tick >= Time.seconds(5)) {
          switch (me.classid) {
            case sdk.player.class.Sorceress:
              if (
                [
                  sdk.skills.Meteor,
                  sdk.skills.Blizzard,
                  sdk.skills.FrozenOrb,
                  sdk.skills.FireWall,
                ].includes(Config.AttackSkill[1])
              ) {
                Skill.cast(
                  Config.AttackSkill[1],
                  sdk.skills.hand.Right,
                  7793 + rand(-1, 1),
                  5293
                );
              }

              delay(500);

              break;
            case sdk.player.class.Paladin:
              Skill.setSkill(Config.AttackSkill[2]);
              Config.AttackSkill[1] === sdk.skills.BlessedHammer &&
                Skill.cast(Config.AttackSkill[1], sdk.skills.hand.Left);

              break;
            case sdk.player.class.Druid:
              if (
                [
                  sdk.skills.Tornado,
                  sdk.skills.Fissure,
                  sdk.skills.Volcano,
                ].includes(Config.AttackSkill[3])
              ) {
                Skill.cast(
                  Config.AttackSkill[1],
                  sdk.skills.hand.Right,
                  7793 + rand(-1, 1),
                  5293
                );

                break;
              }

              delay(500);

              break;
            case sdk.player.class.Assassin:
              if (Config.UseTraps) {
                let trapCheck = Attack.ClassAttack.checkTraps({
                  x: 7793,
                  y: 5293,
                });
                trapCheck &&
                  Attack.ClassAttack.placeTraps(
                    { x: 7793, y: 5293, classid: sdk.monsters.Diablo },
                    trapCheck
                  );
              }

              Config.AttackSkill[1] === sdk.skills.ShockWeb &&
                Skill.cast(
                  Config.AttackSkill[1],
                  sdk.skills.hand.Right,
                  7793,
                  5293
                );

              delay(500);

              break;
            default:
              delay(500);

              break;
          }
        } else {
          delay(500);
        }

        if (Game.getMonster(sdk.monsters.Diablo)) {
          return true;
        }
      }

      throw new Error("Diablo not found");
    },
  },

  Ancients: {
    altarSpot: { x: 10047, y: 12622 },

    canAttack() {
      let ancient = Game.getMonster();

      if (ancient) {
        do {
          if (!ancient.getParent() && !Attack.canAttack(ancient)) {
            console.log("Can't attack ancients");
            return false;
          }
        } while (ancient.getNext());
      }

      return true;
    },

    touchAltar() {
      let tick = getTickCount();

      while (getTickCount() - tick < 5000) {
        if (Game.getObject(sdk.objects.AncientsAltar)) {
          break;
        }

        delay(20 + me.ping);
      }

      let altar = Game.getObject(sdk.objects.AncientsAltar);

      if (altar) {
        while (altar.mode !== sdk.objects.mode.Active) {
          Pather.moveToUnit(altar);
          altar.interact();
          delay(200 + me.ping);
          me.cancel();
        }

        // wait for ancients to spawn
        while (!Game.getMonster(sdk.monsters.TalictheDefender)) {
          delay(250 + me.ping);
        }

        return true;
      }

      return false;
    },

    checkStatues() {
      let statues = Game.getUnits(sdk.unittype.Object).filter(
        (u) =>
          [
            sdk.objects.KorlictheProtectorStatue,
            sdk.objects.TalictheDefenderStatue,
            sdk.objects.MadawctheGuardianStatue,
          ].includes(u.classid) && u.mode === sdk.objects.mode.Active
      );
      return statues.length === 3;
    },

    checkCorners() {
      let pos = [
        { x: 10036, y: 12592 },
        { x: 10066, y: 12589 },
        { x: 10065, y: 12623 },
        { x: 10058, y: 12648 },
        { x: 10040, y: 12660 },
        { x: 10036, y: 12630 },
        { x: 10038, y: 12611 },
      ];
      Pather.moveToUnit(this.altarSpot);
      if (!this.checkStatues()) {
        return pos.forEach((node) => {
          // no mobs at that next, skip it
          if (
            [node.x, node.y].distance < 35 &&
            [node.x, node.y].mobCount({ range: 30 }) === 0
          ) {
            return;
          }
          Pather.moveTo(node.x, node.y);
          Attack.clear(30);
        });
      }

      return true;
    },

    killAncients(checkQuest = false) {
      let retry = 0;
      Pather.moveToUnit(this.altarSpot);

      while (!this.checkStatues()) {
        if (retry > 5) {
          console.log("Failed to kill anicents.");

          break;
        }

        Attack.clearClassids(
          sdk.monsters.KorlictheProtector,
          sdk.monsters.TalictheDefender,
          sdk.monsters.MadawctheGuardian
        );
        delay(1000);

        if (checkQuest) {
          if (
            Misc.checkQuest(
              sdk.quest.id.RiteofPassage,
              sdk.quest.states.Completed
            )
          ) {
            break;
          } else {
            console.log("Failed to kill anicents. Attempt: " + retry);
          }
        }

        this.checkCorners();
        retry++;
      }
    },

    ancientsPrep() {
      Town.goToTown();
      Town.fillTome(sdk.items.TomeofTownPortal);
      [
        sdk.items.StaminaPotion,
        sdk.items.AntidotePotion,
        sdk.items.ThawingPotion,
      ].forEach((p) => Town.buyPots(10, p, true));
      Town.buyPotions();
      Pather.usePortal(sdk.areas.ArreatSummit, me.name);
    },

    startAncients(preTasks = false, checkQuest = false) {
      let retry = 0;
      Pather.moveToUnit(this.altarSpot);
      this.touchAltar();

      while (!this.canAttack()) {
        if (retry > 10)
          throw new Error(
            "I think I'm unable to complete ancients, I've rolled them 10 times"
          );
        preTasks ? this.ancientsPrep() : Pather.makePortal();
        Pather.moveToUnit(this.altarSpot);
        this.touchAltar();
        retry++;
      }

      this.killAncients(checkQuest);
    },
  },

  Baal: {
    checkHydra() {
      let hydra = Game.getMonster(getLocaleString(sdk.locale.monsters.Hydra));
      if (hydra) {
        do {
          if (
            hydra.mode !== sdk.monsters.mode.Dead &&
            hydra.getStat(sdk.stats.Alignment) !== 2
          ) {
            Pather.moveTo(15072, 5002);
            while (hydra.mode !== sdk.monsters.mode.Dead) {
              delay(500);
              if (!copyUnit(hydra).x) {
                break;
              }
            }

            break;
          }
        } while (hydra.getNext());
      }

      return true;
    },

    checkThrone(clear = true) {
      let monster = Game.getMonster();

      if (monster) {
        do {
          if (monster.attackable && monster.y < 5080) {
            switch (monster.classid) {
              case sdk.monsters.WarpedFallen:
              case sdk.monsters.WarpedShaman:
                return 1;
              case sdk.monsters.BaalSubjectMummy:
              case sdk.monsters.BaalColdMage:
                return 2;
              case sdk.monsters.Council4:
                return 3;
              case sdk.monsters.VenomLord2:
                return 4;
              case sdk.monsters.ListerTheTormenter:
                return 5;
              default:
                if (clear) {
                  Attack.getIntoPosition(monster, 10, sdk.collision.Ranged);
                  Attack.clear(15);
                }

                return false;
            }
          }
        } while (monster.getNext());
      }

      return false;
    },

    clearThrone() {
      if (!Game.getMonster(sdk.monsters.ThroneBaal)) return true;

      let resist = false,
        skill = [Config.AttackSkill[2], Config.AttackSkill[4]];

      //iomars
      if (Config.ResistSoul) {
        if (
          me.classid === sdk.player.class.Paladin &&
          me.getSkill(sdk.skills.Salvation, sdk.skills.subindex.SoftPoints) &&
          Game.getMonster(sdk.monsters.BurningSoul1)
        ) {
          console.log(`\xFFc4Baal\xFFc0: \xFFc2resisted\xFFc0 soul.`);
          Config.AttackSkill[2] = sdk.skills.Salvation;
          Config.AttackSkill[4] = sdk.skills.Salvation;
          resist = true;
        }
      }

      Attack.clear(15);

      if (Config.AvoidDolls) {
        let mon = Game.getMonster(sdk.monsters.SoulKiller);
        let monList = [];

        if (mon) {
          do {
            // exclude dolls from the list
            if (
              !mon.isDoll &&
              mon.x >= 15072 &&
              mon.x <= 15118 &&
              mon.y >= 5002 &&
              mon.y <= 5079 &&
              mon.attackable &&
              !Attack.skipCheck(mon)
            ) {
              monList.push(copyUnit(mon));
            }
          } while (mon.getNext());
        }

        if (monList.length > 0) {
          return Attack.clearList(monList);
        }
      }

      let pos = [
        { x: 15097, y: 5054 },
        { x: 15079, y: 5014 },
        { x: 15085, y: 5053 },
        { x: 15085, y: 5040 },
        { x: 15098, y: 5040 },
        { x: 15099, y: 5022 },
        { x: 15086, y: 5024 },
        { x: 15079, y: 5014 },
      ];

      pos.forEach((node) => {
        // no mobs at that next, skip it
        if (
          [node.x, node.y].distance < 35 &&
          [node.x, node.y].mobCount({ range: 30 }) === 0
        ) {
          return;
        }
        Pather.moveTo(node.x, node.y);
        Attack.clear(30);
      });

      if (resist) {
        Config.AttackSkill[2] = skill[0];
        Config.AttackSkill[4] = skill[1];
      }

      return;
    },

    preattack() {
      switch (me.classid) {
        case sdk.player.class.Sorceress:
          if (
            [
              sdk.skills.Meteor,
              sdk.skills.Blizzard,
              sdk.skills.FrozenOrb,
              sdk.skills.FireWall,
            ].includes(Config.AttackSkill[1])
          ) {
            if (me.getState(sdk.states.SkillDelay)) {
              delay(50);
            } else {
              Skill.cast(
                Config.AttackSkill[1],
                sdk.skills.hand.Right,
                15094 + rand(-1, 1),
                5024
              );
            }
          }

          break;
        case sdk.player.class.Paladin:
          if (Config.AttackSkill[3] === sdk.skills.BlessedHammer) {
            Config.AttackSkill[4] > 0 &&
              Skill.setSkill(Config.AttackSkill[4], sdk.skills.hand.Right);

            return Skill.cast(Config.AttackSkill[3], sdk.skills.hand.Left);
          }

          break;
        case sdk.player.class.Druid:
          if (
            [
              sdk.skills.Tornado,
              sdk.skills.Fissure,
              sdk.skills.Volcano,
            ].includes(Config.AttackSkill[3])
          ) {
            Skill.cast(
              Config.AttackSkill[3],
              sdk.skills.hand.Right,
              15094 + rand(-1, 1),
              5029
            );

            return true;
          }

          break;
        case sdk.player.class.Assassin:
          if (Config.UseTraps) {
            let check = Attack.ClassAttack.checkTraps({ x: 15094, y: 5028 });

            if (check) {
              return Attack.ClassAttack.placeTraps({ x: 15094, y: 5028 }, 5);
            }
          }

          if (Config.AttackSkill[3] === sdk.skills.ShockWeb) {
            return Skill.cast(
              Config.AttackSkill[3],
              sdk.skills.hand.Right,
              15094,
              5028
            );
          }

          break;
      }

      return false;
    },

    clearWaves() {
      Pather.moveTo(15094, me.paladin ? 5029 : 5038);

      let tick = getTickCount();
      let totalTick = getTickCount();

      MainLoop: while (true) {
        if (!Game.getMonster(sdk.monsters.ThroneBaal)) return true;

        switch (this.checkThrone()) {
          case 1:
            Attack.clearClassids(
              sdk.monsters.WarpedFallen,
              sdk.monsters.WarpedShaman
            ) && (tick = getTickCount());

            break;
          case 2:
            Attack.clearClassids(
              sdk.monsters.BaalSubjectMummy,
              sdk.monsters.BaalColdMage
            ) && (tick = getTickCount());

            break;
          case 3:
            Attack.clearClassids(sdk.monsters.Council4) &&
              (tick = getTickCount());
            this.checkHydra() && (tick = getTickCount());

            break;
          case 4:
            Attack.clearClassids(sdk.monsters.VenomLord2) &&
              (tick = getTickCount());

            break;
          case 5:
            Attack.clearClassids(
              sdk.monsters.ListerTheTormenter,
              sdk.monsters.Minion1,
              sdk.monsters.Minion2
            ) && (tick = getTickCount());

            break MainLoop;
          default:
            if (getTickCount() - tick < Time.seconds(7)) {
              if (
                Config.Baal.Cleansing ||
                (Skill.canUse(sdk.skills.Cleansing) &&
                  [
                    sdk.states.Poison,
                    sdk.states.AmplifyDamage,
                    sdk.states.Decrepify,
                  ].some((state) => me.getState(state)))
              ) {
                Skill.setSkill(sdk.skills.Cleansing, sdk.skills.hand.Right);
                Misc.poll(
                  () => {
                    if (Config.AttackSkill[3] === sdk.skills.BlessedHammer) {
                      Skill.cast(Config.AttackSkill[3], sdk.skills.hand.Left);
                    }
                    //iomars
                    return Config.Baal.Cleansing
                      ? false
                      : ![
                          sdk.states.Poison,
                          sdk.states.AmplifyDamage,
                          sdk.states.Decrepify,
                        ].some((state) => me.getState(state)) ||
                          me.mode === sdk.player.mode.GettingHit;
                  },
                  Time.seconds(3),
                  100
                );
              }
            }

            if (getTickCount() - tick > Time.seconds(20)) {
              this.clearThrone();
              tick = getTickCount();
            }

            if (!this.preattack()) {
              delay(100);
            }

            break;
        }

        switch (me.classid) {
          case sdk.player.class.Amazon:
          case sdk.player.class.Sorceress:
          case sdk.player.class.Necromancer:
          case sdk.player.class.Assassin:
            [15116, 5026].distance > 3 && Pather.moveTo(15116, 5026);

            break;
          case sdk.player.class.Paladin:
            if (Config.AttackSkill[3] === sdk.skills.BlessedHammer) {
              [15094, 5029].distance > 3 && Pather.moveTo(15094, 5029);

              break;
            }
          case sdk.player.class.Druid:
            if (
              [sdk.skills.Fissure, sdk.skills.Volcano].includes(
                Config.AttackSkill[3]
              )
            ) {
              [15116, 5026].distance > 3 && Pather.moveTo(15116, 5026);

              break;
            }

            if (Config.AttackSkill[3] === sdk.skills.Tornado) {
              [15094, 5029].distance > 3 && Pather.moveTo(15106, 5041);

              break;
            }
          case sdk.player.class.Barbarian:
            [15101, 5045].distance > 3 && Pather.moveTo(15101, 5045);

            break;
        }

        // If we've been in the throne for 30 minutes that's way too long
        if (getTickCount() - totalTick > Time.minutes(30)) {
          return false;
        }

        delay(10);
      }

      this.clearThrone();

      return true;
    },

    killBaal() {
      if (me.inArea(sdk.areas.ThroneofDestruction)) {
        Config.PublicMode &&
          Loader.scriptName() === "Baal" &&
          say(Config.Baal.BaalMessage);
        me.checkForMobs({ range: 30 }) && this.clearWaves(); // ensure waves are actually done
        Pather.moveTo(15090, 5008);
        delay(5000);
        Precast.doPrecast(true);
        Misc.poll(
          () => {
            if (
              me.mode === sdk.player.mode.GettingHit ||
              me.checkForMobs({ range: 15 })
            ) {
              Common.Baal.clearThrone();
              Pather.moveTo(15090, 5008);
            }
            return !Game.getMonster(sdk.monsters.ThroneBaal);
          },
          Time.minutes(3),
          1000
        );

        let portal = Game.getObject(sdk.objects.WorldstonePortal);

        if (portal) {
          Pather.usePortal(null, null, portal);
        } else {
          throw new Error("Couldn't find portal.");
        }
      }

      if (me.inArea(sdk.areas.WorldstoneChamber)) {
        Pather.moveTo(15134, 5923);
        Attack.kill(sdk.monsters.Baal);
        Pickit.pickItems();

        return true;
      }

      return false;
    },
  },

  Toolsthread: {
    pots: {
      Health: 0,
      Mana: 1,
      Rejuv: 2,
      MercHealth: 3,
      MercRejuv: 4,
    },
    pingTimer: [],
    pauseScripts: [],
    stopScripts: [],
    timerLastDrink: [],
    cloneWalked: false,
    hooks: [],

    checkPing(print = true) {
      // Quit after at least 5 seconds in game
      if (getTickCount() - me.gamestarttime < 5000 || !me.gameReady)
        return false;

      for (let i = 0; i < Config.PingQuit.length; i += 1) {
        if (Config.PingQuit[i].Ping > 0) {
          if (me.ping >= Config.PingQuit[i].Ping) {
            me.overhead("High Ping");

            if (this.pingTimer[i] === undefined || this.pingTimer[i] === 0) {
              this.pingTimer[i] = getTickCount();
            }

            if (
              getTickCount() - this.pingTimer[i] >=
              Config.PingQuit[i].Duration * 1000
            ) {
              print &&
                D2Bot.printToConsole(
                  "High ping (" +
                    me.ping +
                    "/" +
                    Config.PingQuit[i].Ping +
                    ") - leaving game.",
                  sdk.colors.D2Bot.Red
                );
              scriptBroadcast("pingquit");
              scriptBroadcast("quit");

              return true;
            }
          } else {
            this.pingTimer[i] = 0;
          }
        }
      }

      return false;
    },

    initQuitList() {
      let temp = [];

      for (let i = 0; i < Config.QuitList.length; i += 1) {
        if (FileTools.exists("data/" + Config.QuitList[i] + ".json")) {
          let string = Misc.fileAction(
            "data/" + Config.QuitList[i] + ".json",
            0
          );

          if (string) {
            let obj = JSON.parse(string);

            if (obj && obj.hasOwnProperty("name")) {
              temp.push(obj.name);
            }
          }
        }
      }

      Config.QuitList = temp.slice(0);
    },

    togglePause() {
      for (let i = 0; i < this.pauseScripts.length; i++) {
        let script = getScript(this.pauseScripts[i]);

        if (script) {
          if (script.running) {
            this.pauseScripts[i] === "default.js" &&
              console.log("\xFFc1Pausing.");

            // don't pause townchicken during clone walk
            if (
              this.pauseScripts[i] !== "tools/townchicken.js" ||
              !this.cloneWalked
            ) {
              script.pause();
            }
          } else {
            this.pauseScripts[i] === "default.js" &&
              console.log("\xFFc2Resuming.");
            script.resume();
          }
        }
      }

      return true;
    },

    stopDefault() {
      for (let i = 0; i < this.stopScripts.length; i++) {
        let script = getScript(this.stopScripts[i]);
        !!script && script.running && script.stop();
      }

      return true;
    },

    exit(chickenExit = false) {
      chickenExit && D2Bot.updateChickens();
      Config.LogExperience && Experience.log();
      console.log(
        "\xFFc8Run duration \xFFc2" +
          Time.format(getTickCount() - me.gamestarttime)
      );
      this.stopDefault();
      quit();
    },

    getPotionType(type) {
      switch (type) {
        case this.pots.Rejuv:
        case this.pots.MercRejuv:
          return ";Rejuvenation";
        case this.pots.Mana:
          return "3Mana";
        default:
          return "1Healing";
      }
    },

    getPotion(pottype, type) {
      if (!pottype) return false;

      let items = me.getItemsEx().filter((item) => item.itemType === pottype);
      if (items.length === 0) return false;

      // Get highest id = highest potion first
      items.sort(function (a, b) {
        return b.classid - a.classid;
      });

      for (let i = 0; i < items.length; i += 1) {
        if (
          type < this.pots.MercHealth &&
          items[i].isInInventory &&
          items[i].itemType === pottype
        ) {
          console.log(
            `\xFFc4Toolsthread\xFFc0: \xFFc2Drinking\xFFc0 \xFFc${this.getPotionType(
              type
            )} Potion\xFFc0 from inventory.`
          );
          return copyUnit(items[i]);
        }

        if (items[i].isInBelt && items[i].itemType === pottype) {
          console.log(
            `\xFFc4Toolsthread\xFFc0: ${
              type > 2 ? "Giving \xFFc2Merc\xFFc0" : "\xFFc2Drinking\xFFc0"
            } \xFFc${this.getPotionType(type)} Potion\xFFc0 from belt.`
          );
          return copyUnit(items[i]);
        }
      }

      return false;
    },

    drinkPotion(type) {
      if (type === undefined) return false;
      let pottype,
        tNow = getTickCount();

      switch (type) {
        case this.pots.Health:
        case this.pots.Mana:
          if (
            (this.timerLastDrink[type] &&
              tNow - this.timerLastDrink[type] < 1000) ||
            me.getState(
              type === this.pots.Health
                ? sdk.states.HealthPot
                : sdk.states.ManaPot
            )
          ) {
            return false;
          }

          break;
        case this.pots.Rejuv:
          // small delay for juvs just to prevent using more at once
          if (
            this.timerLastDrink[type] &&
            tNow - this.timerLastDrink[type] < 300
          ) {
            return false;
          }

          break;
        case this.pots.MercRejuv:
          // larger delay for juvs just to prevent using more at once, considering merc update rate
          if (
            this.timerLastDrink[type] &&
            tNow - this.timerLastDrink[type] < 2000
          ) {
            return false;
          }

          break;
        default:
          if (
            this.timerLastDrink[type] &&
            tNow - this.timerLastDrink[type] < 8000
          ) {
            return false;
          }

          break;
      }

      // mode 18 - can't drink while leaping/whirling etc.
      if (me.dead || me.mode === sdk.player.mode.SkillActionSequence)
        return false;

      switch (type) {
        case this.pots.Health:
        case this.pots.MercHealth:
          pottype = sdk.items.type.HealingPotion;

          break;
        case this.pots.Mana:
          pottype = sdk.items.type.ManaPotion;

          break;
        default:
          pottype = sdk.items.type.RejuvPotion;

          break;
      }

      let potion = this.getPotion(pottype, type);

      if (!!potion) {
        if (me.dead || me.mode === sdk.player.mode.SkillActionSequence)
          return false;

        try {
          type < this.pots.MercHealth
            ? potion.interact()
            : Packet.useBeltItemForMerc(potion);
        } catch (e) {
          console.error(e);
        }

        this.timerLastDrink[type] = getTickCount();

        return true;
      }

      return false;
    },

    checkVipers() {
      let monster = Game.getMonster(sdk.monsters.TombViper2);

      if (monster) {
        do {
          if (monster.getState(sdk.states.Revive)) {
            let owner = monster.getParent();

            if (owner && owner.name !== me.name) {
              D2Bot.printToConsole(
                "Revived Tomb Vipers found. Leaving game.",
                sdk.colors.D2Bot.Red
              );

              return true;
            }
          }
        } while (monster.getNext());
      }

      return false;
    },

    getIronGolem() {
      let golem = Game.getMonster(sdk.summons.IronGolem);

      if (golem) {
        do {
          let owner = golem.getParent();

          if (owner && owner.name === me.name) {
            return copyUnit(golem);
          }
        } while (golem.getNext());
      }

      return false;
    },

    getNearestPreset() {
      let id;
      let unit = getPresetUnits(me.area);
      let dist = 99;

      for (let i = 0; i < unit.length; i += 1) {
        if (
          getDistance(
            me,
            unit[i].roomx * 5 + unit[i].x,
            unit[i].roomy * 5 + unit[i].y
          ) < dist
        ) {
          dist = getDistance(
            me,
            unit[i].roomx * 5 + unit[i].x,
            unit[i].roomy * 5 + unit[i].y
          );
          id = unit[i].type + " " + unit[i].id;
        }
      }

      return id || "";
    },

    getStatsString(unit) {
      let realFCR = unit.getStat(sdk.stats.FCR);
      let realIAS = unit.getStat(sdk.stats.IAS);
      let realFBR = unit.getStat(sdk.stats.FBR);
      let realFHR = unit.getStat(sdk.stats.FHR);
      // me.getStat(sdk.stats.FasterCastRate) will return real FCR from gear + Config.FCR from char cfg

      if (unit === me) {
        realFCR -= Config.FCR;
        realIAS -= Config.IAS;
        realFBR -= Config.FBR;
        realFHR -= Config.FHR;
      }

      let maxHellFireRes = 75 + unit.getStat(sdk.stats.MaxFireResist);
      let hellFireRes = unit.getRes(sdk.stats.FireResist, sdk.difficulty.Hell);
      hellFireRes > maxHellFireRes && (hellFireRes = maxHellFireRes);

      let maxHellColdRes = 75 + unit.getStat(sdk.stats.MaxColdResist);
      let hellColdRes = unit.getRes(sdk.stats.ColdResist, sdk.difficulty.Hell);
      hellColdRes > maxHellColdRes && (hellColdRes = maxHellColdRes);

      let maxHellLightRes = 75 + unit.getStat(sdk.stats.MaxLightResist);
      let hellLightRes = unit.getRes(
        sdk.stats.LightResist,
        sdk.difficulty.Hell
      );
      hellLightRes > maxHellLightRes && (hellLightRes = maxHellLightRes);

      let maxHellPoisonRes = 75 + unit.getStat(sdk.stats.MaxPoisonResist);
      let hellPoisonRes = unit.getRes(
        sdk.stats.PoisonResist,
        sdk.difficulty.Hell
      );
      hellPoisonRes > maxHellPoisonRes && (hellPoisonRes = maxHellPoisonRes);

      let str =
        "\xFFc4Character Level: \xFFc0" +
        unit.charlvl +
        (unit === me
          ? " \xFFc4Difficulty: \xFFc0" +
            sdk.difficulty.nameOf(me.diff) +
            " \xFFc4HighestActAvailable: \xFFc0" +
            me.highestAct
          : "") +
        "\n" +
        "\xFFc1FR: \xFFc0" +
        unit.getStat(sdk.stats.FireResist) +
        "\xFFc1 Applied FR: \xFFc0" +
        unit.fireRes +
        "/\xFFc3 CR: \xFFc0" +
        unit.getStat(sdk.stats.ColdResist) +
        "\xFFc3 Applied CR: \xFFc0" +
        unit.coldRes +
        "/\xFFc9 LR: \xFFc0" +
        unit.getStat(sdk.stats.LightResist) +
        "\xFFc9 Applied LR: \xFFc0" +
        unit.lightRes +
        "/\xFFc2 PR: \xFFc0" +
        unit.getStat(sdk.stats.PoisonResist) +
        "\xFFc2 Applied PR: \xFFc0" +
        unit.poisonRes +
        "\n" +
        (!me.hell
          ? "Hell res: \xFFc1" +
            hellFireRes +
            "\xFFc0/\xFFc3" +
            hellColdRes +
            "\xFFc0/\xFFc9" +
            hellLightRes +
            "\xFFc0/\xFFc2" +
            hellPoisonRes +
            "\xFFc0\n"
          : "") +
        "\xFFc4MF: \xFFc0" +
        unit.getStat(sdk.stats.MagicBonus) +
        "\xFFc4 GF: \xFFc0" +
        unit.getStat(sdk.stats.GoldBonus) +
        " \xFFc4FCR: \xFFc0" +
        realFCR +
        " \xFFc4IAS: \xFFc0" +
        realIAS +
        " \xFFc4FBR: \xFFc0" +
        realFBR +
        " \xFFc4FHR: \xFFc0" +
        realFHR +
        " \xFFc4FRW: \xFFc0" +
        unit.getStat(sdk.stats.FRW) +
        "\n" +
        "\xFFc4CB: \xFFc0" +
        unit.getStat(sdk.stats.CrushingBlow) +
        " \xFFc4DS: \xFFc0" +
        unit.getStat(sdk.stats.DeadlyStrike) +
        " \xFFc4OW: \xFFc0" +
        unit.getStat(sdk.stats.OpenWounds) +
        " \xFFc1LL: \xFFc0" +
        unit.getStat(sdk.stats.LifeLeech) +
        " \xFFc3ML: \xFFc0" +
        unit.getStat(sdk.stats.ManaLeech) +
        " \xFFc8DR: \xFFc0" +
        unit.getStat(sdk.stats.DamageResist) +
        "% + " +
        unit.getStat(sdk.stats.NormalDamageReduction) +
        " \xFFc8MDR: \xFFc0" +
        unit.getStat(sdk.stats.MagicResist) +
        "% + " +
        unit.getStat(sdk.stats.MagicDamageReduction) +
        "\n" +
        (unit.getStat(sdk.stats.CannotbeFrozen) > 0
          ? "\xFFc3Cannot be Frozen\xFFc1\n"
          : "\n");

      return str;
    },
    hookInfo() {
      if (!Config.HookInfo) return;

      // [
      //   sdk.uiflags.Inventory,
      //   sdk.uiflags.Stash,
      //   sdk.uiflags.EscMenu,
      //   sdk.uiflags.Shop,
      //   sdk.uiflags.Cube,
      //   sdk.uiflags.StatsWindow,
      //   sdk.uiflags.QuickSkill,
      //   sdk.uiflags.SkillWindow,
      //   sdk.uiflags.Quest,
      //   sdk.uiflags.ChatBox,
      //   sdk.uiflags.Msgs,
      //   sdk.uiflags.MercScreen,
      // ].some((ui) => getUIFlag(ui))

      let x = 506;
      let y = 35;
      let frameYsize = 35;

      this.hooks.push(
        new Text(
          `Keys: ÿc0${Config.MFTorches.TorchesQuantity.slice(0, 3)}`,
          x,
          y,
          4,
          13,
          2
        )
      );
      this.hooks.push(
        new Text(
          `Orgs: ÿc0${Config.MFTorches.TorchesQuantity.slice(-3)}`,
          x,
          y + 15,
          4,
          13,
          2
        )
      );

      this.hooks.push(new Box(x + 2, y - 15, 86, frameYsize, 0x0, 0, 2));
      this.hooks.push(new Frame(x, y - 15, 90, frameYsize, 2));
      this.hooks[this.hooks.length - 2].zorder = 5;
    },
  },

  Leecher: {
    leadTick: 0,
    leader: null,
    killLeaderTracker: false,
    currentScript: "",
    nextScriptAreas: [
      sdk.areas.TowerCellarLvl5,
      sdk.areas.PitLvl1,
      sdk.areas.PitLvl2,
      sdk.areas.BurialGrounds,
      sdk.areas.CatacombsLvl4,
      sdk.areas.MooMooFarm,
      sdk.areas.DuranceofHateLvl3,
      sdk.areas.ChaosSanctuary,
      sdk.areas.ThroneofDestruction,
      sdk.areas.WorldstoneChamber,
    ],

    leaderTracker() {
      if (Common.Leecher.killLeaderTracker) return false;
      // check every 3 seconds
      if (getTickCount() - Common.Leecher.leadTick < 3000) return true;
      Common.Leecher.leadTick = getTickCount();

      // check again in another 3 seconds if game wasn't ready
      if (!me.gameReady) return true;
      if (Misc.getPlayerCount() <= 1) throw new Error("Empty game");

      let party = getParty(Common.Leecher.leader);

      if (party) {
        // Player has moved on to another script
        if (Common.Leecher.nextScriptAreas.includes(party.area)) {
          if (Loader.scriptName() === Common.Leecher.currentScript) {
            Common.Leecher.killLeaderTracker = true;
            throw new Error("Party leader is running a new script");
          } else {
            // kill process
            return false;
          }
        }
      }

      return true;
    },
  },
};
