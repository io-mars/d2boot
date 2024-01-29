export const CustomConfig = {
  /* Format:
    "Config_Filename_Without_Extension": ["array", "of", "profiles"]

    Multiple entries are separated by commas
  */
};

export const TeamBaseConfig = {
  /* Format:
   */
  //the base config file , u should set all in here.
  BaseConfig: [
    {
      Members: ["leader-sor", "follow-a", "follow-b", "follow-pal"],
    },
  ],

  //only set Follower
  Follower: [
    {
      Members: ["follow-a", "follow-b", "follow-pal"],
      Leader: "leader-sor",
      QuitList: ["leader-sor"],
      SetQuitTimeout: true,
    },
  ],

  FollowerLeader: [{ Members: ["leader-sor"], AuraHelper: "follow-pal" }],

  //set MFHelper
  MFHelper: [
    {
      Members: [],
      Leader: "",
      QuitList: [],
      SetQuitTimeout: true,
    },
  ],

  MFHelperLeader: [
    {
      Members: [],
    },
  ],

  //support make runewords
  RunewordMaker: [
    {
      Members: ["follow-pal"],
    },
  ],

  //cube gem here
  // GemPicker: [{ Members: [""] }],

  //cube ilvl>=95 charm here, NOTE: cube charm only
  CharmCuber: [{ Members: [] }],

  //arrow for bow amz
  ArrowPicker: [{ Members: [] }],

  FollowerPicker: [{ Members: [] }],

  //upgrade Item
  ItemUpgrader: [{ Members: [] }],

  // only get ilvl>=95 charm here, no cube this charm
  CharmPicker: [
    {
      Members: [],
    },
  ],

  //enchant
  Enchanter: [{ Members: [], QuitList: [] }],

  AutoBuilder: [
    {
      Members: [],
    },
  ],

  //get 3boss key
  KeyPicker: [{ Members: [] }],
};
