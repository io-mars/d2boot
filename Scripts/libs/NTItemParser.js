/**
 *  @Item-parser Syntax Information
 *    1. [Keyword] separates into two groups
 *      - [Property Keywords] : [Type], [Name], [Class], [Quality], [Flag], [Level], [Prefix], [Suffix]
 *      - [Stat Keywords] : [Number or Alias]
 *    2. [Keyword] must be surrounded by '[' and ']'
 *    3. [Property Keywords] must be placed first
 *    4. Insert '#' symbol between [Property Keywords] and [Stat Keywords]
 *    5. Use '+', '-', '*', '/', '(', ')', '&&', '||', '>', '>=', '<', '<=', '==', '!=' symbols for comparison
 *    6. Use '//' symbol for comment
 *
 *   @Example: [name] == ring && [quality] == unique # [dexterity] == 20 && [tohit] == 250 // Perfect Raven Frost
 *
 */
import { FileTools, getTickCount, showConsole, print, me } from "boot";
import { sdk } from "./modules/sdk.js";
import {
  NTIPAliasType,
  NTIPAliasColor,
  NTIPAliasClassID,
  NTIPAliasClass,
  NTIPAliasQuality,
  NTIPAliasFlag,
  NTIPAliasStat,
} from "./NTItemAlias.js";
import { Misc } from "./common/Misc.js";

export const NTIP = {
  CheckList: [],
  CheckListNoTier: [],
  stringArray: [],

  OpenFile(filepath, notify) {
    if (!FileTools.exists(filepath)) {
      if (notify) {
        Misc.errorReport("\xFFc1NIP file doesn't exist: \xFFc0" + filepath);
      }
      return false;
    }

    let lines;
    let tick = getTickCount();
    let filename = filepath.substring(
      filepath.lastIndexOf("/") + 1,
      filepath.length
    );
    let entries = 0;

    try {
      lines = FileTools.readAllLines(filepath);
    } catch (fileError) {
      if (notify) {
        Misc.errorReport("\xFFc1Failed to load NIP: \xFFc0" + filename);
      }
    }

    for (let i = 0; i < lines.length; i += 1) {
      let info = {
        line: i + 1,
        file: filename,
        string: lines[i],
      };

      let line = NTIP.ParseLineInt(lines[i], info);

      if (line) {
        entries += 1;

        this.CheckList.push(line);

        if (!lines[i].toLowerCase().match("tier")) {
          this.CheckListNoTier.push(line);
        }

        this.stringArray.push(info);
      }
    }

    if (notify) {
      print(
        "\xFFc4Loaded NIP: \xFFc2" +
          filename +
          "\xFFc4. Lines: \xFFc2" +
          lines.length +
          "\xFFc4. Valid entries: \xFFc2" +
          entries +
          ". \xFFc4Time: \xFFc2" +
          (getTickCount() - tick) +
          " ms"
      );
    }

    return true;
  },

  CheckQuantityOwned(item_type, item_stats) {
    let item;
    let num = 0;
    let items = me.getItemsEx();

    if (!items.length) {
      print("I can't find my items!");

      return 0;
    }

    for (let i = 0; i < items.length; i += 1) {
      if (
        items[i].mode === sdk.items.mode.inStorage &&
        items[i].location === sdk.storage.Stash
      ) {
        item = items[i];

        if (
          (item_type !== null &&
            typeof item_type === "function" &&
            item_type(item)) ||
          item_type === null
        ) {
          if (
            (item_stats !== null &&
              typeof item_stats === "function" &&
              item_stats(item)) ||
            item_stats === null
          ) {
            num += 1;
          }
        }
      } else if (
        items[i].mode === sdk.items.mode.inStorage &&
        items[i].location === sdk.storage.Inventory
      ) {
        // inv check
        item = items[i];

        if (
          (item_type !== null &&
            typeof item_type === "function" &&
            item_type(item)) ||
          item_type === null
        ) {
          if (
            (item_stats !== null &&
              typeof item_stats === "function" &&
              item_stats(item)) ||
            item_stats === null
          ) {
            //if (Config.Inventory[items[i].y][items[i].x] > 0) { // we check only space that is supposed to be free
            num += 1;
            //}
          }
        }
      }
    }

    //print("I have "+num+" of these.");

    return num;
  },

  Clear() {
    this.CheckList.length = 0;
    this.CheckListNoTier.length = 0;
    this.stringArray = [];
  },

  /** @return {function({Unit} item)} */
  generateTierFunc(tierType) {
    return function (item) {
      let tier = -1;

      const updateTier = (wanted) => {
        const tmpTier = wanted[tierType](item);

        if (tier < tmpTier) {
          tier = tmpTier;
        }
      };

      // Go through ALL lines that describe the item
      for (let i = 0; i < this.CheckList.length; i += 1) {
        if (this.CheckList[i].length !== 3) {
          continue;
        }

        let [type, stat, wanted] = this.CheckList[i];

        // If the line doesnt have a tier of this type, we dont need to call it
        if (
          typeof wanted === "object" &&
          wanted &&
          typeof wanted[tierType] === "function"
        ) {
          try {
            if (typeof type === "function") {
              if (type(item)) {
                if (typeof stat === "function") {
                  if (stat(item)) {
                    updateTier(wanted);
                  }
                } else {
                  updateTier(wanted);
                }
              }
            } else if (typeof stat === "function") {
              if (stat(item)) {
                updateTier(wanted);
              }
            }
          } catch (e) {
            const info = this.stringArray[i];
            Misc.errorReport(
              "\xFFc1Pickit Tier (" +
                tierType +
                ") error! Line # \xFFc2" +
                info.line +
                " \xFFc1Entry: \xFFc0" +
                info.string +
                " (" +
                info.file +
                ") Error message: " +
                e.message
            );
          }
        }
      }

      return tier;
    };
  },

  /**@function
   * @param item */
  // GetTier: generateTierFunc("Tier"),
  GetTier() {
    return NTIP.generateTierFunc("Tier");
  },

  /**@function
   * @param item */
  GetMercTier() {
    return NTIP.generateTierFunc("Merctier");
  },

  CheckItem(item, entryList, verbose) {
    let i, num;
    let rval = {};
    let result = 0;

    let list = entryList ? entryList : this.CheckList;
    let identified = item.getFlag(sdk.items.flags.Identified);

    for (i = 0; i < list.length; i++) {
      try {
        // Get the values in separated variables (its faster)
        const [type, stat, wanted] = list[i];

        if (typeof type === "function") {
          if (type(item)) {
            if (typeof stat === "function") {
              if (stat(item)) {
                if (
                  wanted &&
                  wanted.MaxQuantity &&
                  !isNaN(wanted.MaxQuantity)
                ) {
                  num = NTIP.CheckQuantityOwned(type, stat);

                  if (num < wanted.MaxQuantity) {
                    result = 1;

                    break;
                  } else {
                    // attempt at inv fix for maxquantity
                    if (
                      item.getParent() &&
                      item.getParent().name === me.name &&
                      item.isInStorage &&
                      num === wanted.MaxQuantity
                    ) {
                      result = 1;

                      break;
                    }
                  }
                } else {
                  result = 1;

                  break;
                }
              } else if (!identified && result === 0) {
                result = -1;
                verbose &&
                  (rval.line =
                    this.stringArray[i].file + " #" + this.stringArray[i].line);
              }
            } else {
              if (wanted && wanted.MaxQuantity && !isNaN(wanted.MaxQuantity)) {
                num = NTIP.CheckQuantityOwned(type, null);

                if (num < wanted.MaxQuantity) {
                  result = 1;

                  break;
                } else {
                  // attempt at inv fix for maxquantity
                  if (
                    item.getParent() &&
                    item.getParent().name === me.name &&
                    item.isInStorage &&
                    num === wanted.MaxQuantity
                  ) {
                    result = 1;

                    break;
                  }
                }
              } else {
                result = 1;

                break;
              }
            }
          }
        } else if (typeof stat === "function") {
          if (stat(item)) {
            if (wanted && wanted.MaxQuantity && !isNaN(wanted.MaxQuantity)) {
              num = NTIP.CheckQuantityOwned(null, stat);

              if (num < wanted.MaxQuantity) {
                result = 1;

                break;
              } else {
                // attempt at inv fix for maxquantity
                if (
                  item.getParent() &&
                  item.getParent().name === me.name &&
                  item.isInStorage &&
                  num === wanted.MaxQuantity
                ) {
                  result = 1;

                  break;
                }
              }
            } else {
              result = 1;

              break;
            }
          } else if (!identified && result === 0) {
            result = -1;
            verbose &&
              (rval.line =
                this.stringArray[i].file + " #" + this.stringArray[i].line);
          }
        }
      } catch (pickError) {
        showConsole();

        if (!entryList) {
          Misc.errorReport(
            "\xFFc1Pickit error! Line # \xFFc2" +
              this.stringArray[i].line +
              " \xFFc1Entry: \xFFc0" +
              this.stringArray[i].string +
              " (" +
              this.stringArray[i].file +
              ") Error message: " +
              pickError.message +
              " Trigger item: " +
              item.fname.split("\n").reverse().join(" ")
          );

          this.CheckList.splice(i, 1); // Remove the element from the list
        } else {
          Misc.errorReport("\xFFc1Pickit error in runeword config!");
        }

        result = 0;
      }
    }

    if (verbose) {
      switch (result) {
        case -1:
          break;
        case 1:
          rval.line =
            this.stringArray[i].file + " #" + this.stringArray[i].line;

          break;
        default:
          rval.line = null;

          break;
      }

      rval.result = result;

      return rval;
    }

    return result;
  },

  IsSyntaxInt(ch) {
    return (
      ch === "!" ||
      ch === "%" ||
      ch === "&" ||
      (ch >= "(" && ch <= "+") ||
      ch === "-" ||
      ch === "/" ||
      (ch >= ":" && ch <= "?") ||
      ch === "|"
    );
  },

  ParseLineInt(input, info) {
    let i, property, p_start, p_end, p_section, p_keyword, p_result, value;

    p_end = input.indexOf("//");

    if (p_end !== -1) {
      input = input.substring(0, p_end);
    }

    input = input.replace(/\s+/g, "").toLowerCase();

    if (input.length < 5) {
      return null;
    }

    p_result = input.split("#");

    if (p_result[0] && p_result[0].length > 4) {
      p_section = p_result[0].split("[");

      p_result[0] = p_section[0];

      for (i = 1; i < p_section.length; i += 1) {
        p_end = p_section[i].indexOf("]") + 1;
        property = p_section[i].substring(0, p_end - 1);

        switch (property) {
          case "color":
            p_result[0] += "item.getColor()";

            break;
          case "type":
            p_result[0] += "item.itemType";

            break;
          case "name":
            p_result[0] += "item.classid";

            break;
          case "class":
            p_result[0] += "item.itemclass";

            break;
          case "quality":
            p_result[0] += "item.quality";

            break;
          case "flag":
            if (p_section[i][p_end] === "!") {
              p_result[0] += "!item.getFlag(";
            } else {
              p_result[0] += "item.getFlag(";
            }

            p_end += 2;

            break;
          case "level":
            p_result[0] += "item.ilvl";

            break;
          case "prefix":
            if (p_section[i][p_end] === "!") {
              p_result[0] += "!item.getPrefix(";
            } else {
              p_result[0] += "item.getPrefix(";
            }

            p_end += 2;

            break;
          case "suffix":
            if (p_section[i][p_end] === "!") {
              p_result[0] += "!item.getSuffix(";
            } else {
              p_result[0] += "item.getSuffix(";
            }

            p_end += 2;

            break;
          case "europe":
          case "uswest":
          case "useast":
          case "asia":
            p_result[0] +=
              '("' +
              me.realm.toLowerCase() +
              '"==="' +
              property.toLowerCase() +
              '")';

            break;
          case "ladder":
            p_result[0] += "me.ladder";

            break;
          case "hardcore":
            p_result[0] += "(!!me.playertype)";

            break;
          case "classic":
            p_result[0] += "(!me.gametype)";

            break;
          default:
            Misc.errorReport(
              "Unknown property: " +
                property +
                " File: " +
                info.file +
                " Line: " +
                info.line
            );

            return false;
        }

        for (p_start = p_end; p_end < p_section[i].length; p_end += 1) {
          if (!NTIP.IsSyntaxInt(p_section[i][p_end])) {
            break;
          }
        }

        p_result[0] += p_section[i].substring(p_start, p_end);

        if (p_section[i].substring(p_start, p_end) === "=") {
          Misc.errorReport(
            "Unexpected = at line " + info.line + " in " + info.file
          );

          return false;
        }

        for (p_start = p_end; p_end < p_section[i].length; p_end += 1) {
          if (NTIP.IsSyntaxInt(p_section[i][p_end])) {
            break;
          }
        }

        p_keyword = p_section[i].substring(p_start, p_end);

        if (isNaN(p_keyword)) {
          switch (property) {
            case "color":
              if (NTIPAliasColor[p_keyword] === undefined) {
                Misc.errorReport(
                  "Unknown color: " +
                    p_keyword +
                    " File: " +
                    info.file +
                    " Line: " +
                    info.line
                );

                return false;
              }

              p_result[0] += NTIPAliasColor[p_keyword];

              break;
            case "type":
              if (NTIPAliasType[p_keyword] === undefined) {
                Misc.errorReport(
                  "Unknown type: " +
                    p_keyword +
                    " File: " +
                    info.file +
                    " Line: " +
                    info.line
                );

                return false;
              }

              p_result[0] += NTIPAliasType[p_keyword];

              break;
            case "name":
              if (NTIPAliasClassID[p_keyword] === undefined) {
                Misc.errorReport(
                  "Unknown name: " +
                    p_keyword +
                    " File: " +
                    info.file +
                    " Line: " +
                    info.line
                );

                return false;
              }

              p_result[0] += NTIPAliasClassID[p_keyword];

              break;
            case "class":
              if (NTIPAliasClass[p_keyword] === undefined) {
                Misc.errorReport(
                  "Unknown class: " +
                    p_keyword +
                    " File: " +
                    info.file +
                    " Line: " +
                    info.line
                );

                return false;
              }

              p_result[0] += NTIPAliasClass[p_keyword];

              break;
            case "quality":
              if (NTIPAliasQuality[p_keyword] === undefined) {
                Misc.errorReport(
                  "Unknown quality: " +
                    p_keyword +
                    " File: " +
                    info.file +
                    " Line: " +
                    info.line
                );

                return false;
              }

              p_result[0] += NTIPAliasQuality[p_keyword];

              break;
            case "flag":
              if (NTIPAliasFlag[p_keyword] === undefined) {
                Misc.errorReport(
                  "Unknown flag: " +
                    p_keyword +
                    " File: " +
                    info.file +
                    " Line: " +
                    info.line
                );

                return false;
              }

              p_result[0] += NTIPAliasFlag[p_keyword] + ")";

              break;
            case "prefix":
            case "suffix":
              p_result[0] += '"' + p_keyword + '")';

              break;
          }
        } else {
          if (
            property === "flag" ||
            property === "prefix" ||
            property === "suffix"
          ) {
            p_result[0] += p_keyword + ")";
          } else {
            p_result[0] += p_keyword;
          }
        }

        p_result[0] += p_section[i].substring(p_end);
      }
    } else {
      p_result[0] = "";
    }

    if (p_result[1] && p_result[1].length > 4) {
      p_section = p_result[1].split("[");
      p_result[1] = p_section[0];

      for (i = 1; i < p_section.length; i += 1) {
        p_end = p_section[i].indexOf("]");
        p_keyword = p_section[i].substring(0, p_end);

        if (isNaN(p_keyword)) {
          if (NTIPAliasStat[p_keyword] === undefined) {
            Misc.errorReport(
              "Unknown stat: " +
                p_keyword +
                " File: " +
                info.file +
                " Line: " +
                info.line
            );

            return false;
          }

          p_result[1] += "item.getStatEx(" + NTIPAliasStat[p_keyword] + ")";
        } else {
          p_result[1] += "item.getStatEx(" + p_keyword + ")";
        }

        p_result[1] += p_section[i].substring(p_end + 1);
      }
    } else {
      p_result[1] = "";
    }

    if (p_result[2] && p_result[2].length > 0) {
      p_section = p_result[2].split("[");
      p_result[2] = {};

      for (i = 1; i < p_section.length; i += 1) {
        p_end = p_section[i].indexOf("]");
        p_keyword = p_section[i].substring(0, p_end);

        let keyword = p_keyword.toLowerCase();
        switch (keyword) {
          case "maxquantity":
            value = Number(p_section[i].split("==")[1].match(/\d+/g));

            if (!isNaN(value)) {
              p_result[2].MaxQuantity = value;
            }

            break;
          case "merctier":
          case "tier":
            try {
              // p_result[2].Tier = function(item) { return value };
              p_result[2][keyword.charAt(0).toUpperCase() + keyword.slice(1)] =
                new Function(
                  "return function(item) { return " +
                    p_section[i].split("==")[1] +
                    ";}"
                ).call(null); // generate function out of
            } catch (e) {
              Misc.errorReport(
                "\xFFc1Pickit Tier (" +
                  keyword +
                  ") error! Line # \xFFc2" +
                  info.line +
                  " \xFFc1Entry: \xFFc0" +
                  info.string +
                  " (" +
                  info.file +
                  ") Error message: " +
                  e.message
              );
            }
            break;

          default:
            Misc.errorReport(
              "Unknown 3rd part keyword: " +
                p_keyword.toLowerCase() +
                " File: " +
                info.file +
                " Line: " +
                info.line
            );
            return false;
        }
      }
    }
    // Compile the line, to 1) remove the eval lines, and 2) increase the speed
    for (let i = 0; i < 2; i++) {
      if (p_result[i].length) {
        try {
          p_result[i] = new Function(
            "return function(item) { return " + p_result[i] + ";}"
          ).call(null); // generate function out of
        } catch (e) {
          Misc.errorReport(
            "\xFFc1Pickit error! Line # \xFFc2" +
              info.line +
              " \xFFc1Entry: \xFFc0" +
              info.string +
              " (" +
              info.file +
              ") Error message: " +
              e.message
          );

          return null; // failed load this line so return false
        }
      } else {
        p_result[i] = undefined;
      }
    }
    return p_result;
  },
};
