import {
  addEventListener,
  removeEventListener,
  getTickCount,
  copyUnit,
  delay,
  getArea,
  getDistance,
  me,
  quit,
  rand,
  say,
  print,
  getParty,
} from "boot";

import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Game, Misc, Skill } from "../common/Misc.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Pickit } from "../common/Pickit.js";
import { Common } from "../common/Common.js";

export const MFHelper = function () {
  let player, playerAct, split;
  let oldCommand = "";
  let command = "";
  let allowSay = true;
  let setting = {};
  let cleaning = false;

  this.offerTorchesSets = function (event, val) {
    let classid;

    val.forEach((el, index) => {
      switch (event) {
        case "keys":
          classid =
            index == 0
              ? sdk.items.quest.KeyofTerror
              : index == 1
              ? sdk.items.quest.KeyofHate
              : sdk.items.quest.KeyofDestruction;
          break;
        case "orgs":
          classid =
            index == 0
              ? sdk.items.quest.DiablosHorn
              : index == 1
              ? sdk.items.quest.BaalsEye
              : sdk.items.quest.MephistosBrain;
          break;

        default:
          break;
      }

      for (let i = 0; i < el; i++) {
        let item = me.getItem(classid);
        if (item) {
          me.overhead(`\xFFc2drop\xFFc0: ${item.name.omitColor()}`);
          item.drop();
          delay(100);
        }
      }
    });
    say(`${event}:p:${getTickCount()}`);

    return true;
  };

  this.torchesAction = function (event, mode, val) {
    let items = event === "keys" ? [...me.torchKey] : [...me.torchOrgan];

    switch (mode) {
      case 0:
        if (items.summation() > 0) {
          say(`${event}:r:${me.name}:${items.join(",")}`);
        }

        break;
      case 1:
        break;
      case 2:
        if (!Town.openStash()) return false;

        this.offerTorchesSets(event, val);
        me.cancel();

        Town.move("portalspot");

        break;
      default:
        break;
    }
    return true;
  };

  this.findUberTristram = function (mode) {
    if (
      (mode === "g" && me.inArea(sdk.areas.UberTristram)) ||
      (mode === "b" && me.inArea(sdk.areas.Harrogath))
    )
      return false;

    let area = mode === "g" ? sdk.areas.UberTristram : sdk.areas.Harrogath;

    let portal = Game.getObject(sdk.objects.RedPortal);

    if (portal) {
      do {
        if (portal.objtype === area) {
          return copyUnit(portal);
        }
      } while (portal.getNext());
    }
    return false;
  };

  this.uberTristramToTown = function () {
    if (!me.inArea(sdk.areas.UberTristram)) return;

    //back town
    Pather.moveTo(25103, 5090);
    //clear the red door
    Attack.clear();

    let portal = this.findUberTristram("b");

    if (!portal) {
      print("\xFFc4MFHelper\xFFc0: Failed to use portal.");
      return false;
    }

    for (let i = 0; i < 5; i += 1) {
      if (
        me.inArea(sdk.areas.UberTristram) &&
        Pather.usePortal(null, null, portal)
      ) {
        break;
      }

      delay(500 + me.ping);
    }

    Town.doChores();
    Town.move("portalspot");
  };

  this.announce = function (msg = "") {
    if (!allowSay) return;
    say(msg);
  };

  this.followUberTristram = function (mode) {
    let skillBackup = [0, 0];
    let portal = this.findUberTristram(mode);

    if (!portal) {
      print("\xFFc4MFHelper\xFFc0: Failed to use portal.");
      return false;
    }

    //set game time
    me.maxgametime += 600 * 1000;

    for (let i = 0; i < 5; i += 1) {
      if (me.inTown && Pather.usePortal(null, null, portal)) {
        break;
      }

      delay(500 + me.ping);
    }

    if (
      Config.MFTorches.UseSalvation &&
      me.paladin &&
      Skill.canUse(sdk.skills.Salvation)
    ) {
      skillBackup[0] = Config.AttackSkill[2];
      skillBackup[1] = Config.AttackSkill[4];
      Config.AttackSkill[2] = sdk.skills.Salvation;
      Config.AttackSkill[4] = sdk.skills.Salvation;
      Skill.setSkill(sdk.skills.Salvation, sdk.skills.hand.Right);
    }

    Precast.doPrecast(true);
    delay(500);

    let leaderUnit;

    Misc.poll(
      () => {
        leaderUnit = Misc.getPlayerUnit(Config.Leader);
        return leaderUnit;
      },
      2000,
      200
    );

    while (Misc.inMyParty(Config.Leader) && me.inArea(sdk.areas.UberTristram)) {
      if (me.dead) {
        while (!me.inTown) {
          me.revive();
          delay(1000);
        }

        Town.move("portalspot");
        this.announce("I'm alive!");
      }

      leaderUnit = Misc.getPlayerUnit(Config.Leader);

      // found by other player
      if (!leaderUnit) {
        player = Game.getPlayer();

        if (player) {
          do {
            if (player.name !== me.name) {
              Pather.moveToUnit(player);

              break;
            }
          } while (player.getNext());

          leaderUnit = Misc.getPlayerUnit(Config.Leader);
        }
      }

      if (!leaderUnit) {
        print("\xFFc4MFHelper\xFFc0: get leader from party.");
        leaderUnit = getParty(Config.Leader);
      }

      //follow
      if (leaderUnit && leaderUnit.area === me.area) {
        leaderUnit.distance > 5 && Pather.moveToUnit(leaderUnit);
      } else {
        //lost leader
        break;
      }

      delay(100);
    }

    if (me.inArea(sdk.areas.UberTristram)) {
      print("\xFFc4MFHelper\xFFc0: leader not found.");

      this.uberTristramToTown();

      if (Config.MFTorches.UseSalvation && me.paladin) {
        Config.AttackSkill[2] = skillBackup[0];
        Config.AttackSkill[4] = skillBackup[1];
      }
    }
  };

  function chatEvent({ nick, msg }) {
    let split;

    if (!player) {
      let match = [
        "kill",
        "clearlevel",
        "clear",
        "quit",
        "cows",
        "council",
        "goto",
        "nextup",
        "keys",
        "orgs",
        "finale",
      ];
      if (msg) {
        for (let i = 0; i < match.length; i += 1) {
          if (msg.match(match[i])) {
            player = Misc.findPlayer(nick);

            break;
          }
        }
      }
    }

    if (msg.startsWith("keys:") || msg.startsWith("orgs:")) {
      split = msg.split(":");
      switch (split[1]) {
        case "a":
          this.torchesAction(split[0], 0);
          break;

        case "o":
          split[2] == me.name &&
            this.torchesAction(
              split[0],
              2,
              split[3].split(",").map((x) => Number.parseInt(x))
            );
          break;
      }
    } else if (msg.startsWith("finale:")) {
      split = msg.split(":");

      switch (split[1]) {
        case "g":
          this.followUberTristram(split[1]);
          break;
        case "k":
          try {
            let target = parseInt(split[2], 10);

            let result = Attack.kill(target);

            if (
              Config.MFTorches.UseSalvation &&
              me.paladin &&
              target === sdk.monsters.UberMephisto &&
              result &&
              Skill.canUse(sdk.skills.Cleansing)
            ) {
              cleaning = true;
              Config.AttackSkill[2] = sdk.skills.Cleansing;
              Config.AttackSkill[4] = sdk.skills.Cleansing;
              Skill.setSkill(sdk.skills.Cleansing, sdk.skills.hand.Right);
            }
          } catch (error) {
            print(error);
          }
          break;
        //finale:k:cassid:token
        case "c":
          try {
            let target =
              parseInt(split[2], 10) === 0 ? undefined : parseInt(split[2], 10);

            Attack.clear(15, 0, target);
          } catch (error) {
            print(error);
          }
          break;
        case "b":
          this.uberTristramToTown();
          return;
      }
    }

    // // have new command
    // if (command.startsWith("finale:")) {
    //   //do something now
    //   oldCommand = command;

    // //reset aura skill
    // if (
    //   Config.MFTorches.UseSalvation &&
    //   cleaning &&
    //   me.paladin
    //   // !me.getState(sdk.states.Poison)
    // ) {
    //   cleaning = false;
    //   Config.AttackSkill[2] = skillBackup[0];
    //   Config.AttackSkill[4] = skillBackup[1];
    //   Skill.setSkill(skillBackup[0], sdk.skills.hand.Right);
    // }
    // }

    player && nick === player.name && (command = msg);
  }

  function checkAct() {
    playerAct = Misc.getPlayerAct(Config.Leader);

    if (playerAct && playerAct !== me.act) {
      Town.goToTown(playerAct);
      Town.move("portalspot");
      return true;
    }
    return false;
  }

  addEventListener("chatmsg", chatEvent, this);
  Town.doChores();
  Town.move("portalspot");

  if (Config.Leader) {
    if (!Misc.poll(() => Misc.inMyParty(Config.Leader), 5e3, 1000)) {
      // throw new Error("MFHelper: Leader not partied");
      // print("Leader not found.");
      // quit();
      return false;
    }

    Misc.poll(
      () => {
        player = Misc.findPlayer(Config.Leader);
        return player;
      },
      1000,
      100
    );
  }

  if (player) {
    if (!Misc.poll(() => player.area, 10e3, 100 + me.ping)) {
      throw new Error("Failed to wait for player area");
    }
    checkAct();
  } else {
    throw new Error("Failed to found the leader");
  }

  // START
  while (player) {
    if (me.softcore && me.mode === sdk.player.mode.Dead) {
      while (!me.inTown) {
        me.revive();
        delay(1000);
      }

      Town.move("portalspot");
      print("revived!");
    }

    me.inTown && Town.heal() && me.cancelUIFlags();
    Town.move("portalspot");

    // Finish MFHelper script if leader is running Diablo or Baal
    // if load MFHelper again, maybe check break and exit MFHelper.js, recommend set Config.BaalHelper.Town=true for delay
    if (
      [
        sdk.areas.ChaosSanctuary,
        sdk.areas.ThroneofDestruction,
        sdk.areas.WorldstoneChamber,
      ].includes(player.area)
    ) {
      break;
    }

    if (command !== oldCommand) {
      oldCommand = command;

      if (command.includes("quit")) {
        break;
      } else if (command.includes("goto")) {
        print("\xFFc4MFHelper\xFFc0: Goto");
        split = command.substring(6);

        try {
          if (!!parseInt(split, 10)) {
            split = parseInt(split, 10);
          }

          Town.goToTown(split, true);
          Town.move("portalspot");
        } catch (townerror) {
          print(townerror);
        }

        // delay(500 + me.ping);
      } else if (command.includes("nextup")) {
        split = command.split("nextup ")[1];

        if (split && ["Diablo", "Baal"].includes(split)) {
          break;
        }

        // delay(500 + me.ping);
      } else if (command.includes("cows")) {
        print("\xFFc4MFHelper\xFFc0: Clear Cows");

        for (let i = 0; i < 5; i += 1) {
          if (Town.goToTown(1) && Pather.usePortal(sdk.areas.MooMooFarm)) {
            break;
          }

          delay(500 + me.ping);
        }

        if (me.inArea(sdk.areas.MooMooFarm)) {
          Precast.doPrecast(false);
          Common.Cows.clearCowLevel();
          delay(500);

          if (
            !Pather.getPortal(null, player.name) ||
            !Pather.usePortal(null, player.name)
          ) {
            Town.goToTown();
          }
        } else {
          print("Failed to use portal.");
        }
      } else if (
        ["kill", "clearlevel", "clear", "council"].some((c) =>
          command.includes(c)
        )
      ) {
        // fixed the player.area bug iomars
        setting.area = sdk.areas.None;
        switch (true) {
          case command.includes("kill"):
            split = command.split("kill ")[1];
            setting.mode = 0;
            setting.classid = split.split("@")[0];
            setting.area = parseInt(split.split("@")[1], 10);

            break;
          case command.includes("clearlevel"):
            split = command.split("clearlevel ")[1];
            setting.mode = 1;
            setting.area = !!parseInt(split, 10)
              ? parseInt(split, 10)
              : Pather.getAreaId(split);
            setting.classid = undefined;

            break;
          case command.includes("clear"):
            split = command.split("clear ")[1];
            setting.mode = 2;
            setting.classid = split.split("@")[0];
            setting.area = parseInt(split.split("@")[1], 10);

            break;
          case command.includes("council"):
            setting.mode = 3;
            setting.area = sdk.areas.Travincal;
            setting.classid = undefined;

            break;
        }

        if (!!parseInt(setting.classid, 10)) {
          setting.classid = parseInt(setting.classid, 10);
        }

        if (setting.area) {
          for (let i = 0; i < 5; i += 1) {
            if (Pather.usePortal(setting.area, player.name)) {
              break;
            }
            delay(500 + me.ping);
          }
        }
        // if (!me.inTown && me.area === player.area) {
        if (!me.inTown) {
          Precast.doPrecast(true);

          switch (setting.mode) {
            case 0:
              // print("\xFFc4MFHelper\xFFc0: Kill");

              try {
                Attack.kill(setting.classid);
                Pickit.pickItems();
              } catch (killerror) {
                print(killerror);
              }

              break;

            case 1:
              // print("\xFFc4MFHelper\xFFc0: Clear Level " + getArea().name);
              Precast.doPrecast(true);
              Attack.clearLevel(Config.ClearType);
              break;

            case 2:
              // print("\xFFc4MFHelper\xFFc0: Clear");

              try {
                Attack.clear(15, 0, setting.classid);
              } catch (killerror2) {
                print(killerror2);
              }
              break;

            case 3:
              // print("\xFFc4MFHelper\xFFc0: Kill Council");
              Attack.clearList(
                Attack.getMob(
                  [
                    sdk.monsters.Council1,
                    sdk.monsters.Council2,
                    sdk.monsters.Council3,
                  ],
                  0,
                  40
                )
              );
              break;
          }

          delay(100);

          if (
            !Pather.getPortal(null, player.name) ||
            !Pather.usePortal(null, player.name)
          ) {
            Town.goToTown();
            Town.doChores();
          }
        }
      }
    }

    //check act again
    checkAct();

    // check again
    Misc.poll(
      () => {
        player = Misc.findPlayer(Config.Leader);
        return player;
      },
      1000,
      100
    );

    delay(100);
  }

  removeEventListener("chatmsg", chatEvent);

  return true;
};
