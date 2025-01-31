import { me, print, FileTools } from "boot";
import { CustomConfig, TeamBaseConfig } from "../config/_CustomConfig.js";
import { D2Bot } from "../OOG.js";

export const Scripts = {};

export const Config = {
  async baseInit(notify) {
    let baseConfigNames = [];
    let teamVar = { memberIndex: 0 };

    for (let configer in TeamBaseConfig) {
      TeamBaseConfig[configer].forEach((item) => {
        if (
          item.hasOwnProperty("Prefix") &&
          item.hasOwnProperty("Members") &&
          me.charname.startsWith(item.Prefix) &&
          item.Members.includes(me.charname.slice(item.Prefix.length))
        ) {
          //add the baseConfig file
          baseConfigNames.push(configer);

          //set leader
          if (item.hasOwnProperty("Leader")) {
            //the this is Config in arrow function
            //just like Config.Leader = team.Leader;
            teamVar.Leader = item.Prefix + item.Leader;
          }
          //set quitList
          if (item.hasOwnProperty("QuitList")) {
            if (typeof item.QuitList === "string")
              teamVar.QuitList = item.Prefix + item.QuitList;

            if (item.QuitList instanceof Array) {
              teamVar.QuitList = item.QuitList.map((n) => item.Prefix + n);
            }
          }
          //set AuraHelper
          if (item.hasOwnProperty("AuraHelper")) {
            teamVar.AuraHelper = item.Prefix + item.AuraHelper;
          }
          //set quit timeout
          if (
            item.hasOwnProperty("SetQuitTimeout") &&
            item.SetQuitTimeout === true
          ) {
            teamVar.SetQuitTimeout = true;
            //the last index
            let idx = item.Members.indexOf(
              me.charname.slice(item.Prefix.length)
            );
            teamVar.memberIndex = idx >= 8 ? idx - 8 : idx;
          }
        }
      });
    }
    if (notify && baseConfigNames.length > 0) {
      print(
        "\xFFc4Config: \xFFc0loading base config: \xFFc9" + baseConfigNames
      );
    }

    if (FileTools.exists("libs/config/_Base.ModuleConfig.js")) {
      const configModule = await import("../config/_Base.ModuleConfig.js");
      baseConfigNames.forEach((baseName) => {
        //Load in here now!
        try {
          configModule[baseName]();
        } catch (error) {
          print(`\xFFc8Error in Load: ${baseName}, ${error}`);
        }
      });
    } else {
      notify &&
        print("\xFFc1Confirm the [_Base.ModuleConfig.js] file settings.");
    }

    //set the team's property
    teamVar.Leader && (Config.Leader = teamVar.Leader);
    teamVar.AuraHelper && (Config.Follower.AuraHelper = teamVar.AuraHelper);
    teamVar.QuitList && (Config.QuitList = teamVar.QuitList);
    teamVar.SetQuitTimeout &&
      (Config.QuitTimeout =
        teamVar.memberIndex < 3
          ? 5000 + teamVar.memberIndex * 5 * 1000
          : 10000 + teamVar.memberIndex * 4 * 1000);
  },

  async asyncInit(notify) {
    let configFilename = "";
    let classes = [
      "Amazon",
      "Sorceress",
      "Necromancer",
      "Paladin",
      "Barbarian",
      "Druid",
      "Assassin",
    ];

    for (let i = 0; i < 6; i++) {
      switch (i) {
        case 0: // Custom config
          for (let n in CustomConfig) {
            if (CustomConfig.hasOwnProperty(n)) {
              if (CustomConfig[n].indexOf(me.profile) > -1) {
                notify &&
                  print("\xFFc2Loading custom config: \xFFc9" + n + ".js");
                configFilename = n + ".js";

                break;
              }
            }
          }

          break;
        case 1: // Class.Profile.js
          configFilename = classes[me.classid] + "." + me.profile + ".js";

          break;
        case 2: // Realm.Class.Charname.js
          configFilename =
            me.realm + "." + classes[me.classid] + "." + me.charname + ".js";

          break;
        case 3: // Class.Charname.js
          configFilename = classes[me.classid] + "." + me.charname + ".js";

          break;
        case 4: // Class.[prefix-]Charname.js
          configFilename =
            classes[me.classid] +
            "." +
            me.charname.slice(me.charname.indexOf("-") + 1) +
            ".js";

          break;
        case 5: // Profile.js
          configFilename = me.profile + ".js";

          break;
      }

      if (configFilename && FileTools.exists("libs/config/" + configFilename)) {
        break;
      }
    }

    await this.baseInit(notify);

    if (FileTools.exists("libs/config/" + configFilename)) {
      const { LoadConfig } = await import("../config/" + configFilename);
      LoadConfig();

      notify && print(`\xFFc4Config: \xFFc0loaded \xFFc9${configFilename}`);
    } else {
      if (notify) {
        print(`\xFFc1 ${classes[me.classid]}.${me.charname}.js not found!`); // Use the primary format
        print("\xFFc1Loading default config.");
      }

      // Try to find default config
      if (!FileTools.exists("libs/config/" + classes[me.classid] + ".js")) {
        D2Bot.printToConsole(
          "Not going well? Read the guides: https://github.com/blizzhackers/documentation"
        );
        throw new Error(
          "Default config not found. \n     Try reading the d2boot guides."
        );
      }

      const { LoadConfig } = await import(
        "../config/" + classes[me.classid] + ".js"
      );
      try {
        LoadConfig();
      } catch (error) {
        throw new Error(
          "Config.init: Error in character config:" +
            "config/" +
            classes[me.classid] +
            ".js " +
            error.stack.match(/[^\r\n]+/g)
        );
      }
    }

    if (Config.AfterConfigure) {
      switch (typeof Config.AfterConfigure) {
        case "function":
          try {
            let result = Config.AfterConfigure();
            notify && print(`\xFFc4Config: \xFFc0after configure: ${result}`);
          } catch (error) {
            throw new Error(
              `Config.init: AfterConfigure error! ${error.stack.match(
                /[^\r\n]+/g
              )}`
            );
          }

          break;
        case "object":
          throw new Error(
            `Config.init: AfterConfigure error! object isn't supported!`
          );
          break;
        default:
          break;
      }
    }

    if (Config.Silence && !Config.LocalChat.Enabled) {
      // Override the say function with print, so it just gets printed to console
      globalThis._say = globalThis.say;
      globalThis.say = (what) => print("Tryed to say: " + what);
    }

    Config.Loaded = true;
  },

  // dev
  Loaded: false,
  DebugMode: false,

  // Time
  StartDelay: 0,
  PickDelay: 0,
  AreaDelay: 0,
  MinGameTime: 0,
  MaxGameTime: 0,

  // Healing and chicken
  LifeChicken: 0,
  ManaChicken: 0,
  UseHP: 0,
  UseMP: 0,
  UseRejuvHP: 0,
  UseRejuvMP: 0,
  UseMercHP: 0,
  UseMercRejuv: 0,
  MercChicken: 0,
  IronGolemChicken: 0,
  HealHP: 0,
  HealMP: 0,
  HealStatus: false,
  TownHP: 0,
  TownMP: 0,

  // special pots
  StackThawingPots: {
    enabled: false,
    quantity: 12,
  },
  StackAntidotePots: {
    enabled: false,
    quantity: 12,
  },
  StackStaminaPots: {
    enabled: false,
    quantity: 12,
  },

  // General
  AutoMap: false,
  LastMessage: "",
  UseMerc: false,
  MercWatch: false,
  LowGold: 0,
  StashGold: 0,
  FieldID: {
    Enabled: false,
    PacketID: true,
    UsedSpace: 90,
  },
  DroppedItemsAnnounce: {
    Enable: false,
    Quality: [],
    LogToOOG: false,
    OOGQuality: [],
  },
  CainID: {
    Enable: false,
    MinGold: 0,
    MinUnids: 0,
  },
  Inventory: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  LocalChat: {
    Enabled: false,
    Toggle: false,
    Mode: 0,
  },
  Silence: false,
  PublicMode: false,
  PartyAfterScript: false,
  Greetings: [],
  DeathMessages: [],
  Congratulations: [],
  ShitList: false,
  UnpartyShitlisted: false,
  Leader: "",
  QuitList: [],
  QuitListMode: 0,
  QuitListDelay: [],
  HPBuffer: 0,
  MPBuffer: 0,
  RejuvBuffer: 0,
  PickRange: 40,
  MakeRoom: true,
  ClearInvOnStart: false,
  FastPick: false,
  ManualPlayPick: false,
  OpenChests: {
    Enabled: false,
    Range: 15,
    Types: ["chest", "chest3", "armorstand", "weaponrack"],
  },
  PickitFiles: [],
  BeltColumn: [],
  MinColumn: [],
  SkipId: [],
  SkipEnchant: [],
  SkipImmune: [],
  SkipAura: [],
  SkipException: [],
  ScanShrines: [],
  Debug: false,

  AutoMule: {
    Trigger: [],
    Force: [],
    Exclude: [],
  },

  ItemInfo: false,
  ItemInfoQuality: [],

  LogKeys: false,
  LogOrgans: true,
  LogLowRunes: false,
  LogMiddleRunes: false,
  LogHighRunes: true,
  LogLowGems: false,
  LogHighGems: false,
  SkipLogging: [],
  ShowCubingInfo: true,

  Cubing: false,
  CubeRepair: false,
  RepairPercent: 40,
  Recipes: [],
  MakeRunewords: false,
  Runewords: [],
  KeepRunewords: [],
  Gamble: false,
  GambleItems: [],
  GambleGoldStart: 0,
  GambleGoldStop: 0,
  MiniShopBot: false,
  TeleSwitch: false,
  MFSwitchPercent: 0,
  PrimarySlot: -1,
  LogExperience: false,
  TownCheck: false,
  PingQuit: [{ Ping: 0, Duration: 0 }],
  PacketShopping: false,

  // Fastmod
  FCR: 0,
  FHR: 0,
  FBR: 0,
  IAS: 0,
  PacketCasting: 0,
  WaypointMenu: true,

  // Anti-hostile
  AntiHostile: false,
  RandomPrecast: false,
  HostileAction: 0,
  TownOnHostile: false,
  ViperCheck: false,

  // DClone
  StopOnDClone: false,
  SoJWaitTime: 0,
  KillDclone: false,
  DCloneQuit: false,
  DCloneWaitTime: 30,

  // Experimental
  FastParty: false,
  AutoEquip: false,

  // GameData
  ChampionBias: 60,

  UseCta: true,

  // Attack specific
  Dodge: false,
  DodgeRange: 15,
  DodgeHP: 100,
  AttackSkill: [],
  LowManaSkill: [],
  CustomAttack: {},
  TeleStomp: false,
  NoTele: false,
  ClearType: false,
  ClearPath: false,
  BossPriority: false,
  MaxAttackCount: 300,

  // Amazon specific
  LightningFuryDelay: 0,
  UseInnerSight: false,
  UseSlowMissiles: false,
  UseDecoy: false,
  SummonValkyrie: false,
  AutoSwitchJavelin: false,

  // Sorceress specific
  UseTelekinesis: false,
  CastStatic: false,
  StaticList: [],
  UseEnergyShield: false,
  UseColdArmor: true,

  // Necromancer specific
  Golem: 0,
  ActiveSummon: false,
  Skeletons: 0,
  SkeletonMages: 0,
  Revives: 0,
  ReviveUnstackable: false,
  PoisonNovaDelay: 2000,
  Curse: [],
  CustomCurse: [],
  ExplodeCorpses: 0,

  // Paladin speficic
  Redemption: [0, 0],
  Charge: false,
  Vigor: false,
  AvoidDolls: false,
  ResistSoul: false,

  // Barbarian specific
  FindItem: false,
  FindItemSwitch: false,
  UseWarcries: true,

  // Druid specific
  Wereform: 0,
  SummonRaven: 0,
  SummonAnimal: 0,
  SummonVine: 0,
  SummonSpirit: 0,

  // Assassin specific
  UseTraps: false,
  Traps: [],
  BossTraps: [],
  UseFade: false,
  UseBoS: false,
  UseVenom: false,
  UseBladeShield: false,
  UseCloakofShadows: false,
  AggressiveCloak: false,
  SummonShadow: false,

  // Custom Attack
  CustomClassAttack: "", // If set it loads common/Attack/[CustomClassAttack].js

  MapMode: {
    UseOwnItemFilter: false,
  },

  // Script specific
  MFLeader: false,
  HookInfo: false,
  Mausoleum: {
    KillBishibosh: false,
    KillBloodRaven: false,
    ClearCrypt: false,
  },
  Cows: {
    DontMakePortal: false,
    JustMakePortal: false,
    KillKing: false,
  },
  Tombs: {
    KillDuriel: false,
  },
  Eldritch: {
    OpenChest: false,
    KillSharptooth: false,
    KillShenk: false,
    KillDacFarren: false,
  },
  Pindleskin: {
    UseWaypoint: false,
    KillNihlathak: false,
    ViperQuit: false,
  },
  Nihlathak: {
    ViperQuit: false,
    UseWaypoint: false,
  },
  Pit: {
    ClearPath: false,
    ClearPit1: false,
  },
  Snapchip: {
    ClearIcyCellar: false,
  },
  Frozenstein: {
    ClearFrozenRiver: false,
  },
  Rakanishu: {
    KillGriswold: false,
  },
  AutoBaal: {
    Leader: "",
    FindShrine: false,
    LeechSpot: [15115, 5050],
    LongRangeSupport: false,
  },
  KurastChests: {
    LowerKurast: false,
    Bazaar: false,
    Sewers1: false,
    Sewers2: false,
  },
  Countess: {
    KillGhosts: false,
    ClearLastTower: false,
  },
  Baal: {
    DollQuit: false,
    SoulQuit: false,
    KillBaal: false,
    Cleansing: false,
    HotTPMessage: "Hot TP!",
    SafeTPMessage: "Safe TP!",
    BaalMessage: "Baal!",
  },
  BaalAssistant: {
    KillNihlathak: false,
    FastChaos: false,
    Wait: 120,
    Helper: false,
    GetShrine: false,
    GetShrineWaitForHotTP: false,
    DollQuit: false,
    SoulQuit: false,
    SkipTP: false,
    WaitForSafeTP: false,
    KillBaal: false,
    HotTPMessage: [],
    SafeTPMessage: [],
    BaalMessage: [],
    NextGameMessage: [],
  },
  AutoChaos: {
    Taxi: false,
    FindShrine: false,
    Glitcher: false,
    SealOrder: [],
    PreAttack: [],
    Diablo: -1,
    UseShrine: false,
    Leech: false,
    Ranged: false,
    BO: false,
    SealPrecast: false,
    SealDelay: 0,
  },
  BaalHelper: {
    Wait: 120,
    KillNihlathak: false,
    FastChaos: false,
    DollQuit: false,
    KillBaal: false,
    SkipTP: false,
    Town: false,
  },
  Corpsefire: {
    ClearDen: false,
  },
  Hephasto: {
    ClearRiver: false,
    ClearType: false,
  },
  Diablo: {
    WalkClear: false,
    Entrance: false,
    JustViz: false,
    SealLeader: false,
    Fast: false,
    SealWarning: "Leave the seals alone!",
    EntranceTP: "Entrance TP up",
    StarTP: "Star TP up",
    DiabloMsg: "Diablo",
    ClearRadius: 30,
    SealOrder: ["vizier", "seis", "infector"],
  },
  DiabloHelper: {
    Wait: 120,
    Entrance: false,
    SkipIfBaal: false,
    SkipTP: false,
    OpenSeals: false,
    SafePrecast: true,
    ClearRadius: 30,
    SealOrder: ["vizier", "seis", "infector"],
    RecheckSeals: false,
  },
  MFHelper: {
    BreakClearLevel: false,
  },
  Wakka: {
    Wait: 1,
    StopAtLevel: 99,
    StopProfile: false,
    SkipIfBaal: true,
  },
  BattleOrders: {
    Mode: 0,
    Getters: [],
    Idle: false,
    QuitOnFailure: false,
    SkipIfTardy: true,
    Wait: 10,
  },
  BoBarbHelper: {
    Mode: -1,
    Wp: 35,
  },
  ControlBot: {
    RequestLimited: false,
    RushHelper: false,
    Bo: false,
    Cows: {
      MakeCows: false,
      GetLeg: false,
    },
    Chant: {
      Enchant: false,
      AutoEnchant: false,
    },
    Wps: {
      GiveWps: false,
      SecurePortal: false,
    },
    EndMessage: "",
    GameLength: 20,
  },
  Enchant: {
    Triggers: ["chant", "cows", "wps"],
    GetLeg: false,
    AutoChant: false,
    GameLength: 20,
  },
  IPHunter: {
    IPList: [],
    GameLength: 3,
  },
  Follower: {
    Leader: "",
    Picker: false,
    PickGold: false,
    AuraHelper: "",
    AuraSkills: [],
    teleportOff: false,
    SwitchAct: false,
    Runer: undefined,
  },
  Mephisto: {
    MoatTrick: false,
    KillCouncil: false,
    TakeRedPortal: false,
  },
  ShopBot: {
    ScanIDs: [],
    ShopNPC: "anya",
    CycleDelay: 0,
    QuitOnMatch: false,
  },
  Coldworm: {
    KillBeetleburst: false,
    ClearMaggotLair: false,
  },
  Summoner: {
    FireEye: false,
  },
  AncientTunnels: {
    OpenChest: false,
    KillDarkElder: false,
  },
  TorchSystem: {
    LogKeys: false,
    LogOrgans: true,
  },
  OrgTorch: {
    WaitForKeys: false,
    WaitTimeout: false,
    UseSalvation: false,
    GetFade: false,
    MakeTorch: true,
    PreGame: {
      Thawing: { Drink: 0, At: [] },
      Antidote: { Drink: 0, At: [] },
    },
  },
  Synch: {
    WaitFor: [],
  },
  TristramLeech: {
    Leader: "",
    Helper: false,
    Wait: 5,
  },
  TravincalLeech: {
    Leader: "",
    Helper: false,
    Wait: 5,
  },
  Tristram: {
    PortalLeech: false,
    WalkClear: false,
  },
  Travincal: {
    PortalLeech: false,
  },
  SkillStat: {
    Skills: [],
  },
  Bonesaw: {
    ClearDrifterCavern: false,
  },
  ChestMania: {
    Act1: [],
    Act2: [],
    Act3: [],
    Act4: [],
    Act5: [],
  },
  ClearAnyArea: {
    AreaList: [],
  },
  Rusher: {
    WaitPlayerCount: 0,
    Sequence: false,
    Cain: false,
    Radament: false,
    LamEsen: false,
    Izual: false,
    Shenk: false,
    Anya: false,
    HellAncients: false,
    GiveWps: false,
    LastRun: "",
  },
  Rushee: {
    Quester: false,
    Bumper: false,
  },
  Questing: {
    StopProfile: false,
  },
  AutoSkill: {
    Enabled: false,
    Build: [],
    Save: 0,
  },
  AutoStat: {
    Enabled: false,
    Build: [],
    Save: 0,
    BlockChance: 0,
    UseBulk: true,
  },
  AutoBuild: {
    Enabled: false,
    Template: "",
    Verbose: false,
    DebugMode: false,
  },
  //
  QuitTimeout: 0,
  AfterConfigure: undefined,
  AllowSay: false,
  MFTorches: {
    TorchesQuantity: [0, 0, 0, 0, 0, 0],
    MaxQuantity: 0,
    UseSalvation: false,
    MuleProfile: false,
  },
};
