import {
  addEventListener,
  delay,
  me,
  say,
  print,
  getTickCount,
  FileTools,
  transmute,
  copyUnit,
  getRoom,
  getDistance,
  debugLog,
} from "boot";

import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Game, Misc, Skill, Time } from "../common/Misc.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Pickit } from "../common/Pickit.js";
import { Storage } from "../common/Storage.js";
import { Cubing } from "../common/Cubing.js";
import { AutoMule } from "../AutoMule.js";

export const MFTorches = function () {
  this.teamOwns = undefined;
  this.currentGameInfo = null;
  this.uberCount = 0;
  this.skillBackup = [0, 0];
  this.cleaning = false;

  const TorchesMode = {
    MiniUbers: 0,
    UberTristram: 1,
  };

  const OrgTorchData = {
    filePath: "logs/OrgTorch-" + me.profile + ".json",
    default: { gamename: me.gamename, doneAreas: [] },

    create: function () {
      FileTools.writeText(this.filePath, JSON.stringify(this.default));
      return this.default;
    },

    read: function () {
      let obj = {};
      try {
        let string = FileTools.readText(this.filePath);
        obj = JSON.parse(string);
      } catch (e) {
        return this.default;
      }

      return obj;
    },

    update: function (newData) {
      let data = this.read();
      Object.assign(data, newData);
      FileTools.writeText(this.filePath, JSON.stringify(data));
    },

    remove: function () {
      return FileTools.remove(this.filePath);
    },
  };

  const PandemoniumEvent = {
    RunAreas: [
      sdk.areas.MatronsDen,
      sdk.areas.ForgottenSands,
      sdk.areas.FurnaceofPain,
    ],
    FinaleArea: sdk.areas.UberTristram,

    runs: [],
    finale: undefined,
    mode: TorchesMode.MiniUbers,

    canOpenPortal() {
      return (
        !this.finale &&
        (this.mode === TorchesMode.MiniUbers
          ? this.runs.length < this.RunAreas.length
          : this.runs.length === 0)
      );
    },

    setMode(mode) {
      this.mode = mode;
    },

    getPortals() {
      return this.finale ? this.runs.concat(this.finale) : this.runs.concat();
    },

    check() {
      Game.getUnits(sdk.unittype.Object, sdk.objects.RedPortal).forEach(
        (el) => {
          switch (el.objtype) {
            case sdk.areas.MatronsDen:
            case sdk.areas.ForgottenSands:
            case sdk.areas.FurnaceofPain:
              this.runs.push(copyUnit(el));

              break;
            case sdk.areas.UberTristram:
              this.finale = copyUnit(el);
              break;
          }
        }
      );
      return true;
    },

    getQuantity() {
      return this.mode === TorchesMode.MiniUbers
        ? this.RunAreas.length - this.runs.length
        : 1;
    },

    open() {
      let sites = [
        { x: 5130, y: 5050 },
        { x: 5142, y: 5060 },
        { x: 5130, y: 5066 },
      ];

      let items =
        this.mode === TorchesMode.MiniUbers
          ? [
              sdk.items.quest.KeyofTerror,
              sdk.items.quest.KeyofHate,
              sdk.items.quest.KeyofDestruction,
            ]
          : [
              sdk.items.quest.DiablosHorn,
              sdk.items.quest.BaalsEye,
              sdk.items.quest.MephistosBrain,
            ];

      // Town.goToTown(5);
      // Town.doChores();

      if (Town.openStash() && Cubing.emptyCube()) {
        for (let item of items) {
          let si = me.findItem(item, sdk.items.mode.inStorage);
          if (!Storage.Cube.MoveTo(si)) return false;
        }

        let cube = me.cube;

        if (cube && cube.isInStash) {
          if (!Storage.Inventory.CanFit(cube)) return false;
          Storage.Inventory.MoveTo(cube);
          me.cancel();
        }

        if (this.mode === TorchesMode.MiniUbers)
          Pather.moveTo(sites[this.runs.length].x, sites[this.runs.length].y);
        else Pather.moveTo(5090, 5020);

        if (!Cubing.openCube()) return false;
        transmute();
        delay(1000);

        Town.openStash() && Storage.Stash.MoveTo(cube);

        let portal = Game.getObject(sdk.objects.RedPortal);

        if (portal) {
          do {
            if (
              !this.getPortals().some((el) => el.objtype === portal.objtype)
            ) {
              let cp = copyUnit(portal);

              if (this.mode === TorchesMode.MiniUbers) this.runs.push(cp);
              else this.finale = cp;

              return cp;
            }
          } while (portal.getNext());
        }
      }

      return false;
    },
  };

  const FinaleMonster = {
    LocateState: {
      None: 0,
      Nearby: 1,
      Top: 2,
      Bottom: 4,
    },
    HookState: {
      None: 0,
      Hooked: 1,
      Extra: 2,
    },
    LureState: {
      None: 0,
      Found: 1,
      Blocked: 2,
      Failed: 4,
      Lured: 8,
    },
    Distances: 30,

    monsters: undefined,

    search() {
      // init first
      //Object.keys(this.monsters).forEach((p) => delete this.monsters[p]);
      this.monsters = {};

      let count = 0;

      let monster = Game.getMonster();

      if (monster) {
        do {
          if (
            monster.classid >= sdk.monsters.UberMephisto &&
            monster.classid <= sdk.monsters.UberDiablo
          ) {
            if (monster.attackable) {
              this.monsters[monster.classid] = copyUnit(monster);
              count++;
            }
          }
        } while (monster.getNext());
      }

      return count;
    },

    blocked(mode = false) {
      if (
        !this.monsters[sdk.monsters.UberMephisto] &
        (this.monsters[sdk.monsters.UberBaal] ||
          this.monsters[sdk.monsters.UberDiablo])
      ) {
        print(`\xFFc8MFTorches\xFFc0 :: Mephisto is blocked.`);

        return true;
      }

      if (
        (mode &&
          this.monsters[sdk.monsters.UberBaal] &&
          this.monsters[sdk.monsters.UberBaal].distance < 10) ||
        (this.monsters[sdk.monsters.UberDiablo] &&
          this.monsters[sdk.monsters.UberDiablo].distance < 10)
      ) {
        print(`\xFFc8MFTorches\xFFc0 :: monsters is blocked.`);

        return true;
      }

      return false;
    },

    isHooked() {
      let mephisto = this.monsters[sdk.monsters.UberMephisto];

      if (!mephisto) return this.HookState.None;

      let close =
        mephisto.distance <= this.Distances ||
        (mephisto.y <= 5105 &&
          [25103, 5095].distance >
            getDistance(mephisto.x, mephisto.y, 25103, 5095));

      if (close) return this.HookState.Hooked;

      if (
        mephisto.distance > this.Distances &&
        mephisto.distance - this.Distances <= this.Distances / 3
      ) {
        let pos = {};
        pos.angle = Math.atan2(me.y - mephisto.y, me.x - mephisto.x).toFixed(4);

        pos.range = ((mephisto.distance - this.Distances) / 2).toFixed(4);

        pos.x = Math.round(Math.cos(pos.angle) * pos.range) + mephisto.x;
        pos.y = Math.round(Math.sin(pos.angle) * pos.range) + mephisto.y;

        Pather.moveTo(pos.x, pos.y);
        delay(200);
        return this.HookState.Hooked | this.HookState.Extra;
      }

      return this.HookState.None;
    },

    //the UberMephisto first, sort by classid
    foundNearby() {
      if (!this.search()) return false;

      return Object.values(this.monsters).sort(
        (m1, m2) => m1.classid - m2.classid
      );
    },

    getState() {
      if (!Object.keys(this.monsters).length) return this.LocateState.None;

      let state = this.LocateState.None;

      Object.values(this.monsters).some((m) => m.distance <= this.Distances) &&
        (state = state | this.LocateState.Nearby);

      let meph = this.monsters[sdk.monsters.UberMephisto];
      if (meph) {
        state =
          meph.x <= 25103
            ? state | this.LocateState.Top
            : state | this.LocateState.Bottom;
      }

      return state;
    },

    lure(path, pos) {
      let step, boss;
      // let found = false;
      let hooked;

      for (step = pos; step < path.length; step++) {
        //
        if (!this.search()) continue;

        // uber diablo or baal found first
        if (this.blocked()) {
          return this.monsters[sdk.monsters.UberMephisto]
            ? this.LureState.Blocked | this.LureState.Found
            : this.LureState.Blocked;
        }

        hooked = this.isHooked();

        if (hooked) {
          boss = this.monsters[sdk.monsters.UberMephisto];

          // found = true;
          hooked & this.HookState.Extra && step++;

          break;
        }

        Pather.moveTo(path[step].x, path[step].y);
        delay(200);
      }

      step = step >= path.length ? path.length - 1 : step;

      let tries = 10;
      for (step -= 1; step >= 0 && tries > 0; step--) {
        Pather.moveTo(path[step].x, path[step].y);
        delay(200);

        // if (!found) continue;

        let hook = Misc.poll(
          () => {
            if (this.search()) {
              hooked = this.isHooked();

              return hooked;
            }
            return false;
          },
          1000,
          200
        );

        if (!hook) {
          // continue will reduce 1 agnin
          step += 2;
          tries--;
          continue;
        }

        hooked & this.HookState.Extra && step++;

        if (this.blocked(true))
          return this.monsters[sdk.monsters.UberMephisto]
            ? this.LureState.Blocked | this.LureState.Found
            : this.LureState.Blocked;

        if (path[0].distance <= this.Distances * 1.5) {
          return this.LureState.Found | this.LureState.Lured;
        }
      }
      return this.LureState.None;
    },
  };

  const TorchesSets = {
    //[1,2,3]
    expect: undefined,
    //charname:[1,2,3]
    owns: undefined,
    //charname:[1,2,3]
    result: undefined,

    update(id, val) {
      if (this.result[id] === undefined) this.result[id] = val;
      else this.result[id].addArray(val);

      this.owns[id].minusArray(val);
    },

    generate() {
      let temp = [];

      for (const key in this.owns) {
        if (this.owns[key].greaterThan(this.expect)) {
          this.update(key, this.expect);
          return true;
        }

        temp.push({ id: key, v: this.owns[key].consumeThan(this.expect) });
      }

      temp.sort((a, b) => a.v.summation() - b.v.summation());
      //
      let item = temp.pop();

      this.update(item.id, item.v);

      this.expect.minusArray(item.v);
      this.expect.summation() > 0 && this.generate();
    },

    perform(owns, expect) {
      this.owns = owns;
      this.expect = expect;
      this.result = {};

      this.generate(expect);
    },
  };

  this.checkTorchesSets = function (mode, quantity) {
    let event, owns;

    if (mode == TorchesMode.MiniUbers) {
      event = "keys";
      owns = me.torchKey;
    } else {
      event = "orgs";
      owns = me.torchOrgan;
    }

    let needs = owns.map((val) => (val - quantity > 0 ? 0 : quantity - val));

    if (needs.every((e) => e === 0)) return true;

    this.teamOwns = {};
    say(`${event}:a:${getTickCount()}`);

    let playerCount = Misc.getPartyCount();

    Misc.poll(
      () => Object.keys(this.teamOwns).length === playerCount,
      5000,
      200
    );

    let all = [0, 0, 0];
    Object.values(this.teamOwns).forEach((item) => {
      all.addArray(item);
    });

    if (!all.greaterThan(needs)) return false;

    TorchesSets.perform(this.teamOwns, needs);

    for (const id in TorchesSets.result) {
      say(`${event}:o:${id}:${TorchesSets.result[id]}`);
      delay(100);
    }

    return Misc.poll(
      () => {
        //pick again
        Pickit.pickItems();
        owns = mode == TorchesMode.MiniUbers ? me.torchKey : me.torchOrgan;
        return owns.summation() >= quantity * 3;
      },
      60000,
      100
    );
  };

  this.chatEvent = function ({ nick, msg }) {
    //keys:r:charname:1,2,3
    if (msg.startsWith("keys:") || msg.startsWith("orgs:")) {
      let split = msg.split(":");
      switch (split[1]) {
        case "r":
          this.teamOwns[split[2]] = split[3]
            .split(",")
            .map((x) => Number.parseInt(x));
          break;

        case "p":
          Pickit.pickItems();
          break;

        default:
          break;
      }
    }
  };

  this.getQuestItem = function (item) {
    if (item) {
      let id = item.classid;
      let canFit = Storage.Inventory.CanFit(item);
      if (!canFit && Pickit.canMakeRoom()) {
        console.log(
          "\xFFc7Trying to make room for " + Pickit.itemColor(item) + item.name
        );
        Town.visitTown();
        !copyUnit(item).x && (item = Misc.poll(() => Game.getItem(id)));
      }
    }
    return Pickit.pickItem(item);
  };

  this.attackMiniBoss = function (miniBoss, qustItem) {
    let bItem = me.findItems(qustItem, sdk.items.mode.inStorage).length;
    let success = false;

    Precast.doPrecast(true);

    let target;
    let myRoom,
      rooms = [];

    function RoomSort(a, b) {
      return (
        getDistance(myRoom[0], myRoom[1], a[0], a[1]) -
        getDistance(myRoom[0], myRoom[1], b[0], b[1])
      );
    }

    try {
      let room = getRoom();
      if (!room) return false;

      do {
        rooms.push([room.x * 5 + room.xsize / 2, room.y * 5 + room.ysize / 2]);
      } while (room.getNext());

      while (rooms.length > 0) {
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

        rooms.sort(RoomSort);
        room = rooms.shift();

        let result = Pather.getNearestWalkable(room[0], room[1], 18, 3);

        if (result) {
          Pather.moveTo(result[0], result[1], 3);

          target = Game.getMonster(miniBoss);
          if (target) {
            let safeLoc = Attack.findSafeSpot(target, 5, 5, 5);

            typeof safeLoc === "object"
              ? Pather.moveToUnit(safeLoc, 0)
              : Pather.moveToUnit(target);

            break;
          }
        }
      }

      let result = Attack.kill(miniBoss);
      Pickit.pickItems();
      this.getQuestItem(Game.getItem(qustItem));

      // we sucessfully picked up the horn
      success =
        result &&
        (me.findItems(qustItem, sdk.items.mode.inStorage).length > bItem ||
          !Game.getItem(qustItem, sdk.items.mode.onGround));

      Town.goToTown();
    } catch (error) {
      console.error(error);
      //
    }

    return success;
  };

  // Get fade in River of Flames - only works if we are wearing an item with ctc Fade
  // todo - equipping an item from storage if we have it
  this.getFade = function () {
    if (
      Config.OrgTorch.GetFade &&
      !me.getState(sdk.states.Fade) &&
      me.haveSome([
        { name: sdk.locale.items.Treachery, equipped: true },
        { name: sdk.locale.items.LastWish, equipped: true },
        { name: sdk.locale.items.SpiritWard, equipped: true },
      ])
    ) {
      console.log(
        sdk.colors.Orange + "MFTorches :: " + sdk.colors.White + "Getting Fade"
      );
      // lets figure out what fade item we have before we leave town
      let fadeItem = me.findFirst([
        { name: sdk.locale.items.Treachery, equipped: true },
        { name: sdk.locale.items.LastWish, equipped: true },
        { name: sdk.locale.items.SpiritWard, equipped: true },
      ]);

      Pather.useWaypoint(sdk.areas.RiverofFlame);
      Precast.doPrecast(true);
      // check if item is on switch
      let mainSlot;

      Pather.moveTo(7811, 5872);

      if (fadeItem.have && fadeItem.item.isOnSwap && me.weaponswitch !== 1) {
        mainSlot = me.weaponswitch;
        me.switchWeapons(1);
      }

      Skill.canUse(sdk.skills.Salvation) &&
        Skill.setSkill(sdk.skills.Salvation, sdk.skills.hand.Right);

      while (!me.getState(sdk.states.Fade)) {
        delay(100);
      }

      mainSlot !== undefined &&
        me.weaponswitch !== mainSlot &&
        me.switchWeapons(mainSlot);

      console.log(
        sdk.colors.Orange + "MFTorches :: " + sdk.colors.Green + "Fade Achieved"
      );
    }

    return true;
  };

  this.attackUberTarget = function (target) {
    if (!target) return false;

    if (Config.MFTorches.UseSalvation && this.cleaning) {
      this.cleaning = false;
      Config.AttackSkill[2] = this.skillBackup[0];
      Config.AttackSkill[4] = this.skillBackup[1];
      Skill.setSkill(this.skillBackup[0], sdk.skills.hand.Right);
    }

    let safeLoc = Attack.findSafeSpot(target, 5, 5, 5);

    typeof safeLoc === "object"
      ? Pather.moveToUnit(safeLoc, 0)
      : Pather.moveToUnit(target);

    say(`finale:k:${target.classid}:${getTickCount()}`);

    let result = Attack.kill(target);

    if (result) {
      this.uberCount++;

      if (
        Config.MFTorches.UseSalvation &&
        target.classid === sdk.monsters.UberMephisto &&
        Skill.canUse(sdk.skills.Cleansing)
      ) {
        this.cleaning = true;
        Config.AttackSkill[2] = sdk.skills.Cleansing;
        Config.AttackSkill[4] = sdk.skills.Cleansing;
        Skill.setSkill(sdk.skills.Cleansing, sdk.skills.hand.Right);
      }
    }

    return result;
  };

  // re-write this, lure doesn't always work and other classes can do ubers
  this.uberTrist = function () {
    let useSalvation =
      Config.MFTorches.UseSalvation && Skill.canUse(sdk.skills.Salvation);

    let paths = [
      //bottom
      [
        { x: 25103, y: 5095 },
        { x: 25120, y: 5102 },
        { x: 25140, y: 5102 },
        { x: 25160, y: 5100 },
        { x: 25180, y: 5103 },
        { x: 25180, y: 5123 },
        { x: 25180, y: 5143 },
        { x: 25180, y: 5163 },
        { x: 25180, y: 5183 },
      ],
      [
        { x: 25103, y: 5095 },
        { x: 25080, y: 5095 },
        { x: 25060, y: 5095 },
        { x: 25051, y: 5095 },
        { x: 25051, y: 5075 },
        { x: 25040, y: 5150 },
        { x: 25050, y: 5170 },
        { x: 25075, y: 5170 },
        { x: 25095, y: 5180 },
        { x: 25115, y: 5190 },
        { x: 25125, y: 5175 },
        { x: 25125, y: 5160 },
        { x: 25125, y: 5145 },
      ],
    ];

    let fullpath = [
      { x: 25103, y: 5095 },
      { x: 25140, y: 5102 },
      { x: 25160, y: 5100 },
      { x: 25180, y: 5103 },
      { x: 25180, y: 5123 },
      { x: 25180, y: 5143 },
      { x: 25180, y: 5163 },
      { x: 25180, y: 5183 },
      { x: 25150, y: 5183 },
      { x: 25125, y: 5183 },
      { x: 25125, y: 5162 }, //
      { x: 25125, y: 5140 }, // |----
      { x: 25125, y: 5183 },
      { x: 25105, y: 5183 },
      { x: 25080, y: 5183 },
      { x: 25060, y: 5167 },
      { x: 25045, y: 5137 },
      { x: 25045, y: 5115 },
      { x: 25045, y: 5100 },
      { x: 25065, y: 5100 },
      { x: 25080, y: 5095 },
    ];

    if (useSalvation) {
      this.skillBackup[0] = Config.AttackSkill[2];
      this.skillBackup[1] = Config.AttackSkill[4];
      Config.AttackSkill[2] = sdk.skills.Salvation;
      Config.AttackSkill[4] = sdk.skills.Salvation;
      Skill.setSkill(sdk.skills.Salvation, sdk.skills.hand.Right);
    }

    this.uberCount == 0;

    Precast.doPrecast(true);

    let exact;
    if (FinaleMonster.search()) {
      let meph = FinaleMonster.monsters[sdk.monsters.UberMephisto];

      if (meph) {
        exact = { nodes: me.x > meph.x ? paths[1] : paths[0], step: 0 };
      } else {
        //other monster at top
        let boss =
          FinaleMonster.monsters[sdk.monsters.UberDiablo] ||
          FinaleMonster.monsters[sdk.monsters.UberBaal];

        if (me.x > boss.x) paths.reverse();
      }
    }

    if (!exact) {
      let index = 0;
      for (const path in paths) {
        if (
          paths[path].some((node, idx) => {
            Pather.moveTo(node.x, node.y);
            delay(200);

            if (
              FinaleMonster.search() &&
              FinaleMonster.monsters[sdk.monsters.UberMephisto]
            ) {
              index = idx;
              return true;
            }
          })
        ) {
          exact = { nodes: paths[path], step: index };
          break;
        }
      }
    }

    let success = false;
    if (exact) {
      for (let t = 0; t < 3; t++) {
        success = FinaleMonster.lure(exact.nodes, exact.step);

        if (
          success & FinaleMonster.LureState.Lured ||
          success & FinaleMonster.LureState.Blocked
        ) {
          break;
        }
      }
    }

    say(`finale:g:${getTickCount()}`);
    if (success & FinaleMonster.LureState.Lured) {
      Pather.moveTo(exact.nodes[0].x, exact.nodes[0].y);
      delay(500);

      let um = Game.getMonster(sdk.monsters.UberMephisto);
      this.attackUberTarget(um);
      Precast.doPrecast(true);

      delay(500);
    }

    // full search now
    for (const n of fullpath) {
      if (me.x > n.x && me.y >= 5090 && me.y <= 5105) continue;

      Pather.moveTo(n.x, n.y, 3);
      delay(300);

      let bosses = FinaleMonster.foundNearby();
      if (!bosses) continue;

      bosses.forEach((boss) => {
        this.attackUberTarget(boss);
        Precast.doPrecast(true);
      });

      if (this.uberCount === 3) {
        say(`finale:c:0:${getTickCount()}`);
        Attack.clear();
        this.currentGameInfo.doneAreas.push(sdk.areas.UberTristram) &&
          OrgTorchData.update(this.currentGameInfo);

        break;
      }
    }

    delay(300);
    say(`finale:b:${getTickCount()}`);

    AutoMule.callCharmMuler(sdk.items.LargeCharm);
  };

  // Do mini ubers or Tristram based on area we're already in
  this.pandemoniumRun = function (portalId) {
    let result = false;

    switch (me.area) {
      case sdk.areas.MatronsDen:
        result = this.attackMiniBoss(
          sdk.monsters.Lilith,
          sdk.items.quest.DiablosHorn
        );

        break;
      case sdk.areas.ForgottenSands:
        result = this.attackMiniBoss(
          sdk.monsters.UberDuriel,
          sdk.items.quest.BaalsEye
        );

        break;
      case sdk.areas.FurnaceofPain:
        result = this.attackMiniBoss(
          sdk.monsters.UberIzual,
          sdk.items.quest.MephistosBrain
        );

        break;
      case sdk.areas.UberTristram:
        this.uberTrist();

        break;
    }

    if (result)
      this.currentGameInfo.doneAreas.push(portalId) &&
        OrgTorchData.update(this.currentGameInfo);
  };

  this.runEvent = function (portal) {
    if (portal) {
      if (
        Config.OrgTorch.PreGame.Antidote.At.includes(portal.objtype) &&
        Config.OrgTorch.PreGame.Antidote.Drink > 0
      ) {
        Town.buyPots(
          Config.OrgTorch.PreGame.Antidote.Drink,
          "Antidote",
          true,
          true
        );
      }
      if (
        Config.OrgTorch.PreGame.Thawing.At.includes(portal.objtype) &&
        Config.OrgTorch.PreGame.Thawing.Drink > 0
      ) {
        Town.buyPots(
          Config.OrgTorch.PreGame.Thawing.Drink,
          "Thawing",
          true,
          true
        );
      }

      if (portal.objtype === sdk.areas.UberTristram) Pather.moveTo(5090, 5020);
      else Town.move("stash");
      console.log("taking portal: " + portal.objtype);

      //set first! after usePortal will change null
      let pid = portal.objtype;
      Pather.usePortal(null, null, portal);
      this.pandemoniumRun(pid);
    }
  };

  addEventListener("chatmsg", this.chatEvent, this);

  // make sure we are picking the organs
  Config.PickitFiles.length === 0 && NTIP.OpenFile("pickit/keyorg.nip", true);

  FileTools.exists(OrgTorchData.filePath) &&
    (this.currentGameInfo = OrgTorchData.read());

  if (!this.currentGameInfo || this.currentGameInfo.gamename !== me.gamename) {
    this.currentGameInfo = OrgTorchData.create();
  }

  Town.goToTown(5);
  Town.doChores();
  Town.move("stash");

  //check first
  PandemoniumEvent.check() &&
    PandemoniumEvent.getPortals().forEach(
      (p) =>
        !this.currentGameInfo.doneAreas.includes(p.objtype) && this.runEvent(p)
    );

  let tick = getTickCount();
  while (getTickCount() - tick < Time.seconds(20)) {
    me.overhead(
      `\xFFc4MFTorches:\xFFc0 Wait \xFFc2${Math.round(
        20 - (getTickCount() - tick) / 1000
      )}\xFFc0 seconds for verify sets.`
    );
    delay(100);
  }

  //run now
  [TorchesMode.MiniUbers, TorchesMode.UberTristram].forEach((mode) => {
  // [TorchesMode.MiniUbers].forEach((mode) => {
    PandemoniumEvent.setMode(mode);

    if (PandemoniumEvent.canOpenPortal()) {
      me.maxgametime += 600 * 1000;

      if (this.checkTorchesSets(mode, PandemoniumEvent.getQuantity())) {
        while (PandemoniumEvent.canOpenPortal()) {
          let portal = PandemoniumEvent.open();
          this.runEvent(portal);
        }
      } else {
        tick = getTickCount();
        while (getTickCount() - tick < Time.seconds(3)) {
          me.overhead(
            `\xFFc4MFTorches:\xFFc0 No more ${mode ? "organ" : "key"} sets.`
          );
          delay(100);
        }
      }
    }
  });
  return true;
};
