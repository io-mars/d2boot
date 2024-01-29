#include "JSBoot.h"

#include "D2Ptrs.h"
#include "Helpers.h"
#include "JSUnit.h"
#include "MapHeader.h"
#include "JSPresetUnit.h"
#include "JSScreenHook.h"
#include "JSRoom.h"
#include "Script.h"
#include "ScriptEngine.h"
#include "Console.h"
#include "JSScript.h"
#include "JSParty.h"
#include "D2Skills.h"
#include "MPQStats.h"
#include "JSArea.h"
#include "JSExits.h"
#include "Room.h"
#include "JSFileTools.h"
#include "JSMenu.h"
#include "JSProfile.h"
#include "Events.h"
#include "JSControl.h"
#include "JSHash.h"

JSAPI_FUNC(my_gamePrint)
{
  if (!JS_IsString(argv[0]))
  {
    return JS_FALSE;
  }
  wchar_t *output = nullptr;
  JS_ToUnicodeString(ctx, &output, argv[0]);

  D2CLIENT_PrintGameString(output, 0);
  free(output);
  return JS_TRUE;
}

JSAPI_FUNC(my_print)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    return JS_FALSE;

  wchar_t *wVal = nullptr;
  JS_ToUnicodeString(ctx, &wVal, argv[0]);
  // wchar_t *wVal = GetPrintString(szVal);
  Print(L"%ls", wVal);

  free(wVal);

  return JS_TRUE;
}

JSAPI_FUNC(my_say)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    return JS_FALSE;

  wchar_t *szMessage = nullptr;
  JS_ToUnicodeString(ctx, &szMessage, argv[0]);

  Say(L"%ls", szMessage);

  free(szMessage);

  return JS_TRUE;
}

JSAPI_FUNC(my_getPath)
{
  GAME_READY();

  if (argc < 5)
    JS_THROW_SINGLE_LINE(ctx, "Not enough parameters were passed to getPath!");

  uint32_t lvl = 0, x = 0, y = 0, dx = 0, dy = 0, reductionType = 0, radius = 20;
  JS_ToUint32(ctx, &lvl, argv[0]);
  JS_ToUint32(ctx, &x, argv[1]);
  JS_ToUint32(ctx, &y, argv[2]);
  JS_ToUint32(ctx, &dx, argv[3]);
  JS_ToUint32(ctx, &dy, argv[4]);

  if (lvl == 0)
    JS_THROW_SINGLE_LINE(ctx, "Invalid level passed to getPath");

  if (argc > 6)
    JS_ToUint32(ctx, &reductionType, argv[5]);

  if (argc > 7)
    JS_ToUint32(ctx, &radius, argv[6]);

  Level *level = GetLevel(lvl);

  if (!level)
    return JS_FALSE;

  ActMap *map = ActMap::GetMap(level);

  Point start(x, y), end(dx, dy);

  PathReducer *reducer = nullptr;
  switch (reductionType)
  {
  case 0:
    reducer = new WalkPathReducer(map, DiagonalShortcut, radius);
    break;
  case 1:
    reducer = new TeleportPathReducer(map, DiagonalShortcut, radius);
    break;
  case 2:
    reducer = new NoPathReducer(map);
    break;
  // case 3:
  //   reducer = new JSPathReducer(map, cx, JS_THIS_OBJECT(cx, vp), JS_ARGV(cx, vp)[7], JS_ARGV(cx, vp)[8], JS_ARGV(cx, vp)[9]);
  //   break;
  default:
    JS_THROW_ERROR(ctx, "Invalid path reducer value!");
    break;
  }

  PointList list;
  AStarPath<> path(map, reducer);

  path.GetPath(start, end, list, true);
  map->CleanUp();

  int count = list.size();

  JSValue array = JS_NewArray(ctx);
  for (int i = 0; i < count; i++)
  {
    JSValue point = JS_NewObject(ctx);
    JS_SetPropertyStr(ctx, point, "x", JS_NewUint32(ctx, list[i].first));
    JS_SetPropertyStr(ctx, point, "y", JS_NewUint32(ctx, list[i].second));
    JS_DefinePropertyValueUint32(ctx, array, i, point, JS_PROP_C_W_E);
  }

  delete reducer;
  map->CleanUp();
  return array;
}

JSAPI_FUNC(my_dumpLevel)
{
  uint32_t lvl = 0;
  JS_ToUint32(ctx, &lvl, argv[0]);

  const char *file = JS_ToCString(ctx, argv[1]);

  Level *level = GetLevel(lvl);

  if (!level)
    return JS_FALSE;

  ActMap *map = ActMap::GetMap(level);
  map->DumpLevel(file);
  JS_FreeCString(ctx, file);
  map->CleanUp();
  // delete map;

  return JS_TRUE;
}

JSAPI_FUNC(my_delay)
{
  uint32_t nDelay = 0;
  if (JS_ToUint32(ctx, &nDelay, argv[0]) < 0)
    return JS_FALSE;

  Script *script = (Script *)JS_GetContextOpaque(ctx);
  script->WaitForExecEvent(nDelay);

  return JS_TRUE;
}

JSAPI_FUNC(my_getTickCount)
{
  return JS_NewUint32(ctx, GetTickCount());
}

JSAPI_FUNC(my_version)
{
  Print(L"\u00FFc4D2Boot\u00FFc1 \u00FFc3%ls for Diablo II 1.13d.", D2BOOT_VERSION);
  return JS_NewUTF8String(ctx, D2BOOT_VERSION);
}

JSAPI_FUNC(my_debugLog)
{
  for (int i = 0; i < argc; i++)
  {
    if (!JS_IsNull(argv[i]))
    {
      wchar_t *Text = nullptr;
      JS_ToUnicodeString(ctx, &Text, argv[i]);
      if (Text == nullptr)
      {
        JS_ReportError(ctx, "Could not get string for value");
        return JS_FALSE;
      }

      Log(L"%ls", Text);
      free(Text);
    }
  }
  return JS_TRUE;
}

JSAPI_FUNC(my_getLocaleString)
{
  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t localeId;

  JS_ToUint32(ctx, &localeId, argv[0]);
  wchar_t *wString = D2LANG_GetLocaleText(localeId);
  return JS_NewUTF8String(ctx, wString);
}

JSAPI_FUNC(my_getUIFlag)
{
  GAME_READY();

  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t nUIId;
  JS_ToUint32(ctx, &nUIId, argv[0]);

  return JS_NewBool(ctx, D2CLIENT_GetUIState(nUIId));
}

JSAPI_FUNC(my_addEventListener)
{
  if (JS_IsString(argv[0]) && JS_IsFunction(ctx, argv[1]))
  {
    const char *evtName = JS_ToCString(ctx, argv[0]);
    if (evtName && strlen(evtName))
    {
      Script *self = (Script *)JS_GetContextOpaque(ctx);
      JSValue thisVal = JS_UNDEFINED;

      if (argc > 2 && JS_IsObject(argv[2]))
      {
        thisVal = argv[2];
      }

      self->RegisterEvent(evtName, argv[1], thisVal);
    }
    else
    {
      JS_FreeCString(ctx, evtName);
      JS_THROW_ERROR(ctx, "Event name is invalid!");
    }
    JS_FreeCString(ctx, evtName);
  }
  return JS_TRUE;
}

JSAPI_FUNC(my_removeEventListener)
{
  if (JS_IsString(argv[0]) && JS_IsFunction(ctx, argv[1]))
  {
    const char *evtName = JS_ToCString(ctx, argv[0]);
    if (evtName && strlen(evtName))
    {
      Script *self = (Script *)JS_GetContextOpaque(ctx);
      self->UnregisterEvent(evtName, argv[1]);
    }
    else
    {
      JS_FreeCString(ctx, evtName);
      JS_THROW_ERROR(ctx, "Event name is invalid!");
    }
    JS_FreeCString(ctx, evtName);
  }
  return JS_TRUE;
}

JSAPI_FUNC(my_showConsole)
{
  Console::Show();
  return JS_TRUE;
}

JSAPI_FUNC(my_hideConsole)
{
  Console::Hide();
  return JS_TRUE;
}

JSAPI_FUNC(my_handler)
{
  return JS_NewUint32(ctx, (uint32_t)Vars.hHandle);
}

JSAPI_FUNC(my_getPacket)
{
  if (!Vars.bEnableUnsupported)
    JS_THROW_SINGLE_LINE(ctx, "getPacket requires EnableUnsupported = true in d2boot.ini");

  BYTE *aPacket;
  uint32_t len = 0, size = 0;
  if (JS_IsObject(argv[0]))
  {
    aPacket = JS_GetArrayBuffer(ctx, &size, argv[0]);

    if (!aPacket)
      JS_THROW_SINGLE_LINE(ctx, "invalid ArrayBuffer parameter");
  }
  else
  {
    if (argc % 2 != 0)
      JS_THROW_SINGLE_LINE(ctx, "invalid packet format");

    aPacket = new BYTE[2 * argc];

    for (int i = 0; i < argc; i += 2, len += size)
    {
      JS_ToUint32(ctx, &size, argv[i]);
      JS_ToUint32(ctx, (uint32_t *)&aPacket[len], argv[i + 1]);
    }
  }

  D2NET_ReceivePacket(aPacket, len);
  delete[] aPacket;
  return JS_TRUE;
}

JSAPI_FUNC(my_sendPacket)
{
  if (!Vars.bEnableUnsupported)
    JS_THROW_SINGLE_LINE(ctx, "sendPacket requires EnableUnsupported = true in d2boot.ini");

  BYTE *aPacket;
  uint32_t len = 0;

  if (JS_IsObject(argv[0]))
  {
    aPacket = JS_GetArrayBuffer(ctx, &len, argv[0]);
    if (!aPacket)
      JS_THROW_SINGLE_LINE(ctx, "invalid ArrayBuffer parameter");
  }
  else
  {
    if (argc % 2 != 0)
      JS_THROW_SINGLE_LINE(ctx, "invalid packet format");

    // 2*argc(4*argc/2) mean all val is int type, overflow?
    aPacket = new BYTE[2 * argc];
    uint32_t size = 0;

    for (int i = 0; i < argc; i += 2, len += size)
    {
      // (uint32_t *)&aPacket[len] is safe, set uint32_t to char
      if (JS_ToUint32(ctx, &size, argv[i]) < 0 || JS_ToUint32(ctx, (uint32_t *)&aPacket[len], argv[i + 1]) < 0)
        JS_THROW_SINGLE_LINE(ctx, "invalid packet data");
    }
  }

  D2NET_SendPacket(len, 1, aPacket);
  delete[] aPacket;
  aPacket = nullptr;
  return JS_TRUE;
}

JSAPI_FUNC(my_load)
{
  Script *script = (Script *)JS_GetContextOpaque(ctx);
  if (!script)
  {
    return JS_FALSE;
  }

  wchar_t *file = nullptr;
  JS_ToUnicodeString(ctx, &file, argv[0]);

  if (wcslen(file) > (_MAX_FNAME + _MAX_PATH - wcslen(Vars.szScriptPath)))
  {
    free(file);
    return JS_FALSE;
  }

  ScriptState scriptState = script->GetState();
  if (scriptState == Command)
    scriptState = (ClientState() == ClientStateInGame ? InGame : OutOfGame);

  wchar_t buf[_MAX_PATH + _MAX_FNAME];
  swprintf_s(buf, _countof(buf), L"%s/%s", Vars.szScriptPath, file);
  // StringReplaceChar(buf, L'/', L'\\', _countof(buf));

  // MTODO support args?
  char **args = nullptr;
  //  if (argc > 1)
  //  {
  //    args = new char *[argc - 1];
  //    for (int i = 1; i < argc; i++)
  //    {
  //      args[i - 1] = (char *)JS_ToCString(ctx, argv[i]);
  //    }
  //  }
  Script *newScript = ScriptEngine::CompileFile(buf, scriptState, argc - 1, (void **)args);

  if (newScript)
  {
    ScriptEngine::EvalScript(newScript);
  }
  else
  {
    // TODO: Should this actually be there? No notification is bad, but do we want this? maybe throw an exception?
    Print(L"File \"%ls\" not found.", file);
    return JS_FALSE;
  }
  free(file);
  return JS_TRUE;
}

JSAPI_FUNC(my_clearAllEvents)
{
  Script *self = (Script *)JS_GetContextOpaque(ctx);
  self->ClearAllEvents();
  return JS_TRUE;
}

static JSClassID dialogLine_class_id;

JSAPI_FUNC(my_clickDialog)
{
  TransactionDialogsLine_t *tdl = (TransactionDialogsLine_t *)JS_GetOpaque(this_val, dialogLine_class_id);

  if (tdl && tdl->bMaybeSelectable)
    tdl->handler();
  else
    JS_THROW_SINGLE_LINE(ctx, "That dialog is not currently clickable.");

  return JS_TRUE;
}

JSAPI_FUNC(my_getDialogLines)
{
  TransactionDialogsInfo_t *pTdi = *p_D2CLIENT_pTransactionDialogsInfo;
  JSValue returnArray = JS_NULL, jsLine, jsText, jsSelectable;

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;
  if (pTdi)
  {
    returnArray = JS_NewArray(ctx);

    for (DWORD i = 0; i < pTdi->numLines; ++i)
    {

      jsText = JS_NewUTF8String(ctx, pTdi->dialogLines[i].text);
      jsSelectable = JS_NewBool(ctx, pTdi->dialogLines[i].bMaybeSelectable);

      jsLine = BuildObject(ctx, dialogLine_class_id, &pTdi->dialogLines[i]);
      JS_SetPropertyStr(ctx, jsLine, "text", jsText);
      JS_SetPropertyStr(ctx, jsLine, "selectable", jsSelectable);
      JS_SetPropertyStr(ctx, jsLine, "handler", JS_NewCFunction(ctx, my_clickDialog, "handler", 1));

      JS_DefinePropertyValueUint32(ctx, returnArray, i, jsLine, JS_PROP_C_W_E);
    }
  }
  delete cRoom;
  return returnArray;
}

JSAPI_FUNC(my_getWaypoint)
{
  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  GAME_READY();

  uint32_t nWaypointId;
  JS_ToUint32(ctx, &nWaypointId, argv[0]);

  if (nWaypointId > 40)
    nWaypointId = 0;

  return JS_NewBool(ctx, !!D2COMMON_CheckWaypoint((*p_D2CLIENT_WaypointTable), nWaypointId));
}

JSAPI_FUNC(my_getBaseStat)
{
  if (argc > 2)
  {
    const char *szStatName = nullptr, *szTableName = nullptr;
    uint32_t nBaseStat = 0;
    uint32_t nClassId = 0;
    uint32_t nStat = -1;
    if (JS_IsString(argv[0]))
    {
      szTableName = JS_ToCString(ctx, argv[0]);
      if (!szTableName)
        JS_THROW_SINGLE_LINE(ctx, "Invalid table value");
    }
    else if (JS_IsNumber(argv[0]))
      JS_ToUint32(ctx, &nBaseStat, argv[0]);
    else
      JS_THROW_SINGLE_LINE(ctx, "Invalid table value");

    JS_ToUint32(ctx, &nClassId, argv[1]);

    if (JS_IsString(argv[2]))
    {
      szStatName = JS_ToCString(ctx, argv[2]);
      if (!szStatName)
      {
        JS_FreeCString(ctx, szTableName);
        JS_THROW_ERROR(ctx, "Invalid column value");
      }
    }
    else if (JS_IsNumber(argv[2]))
      JS_ToUint32(ctx, &nStat, argv[2]);
    else
    {
      JS_FreeCString(ctx, szTableName);
      JS_THROW_ERROR(ctx, "Invalid column value");
    }

    JSValue rval;
    JS_FillBaseStat(ctx, &rval, nBaseStat, nClassId, nStat, szTableName, szStatName);
    // JS_SET_RVAL(cx, vp, rval);

    JS_FreeCString(ctx, szTableName);
    JS_FreeCString(ctx, szStatName);
    return rval;
  }

  return JS_FALSE;
}

JSAPI_FUNC(my_getIsTalkingNPC)
{
  GAME_READY();

  return JS_NewBool(ctx, IsScrollingText());
}

JSAPI_FUNC(my_getCollision)
{
  GAME_READY();

  if (argc < 3)
    return JS_FALSE;

  int32_t nLevelId, nX, nY;
  JS_ToInt32(ctx, &nLevelId, argv[0]);
  JS_ToInt32(ctx, &nX, argv[1]);
  JS_ToInt32(ctx, &nY, argv[2]);

  Point point(nX, nY);
  Level *level = GetLevel(nLevelId);
  if (!level)
    JS_THROW_SINGLE_LINE(ctx, "Level Not loaded");

  ActMap *map = ActMap::GetMap(level);
  // if(!map->IsValidPoint(point))  //return avoid instead and make it not lvl depenant
  //	{ map->CleanUp(); THROW_ERROR(cx, "Invalid point!");}

  JSValue rval = JS_NewInt32(ctx, map->GetMapData(point, true));
  map->CleanUp();

  return rval;
}

JSAPI_FUNC(my_getCursorType)
{
  uint32_t nType = 0;

  if (argc > 0)
    nType = JS_ToUint32(ctx, &nType, argv[0]);

  return JS_NewUint32(ctx, nType == 1 ? *p_D2CLIENT_ShopCursorType : *p_D2CLIENT_RegularCursorType);
}

JSAPI_FUNC(my_getSkillByName)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    return JS_FALSE;

  const char *lpszText = JS_ToCString(ctx, argv[0]);

  if (!lpszText || lpszText[0])
    JS_THROW_SINGLE_LINE(ctx, "Could not convert string");

  JSValue val = JS_UNDEFINED;
  for (unsigned int i = 0; i < ARRAYSIZE(Game_Skills); i++)
  {
    if (!_strcmpi(Game_Skills[i].name, lpszText))
    {
      val = JS_NewUint32(ctx, Game_Skills[i].skillID);
      break;
    }
  }

  JS_FreeCString(ctx, lpszText);
  return val;
}

JSAPI_FUNC(my_getSkillById)
{
  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t nId;
  JS_ToUint32(ctx, &nId, argv[0]);

  int row = 0;
  JSValue val = JS_NewString(ctx, "Unknown");
  if (FillBaseStat("skills", nId, "skilldesc", &row, sizeof(int)))
  {
    if (FillBaseStat("skilldesc", row, "str name", &row, sizeof(int)))
    {
      wchar_t *wcsName = D2LANG_GetLocaleText((WORD)row);
      val = JS_NewUTF8String(ctx, wcsName);
    }
  }

  return val;
}

JSAPI_FUNC(my_getTextSize)
{
  if (argc < 2 || !JS_IsString(argv[0]) || !JS_IsNumber(argv[1]))
    return JS_FALSE;

  wchar_t *pString = nullptr;
  JS_ToUnicodeString(ctx, &pString, argv[0]);

  if (!pString)
    JS_THROW_SINGLE_LINE(ctx, "Could not convert string");

  uint32_t font;
  JS_ToUint32(ctx, &font, argv[1]);
  POINT r = CalculateTextLen(pString, font);
  free(pString);

  JSValue x = JS_NewUint32(ctx, r.x);
  JSValue y = JS_NewUint32(ctx, r.y);
  JSValue val = JS_UNDEFINED;
  if (argc > 2 && JS_IsBool(argv[2]) && JS_ToBool(ctx, argv[2]) == TRUE)
  {
    // return an object with a height/width rather than an array
    val = JS_NewObject(ctx);
    if (JS_IsException(val))
      JS_THROW_SINGLE_LINE(ctx, "Could not build object");

    JS_DefinePropertyValueStr(ctx, val, "width", x, JS_PROP_C_W_E);
    JS_DefinePropertyValueStr(ctx, val, "height", y, JS_PROP_C_W_E);
  }
  else
  {
    val = JS_NewArray(ctx);
    JS_DefinePropertyValueUint32(ctx, val, 0, x, JS_PROP_C_W_E);
    JS_DefinePropertyValueUint32(ctx, val, 1, y, JS_PROP_C_W_E);
  }
  return val;
}

JSAPI_FUNC(my_getThreadPriority)
{
  return JS_NewUint32(ctx, (uint32_t)GetCurrentThread());
}

JSAPI_FUNC(my_getTradeInfo)
{
  if (argc < 1)
    return JS_FALSE;

  GAME_READY();

  if (!JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t nMode;
  JS_ToUint32(ctx, &nMode, argv[0]);

  JSValue val = JS_UNDEFINED;
  switch (nMode)
  {
  case 0:
  case 2:
    val = JS_NewUint32(ctx, *p_D2CLIENT_RecentTradeId);
    break;
  case 1:
  {
    // FIXME
    // char* tmp = UnicodeToAnsi((wchar_t*)(*p_D2CLIENT_RecentTradeName));
    //*rval = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, tmp));
    // free(tmp);
    // Temporary return value to keep it kosher
    val = JS_NULL;
  }
  break;
  default:
    val = JS_FALSE;
    break;
  }
  return val;
}

JSAPI_FUNC(my_getPlayerFlag)
{
  if (argc != 3 || !JS_IsNumber(argv[0]) || !JS_IsNumber(argv[1]) || !JS_IsNumber(argv[2]))
    return JS_FALSE;

  GAME_READY();

  uint32_t nFirstUnitId = (uint32_t)-1;
  uint32_t nSecondUnitId = (uint32_t)-1;
  JS_ToUint32(ctx, &nFirstUnitId, argv[0]);
  JS_ToUint32(ctx, &nSecondUnitId, argv[1]);

  uint32_t nFlag;
  JS_ToUint32(ctx, &nFlag, argv[2]);

  return JS_NewBool(ctx, D2CLIENT_TestPvpFlag(nFirstUnitId, nSecondUnitId, nFlag));
}

JSAPI_FUNC(my_submitItem)
{
  GAME_READY();

  if (UnitAny *pUnit = D2CLIENT_GetCursorItem())
  {
    if (D2CLIENT_GetPlayerUnit()->dwAct == 1)
    {
      if (GetPlayerArea() == D2CLIENT_GetPlayerUnit()->pAct->pMisc->dwStaffTombLevel)
      {
        *p_D2CLIENT_CursorItemMode = 3;
        BYTE aPacket[17] = {0};
        aPacket[0] = 0x44;
        *(DWORD *)&aPacket[1] = D2CLIENT_GetPlayerUnit()->dwUnitId;
        *(DWORD *)&aPacket[5] = *p_D2CLIENT_OrificeId;
        *(DWORD *)&aPacket[9] = pUnit->dwUnitId;
        *(DWORD *)&aPacket[13] = 3;
        D2NET_SendPacket(17, 1, aPacket);
        return JS_TRUE;
      }
    }
    else if (D2CLIENT_GetPlayerUnit()->dwAct == 0 || D2CLIENT_GetPlayerUnit()->dwAct == 4) // dwAct is 0-4, not 1-5
    {
      if (*p_D2CLIENT_RecentInteractId && D2COMMON_IsTownByLevelNo(GetPlayerArea()))
      {
        D2CLIENT_SubmitItem(pUnit->dwUnitId);
        return JS_TRUE;
      }
    }
  }
  return JS_FALSE;
}

JSAPI_FUNC(my_getMouseCoords)
{
  bool nFlag = false, nReturn = false;

  if (argc > 0 && (JS_IsNumber(argv[0]) || JS_IsBool(argv[0])))
    nFlag = !!JS_ToBool(ctx, argv[0]);

  if (argc > 1 && (JS_IsNumber(argv[1]) || JS_IsBool(argv[1])))
    nReturn = !!JS_ToBool(ctx, argv[1]);

  POINT Coords = {(LONG)*p_D2CLIENT_MouseX, (LONG)*p_D2CLIENT_MouseY};

  if (nFlag)
  {
    Coords.x += *p_D2CLIENT_ViewportX;
    Coords.y += *p_D2CLIENT_ViewportY;

    D2COMMON_AbsScreenToMap(&Coords.x, &Coords.y);
  }

  int32_t jsX, jsY;
  JS_ToInt32(ctx, &jsX, Coords.x);
  JS_ToInt32(ctx, &jsY, Coords.y);

  JSValue jsVal = JS_UNDEFINED;

  if (nReturn)
  {
    jsVal = JS_NewObject(ctx);
    if (JS_IsException(jsVal))
      return JS_FALSE;

    JS_DefinePropertyValueStr(ctx, jsVal, "x", jsX, JS_PROP_C_W_E);
    JS_DefinePropertyValueStr(ctx, jsVal, "y", jsY, JS_PROP_C_W_E);
  }
  else
  {
    jsVal = JS_NewArray(ctx);
    if (JS_IsException(jsVal))
      return JS_FALSE;

    JS_DefinePropertyValueUint32(ctx, jsVal, 0, jsX, JS_PROP_C_W_E);
    JS_DefinePropertyValueUint32(ctx, jsVal, 1, jsY, JS_PROP_C_W_E);
  }

  return jsVal;
}

JSAPI_FUNC(my_acceptTrade)
{
  GAME_READY();

  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t nMode;
  JS_ToUint32(ctx, &nMode, argv[0]);

  // TODO: Fix this nonsense.
  switch (nMode)
  {
  case 1:
    // Called with a '1' it will return if we already accepted it or not
    return JS_NewBool(ctx, *p_D2CLIENT_bTradeAccepted);
    break;
  case 2:
    // Called with a '2' it will return the trade flag
    return JS_NewBool(ctx, *p_D2CLIENT_RecentTradeId);
    break;
  case 3:
    // Called with a '3' it will return if the 'check' is red or not
    return JS_NewBool(ctx, *p_D2CLIENT_bTradeBlock);
    break;

  default:
    break;
  }

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;

  JSValue val = JS_FALSE;

  if ((*p_D2CLIENT_RecentTradeId) == 3 || (*p_D2CLIENT_RecentTradeId) == 5 || (*p_D2CLIENT_RecentTradeId) == 7)
  {
    if ((*p_D2CLIENT_bTradeBlock))
    {
      // Don't operate if we can't trade anyway ...
      val = JS_FALSE;
    }
    else if ((*p_D2CLIENT_bTradeAccepted))
    {
      (*p_D2CLIENT_bTradeAccepted) = FALSE;
      D2CLIENT_CancelTrade();
      val = JS_TRUE;
    }
    else
    {
      (*p_D2CLIENT_bTradeAccepted) = TRUE;
      D2CLIENT_AcceptTrade();
      val = JS_TRUE;
    }
    delete cRoom;
    return val;
  }
  delete cRoom;
  JS_THROW_ERROR(ctx, "Invalid parameter passed to acceptTrade!");
}

JSAPI_FUNC(my_tradeOk)
{
  GAME_READY();

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;
  TransactionDialogsInfo_t *pTdi = *p_D2CLIENT_pTransactionDialogsInfo;
  unsigned int i;

  if (pTdi != NULL)
  {
    for (i = 0; i < pTdi->numLines; ++i)
    {
      // Not sure if *p_D2CLIENT_TransactionDialogs == 1 necessary if it's in
      // the dialog list, but if it's not 1, a crash is guaranteed. (CrazyCasta)
      if (pTdi->dialogLines[i].handler == D2CLIENT_TradeOK && *p_D2CLIENT_TransactionDialogs == 1)
      {
        D2CLIENT_TradeOK();
        delete cRoom;
        return JS_TRUE;
      }
    }
  }
  delete cRoom;
  JS_THROW_ERROR(ctx, "Not in proper state to click ok to trade.");
}

JSAPI_FUNC(my_beep)
{
  uint32_t nBeepId = 0;

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &nBeepId, argv[0]);

  MessageBeep(nBeepId);
  return JS_TRUE;
}

JSAPI_FUNC(my_gold)
{
  GAME_READY();

  uint32_t nGold = 0, nMode = 1;

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &nGold, argv[0]);

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &nMode, argv[1]);

  SendGold(nGold, nMode);
  return JS_TRUE;
}

JSAPI_FUNC(my_playSound)
{
  // I need to take a closer look at the D2CLIENT_PlaySound function
  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t nSoundId;
  JS_ToUint32(ctx, &nSoundId, argv[0]);
  // D2CLIENT_PlaySound(nSoundId);

  return JS_TRUE;
}

JSAPI_FUNC(my_quitGame)
{
  if (ClientState() != ClientStateMenu)
    D2CLIENT_ExitGame();

  // give a chance to shut down
  Shutdown();
  TerminateProcess(GetCurrentProcess(), 0);

  return JS_TRUE;
}

JSAPI_FUNC(my_quit)
{
  Vars.bQuitting = true;
  if (ClientState() != ClientStateMenu)
    D2CLIENT_ExitGame();

  return JS_TRUE;
}

JSAPI_FUNC(my_weaponSwitch)
{
  GAME_READY();

  uint32_t nParameter = 0;
  if (argc > 0)
    JS_ToUint32(ctx, &nParameter, argv[0]);

  if (nParameter == 0)
  {
    // don't perform a weapon switch if current gametype is classic
    BnetData *pData = (*p_D2LAUNCH_BnData);
    if (pData)
    {
      if (!(pData->nCharFlags & PLAYER_TYPE_EXPAC))
        return JS_FALSE;
    }
    else
      JS_THROW_SINGLE_LINE(ctx, "Could not acquire BnData");

    BYTE aPacket[1];
    aPacket[0] = 0x60;
    D2NET_SendPacket(1, 1, aPacket);
    return JS_TRUE;
  }
  else
    return JS_NewUint32(ctx, *p_D2CLIENT_bWeapSwitch);

  return JS_FALSE;
}

JSAPI_FUNC(my_transmute)
{
  GAME_READY();

  bool cubeOn = !!D2CLIENT_GetUIState(UI_CUBE);
  if (!cubeOn)
    D2CLIENT_SetUIState(UI_CUBE, TRUE);

  D2CLIENT_Transmute();

  if (!cubeOn)
    D2CLIENT_SetUIState(UI_CUBE, FALSE);

  return JS_TRUE;
}

JSAPI_FUNC(my_useStatPoint)
{
  GAME_READY();

  if (argc < 1)
    return JS_FALSE;

  uint32_t stat = 0;
  uint32_t count = 1;

  JS_ToUint32(ctx, &stat, argv[0]);

  if (argc > 1)
    JS_ToUint32(ctx, &count, argv[1]);

  UseStatPoint(stat, count);
  return JS_TRUE;
}

JSAPI_FUNC(my_useSkillPoint)
{
  GAME_READY();

  if (argc < 1)
    return JS_FALSE;

  // the skill <= 0xFFFF
  uint32_t skill = 0;
  uint32_t count = 1;

  JS_ToUint32(ctx, &skill, argv[0]);

  if (argc > 1)
    JS_ToUint32(ctx, &count, argv[1]);

  UseSkillPoint(skill, count);
  return JS_TRUE;
}

JSAPI_FUNC(my_takeScreenshot)
{
  Vars.bTakeScreenshot = true;
  return JS_TRUE;
}

// #pragma comment(lib, "wininet")
JSAPI_FUNC(my_getIP)
{
  // HINTERNET hInternet, hFile;
  // DWORD rSize;
  // char buffer[32];

  // hInternet = InternetOpen(NULL, INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
  // hFile = InternetOpenUrl(hInternet, "http://ipv4bot.whatismyipaddress.com", NULL, 0, INTERNET_FLAG_RELOAD, 0);
  // InternetReadFile(hFile, &buffer, sizeof(buffer), &rSize);
  // buffer[min(rSize, 31)] = '\0';
  // InternetCloseHandle(hFile);
  // InternetCloseHandle(hInternet);
  // JS_SET_RVAL(cx, vp, STRING_TO_JSVAL(JS_NewStringCopyZ(cx, (char *)buffer)));
  return JS_FALSE;
}

JSAPI_FUNC(my_sendClick)
{
  uint32_t x = 0, y = 0;

  if (argc < 2)
    return JS_FALSE;

  JS_ToUint32(ctx, &x, argv[0]);
  JS_ToUint32(ctx, &y, argv[1]);

  Sleep(100);
  SendMouseClick(x, y, 0);
  Sleep(100);
  SendMouseClick(x, y, 1);
  Sleep(100);
  return JS_TRUE;
}

JSAPI_FUNC(my_sendKey)
{
  uint32_t key;

  if (argc < 1)
    return JS_FALSE;

  JS_ToUint32(ctx, &key, argv[0]);

  bool prompt = Console::IsEnabled();
  if (prompt)
  {
    Console::HidePrompt();
  }
  Sleep(100);
  SendKeyPress(WM_KEYDOWN, key, 0);
  Sleep(100);
  SendKeyPress(WM_KEYUP, key, 0);
  Sleep(100);
  if (prompt)
  {
    Console::ShowPrompt();
  }
  return JS_TRUE;
}

JSAPI_FUNC(my_revealLevel)
{
  UnitAny *unit = D2CLIENT_GetPlayerUnit();

  if (!unit)
    return JS_FALSE;

  Level *level = unit->pPath->pRoom1->pRoom2->pLevel;

  if (!level)
    return JS_FALSE;

  BOOL bDrawPresets = false;

  if (argc == 1 && JS_IsBool(argv[0]))
    bDrawPresets = !!JS_ToBool(ctx, argv[0]);

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;
  if (!GameReady())
  {
    delete cRoom;
    return JS_FALSE;
  }

  for (Room2 *room = level->pRoom2First; room; room = room->pRoom2Next)
  {
    RevealRoom(room, bDrawPresets);
  }
  delete cRoom;
  return JS_TRUE;
}

JSAPI_FUNC(my_rand)
{
  if (argc < 2 || !JS_IsNumber(argv[0]) || !JS_IsNumber(argv[1]))
    return JS_FALSE;

  // only seed the rng once
  static bool seeded = false;
  if (!seeded)
  {
    srand(GetTickCount());
    seeded = true;
  }

  long long seed = 0;
  if (ClientState() == ClientStateInGame)
    seed = D2GAME_Rand(D2CLIENT_GetPlayerUnit()->dwSeed);
  else
    seed = rand();

  uint32_t high, low;

  JS_ToUint32(ctx, &low, argv[0]);
  JS_ToUint32(ctx, &high, argv[1]);

  if (high > low + 1)
  {
    int i = (seed % (high - low + 1)) + low;
    return JS_NewUint32(ctx, i);
  }
  else
    return JS_NewUint32(ctx, high);

  return JS_FALSE;
}

JSAPI_FUNC(my_scriptBroadcast)
{
  if (argc < 1)
    JS_THROW_SINGLE_LINE(ctx, "You must specify something to broadcast");

  JSValue jsonVal = JS_JSONStringify(ctx, argv[0], JS_UNDEFINED, JS_UNDEFINED);
  const char *szAgrv = JS_ToCString(ctx, jsonVal);
  JS_FreeValue(ctx, jsonVal);

  ScriptBroadcastEvent(argc, szAgrv);
  JS_FreeCString(ctx, szAgrv);
  return JS_TRUE;
}

JSAPI_FUNC(my_sendCopyData)
{
  if (argc < 4)
    return JS_FALSE;

  wchar_t *windowClassName = nullptr, *windowName = nullptr;
  const char *data = nullptr;
  uint32_t nHandle = 0, nModeId = 0;
  HWND hWnd = nullptr;

  if (JS_IsString(argv[0]) && !JS_IsNull(argv[0]))
    JS_ToUnicodeString(ctx, &windowClassName, argv[0]);

  if (!JS_IsNull(argv[1]))
  {
    if (JS_IsNumber(argv[1]))
    {
      JS_ToUint32(ctx, &nHandle, argv[1]);
      hWnd = (HWND)nHandle;
    }
    else if (JS_IsString(argv[1]))
      JS_ToUnicodeString(ctx, &windowName, argv[1]);
  }

  if (hWnd == nullptr && windowName)
  {
    hWnd = FindWindow(windowClassName, windowName);
    if (!hWnd)
    {
      free(windowClassName);
      free(windowName);
      return JS_FALSE;
    }
  }

  if (JS_IsNumber(argv[2]) && !JS_IsNull(argv[2]))
    JS_ToUint32(ctx, &nModeId, argv[2]);

  // the quickjs is UTF-8 string, the D2Bot# SendMessage by ansi
  if (JS_IsString(argv[3]) && !JS_IsNull(argv[3]))
    data = JS_ToCString(ctx, argv[3]);

  // if data is NULL, wcslen crashes
  if (data == nullptr)
    data = "";

  // the size + 1 ! free the parameter in GameEventHandler
  COPYDATASTRUCT aCopy = {nModeId, strlen(data) + 1, (PVOID)strdup(data)};

  // GameEventHandler handle WM_COPYDATA return TRUE!
  LRESULT res = SendMessage(hWnd, WM_COPYDATA, (WPARAM)D2GFX_GetHwnd(), (LPARAM)&aCopy);

  free(windowClassName);
  free(windowName);
  JS_FreeCString(ctx, data);
  
  //return 1
  return JS_NewInt32(ctx, res);
}

static const JSCFunctionListEntry js_boot_funcs[] = {
    // "get" functions
    JS_CFUNC_DEF("getPath", 0, my_getPath),
    JS_CFUNC_DEF("getCollision", 0, my_getCollision),
    JS_CFUNC_DEF("getCursorType", 0, my_getCursorType),
    JS_CFUNC_DEF("getSkillByName", 1, my_getSkillByName),
    JS_CFUNC_DEF("getSkillById", 1, my_getSkillById),
    JS_CFUNC_DEF("getLocaleString", 1, my_getLocaleString),
    JS_CFUNC_DEF("getTextSize", 2, my_getTextSize),
    JS_CFUNC_DEF("getThreadPriority", 0, my_getThreadPriority),
    JS_CFUNC_DEF("getUIFlag", 1, my_getUIFlag),
    JS_CFUNC_DEF("getTradeInfo", 0, my_getTradeInfo),
    JS_CFUNC_DEF("getWaypoint", 1, my_getWaypoint),
    JS_CFUNC_DEF("getBaseStat", 0, my_getBaseStat),
    JS_CFUNC_DEF("getPlayerFlag", 2, my_getPlayerFlag),
    JS_CFUNC_DEF("getTickCount", 0, my_getTickCount),
    JS_CFUNC_DEF("getIsTalkingNPC", 0, my_getIsTalkingNPC),
    JS_CFUNC_DEF("getDialogLines", 0, my_getDialogLines),

    // utility functions that don't have anything to do with the game
    JS_CFUNC_DEF("handler", 0, my_handler),
    JS_CFUNC_DEF("debugLog", 1, my_debugLog),
    JS_CFUNC_DEF("delay", 1, my_delay),
    JS_CFUNC_DEF("print", 1, my_print),
    JS_CFUNC_DEF("gamePrint", 1, my_gamePrint),
    JS_CFUNC_DEF("load", 1, my_load),
    JS_CFUNC_DEF("clearAllEvents", 0, my_clearAllEvents),
    JS_CFUNC_DEF("addEventListener", 2, my_addEventListener),
    JS_CFUNC_DEF("removeEventListener", 2, my_removeEventListener),
    JS_CFUNC_DEF("scriptBroadcast", 1, my_scriptBroadcast),
    JS_CFUNC_DEF("rand", 0, my_rand),
    JS_CFUNC_DEF("sendCopyData", 4, my_sendCopyData),

    JS_CFUNC_DEF("version", 0, my_version),
    JS_CFUNC_DEF("dumpLevel", 2, my_dumpLevel),

    JS_CFUNC_DEF("showConsole", 0, my_showConsole),
    JS_CFUNC_DEF("hideConsole", 0, my_hideConsole),

    // game functions that don't have anything to do with gathering data
    JS_CFUNC_DEF("submitItem", 0, my_submitItem),
    JS_CFUNC_DEF("getMouseCoords", 1, my_getMouseCoords),
    JS_CFUNC_DEF("acceptTrade", 0, my_acceptTrade),
    JS_CFUNC_DEF("tradeOk", 0, my_tradeOk),
    JS_CFUNC_DEF("beep", 0, my_beep),
    JS_CFUNC_DEF("gold", 1, my_gold),
    JS_CFUNC_DEF("playSound", 1, my_playSound),
    JS_CFUNC_DEF("quit", 0, my_quit),
    JS_CFUNC_DEF("say", 1, my_say),
    JS_CFUNC_DEF("quitGame", 0, my_quitGame),
    JS_CFUNC_DEF("weaponSwitch", 0, my_weaponSwitch),
    JS_CFUNC_DEF("transmute", 0, my_transmute),
    JS_CFUNC_DEF("useStatPoint", 1, my_useStatPoint),
    JS_CFUNC_DEF("useSkillPoint", 1, my_useSkillPoint),
    JS_CFUNC_DEF("takeScreenshot", 0, my_takeScreenshot),
    JS_CFUNC_DEF("getPacket", 0, my_getPacket),
    JS_CFUNC_DEF("sendPacket", 1, my_sendPacket),
    JS_CFUNC_DEF("getIP", 0, my_getIP),
    JS_CFUNC_DEF("sendClick", 0, my_sendClick),
    JS_CFUNC_DEF("sendKey", 0, my_sendKey),
    JS_CFUNC_DEF("revealLevel", 0, my_revealLevel),
};

static int js_boot_init(JSContext *ctx, JSModuleDef *m)
{
  JS_NewClassID(&dialogLine_class_id);

  JS_SetModuleExportList(ctx, m, js_boot_funcs, ARRAYSIZE(js_boot_funcs));
  // ScreenHook
  js_module_hook_init(ctx, m);
  // Unit
  js_module_unit_init(ctx, m);
  // PresetUnit
  js_module_presetunit_init(ctx, m);
  // Room
  js_module_room_init(ctx, m);
  // Area
  js_module_area_init(ctx, m);
  // Exits
  js_module_exit_init(ctx, m);

  // Script
  js_module_script_init(ctx, m);
  // Party
  js_module_party_init(ctx, m);
  // FileTools
  js_module_filetools_init(ctx, m);
  // Menu
  js_module_menu_init(ctx, m);
  // Profile
  js_module_profile_init(ctx, m);
  // Control
  js_module_control_init(ctx, m);
  // Hash
  js_module_hash_init(ctx, m);

  return TRUE;
}

JSModuleDef *js_init_module_boot(JSContext *ctx, const char *module_name)
{
  JSModuleDef *m;
  m = JS_NewCModule(ctx, module_name, js_boot_init);
  if (!m)
    return NULL;

  JS_AddModuleExportList(ctx, m, js_boot_funcs, ARRAYSIZE(js_boot_funcs));

  // ScreenHook
  js_module_hook_export(ctx, m);
  // Unit
  js_module_unit_export(ctx, m);
  // PresetUnit
  js_module_presetunit_export(ctx, m);
  // Room
  js_module_room_export(ctx, m);
  // Area
  js_module_area_export(ctx, m);
  // Exits
  js_module_exit_export(ctx, m);
  // Script
  js_module_script_export(ctx, m);
  // Party
  js_module_party_export(ctx, m);
  // FileTools
  js_module_filetools_export(ctx, m);
  // Menu
  js_module_menu_export(ctx, m);
  // Profile
  js_module_profile_export(ctx, m);
  // Control
  js_module_control_export(ctx, m);
  // Hash
  js_module_hash_export(ctx, m);

  return m;
}
