export const CustomConfig = {
  /* Format:
    "Config_Filename_Without_Extension": ["array", "of", "profiles"]

    Multiple entries are separated by commas
  */
};

const TREAMCHARNAMES = ["follow-a", "follow-b", "follow-pal", "..."];

export const TeamBaseConfig = {
  /* Format:
   */
  //the base config file , u should set all in here.
  BaseConfig: [
    {
      Prefix: "",
      Members: ["leader-sor", ...TREAMCHARNAMES],
    },
  ],

  //only set Follower
  Follower: [
    {
      Prefix: "",
      Members: [...TREAMCHARNAMES],
      Leader: "leader-sor",
      QuitList: ["leader-sor"],
      SetQuitTimeout: true,
    },
  ],

  FollowerLeader: [{ Members: ["leader-sor"], AuraHelper: "follow-pal" }],

  //set MFHelper
  MFHelper: [
    {
      Prefix: "",
      Members: [],
      Leader: "",
      QuitList: [],
      SetQuitTimeout: true,
    },
  ],

  MFHelperLeader: [
    {
      Prefix: "",
      Members: [],
    },
  ],

  //support make runewords
  RunewordMaker: [
    {
      Prefix: "",
      Members: ["follow-pal"],
    },
  ],

  //cube gem here
  // GemPicker: [{ Members: [""] }],

  //cube ilvl>=95 charm here, NOTE: cube charm only
  CharmCuber: [{ Prefix: "", Members: [] }],

  //arrow for bow amz
  ArrowPicker: [{ Prefix: "", Members: [] }],

  FollowerPicker: [{ Prefix: "", Members: [] }],

  //upgrade Item
  ItemUpgrader: [{ Prefix: "", Members: [] }],

  // only get ilvl>=95 charm here, no cube this charm
  CharmPicker: [
    {
      Prefix: "",
      Members: [],
    },
  ],

  //enchant
  Enchanter: [{ Prefix: "", Members: [], QuitList: [] }],

  AutoBuilder: [
    {
      Prefix: "",
      Members: [],
    },
  ],

  //get 3boss key
  KeyPicker: [{ Prefix: "", Members: [] }],
};
