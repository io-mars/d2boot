import { rand } from "boot";

export const StarterConfig = {
  MinGameTime: 30, // Minimum game length in seconds. If a game is ended too soon, the rest of the time is waited in the lobby
  // MinGameTime: 360, // Minimum game length in seconds. If a game is ended too soon, the rest of the time is waited in the lobby
  PingQuitDelay: 30, // Time in seconds to wait in lobby after quitting due to high ping
  CreateGameDelay: rand(2, 5), // Seconds to wait before creating a new game
  // CreateGameDelay: rand(5, 15), // Seconds to wait before creating a new game
  ResetCount: 999, // Reset game count back to 1 every X games.
  CharacterDifference: 99, // Character level difference. Set to false to disable character difference.
  MaxPlayerCount: 8, // Max amount of players in game between 1 and 8
  StopOnDeadHardcore: true, // Stop profile character has died on hardcore mode

  // ChannelConfig can override these options for individual profiles.
  JoinChannel: "", // Default channel.
  FirstJoinMessage: "", // Default join message. Can be an array of messages
  ChatActionsDelay: 2, // Seconds to wait in lobby before entering a channel
  AnnounceGames: false, // Default value
  AfterGameMessage: "", // Default message after a finished game. Can be an array of messages

  InvalidPasswordDelay: 10, // Minutes to wait after getting Invalid Password message
  VersionErrorDelay: rand(5, 30), // Seconds to wait after 'unable to identify version' message
  SwitchKeyDelay: 5, // Seconds to wait before switching a used/banned key or after realm down
  //iomars
  // CrashDelay: rand(120, 150), // Seconds to wait after a d2 window crash
  CrashDelay: rand(5, 15), // Seconds to wait after a d2 window crash
  JoinDelay: rand(1, 5), // Seconds to wait after join game
  // FTJDelay: 120, // Seconds to wait after failing to create a game
  FTJDelay: 20, // Seconds to wait after failing to create a game
  RealmDownDelay: 3, // Minutes to wait after getting Realm Down message
  UnableToConnectDelay: 5, // Minutes to wait after Unable To Connect message
  TCPIPNoHostDelay: 5, // Seconds to wait after Cannot Connect To Server message
  CDKeyInUseDelay: 5, // Minutes to wait before connecting again if CD-Key is in use.
  ConnectingTimeout: 60, // Seconds to wait before cancelling the 'Connecting...' screen
  PleaseWaitTimeout: 60, // Seconds to wait before cancelling the 'Please Wait...' screen
  WaitInLineTimeout: 3600, // Seconds to wait before cancelling the 'Waiting in Line...' screen
  WaitOutQueueRestriction: true, // Wait out queue if we are restricted, queue time > 10000
  WaitOutQueueExitToMenu: false, // Wait out queue restriction at D2 Splash screen if true, else wait out in lobby
  GameDoesNotExistTimeout: 30, // Seconds to wait before cancelling the 'Game does not exist.' screen
  JoinSameGame: true, //join a same game name  iomars
};

// Advanced config - you don't have to edit this unless you need some of the features provided
export const AdvancedConfig = {
  /* Features:
	Override channel for each profile, Override join delay for each profile
	Override default values for JoinChannel, FirstJoinMessage, AnnounceGames and AfterGameMessage per profile

	* Format *:
		"Profile Name": {JoinDelay: number_of_seconds}
	or
		"Profile Name": {JoinChannel: "channel name"}
	or
		"Profile Name": {JoinChannel: "channel name", JoinDelay: number_of_seconds}

	* Example * (don't edit this - it's just an example):

		"MyProfile1": {JoinDelay: 3},
		"MyProfile2": {JoinChannel: "some channel"},
		"MyProfile3": {JoinChannel: "some other channel", JoinDelay: 11}
		"MyProfile4": {AnnounceGames: true, AnnounceMessage: "Joining game"} // announce game you are joining

		"Profile Name": {
			JoinChannel: "channel name",
			FirstJoinMessage: "first message", -OR- ["join msg 1", "join msg 2"],
			AnnounceGames: true,
			AfterGameMessage: "message after a finished run" -OR- ["msg 1", msg 2"]
		}
	*/

  // Put your lines under this one. Multiple entries are separated by commas. No comma after the last one.

  Test: {
    JoinChannel: "op nnqry",
    JoinDelay: 3,
    AnnounceGames: true,
    AnnounceMessage: "Joining game", // output: Joining game Baals-23
  },
};

/* Join game settings
	Format: "leader's profile": ["leecher 1 profile", "leecher 2 profile", ...]
	If you want everyone to join the same leader, use "leader's profile": ["all"]
	NOTE: Use PROFILE names (profile matches window title), NOT character/account names
	leader:leecher groups need to be divided by a comma
	example:
		let JoinSettings = {
			"lead1": ["follow1", "follow2"],
			"lead2": ["follow3", "follow4"]
		};
*/
export const JoinSettings = {
  "leader-profile": ["follow1-profile", "follow2-profile"],
};

export const MuleLoggerConfig = {
  LogAccounts: {
    /* Format:
			"account1/password1/realm": ["charname1", "charname2 etc"],
			"account2/password2/realm": ["charnameX", "charnameY etc"],
			"account3/password3/realm": ["all"]

			To log a full account, put "account/password/realm": ["all"]

			realm = useast, uswest, europe or asia

			Individual entries are separated with a comma.
		*/
  },

  LogGame: ["game", "pass"], // ["gamename", "password"]
};

export const AutoMuleConfig = {
  Mules: {
    Mule1: {
      muleProfile: "mule", // The name of mule profile in d2bot#. It will be started and stopped when needed.
      accountPrefix: "acc", // Account prefix. Numbers added automatically when making accounts.
      accountPassword: "", // Account password.
      charPrefix: "mu-", // Character prefix. Suffix added automatically when making characters.
      realm: "", // Available options: "useast", "uswest", "europe", "asia"
      expansion: true,
      ladder: true,
      hardcore: false,
      charsPerAcc: 8, // Maximum number of mules to create per account (between 1 to 18)

      // Game name and password of the mule game. Never use the same game name as for mule logger.
      muleGameName: ["mu", "pass"], // ["gamename", "password"]

      // List of profiles that will mule items. Example: enabledProfiles: ["profile 1", "profile 2"],
      enabledProfiles: [],

      // Stop a profile prior to muling. Useful when running 8 bots without proxies.
      stopProfile: "",
      stopProfileKeyRelease: false, // true = stopProfile key will get released on stop. useful when using 100% of your keys for botting.

      // Trigger muling at the end of a game if used space in stash and inventory is equal to or more than given percent.
      usedStashTrigger: 80,
      usedInventoryTrigger: 80,

      // Mule items that have been stashed at some point but are no longer in pickit.
      muleOrphans: true,
      // Continuous Mule settings
      continuousMule: false, // Mule stays in game for continuous muling. muleProfile must be dedicated and started manually.
      skipMuleResponse: false, // Skip mule response check and attempt to join mule game. Useful if mule is shared and/or ran on different system.
      onlyLogWhenFull: false, // Only log character when full, solves an issue with droppers attempting to use characters who are already in game
    },
  },

  /** Torch/Anni mules
		- Torch is muled in OrgTorch script after finishing uber Tristram successfully or when starting OrgTorch script with a Torch already on the character.
		- Anni is muled after successfully killing Diablo in Palace Cellar level 3 using Config.KillDclone option or KillDClone script.
			If a profile is listed in Torch/Anni mule's enabledProfiles list, it will also do a check to mule Anni at the end of each game.
			Anni that is in locked inventory slot will not be muled.

		* Each mule will hold either a Torch or an Anni, but not both. As soon as the current mule has either one, a new one will be created.
	*/
  TorchAnniMules: {
    Mule1: {
      type: "charm",
      muleProfile: "charmMuler", // The name of mule profile in d2bot#. It will be started and stopped when needed.
      accountPrefix: "acc", // Account prefix. Numbers added automatically when making accounts.
      accountPassword: "pass", // Account password.
      charPrefix: "", // Character prefix. Suffix added automatically when making characters.
      realm: "", // Available options: "useast", "uswest", "europe", "asia"
      expansion: true,
      ladder: true,
      hardcore: false,
      // charsPerAcc: 8, // Maximum number of mules to create per account (between 1 to 18)

      // Game name and password of the mule game. Never use the same game name as for mule logger.
      muleGameName: ["", ""], // ["gamename", "password"]

      // List of profiles that will mule items. Example: enabledProfiles: ["profile 1", "profile 2"],
      enabledProfiles: [],

      // Stop a profile prior to muling. Useful when running 8 bots without proxies.
      stopProfile: "",
      stopProfileKeyRelease: false, // true = stopProfile key will get released on stop. useful when using 100% of your keys for botting.

      // Continuous Mule settings
      continuousMule: true, // Mule stays in game for continuous muling. muleProfile must be dedicated and started manually.
      skipMuleResponse: true, // Skip mule response check and attempt to join mule game. Useful if mule is shared and/or ran on different system.
      onlyLogWhenFull: true, // Only log character when full, solves an issue with droppers attempting to use characters who are already in game
    },
    //##########################################################################################
  },
};
