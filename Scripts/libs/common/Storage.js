import { copyUnit, delay, getTickCount, me, print, sendPacket } from "boot";

import { sdk } from "../modules/sdk.js";
import { Town } from "./Town.js";
import { Misc, Game } from "./Misc.js";

const Container = function (name, width, height, location) {
  let h, w;

  this.name = name;
  this.width = width;
  this.height = height;
  this.location = location;
  this.buffer = [];
  this.itemList = [];
  this.openPositions = this.height * this.width;

  // Initalize the buffer array for use, set all as empty.
  for (h = 0; h < this.height; h += 1) {
    this.buffer.push([]);

    for (w = 0; w < this.width; w += 1) {
      this.buffer[h][w] = 0;
    }
  }

  /* Container.Mark(item)
   *	Marks the item in the buffer, and adds it to the item list.
   */
  this.Mark = function (item) {
    let x, y;

    //Make sure it is in this container.
    if (
      item.location !== this.location ||
      (item.mode !== 0 && item.mode !== 2)
    ) {
      return false;
    }

    //Mark item in buffer.
    for (x = item.x; x < item.x + item.sizex; x += 1) {
      for (y = item.y; y < item.y + item.sizey; y += 1) {
        this.buffer[y][x] = this.itemList.length + 1;
        this.openPositions -= 1;
      }
    }

    //Add item to list.
    this.itemList.push(copyUnit(item));

    return true;
  };

  /* Container.isLocked(item)
   *	Checks if the item is in a locked spot
   */
  this.IsLocked = function (item, baseRef) {
    let h, w, reference;

    reference = baseRef.slice(0);

    //Make sure it is in this container.
    if (item.mode !== 0 || item.location !== this.location) {
      return false;
    }

    // Make sure the item is ours
    if (
      !item.getParent() ||
      item.getParent().type !== me.type ||
      item.getParent().gid !== me.gid
    ) {
      return false;
    }

    //Insure valid reference.
    if (
      typeof reference !== "object" ||
      reference.length !== this.buffer.length ||
      reference[0].length !== this.buffer[0].length
    ) {
      throw new Error("Storage.IsLocked: Invalid inventory reference");
    }

    try {
      // Check if the item lies in a locked spot.
      for (h = item.y; h < item.y + item.sizey; h += 1) {
        for (w = item.x; w < item.x + item.sizex; w += 1) {
          if (reference[h][w] === 0) {
            return true;
          }
        }
      }
    } catch (e2) {
      throw new Error(
        "Storage.IsLocked error! Item info: " +
          item.name +
          " " +
          item.y +
          " " +
          item.sizey +
          " " +
          item.x +
          " " +
          item.sizex +
          " " +
          item.mode +
          " " +
          item.location
      );
    }

    return false;
  };

  this.Reset = function () {
    let h, w;

    for (h = 0; h < this.height; h += 1) {
      for (w = 0; w < this.width; w += 1) {
        this.buffer[h][w] = 0;
      }
    }

    this.itemList = [];
    this.openPositions = this.height * this.width;
    return true;
  };

  /* Container.CanFit(item)
   *	Checks to see if we can fit the item in the buffer.
   */
  this.CanFit = function (item) {
    return !!this.FindSpot(item);
  };

  /* Container.FindSpot(item)
   *	Finds a spot available in the buffer to place the item.
   */
  this.FindSpot = function (item) {
    let x, y, nx, ny, sx, sy;

    // iomars fixed sizex or sizey maybe false when loop
    //Make sure it's a valid item
    if (!item || !item.sizex || !item.sizey) {
      return false;
    }

    sx = item.sizex;
    sy = item.sizey;
    let debugMsg = `name:${item.name} sizex:${sx} sizey:${sy}`;

    Storage.Reload();

    //Loop buffer looking for spot to place item.
    for (y = 0; y < this.width - (sx - 1); y += 1) {
      Loop: for (x = 0; x < this.height - (sy - 1); x += 1) {
        try {
          //Check if there is something in this spot.
          if (this.buffer[x][y] > 0) {
            continue;
          }
        } catch (error) {
          // for BUG MTODO
        }

        //Loop the item size to make sure we can fit it.
        for (nx = 0; nx < sy; nx += 1) {
          for (ny = 0; ny < sx; ny += 1) {
            if (this.buffer[x + nx][y + ny]) {
              continue Loop;
            }
          }
        }

        return { x: x, y: y };
      }
    }

    return false;
  };

  /* Container.MoveTo(item)
   *	Takes any item and moves it into given buffer.
   */
  this.MoveTo = function (item) {
    let nPos, n, nDelay, cItem, cube;

    try {
      //Can we even fit it in here?
      nPos = this.FindSpot(item);

      if (!nPos) {
        return false;
      }

      //Cube -> Stash, must place item in inventory first
      if (
        item.location === sdk.storage.Cube &&
        this.location === sdk.storage.Stash &&
        !Storage.Inventory.MoveTo(item)
      ) {
        return false;
      }

      //Can't deal with items on ground!
      if (item.mode === sdk.items.mode.onGround) {
        return false;
      }

      //Item already on the cursor.
      if (me.itemoncursor && item.mode !== 4) {
        return false;
      }

      //Make sure stash is open
      if (this.location === sdk.storage.Stash && !Town.openStash()) {
        return false;
      }

      //Pick to cursor if not already.
      if (!item.toCursor()) {
        return false;
      }

      //Loop three times to try and place it.
      for (n = 0; n < 5; n += 1) {
        if (this.location === sdk.storage.Cube) {
          // place item into cube
          cItem = Game.getCursorUnit();
          cube = me.getItem(sdk.quest.item.Cube);

          if (cItem !== null && cube !== null) {
            sendPacket(
              1,
              sdk.packets.send.ItemToCube,
              4,
              cItem.gid,
              4,
              cube.gid
            );
          }
        } else if (this.location === sdk.storage.Belt) {
          cItem = Game.getCursorUnit();
          if (cItem !== null) {
            sendPacket(1, sdk.packets.send.ItemToBelt, 4, cItem.gid, 4, nPos.y);
          }
        } else {
          Game.clickItemAndWait(
            sdk.clicktypes.click.Left,
            nPos.y,
            nPos.x,
            this.location
          );
        }

        nDelay = getTickCount();

        while (getTickCount() - nDelay < Math.max(1000, me.ping * 3 + 500)) {
          if (!me.itemoncursor) {
            print(
              "Successfully placed " +
                item.name +
                "\xFFc0 at X: " +
                nPos.x +
                " Y: " +
                nPos.y
            );
            delay(200);

            return true;
          }

          delay(10);
        }
      }

      return true;
    } catch (e) {
      //iomars
      console.error(e);
      return false;
    }
  };

  /* Container.Dump()
   *	Prints all known information about container.
   */
  this.Dump = function () {
    let x, y, string;

    print(
      this.name +
        " has the width of " +
        this.width +
        " and the height of " +
        this.height
    );
    print(
      this.name +
        " has " +
        this.itemList.length +
        " items inside, and has " +
        this.openPositions +
        " spots left."
    );

    for (x = 0; x < this.height; x += 1) {
      string = "";

      for (y = 0; y < this.width; y += 1) {
        string += this.buffer[x][y] > 0 ? "\xFFc1x" : "\xFFc0o";
      }

      print(string);
    }
  };

  /* Container.UsedSpacePercent()
   *	Returns percentage of the container used.
   */
  this.UsedSpacePercent = function () {
    let x,
      y,
      usedSpace = 0,
      totalSpace = this.height * this.width;

    Storage.Reload();

    for (x = 0; x < this.height; x += 1) {
      for (y = 0; y < this.width; y += 1) {
        if (this.buffer[x][y] > 0) {
          usedSpace += 1;
        }
      }
    }

    return (usedSpace * 100) / totalSpace;
  };

  /* Container.compare(reference)
   *	Compare given container versus the current one, return all new items in current buffer.
   */
  this.Compare = function (baseRef) {
    let h, w, n, item, itemList, reference;

    Storage.Reload();

    try {
      itemList = [];
      reference = baseRef.slice(0, baseRef.length);

      //Insure valid reference.
      if (
        typeof reference !== "object" ||
        reference.length !== this.buffer.length ||
        reference[0].length !== this.buffer[0].length
      ) {
        throw new Error("Unable to compare different containers.");
      }

      for (h = 0; h < this.height; h += 1) {
        Loop: for (w = 0; w < this.width; w += 1) {
          item = this.itemList[this.buffer[h][w] - 1];

          if (!item) {
            continue;
          }

          for (n = 0; n < itemList.length; n += 1) {
            if (itemList[n].gid === item.gid) {
              continue Loop;
            }
          }

          //Check if the buffers changed and the current buffer has an item there.
          if (this.buffer[h][w] > 0 && reference[h][w] > 0) {
            itemList.push(copyUnit(item));
          }
        }
      }

      return itemList;
    } catch (e) {
      return false;
    }
  };

  this.toSource = function () {
    return this.buffer.toSource();
  };
};

export const Storage = {
  StashX: undefined,
  StashY: undefined,
  Inventory: undefined,
  TradeScreen: undefined,
  Stash: undefined,
  Belt: undefined,
  Cube: undefined,
  InvRef: undefined,

  init() {
    this.StashX = me.gametype === 0 ? 6 : 10;
    this.StashY = me.gametype === 0 ? 4 : 10;
    this.Inventory = new Container("Inventory", 10, 4, 3);
    this.TradeScreen = new Container("Inventory", 10, 4, 5);
    this.Stash = new Container("Stash", this.StashX, this.StashY, 7);
    this.Belt = new Container("Belt", 4 * this.BeltSize(), 1, 2);
    this.Cube = new Container("Horadric Cube", 3, 4, 6);
    this.InvRef = [];

    this.Reload();
  },

  BeltSize() {
    let item = me.getItem(-1, sdk.items.mode.Equipped); // get equipped item

    if (!item) {
      // nothing equipped
      return 1;
    }

    do {
      if (item.bodylocation === 8) {
        // belt slot
        switch (item.code) {
          case "lbl": // sash
          case "vbl": // light belt
            return 2;
          case "mbl": // belt
          case "tbl": // heavy belt
            return 3;
          default: // everything else
            return 4;
        }
      }
    } while (item.getNext());

    return 1; // no belt
  },

  Reload() {
    this.Inventory.Reset();
    this.Stash.Reset();
    this.Belt.Reset();
    this.Cube.Reset();
    this.TradeScreen.Reset();

    let item = me.getItem();

    if (!item) {
      return false;
    }

    do {
      switch (item.location) {
        case 3:
          this.Inventory.Mark(item);

          break;
        case 5:
          this.TradeScreen.Mark(item);

          break;
        case 2:
          this.Belt.Mark(item);

          break;
        case 6:
          this.Cube.Mark(item);

          break;
        case 7:
          this.Stash.Mark(item);

          break;
      }
    } while (item.getNext());

    return true;
  },
};
