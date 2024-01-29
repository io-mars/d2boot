import { delay, me, getInteractedNPC, transmute } from "boot";
import { sdk } from "../modules/sdk.js";
import { Config } from "../common/Config.js";
import { Precast } from "../common/Precast.js";
import { Town } from "../common/Town.js";
import { Pather } from "../common/Pather.js";
import { Attack } from "../common/Attack.js";
import { Pickit } from "../common/Pickit.js";
import { Common } from "../common/Common.js";
import { Misc, Game, Time } from "../common/Misc.js";
import { Storage } from "../common/Storage.js";
import { Cubing } from "../common/Cubing.js";

export const Cows = function () {
  this.getLeg = function () {
    if (me.wirtsleg) return me.wirtsleg;

    Pather.useWaypoint(sdk.areas.StonyField);
    Precast.doPrecast(true);
    Pather.moveToPreset(
      me.area,
      sdk.unittype.Monster,
      sdk.monsters.preset.Rakanishu,
      8,
      8
    );

    if (
      !Misc.poll(
        () => {
          let p = Pather.getPortal(sdk.areas.Tristram);
          return p && Pather.usePortal(sdk.areas.Tristram, null, p);
        },
        Time.minutes(1),
        1000
      )
    ) {
      throw new Error("Tristram portal not found");
    }

    Pather.moveTo(25048, 5177);

    let wirt = Game.getObject(sdk.quest.chest.Wirt);

    for (let i = 0; i < 8; i += 1) {
      wirt.interact();
      delay(500);

      let leg = Game.getItem(sdk.quest.item.WirtsLeg);

      if (leg) {
        let gid = leg.gid;

        Pickit.pickItem(leg);
        Town.goToTown();

        return me.getItem(-1, -1, gid);
      }
    }

    throw new Error("Failed to get the leg");
  };

  this.getTome = function () {
    let tpTome = me.findItems(
      sdk.items.TomeofTownPortal,
      sdk.items.mode.inStorage,
      sdk.storage.Inventory
    );

    if (tpTome.length < 2) {
      let npc = Town.initNPC("Shop", "buyTpTome");

      if (!getInteractedNPC()) {
        throw new Error("Failed to find npc");
      }

      let tome = npc.getItem(sdk.items.TomeofTownPortal);

      if (
        !!tome &&
        tome.getItemCost(sdk.items.cost.ToBuy) < me.gold &&
        tome.buy()
      ) {
        delay(500);
        tpTome = me.findItems(
          sdk.items.TomeofTownPortal,
          sdk.items.mode.inStorage,
          sdk.storage.Inventory
        );
        tpTome.forEach(function (book) {
          if (book.isInInventory) {
            let scroll = npc.getItem(sdk.items.ScrollofTownPortal);
            while (book.getStat(sdk.stats.Quantity) < 20) {
              if (
                !!scroll &&
                scroll.getItemCost(sdk.items.cost.ToBuy) < me.gold
              ) {
                scroll.buy(true);
              } else {
                break;
              }

              delay(20);
            }
          }
        });
      } else {
        throw new Error("Failed to buy tome");
      }
    }

    return tpTome.last();
  };

  this.openPortal = function (leg, tome) {
    if (!Town.openStash()) throw new Error("Failed to open stash");
    if (!Cubing.emptyCube()) throw new Error("Failed to empty cube");
    if (
      !Storage.Cube.MoveTo(leg) ||
      !Storage.Cube.MoveTo(tome) ||
      !Cubing.openCube()
    ) {
      throw new Error("Failed to cube leg and tome");
    }

    transmute();
    delay(1000);
    me.cancelUIFlags();

    for (let i = 0; i < 10; i += 1) {
      if (Pather.getPortal(sdk.areas.MooMooFarm)) {
        return true;
      }

      delay(200);
    }

    throw new Error("Portal not found");
  };

  // we can begin now
  try {
    if (!me.diffCompleted) throw new Error("Final quest incomplete.");

    Town.goToTown(1);
    Town.doChores();
    Town.move("stash");

    // Check to see if portal is already open, if not get the ingredients
    if (!Pather.getPortal(sdk.areas.MooMooFarm)) {
      if (Config.Cows.DontMakePortal) throw new Error("NOT PORTAL MAKER");
      if (!me.tristram) throw new Error("Cain quest incomplete");
      if (me.cows) throw new Error("Already killed the Cow King.");

      let leg = this.getLeg();
      let tome = this.getTome();
      this.openPortal(leg, tome);
    }
  } catch (e) {
    typeof e === "object" &&
      e.message &&
      e.message !== "NOT PORTAL MAKER" &&
      console.error(e);

    if (Misc.getPlayerCount() > 1) {
      Town.goToTown(1);
      Town.move("stash");
      console.log(
        "\xFFc9(Cows) :: \xFFc0Waiting 1 minute to see if anyone else opens the cow portal"
      );

      if (
        !Misc.poll(
          () => Pather.getPortal(sdk.areas.MooMooFarm),
          Time.minutes(3),
          2000
        )
      )
        throw new Error("No cow portal");
    } else {
      return false;
    }
  }

  if (Config.Cows.JustMakePortal) {
    if (Pather.getPortal(sdk.areas.MooMooFarm)) {
      return true;
    } else {
      throw new Error("I failed to make cow portal");
    }
  }

  Pather.usePortal(sdk.areas.MooMooFarm);
  Precast.doPrecast(false);
  Config.Cows.KillKing ? Attack.clearLevel() : Common.Cows.clearCowLevel();

  return true;
};
