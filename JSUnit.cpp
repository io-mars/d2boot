#include "JSUnit.h"
#include "Unit.h"
#include "Helpers.h"
#include "D2Boot.h"
#include "CriticalSections.h"
#include "Offset.h"
#include "MPQStats.h"
#include "ScriptEngine.h"

enum unit_id
{
  UNIT_TYPE,
  UNIT_CLASSID,
  UNIT_MODE,
  UNIT_NAME,
  UNIT_ACT,
  UNIT_ID,
  UNIT_XPOS,
  UNIT_YPOS,
  UNIT_TARGETX,
  UNIT_TARGETY,
  UNIT_AREA,
  UNIT_HP,
  UNIT_HPMAX,
  UNIT_MP,
  UNIT_MPMAX,
  UNIT_STAMINA,
  UNIT_STAMINAMAX,
  UNIT_CHARLVL,
  UNIT_ITEMCOUNT,
  UNIT_OWNER,
  UNIT_OWNERTYPE,
  UNIT_SPECTYPE,
  UNIT_DIRECTION,
  UNIT_UNIQUEID,
  ITEM_CODE = 50,
  ITEM_PREFIX,
  ITEM_SUFFIX,
  ITEM_PREFIXES,
  ITEM_SUFFIXES,
  ITEM_PREFIXNUM,
  ITEM_SUFFIXNUM,
  ITEM_PREFIXNUMS,
  ITEM_SUFFIXNUMS,
  ITEM_FNAME,
  ITEM_QUALITY,
  ITEM_NODE,
  ITEM_LOC,
  ITEM_SIZEX,
  ITEM_SIZEY,
  ITEM_TYPE,
  ITEM_DESC,
  ITEM_BODYLOCATION,
  ITEM_LEVEL,
  ITEM_LEVELREQ,
  ITEM_GFX,
  OBJECT_TYPE = 80,
  OBJECT_LOCKED,
  ME_ACCOUNT = 100,
  ME_CHARNAME,
  ME_DIFF,
  ME_MAXDIFF,
  ME_GAMENAME,
  ME_GAMEPASSWORD,
  ME_GAMESERVERIP,
  ME_GAMESTARTTIME,
  ME_GAMETYPE,
  ME_ITEMONCURSOR,
  ME_AUTOMAP,
  ME_LADDER,
  ME_PING,
  ME_FPS,
  ME_PLAYERTYPE,
  ME_REALM,
  ME_REALMSHORT,
  ME_MERCREVIVECOST,
  ME_RUNWALK,
  ME_WSWITCH,
  ME_CHICKENHP,
  ME_CHICKENMP,
  ME_QUITONHOSTILE,
  ME_BLOCKKEYS,
  ME_BLOCKMOUSE,
  ME_GAMEREADY,
  ME_PROFILE,
  ME_NOPICKUP,
  ME_PID,
  ME_UNSUPPORTED,
  ME_CHARFLAGS,
  ME_MAPID,
  OOG_SCREENSIZE = 150,
  OOG_WINDOWTITLE,
  OOG_INGAME,
  OOG_QUITONERROR,
  OOG_MAXGAMETIME,
};

JSClassID unit_class_id;

static void js_unit_finalizer(JSRuntime *rt, JSValue val)
{
  Private *pUnit = (Private *)JS_GetOpaque(val, unit_class_id);
  if (pUnit)
  {
    switch (pUnit->dwPrivateType)
    {
    case PRIVATE_UNIT:
    {
      myUnit *unit = (myUnit *)pUnit;
      js_free_rt(rt, unit);
      break;
    }
    case PRIVATE_ITEM:
    {
      invUnit *unit = (invUnit *)pUnit;
      js_free_rt(rt, unit);
      break;
    }
    }
  }
}

static JSClassDef js_unit_class = {
    "Unit",
    .finalizer = js_unit_finalizer,
};

static JSValue js_unit_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

static JSValue get_item_property(JSContext *ctx, JSValueConst this_val, int magic, UnitAny *pUnitAny)
{
  // myUnit *pUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  // if (!pUnit || (pUnit->dwPrivateType & PRIVATE_ITEM) != PRIVATE_ITEM)
  //   return JS_FALSE;

  // UnitAny *pUnitAny = D2CLIENT_FindUnit(pUnit->dwUnitId, pUnit->dwType);

  // if (pUnitAny->dwType != UNIT_ITEM || !pUnitAny->pItemData)
  //   return JS_FALSE;

  switch (magic)
  {
  case ITEM_CODE:
  {
    ItemTxt *pTxt = D2COMMON_GetItemText(pUnitAny->dwTxtFileNo);
    if (!pTxt)
      return JS_NewString(ctx, "Unknown");

    char szCode[4];
    memcpy(szCode, pTxt->szCode, 3);
    szCode[3] = 0x00;
    return JS_NewString(ctx, szCode);
  }

  break;
  case ITEM_PREFIX:
    if (D2COMMON_GetItemMagicalMods(pUnitAny->pItemData->wMagicPrefix[0]))
      return JS_NewString(ctx, D2COMMON_GetItemMagicalMods(pUnitAny->pItemData->wMagicPrefix[0]));

    break;
  case ITEM_SUFFIX:
    if (D2COMMON_GetItemMagicalMods(pUnitAny->pItemData->wMagicSuffix[0]))
      return JS_NewString(ctx, D2COMMON_GetItemMagicalMods(pUnitAny->pItemData->wMagicSuffix[0]));

    break;
  case ITEM_PREFIXES:
  {
    JSValue pReturnArray = JS_NewArray(ctx);

    for (int i = 0; i < 3; i++)
    {
      if (D2COMMON_GetItemMagicalMods(pUnitAny->pItemData->wMagicPrefix[i]))
      {
        JSValue nPrefix = JS_NewString(ctx, D2COMMON_GetItemMagicalMods(pUnitAny->pItemData->wMagicPrefix[i]));
        JS_DefinePropertyValueUint32(ctx, pReturnArray, i, nPrefix, JS_PROP_C_W_E);
      }
    }
    return pReturnArray;
  }

  break;
  case ITEM_SUFFIXES:
  {
    JSValue pReturnArray = JS_NewArray(ctx);

    for (int i = 0; i < 3; i++)
    {
      if (D2COMMON_GetItemMagicalMods(pUnitAny->pItemData->wMagicSuffix[i]))
      {
        JSValue nSuffix = JS_NewString(ctx, D2COMMON_GetItemMagicalMods(pUnitAny->pItemData->wMagicSuffix[i]));
        JS_DefinePropertyValueUint32(ctx, pReturnArray, i, nSuffix, JS_PROP_C_W_E);
      }
    }
    return pReturnArray;
  }

  break;
  case ITEM_PREFIXNUM:
    return JS_NewUint32(ctx, pUnitAny->pItemData->wMagicPrefix[0]);

    break;
  case ITEM_SUFFIXNUM:
    return JS_NewUint32(ctx, pUnitAny->pItemData->wMagicSuffix[0]);

    break;
  case ITEM_PREFIXNUMS:
  {
    JSValue pReturnArray = JS_NewArray(ctx);

    for (int i = 0; i < 3; i++)
    {
      if (pUnitAny->pItemData->wMagicPrefix[i])
      {
        JSValue nPrefixnum = JS_NewUint32(ctx, pUnitAny->pItemData->wMagicPrefix[i]);
        JS_DefinePropertyValueUint32(ctx, pReturnArray, i, nPrefixnum, JS_PROP_C_W_E);
      }
    }
    return pReturnArray;
  }

  break;
  case ITEM_SUFFIXNUMS:
  {
    JSValue pReturnArray = JS_NewArray(ctx);

    for (int i = 0; i < 3; i++)
    {
      if (pUnitAny->pItemData->wMagicSuffix[i])
      {
        JSValue nSuffixnum = JS_NewUint32(ctx, pUnitAny->pItemData->wMagicSuffix[i]);
        JS_DefinePropertyValueUint32(ctx, pReturnArray, i, nSuffixnum, JS_PROP_C_W_E);
      }
    }

    return pReturnArray;
  }

  break;
  case ITEM_FNAME:
  {
    wchar_t wszfname[256] = L"";
    D2CLIENT_GetItemName(pUnitAny, wszfname, _countof(wszfname));
    if (wcslen(wszfname) > 0)
      return JS_NewUTF8String(ctx, wszfname);
  }

  break;
  case ITEM_QUALITY:
    return JS_NewUint32(ctx, pUnitAny->pItemData->dwQuality);

    break;
  case ITEM_NODE:
    return JS_NewUint32(ctx, pUnitAny->pItemData->NodePage);

    break;
  case ITEM_LOC:
    return JS_NewUint32(ctx, pUnitAny->pItemData->GameLocation);

    break;
  case ITEM_SIZEX:
  {
    ItemTxt *pTxt = D2COMMON_GetItemText(pUnitAny->dwTxtFileNo);
    if (pTxt)
      return JS_NewUint32(ctx, pTxt->xSize);
  }

  break;
  case ITEM_SIZEY:
  {
    ItemTxt *pTxt = D2COMMON_GetItemText(pUnitAny->dwTxtFileNo);
    if (pTxt)
      return JS_NewUint32(ctx, pTxt->ySize);
  }

  break;
  case ITEM_TYPE:
  {
    ItemTxt *pTxt = D2COMMON_GetItemText(pUnitAny->dwTxtFileNo);
    if (pTxt)
      return JS_NewUint32(ctx, pTxt->nType);
  }

  break;
  case ITEM_DESC:
  {
    AutoCriticalRoom *cRoom = new AutoCriticalRoom;
    wchar_t wBuffer[2048] = L"";
    wchar_t bBuffer[1] = {1};

    if (pUnitAny->pItemData->pOwnerInventory && pUnitAny->pItemData->pOwnerInventory->pOwner)
    {
      ::WriteProcessMemory(GetCurrentProcess(), (void *)GetDllOffset(L"D2Client.dll", 0x11CB1C), bBuffer, 1, NULL);   // d2client + 0x11cb1c
      ::WriteProcessMemory(GetCurrentProcess(), (void *)GetDllOffset(L"D2Client.dll", 0x11CB28), &pUnitAny, 4, NULL); // d2client + 0x11cb28

      // D2CLIENT_LoadItemDesc(D2CLIENT_GetPlayerUnit(), 0);
      D2CLIENT_LoadItemDesc(pUnitAny->pItemData->pOwnerInventory->pOwner, 0);
      ReadProcessBYTES(GetCurrentProcess(), GetDllOffset(L"D2Win.dll", 0xC9E68), wBuffer, 2047); // d2win + 0xc9e68
    }
    delete cRoom;

    if (wcslen(wBuffer) > 0)
      return JS_NewUTF8String(ctx, wBuffer);
  }

  break;
  case ITEM_BODYLOCATION:
    return JS_NewUint32(ctx, pUnitAny->pItemData->BodyLocation);

    break;
  case ITEM_LEVEL:
    return JS_NewUint32(ctx, pUnitAny->pItemData->dwItemLevel);

    break;
  case ITEM_LEVELREQ:
    return JS_NewUint32(ctx, D2COMMON_GetItemLevelRequirement(pUnitAny, D2CLIENT_GetPlayerUnit()));

    break;
  case ITEM_GFX:
    return JS_NewUint32(ctx, pUnitAny->pItemData->bInvGfxIdx);

    break;
  default:
    break;
  }
  return JS_FALSE;
}

JSAPI_PGM(get_unit_property)
{
  if (ClientState() != ClientStateInGame)
    return JS_FALSE;

  myUnit *pUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  if (!pUnit || (pUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnitAny = D2CLIENT_FindUnit(pUnit->dwUnitId, pUnit->dwType);
  if (!pUnitAny)
    return JS_FALSE;

  Room1 *pRoom = NULL;

  switch (magic)
  {
  case UNIT_TYPE:
    return JS_NewUint32(ctx, pUnitAny->dwType);
  case UNIT_CLASSID:
    return JS_NewUint32(ctx, pUnitAny->dwTxtFileNo);
  case UNIT_MODE:
    return JS_NewUint32(ctx, pUnitAny->dwMode);
  case UNIT_NAME:
  {
    char szName[128] = "";
    GetUnitName(pUnitAny, szName, 128);
    return JS_NewString(ctx, szName);
  }
  case UNIT_ACT:
    return JS_NewUint32(ctx, pUnitAny->dwAct + 1);
  case UNIT_ID:
    return JS_NewUint32(ctx, pUnitAny->dwUnitId);
  case UNIT_XPOS:
    return JS_NewUint32(ctx, D2CLIENT_GetUnitX(pUnitAny));
  case UNIT_YPOS:
    return JS_NewUint32(ctx, D2CLIENT_GetUnitY(pUnitAny));
  case UNIT_TARGETX:
    switch (pUnit->dwType)
    {
    case 0:
    case 1:
    case 3:
      return JS_NewUint32(ctx, pUnitAny->pPath->xTarget);
    }
    break;
  case UNIT_TARGETY:
    switch (pUnit->dwType)
    {
    case 0:
    case 1:
    case 3:
      return JS_NewUint32(ctx, pUnitAny->pPath->yTarget);
    }
    break;
  case UNIT_AREA:
    pRoom = D2COMMON_GetRoomFromUnit(pUnitAny);
    if (pRoom && pRoom->pRoom2 && pRoom->pRoom2->pLevel)
      return JS_NewUint32(ctx, pRoom->pRoom2->pLevel->dwLevelNo);

    break;
  case UNIT_HP:
    return JS_NewUint32(ctx, D2COMMON_GetUnitStat(pUnitAny, 6, 0) >> 8);
  case UNIT_HPMAX:
    return JS_NewUint32(ctx, D2COMMON_GetUnitStat(pUnitAny, 7, 0) >> 8);
  case UNIT_MP:
    return JS_NewUint32(ctx, D2COMMON_GetUnitStat(pUnitAny, 8, 0) >> 8);
  case UNIT_MPMAX:
    return JS_NewUint32(ctx, D2COMMON_GetUnitStat(pUnitAny, 9, 0) >> 8);
  case UNIT_STAMINA:
    return JS_NewUint32(ctx, D2COMMON_GetUnitStat(pUnitAny, 10, 0) >> 8);
  case UNIT_STAMINAMAX:
    return JS_NewUint32(ctx, D2COMMON_GetUnitStat(pUnitAny, 11, 0) >> 8);
  case UNIT_CHARLVL:
    return JS_NewUint32(ctx, D2COMMON_GetUnitStat(pUnitAny, 12, 0));
  case UNIT_ITEMCOUNT:
    if (pUnitAny->pInventory)
      return JS_NewUint32(ctx, pUnitAny->pInventory->dwItemCount);
    break;
  case UNIT_OWNER:
    return JS_NewUint32(ctx, pUnitAny->dwOwnerId);
  case UNIT_OWNERTYPE:
    return JS_NewUint32(ctx, pUnitAny->dwOwnerType);
  case UNIT_SPECTYPE:
    if (pUnit->dwType == UNIT_MONSTER && pUnitAny->pMonsterData)
    {
      DWORD SpecType = 0;
      if (pUnitAny->pMonsterData->fMinion & 1)
        SpecType |= 0x08;
      if (pUnitAny->pMonsterData->fBoss & 1)
        SpecType |= 0x04;
      if (pUnitAny->pMonsterData->fChamp & 1)
        SpecType |= 0x02;
      if ((pUnitAny->pMonsterData->fBoss & 1) && (pUnitAny->pMonsterData->fNormal & 1))
        SpecType |= 0x01;
      if (pUnitAny->pMonsterData->fNormal & 1)
        SpecType |= 0x00;
      return JS_NewUint32(ctx, SpecType);
    }
    break;
  case UNIT_DIRECTION:
    if (pUnitAny->pPath && pUnitAny->pPath->pRoom1)
      return JS_NewUint32(ctx, pUnitAny->pPath->bDirection);
    break;
  case UNIT_UNIQUEID:
    if (pUnitAny->dwType == UNIT_MONSTER && pUnitAny->pMonsterData->fBoss && pUnitAny->pMonsterData->fNormal)
      return JS_NewUint32(ctx, pUnitAny->pMonsterData->wUniqueNo);
    else
      return JS_NewUint32(ctx, -1);
  case OBJECT_TYPE:
    if (pUnitAny->dwType == UNIT_OBJECT && pUnitAny->pObjectData)
    {
      pRoom = D2COMMON_GetRoomFromUnit(pUnitAny);
      if (pRoom && D2COMMON_GetLevelNoFromRoom(pRoom))
        return JS_NewUint32(ctx, pUnitAny->pObjectData->Type & 255);
      else
        return JS_NewUint32(ctx, pUnitAny->pObjectData->Type);
    }
    break;
  case OBJECT_LOCKED:
    if (pUnitAny->dwType == UNIT_OBJECT && pUnitAny->pObjectData)
      return JS_NewUint32(ctx, pUnitAny->pObjectData->ChestLocked);
    break;
  }

  if (pUnitAny->dwType == UNIT_ITEM && pUnitAny->pItemData)
    return get_item_property(ctx, this_val, magic, pUnitAny);

  return JS_FALSE;
}

JSAPI_PGM(get_me_property)
{
  BnetData *pData = *p_D2LAUNCH_BnData;
  GameStructInfo *pInfo = *p_D2CLIENT_GameInfo;
  switch (magic)
  {
  case ME_ACCOUNT:
    return JS_NewString(ctx, pData->szAccountName);
  case ME_CHARNAME:
    return JS_NewString(ctx, pData->szPlayerName);
  case ME_DIFF:
    return JS_NewUint32(ctx, D2CLIENT_GetDifficulty());
  case ME_MAXDIFF:
    return JS_NewUint32(ctx, pData->nMaxDiff);
  case ME_GAMENAME:
    return JS_NewString(ctx, pInfo->szGameName);
  case ME_GAMEPASSWORD:
    return JS_NewString(ctx, pInfo->szGamePassword);
  case ME_GAMESERVERIP:
    return JS_NewString(ctx, pInfo->szGameServerIp);
  case ME_GAMESTARTTIME:
    return JS_NewFloat64(ctx, Vars.dwGameTime);
  case ME_GAMETYPE:
    return JS_NewUint32(ctx, *p_D2CLIENT_ExpCharFlag);
  case ME_ITEMONCURSOR:
    return JS_NewBool(ctx, !!(D2CLIENT_GetCursorItem()));
  case ME_AUTOMAP:
    return JS_NewBool(ctx, *p_D2CLIENT_AutomapOn);
  case ME_LADDER:
    return JS_NewFloat64(ctx, pData->ladderflag);
  case ME_PING:
    return JS_NewUint32(ctx, *p_D2CLIENT_Ping);
  case ME_FPS:
    return JS_NewUint32(ctx, *p_D2CLIENT_FPS);
  case ME_PLAYERTYPE:
    return JS_NewBool(ctx, !!(pData->nCharFlags & PLAYER_TYPE_HARDCORE));
  case ME_REALM:
    return JS_NewString(ctx, pData->szRealmName);
  case ME_REALMSHORT:
    return JS_NewString(ctx, pData->szRealmName2);
  case ME_MERCREVIVECOST:
    return JS_NewUint32(ctx, *p_D2CLIENT_MercReviveCost);
  case ME_CHICKENHP:
    return JS_NewUint32(ctx, Vars.nChickenHP);
  case ME_CHICKENMP:
    return JS_NewUint32(ctx, Vars.nChickenMP);
  case ME_QUITONHOSTILE:
    return JS_NewBool(ctx, Vars.bQuitOnHostile);
  case ME_BLOCKKEYS:
    return JS_NewBool(ctx, Vars.bBlockKeys);
  case ME_BLOCKMOUSE:
    return JS_NewBool(ctx, Vars.bBlockMouse);
  case ME_GAMEREADY:
    return JS_NewBool(ctx, GameReady());
  case ME_PROFILE:
    return JS_NewUTF8String(ctx, Vars.szProfile);
  case ME_NOPICKUP:
    return JS_NewBool(ctx, !!*p_D2CLIENT_NoPickUp);
  case ME_PID:
    return JS_NewFloat64(ctx, GetCurrentProcessId());
  case ME_UNSUPPORTED:
    return JS_NewBool(ctx, Vars.bEnableUnsupported);
  case ME_CHARFLAGS:
    return JS_NewUint32(ctx, pData->nCharFlags);
  case ME_MAPID:
    return JS_NewUint32(ctx, *p_D2CLIENT_MapId);
  case OOG_INGAME:
    return JS_NewBool(ctx, (ClientState() == ClientStateMenu ? false : true));
  case OOG_QUITONERROR:
    return JS_NewBool(ctx, Vars.bQuitOnError);
  case OOG_MAXGAMETIME:
    return JS_NewUint32(ctx, Vars.dwMaxGameTime);
  case OOG_SCREENSIZE:
    return JS_NewUint32(ctx, D2GFX_GetScreenSize());
  case OOG_WINDOWTITLE:
  {
    wchar_t szTitle[128];
    GetWindowText(D2GFX_GetHwnd(), szTitle, 128);
    return JS_NewUTF8String(ctx, szTitle);
  }
  }

  myUnit *pUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  if (!pUnit || (pUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnitAny = D2CLIENT_FindUnit(pUnit->dwUnitId, pUnit->dwType);
  switch (magic)
  {
  case ME_RUNWALK:
    if (pUnitAny == D2CLIENT_GetPlayerUnit())
      return JS_NewUint32(ctx, *p_D2CLIENT_AlwaysRun);
    break;
  case ME_WSWITCH:
    if (pUnitAny == D2CLIENT_GetPlayerUnit())
      return JS_NewUint32(ctx, *p_D2CLIENT_bWeapSwitch);
    break;
  }

  return JS_FALSE;
}

JSAPI_PSM(set_me_property)
{
  uint32_t iVal = 0;
  switch (magic)
  {
  case ME_CHICKENHP:
    if (JS_IsNumber(val))
    {
      JS_ToUint32(ctx, &iVal, val);
      Vars.nChickenHP = iVal;
      return JS_TRUE;
    }
    break;
  case ME_CHICKENMP:
    if (JS_IsNumber(val))
    {
      JS_ToUint32(ctx, &iVal, val);
      Vars.nChickenMP = iVal;
      return JS_TRUE;
    }
    break;
  case ME_QUITONHOSTILE:
    if (JS_IsBool(val))
    {
      Vars.bQuitOnHostile = !!JS_ToBool(ctx, val);
      return JS_TRUE;
    }
    break;
  case OOG_QUITONERROR:
    if (JS_IsBool(val))
    {
      Vars.bQuitOnError = !!JS_ToBool(ctx, val);
      return JS_TRUE;
    }
    break;
  case OOG_MAXGAMETIME:
    if (JS_IsNumber(val))
    {
      JS_ToUint32(ctx, &iVal, val);
      Vars.dwMaxGameTime = iVal;
      return JS_TRUE;
    }
    break;
  case ME_BLOCKKEYS:
    if (JS_IsBool(val))
    {
      Vars.bBlockKeys = !!JS_ToBool(ctx, val);
      return JS_TRUE;
    }
    break;
  case ME_BLOCKMOUSE:
    if (JS_IsBool(val))
    {
      Vars.bBlockMouse = !!JS_ToBool(ctx, val);
      return JS_TRUE;
    }
    break;
  case ME_RUNWALK:
    JS_ToUint32(ctx, &iVal, val);
    *p_D2CLIENT_AlwaysRun = !!iVal;
    return JS_TRUE;
    break;
  case ME_AUTOMAP:
    *p_D2CLIENT_AutomapOn = !!JS_ToBool(ctx, val) ? 1 : 0;
    return JS_TRUE;
    break;
  case ME_NOPICKUP:
    JS_ToUint32(ctx, &iVal, val);
    *p_D2CLIENT_NoPickUp = !!iVal;
    return JS_TRUE;
    break;
  }
  return JS_FALSE;
}

JSAPI_FUNC(unit_getItem)
{
  GAME_READY();

  myUnit *pmyUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);
  if (!pUnit || !pUnit->pInventory)
    return JS_FALSE;

  uint32_t nClassId = -1;
  uint32_t nMode = -1;
  uint32_t nUnitId = -1;
  char szName[128] = "";

  if (argc > 0 && JS_IsString(argv[0]))
  {
    const char *szText = JS_ToCString(ctx, argv[0]);
    strcpy_s(szName, sizeof(szName), szText);
    JS_FreeCString(ctx, szText);
  }

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &nClassId, argv[0]);

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &nMode, argv[1]);

  if (argc > 2 && JS_IsNumber(argv[2]))
    JS_ToUint32(ctx, &nUnitId, argv[2]);

  UnitAny *pItem = GetInvUnit(pUnit, szName, nClassId, nMode, nUnitId);
  if (!pItem)
    return JS_FALSE;

  invUnit *pmyItem = (invUnit *)js_mallocz(ctx, sizeof(*pmyItem));
  if (!pmyItem)
    return JS_FALSE;

  pmyItem->dwPrivateType = PRIVATE_ITEM;
  pmyItem->dwClassId = nClassId;
  pmyItem->dwMode = nMode;
  pmyItem->dwType = pItem->dwType;
  pmyItem->dwUnitId = pItem->dwUnitId;
  pmyItem->dwOwnerId = pmyUnit->dwUnitId;
  pmyItem->dwOwnerType = pmyUnit->dwType;
  strcpy_s(pmyItem->szName, sizeof(pmyItem->szName), szName);

  JSValue jsunit = BuildObject(ctx, unit_class_id, pmyItem);
  if (JS_IsException(jsunit))
  {
    js_free(ctx, pmyItem);
    pmyItem = nullptr;
    return JS_FALSE;
  }

  return jsunit;
}

JSAPI_FUNC(unit_getItems)
{
  GAME_READY();

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);

  if (!pUnit || !pUnit->pInventory || !pUnit->pInventory->pFirstItem)
    return JS_FALSE;

  JSValue returnArray = JS_NewArray(ctx);

  if (JS_IsException(returnArray))
    return JS_FALSE;

  DWORD dwArrayCount = 0;

  for (UnitAny *pItem = pUnit->pInventory->pFirstItem; pItem; pItem = D2COMMON_GetNextItemFromInventory(pItem), dwArrayCount++)
  {
    invUnit *pmyUnit = (invUnit *)js_mallocz(ctx, sizeof(*pmyUnit));
    if (!pmyUnit)
      continue;

    pmyUnit->dwPrivateType = PRIVATE_UNIT;
    pmyUnit->szName[0] = 0;
    pmyUnit->dwMode = pItem->dwMode;
    pmyUnit->dwClassId = pItem->dwTxtFileNo;
    pmyUnit->dwUnitId = pItem->dwUnitId;
    pmyUnit->dwType = UNIT_ITEM;
    pmyUnit->dwOwnerId = pUnit->dwUnitId;
    pmyUnit->dwOwnerType = pUnit->dwType;

    JSValue jsunit = BuildObject(ctx, unit_class_id, pmyUnit);
    if (JS_IsException(jsunit))
    {
      js_free(ctx, pmyUnit);
      pmyUnit = nullptr;
      JS_THROW_ERROR(ctx, "Failed to build item array");
    }

    JS_DefinePropertyValueUint32(ctx, returnArray, dwArrayCount, jsunit, JS_PROP_C_W_E);
  }
  return returnArray;
}

JSAPI_FUNC(unit_getState)
{
  GAME_READY();

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);

  if (!pUnit || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t nState;
  JS_ToUint32(ctx, &nState, argv[0]);

  // TODO: make these constants so we know what we're checking here
  if (nState > 183 || nState < 0)
    return JS_FALSE;

  return JS_NewBool(ctx, !!D2COMMON_GetUnitState(pUnit, nState));
}

static void InsertStatsNow(Stat *pStat, int nStat, JSContext *ctx, JSValue *pArray)
{
  if (pStat[nStat].wSubIndex > 0x200)
  {
    // subindex is the skill id and level
    int skill = pStat[nStat].wSubIndex >> 6, level = pStat[nStat].wSubIndex & 0x3F, charges = 0, maxcharges = 0;
    JSValue jsskill, jslevel, jscharges, jsmaxcharges;

    if (pStat[nStat].dwStatValue > 0x200)
    {
      charges = pStat[nStat].dwStatValue & 0xFF;
      maxcharges = pStat[nStat].dwStatValue >> 8;
    }

    JSValue val = JS_NewObject(ctx);
    if (JS_IsException(val))
      return;

    jsskill = JS_NewUint32(ctx, skill);
    jslevel = JS_NewUint32(ctx, level);
    // val is an anonymous object that holds properties
    if (JS_SetPropertyStr(ctx, val, "skill", jsskill) < 0 || JS_SetPropertyStr(ctx, val, "level", jslevel) < 0)
    {
      JS_FreeValue(ctx, val);
      JS_FreeValue(ctx, jsskill);
      JS_FreeValue(ctx, jslevel);
      return;
    }

    if (maxcharges > 0)
    {
      jscharges = JS_NewUint32(ctx, charges);
      jsmaxcharges = JS_NewUint32(ctx, maxcharges);

      if (JS_SetPropertyStr(ctx, val, "charges", jscharges) < 0 || JS_SetPropertyStr(ctx, val, "maxcharges", jsmaxcharges) < 0)
      {
        JS_FreeValue(ctx, val);
        JS_FreeValue(ctx, jsskill);
        JS_FreeValue(ctx, jslevel);
        JS_FreeValue(ctx, jscharges);
        JS_FreeValue(ctx, jsmaxcharges);
        return;
      }
    }

    // find where we should put it
    JSValue index = JS_GetPropertyUint32(ctx, *pArray, pStat[nStat].wStatIndex);
    if (JS_IsException(index))
    {
      JS_FreeValue(ctx, val);
      JS_FreeValue(ctx, jsskill);
      JS_FreeValue(ctx, jslevel);
      JS_FreeValue(ctx, jscharges);
      JS_FreeValue(ctx, jsmaxcharges);
      return;
    }

    if (JS_IsUndefined(index))
    {
      JS_SetPropertyUint32(ctx, *pArray, pStat[nStat].wStatIndex, val);
      return;
    }

    if (JS_IsArray(ctx, index))
    {
      // it is an array, append the new value
      JSValue jslength = JS_GetPropertyStr(ctx, index, "length");
      if (JS_IsException(jslength))
        return;

      uint32_t len;
      JS_ToUint32(ctx, &len, jslength);

      // free jslength now
      JS_FreeValue(ctx, jslength);

      // len++;
      // don't needed set pArray again
      JS_DefinePropertyValueUint32(ctx, index, len, val, JS_PROP_C_W_E);
    }
    else
    {
      // it's not an array, build one
      JSValue arr = JS_NewArray(ctx);
      JS_DefinePropertyValueUint32(ctx, arr, 0, index, JS_PROP_C_W_E);
      JS_DefinePropertyValueUint32(ctx, arr, 1, val, JS_PROP_C_W_E);
      JS_SetPropertyUint32(ctx, *pArray, pStat[nStat].wStatIndex, arr);
    }
  }
  else
  {
    // Make sure to bit shift life, mana and stamina properly!
    int value = pStat[nStat].dwStatValue;
    if (pStat[nStat].wStatIndex >= 6 && pStat[nStat].wStatIndex <= 11)
      value = value >> 8;

    JSValue val = JS_NewUint32(ctx, value);
    JSValue index = JS_GetPropertyUint32(ctx, *pArray, pStat[nStat].wStatIndex);
    if (JS_IsUndefined(index))
    {
      // the array index doesn't exist, make it
      index = JS_NewArray(ctx);
      if (JS_IsException(index))
      {
        JS_FreeValue(ctx, val);
        return;
      }
    }

    // index now points to the correct array index
    JS_SetPropertyUint32(ctx, index, pStat[nStat].wSubIndex, val);
    // alway set index JSValue, avoid object leaks!
    JS_SetPropertyUint32(ctx, *pArray, pStat[nStat].wStatIndex, index);
  }
}

static void InsertStatsToGenericObject(UnitAny *pUnit, StatList *pStatList, JSContext *ctx, JSValue *pArray)
{
  Stat *pStat = NULL;
  if (!pStatList)
    return;

  if ((pStatList->dwUnitId == pUnit->dwUnitId && pStatList->dwUnitType == pUnit->dwType) || pStatList->pUnit == pUnit)
  {
    pStat = pStatList->StatVec.pStats;
    for (int nStat = 0; nStat < pStatList->StatVec.wCount; nStat++)
    {
      InsertStatsNow(pStat, nStat, ctx, pArray);
    }
  }
  if (pStatList->dwFlags >> 24 & 0x80)
  {
    pStat = pStatList->SetStatVec.pStats;
    for (int nStat = 0; nStat < pStatList->SetStatVec.wCount; nStat++)
    {
      InsertStatsNow(pStat, nStat, ctx, pArray);
    }
  }
}

JSAPI_FUNC(unit_getStat)
{
  GAME_READY();

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);

  if (!pUnit)
    return JS_FALSE;

  int32_t nStat = 0;
  int32_t nSubIndex = 0;

  if (argc > 0)
    JS_ToInt32(ctx, &nStat, argv[0]);
  if (argc > 1)
    JS_ToInt32(ctx, &nSubIndex, argv[1]);

  if (nStat >= STAT_HP && nStat <= STAT_MAXSTAMINA)
    return JS_NewInt32(ctx, D2COMMON_GetUnitStat(pUnit, nStat, nSubIndex) >> 8);
  else if (nStat == STAT_EXP || nStat == STAT_LASTEXP || nStat == STAT_NEXTEXP)
    return JS_NewInt32(ctx, D2COMMON_GetUnitStat(pUnit, nStat, nSubIndex));
  else if (nStat == STAT_ITEMLEVELREQ)
    return JS_NewInt32(ctx, D2COMMON_GetItemLevelRequirement(pUnit, D2CLIENT_GetPlayerUnit()));
  else if (nStat == -1)
  {
    StatList *pStatList = D2COMMON_GetStatList(pUnit, 0, 0x40);
    // Mars GetStatList by -1 alway return NULL?
    if (!pStatList)
      pStatList = pUnit->pStats;

    if (pStatList)
    {
      Stat aStatList[256] = {0};
      DWORD dwStats = D2COMMON_CopyStatList(pStatList, (Stat *)aStatList, 256);
      JSValue pReturnArray = JS_NewArray(ctx);

      for (int j = 0; j < pUnit->pStats->StatVec.wCount; j++)
      {
        bool inListAlready = false;
        for (DWORD k = 0; k < dwStats; k++)
        {
          if (aStatList[k].dwStatValue == pUnit->pStats->StatVec.pStats[j].dwStatValue &&
              aStatList[k].wStatIndex == pUnit->pStats->StatVec.pStats[j].wStatIndex && aStatList[k].wSubIndex == pUnit->pStats->StatVec.pStats[j].wSubIndex)
            inListAlready = true;
        }
        if (!inListAlready)
        {

          aStatList[dwStats].dwStatValue = pUnit->pStats->StatVec.pStats[j].dwStatValue;
          aStatList[dwStats].wStatIndex = pUnit->pStats->StatVec.pStats[j].wStatIndex;
          aStatList[dwStats].wSubIndex = pUnit->pStats->StatVec.pStats[j].wSubIndex;
          dwStats++;
        }
      }
      for (DWORD i = 0; i < dwStats; i++)
      {
        JSValue pArrayInsert = JS_NewArray(ctx);

        JSValue nIndex = JS_NewInt32(ctx, aStatList[i].wStatIndex);
        JSValue nSubIndex = JS_NewInt32(ctx, aStatList[i].wSubIndex);
        JSValue nValue = JS_NewInt32(ctx, aStatList[i].dwStatValue);

        JS_DefinePropertyValueUint32(ctx, pArrayInsert, 0, nIndex, JS_PROP_C_W_E);
        JS_DefinePropertyValueUint32(ctx, pArrayInsert, 1, nSubIndex, JS_PROP_C_W_E);
        JS_DefinePropertyValueUint32(ctx, pArrayInsert, 2, nValue, JS_PROP_C_W_E);

        JS_DefinePropertyValueUint32(ctx, pReturnArray, i, pArrayInsert, JS_PROP_C_W_E);
      }
      return pReturnArray;
    }
    return JS_FALSE;
  }
  else if (nStat == -2)
  {
    JSValue pArray = JS_NewArray(ctx);
    // iomars duplicate bug, cause quickjs assert error. what diff pUnit->pStats and D2COMMON_GetStatList?
    // InsertStatsToGenericObject(pUnit, pUnit->pStats, ctx, &pArray);
    InsertStatsToGenericObject(pUnit, D2COMMON_GetStatList(pUnit, 0, 0x40), ctx, &pArray);
    return pArray;
  }
  else
  {
    long result = D2COMMON_GetUnitStat(pUnit, nStat, nSubIndex);
    if (result == 0) // if stat isnt found look up preset list
    {
      StatList *pStatList = D2COMMON_GetStatList(pUnit, 0, 0x40);
      Stat aStatList[256] = {0};
      if (pStatList)
      {
        DWORD dwStats = D2COMMON_CopyStatList(pStatList, (Stat *)aStatList, 256);
        for (DWORD i = 0; i < dwStats; i++)
        {
          if (nStat == aStatList[i].wStatIndex && nSubIndex == aStatList[i].wSubIndex)
            result = (aStatList[i].dwStatValue);
        }
      }
    }
    return JS_NewInt32(ctx, result);
  }
  return JS_FALSE;
}

JSAPI_FUNC(unit_repair)
{
  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);
  if (!pUnit)
    return JS_FALSE;

  BYTE aPacket[17] = {0};
  aPacket[0] = 0x35;
  *(DWORD *)&aPacket[1] = *p_D2CLIENT_RecentInteractId;
  aPacket[16] = 0x80;
  D2NET_SendPacket(17, 1, aPacket);

  // note: this crashes while minimized
  // D2CLIENT_PerformNpcAction(pUnit,1, NULL);
  return JS_TRUE;
}

JSAPI_FUNC(unit_interact)
{
  GAME_READY();

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);

  if (!pUnit || pUnit == D2CLIENT_GetPlayerUnit())
    return JS_FALSE;

  if (pUnit->dwType == UNIT_ITEM && pUnit->dwMode != ITEM_MODE_ON_GROUND && pUnit->dwMode != ITEM_MODE_BEING_DROPPED)
  {
    int nLocation = GetItemLocation(pUnit);

    BYTE aPacket[13] = {0};

    if (nLocation == LOCATION_INVENTORY || nLocation == LOCATION_STASH)
    {
      aPacket[0] = 0x20;
      *(DWORD *)&aPacket[1] = pUnit->dwUnitId;
      *(DWORD *)&aPacket[5] = D2CLIENT_GetPlayerUnit()->pPath->xPos;
      *(DWORD *)&aPacket[9] = D2CLIENT_GetPlayerUnit()->pPath->yPos;
      D2NET_SendPacket(13, 1, aPacket);
      return JS_TRUE;
    }
    else if (nLocation == LOCATION_BELT)
    {
      aPacket[0] = 0x26;
      *(DWORD *)&aPacket[1] = pUnit->dwUnitId;
      *(DWORD *)&aPacket[5] = 0;
      *(DWORD *)&aPacket[9] = 0;
      D2NET_SendPacket(13, 1, aPacket);
      return JS_TRUE;
    }
  }

  if (pUnit->dwType == UNIT_OBJECT && argc == 1 && JS_IsNumber(argv[0]))
  {
    // TODO: check the range on argv[0] to make sure it won't crash the game - Done! TechnoHunter
    uint32_t nWaypointID;
    JS_ToUint32(ctx, &nWaypointID, argv[0]);

    int retVal = 0;
    if (FillBaseStat("levels", nWaypointID, "Waypoint", &retVal, sizeof(int)))
      if (retVal == 255)
        return JS_FALSE;

    D2CLIENT_TakeWaypoint(pUnit->dwUnitId, nWaypointID);
    if (!D2CLIENT_GetUIState(UI_GAME))
      D2CLIENT_CloseInteract();

    return JS_TRUE;
  }
  //	else if(pUnit->dwType == UNIT_PLAYER && argc == 1 && JSVAL_IS_INT(argv[0]) && JSVAL_TO_INT(argv[0]) == 1)
  //	{
  // Accept Trade
  //	}
  else
  {
    ClickMap(0, D2CLIENT_GetUnitX(pUnit), D2CLIENT_GetUnitY(pUnit), FALSE, pUnit);
    // D2CLIENT_Interact(pUnit, 0x45);
    return JS_TRUE;
  }

  return JS_FALSE;
}

JSAPI_FUNC(unit_getSkill)
{
  if (argc == 0 || argc > 3)
    return JS_FALSE;

  GAME_READY();

  bool nCharge = false;
  uint32_t nSkillId = 0;
  uint32_t nExt = 0;

  myUnit *pmyUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  if (!pmyUnit)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);
  if (!pUnit)
    return JS_FALSE;

  if (argc > 0)
  {
    if (!JS_IsNumber(argv[0]))
      return JS_FALSE;

    JS_ToUint32(ctx, &nSkillId, argv[0]);
  }

  if (argc > 1)
  {
    if (!JS_IsNumber(argv[1]))
      return JS_FALSE;

    JS_ToUint32(ctx, &nExt, argv[1]);
  }

  if (argc == 3)
  {
    if (!JS_IsBool(argv[2]))
      return JS_FALSE;

    nCharge = !!JS_ToBool(ctx, argv[2]);
  }

  if (argc == 1)
  {
    WORD wLeftSkillId = pUnit->pInfo->pLeftSkill->pSkillInfo->wSkillId;
    WORD wRightSkillId = pUnit->pInfo->pRightSkill->pSkillInfo->wSkillId;
    switch (nSkillId)
    {
    case 0:
    {
      int row = 0;
      if (FillBaseStat("skills", wRightSkillId, "skilldesc", &row, sizeof(int)))
        if (FillBaseStat("skilldesc", row, "str name", &row, sizeof(int)))
        {
          wchar_t *szName = D2LANG_GetLocaleText((WORD)row);
          if (wcslen(szName) > 0)
            return JS_NewUTF8String(ctx, szName);
        }
    }
    break;
    case 1:
    {
      int row = 0;
      if (FillBaseStat("skills", wLeftSkillId, "skilldesc", &row, sizeof(int)))
        if (FillBaseStat("skilldesc", row, "str name", &row, sizeof(int)))
        {
          wchar_t *szName = D2LANG_GetLocaleText((WORD)row);
          if (wcslen(szName) > 0)
            return JS_NewUTF8String(ctx, szName);
        }
    }
    break;

    case 2:
      return JS_NewUint32(ctx, wRightSkillId);
      break;
    case 3:
      return JS_NewUint32(ctx, wLeftSkillId);
      break;
    case 4:
    {
      JSValue returnArray = JS_NewArray(ctx);

      int i = 0;
      for (Skill *pSkill = pUnit->pInfo->pFirstSkill; pSkill; pSkill = pSkill->pNextSkill)
      {
        JSValue arrayInsert = JS_NewArray(ctx);
        if (JS_IsException(arrayInsert))
          continue;

        JSValue nId = JS_NewUint32(ctx, pSkill->pSkillInfo->wSkillId);
        JSValue nBase = JS_NewUint32(ctx, pSkill->dwSkillLevel);
        JSValue nTotal = JS_NewUint32(ctx, D2COMMON_GetSkillLevel(pUnit, pSkill, 1));
        JS_DefinePropertyValueUint32(ctx, arrayInsert, 0, nId, JS_PROP_C_W_E);
        JS_DefinePropertyValueUint32(ctx, arrayInsert, 1, nBase, JS_PROP_C_W_E);
        JS_DefinePropertyValueUint32(ctx, arrayInsert, 2, nTotal, JS_PROP_C_W_E);

        JS_DefinePropertyValueUint32(ctx, returnArray, i, arrayInsert, JS_PROP_C_W_E);
        i++;
      }
      return returnArray;
      break;
    }
    default:
      return JS_FALSE;
      break;
    }
    return JS_FALSE;
  }

  if (pUnit && pUnit->pInfo && pUnit->pInfo->pFirstSkill)
  {
    for (Skill *pSkill = pUnit->pInfo->pFirstSkill; pSkill; pSkill = pSkill->pNextSkill)
    {
      if (pSkill->pSkillInfo && pSkill->pSkillInfo->wSkillId == nSkillId)
      {
        if ((argc == 2 && pSkill->IsCharge == 0) || (argc == 3 && (nCharge == false || pSkill->IsCharge == 1)))
        {
          return JS_NewUint32(ctx, D2COMMON_GetSkillLevel(pUnit, pSkill, nExt));
        }
      }
    }
  }

  return JS_FALSE;
}

// unit.setSkill( int skillId OR String skillName, int hand [, int itemGlobalId] );
JSAPI_FUNC(unit_setSkill)
{
  GAME_READY();

  // nSkillId should < 0xFFFF
  uint32_t nSkillId = (uint32_t)-1;
  bool nHand = false;
  uint32_t itemId = (uint32_t)-1;

  if (argc < 1)
    return JS_FALSE;

  if (JS_IsString(argv[0]))
  {
    const char *name = JS_ToCString(ctx, argv[0]);
    nSkillId = GetSkillByName(name);
    JS_FreeCString(ctx, name);
  }
  else if (JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &nSkillId, argv[0]);
  else
    return JS_FALSE;

  if (argc > 1)
  {
    if (JS_IsBool(argv[1]) || JS_IsNumber(argv[1]))
      nHand = !!JS_ToBool(ctx, argv[1]);
    else
      return JS_FALSE;
  }

  if (argc == 3 && JS_IsObject(argv[2]))
  {
    if (JS_IsInstanceOf(ctx, unit_class_id, argv[2]))
    {
      myUnit *unit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
      if (unit->dwType == UNIT_ITEM)
        itemId = unit->dwUnitId;
    }
  }

  if (SetSkill(ctx, nSkillId, nHand, itemId))
    return JS_TRUE;

  return JS_FALSE;
}

JSAPI_FUNC(my_overhead)
{
  GAME_READY();

  myUnit *pmyUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);

  if (!pUnit)
    return JS_FALSE;

  if (!JS_IsNull(argv[0]) && JS_IsString(argv[0]))
  {
    wchar_t *lpszText = nullptr;
    JS_ToUnicodeString(ctx, &lpszText, argv[0]);

    // utf-8
    // char *lpszText = (char *)JS_ToCString(ctx, argv[0]);
    if (lpszText && lpszText[0])
    {
      // Convert back to multibyte in locale code page
      char *szText = UnicodeToAnsi(lpszText, CP_ACP);

      // Unicode 0xFF -- > CP_ACP-- > ascii 0x3F 0x63
      ToColorString(szText);

      OverheadMsg *pMsg = D2COMMON_GenerateOverheadMsg(0, szText, *p_D2CLIENT_OverheadTrigger);
      if (pMsg)
      {
        // D2COMMON_FixOverheadMsg(pMsg, 0);
        pUnit->pOMsg = pMsg;
      }
      free(szText);
      // JS_FreeCString(ctx, lpszText);
    }
    free(lpszText);
  }

  return JS_TRUE;
}

JSAPI_FUNC(my_updatePlayerGid)
{
  GAME_READY();

  D2CLIENT_InitInventory();
  myUnit *pmyUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pPlayer = D2CLIENT_GetPlayerUnit();

  if (pPlayer == NULL)
    return JS_FALSE;

  pmyUnit->dwUnitId = pPlayer->dwUnitId;

  return JS_TRUE;
}

JSAPI_FUNC(unit_useMenu)
{
  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);
  if (!pUnit)
    return JS_FALSE;

  uint32_t nMenuId;
  JS_ToUint32(ctx, &nMenuId, argv[0]);

  return ClickNPCMenu(pUnit->dwTxtFileNo, nMenuId);
}

JSAPI_FUNC(item_shop)
{
  GAME_READY();

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;

  if (*p_D2CLIENT_TransactionDialog != 0 || *p_D2CLIENT_TransactionDialogs != 0 || *p_D2CLIENT_TransactionDialogs_2 != 0)
  {
    delete cRoom;
    return JS_FALSE;
  }

  myUnit *lpItem = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  if (!lpItem || (lpItem->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
  {
    delete cRoom;
    return JS_FALSE;
  }

  UnitAny *pItem = D2CLIENT_FindUnit(lpItem->dwUnitId, lpItem->dwType);
  if (!pItem || pItem->dwType != UNIT_ITEM)
  {
    delete cRoom;
    return JS_FALSE;
  }

  if (!D2CLIENT_GetUIState(UI_NPCSHOP))
  {
    delete cRoom;
    return JS_FALSE;
  }

  // Check if we are interacted.
  UnitAny *pNPC = D2CLIENT_GetCurrentInteractingNPC();
  if (!pNPC)
  {
    delete cRoom;
    return JS_FALSE;
  }

  uint32_t dwMode;
  JS_ToUint32(ctx, &dwMode, argv[argc - 1]);

  // Check for proper mode.
  // dwMode What to do with the item.1 - Sell, 2 - Buy, 6 - ?
  if ((dwMode != 1) && (dwMode != 2) && (dwMode != 6))
  {
    delete cRoom;
    return JS_FALSE;
  }

  // Selling an Item
  if (dwMode == 1)
  {
    // Check if we own the item!
    if (pItem->pItemData->pOwnerInventory->pOwner->dwUnitId != D2CLIENT_GetPlayerUnit()->dwUnitId)
    {
      delete cRoom;
      return JS_FALSE;
    }

    D2CLIENT_ShopAction(pItem, pNPC, pNPC, 1, 0, 1, 1, 0);
  }
  else
  {
    // Make sure the item is owned by the NPC interacted with.
    if (pItem->pItemData->pOwnerInventory->pOwner->dwUnitId != pNPC->dwUnitId)
    {
      delete cRoom;
      return JS_FALSE;
    }
    D2CLIENT_ShopAction(pItem, pNPC, pNPC, 0, 0, dwMode, 1, 0);
  }

  delete cRoom;
  return JS_TRUE;
}

JSAPI_FUNC(unit_cancel)
{
  GAME_READY();

  DWORD automapOn = *p_D2CLIENT_AutomapOn;
  uint32_t mode = -1;

  if (argc > 0)
  {
    if (JS_IsNumber(argv[0]))
      JS_ToUint32(ctx, &mode, argv[0]);
  }
  else if (IsScrollingText())
    mode = 3;
  else if (D2CLIENT_GetCurrentInteractingNPC())
    mode = 2;
  else if (D2CLIENT_GetCursorItem())
    mode = 1;
  else
    mode = 0;

  switch (mode)
  {
  case 0:
    D2CLIENT_CloseInteract();
    break;
  case 1:
    D2CLIENT_ClickMap(0, 10, 10, 0x08);
    break;
  case 2:
    D2CLIENT_CloseNPCInteract();
    break;
  case 3:
    D2CLIENT_ClearScreen();
    break;
  }

  *p_D2CLIENT_AutomapOn = automapOn;

  return JS_TRUE;
}

JSAPI_FUNC(my_revive)
{
  GAME_READY();

  BYTE pPacket[] = {0x41};
  D2NET_SendPacket(1, 1, pPacket);
  return JS_TRUE;
}

JSAPI_FUNC(unit_getQuest)
{
  GAME_READY();

  if (argc < 2 || !JS_IsNumber(argv[0]) || !JS_IsNumber(argv[1]))
    return JS_FALSE;

  uint32_t nAct, nQuest;
  JS_ToUint32(ctx, &nAct, argv[0]);
  JS_ToUint32(ctx, &nQuest, argv[1]);
  int res = D2COMMON_GetQuestFlag(D2CLIENT_GetQuestInfo(), nAct, nQuest);

  return JS_NewUint32(ctx, res);
}

JSAPI_FUNC(unit_getParent)
{
  GAME_READY();

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);

  if (!pUnit)
    return JS_FALSE;

  if (pUnit->dwType == UNIT_MONSTER)
  {
    DWORD dwOwnerId = D2CLIENT_GetMonsterOwner(pUnit->dwUnitId);
    if (dwOwnerId == (DWORD)-1)
      return JS_FALSE;

    UnitAny *pMonster = GetUnit(NULL, (DWORD)-1, (DWORD)-1, (DWORD)-1, dwOwnerId);
    if (!pMonster)
      return JS_FALSE;

    myUnit *pmyUnit = (myUnit *)js_mallocz(ctx, sizeof(*pmyUnit));
    if (!pmyUnit)
      return JS_FALSE;

    pmyUnit->dwPrivateType = PRIVATE_UNIT;
    pmyUnit->dwUnitId = pMonster->dwUnitId;
    pmyUnit->dwClassId = pMonster->dwTxtFileNo;
    pmyUnit->dwMode = pMonster->dwMode;
    pmyUnit->dwType = pMonster->dwType;
    pmyUnit->szName[0] = 0;

    JSValue jsunit = BuildObject(ctx, unit_class_id, pmyUnit);
    if (JS_IsException(jsunit))
    {
      js_free(ctx, pmyUnit);
      pmyUnit = nullptr;
      return JS_FALSE;
    }

    return jsunit;
  }
  else if (pUnit->dwType == UNIT_OBJECT)
  {
    if (pUnit->pObjectData)
    {
      char szBuffer[128] = "";
      strcpy_s(szBuffer, sizeof(szBuffer), pUnit->pObjectData->szOwner);

      return JS_NewString(ctx, szBuffer);
    }
  }
  else if (pUnit->dwType == UNIT_ITEM)
  {
    if (pUnit->pItemData && pUnit->pItemData->pOwnerInventory && pUnit->pItemData->pOwnerInventory->pOwner)
    {
      myUnit *pmyUnit = (myUnit *)js_mallocz(ctx, sizeof(*pmyUnit));
      if (!pmyUnit)
        return JS_FALSE;

      pmyUnit->dwPrivateType = PRIVATE_UNIT;
      pmyUnit->dwUnitId = pUnit->pItemData->pOwnerInventory->pOwner->dwUnitId;
      pmyUnit->dwClassId = pUnit->pItemData->pOwnerInventory->pOwner->dwTxtFileNo;
      pmyUnit->dwMode = pUnit->pItemData->pOwnerInventory->pOwner->dwMode;
      pmyUnit->dwType = pUnit->pItemData->pOwnerInventory->pOwner->dwType;
      pmyUnit->szName[0] = 0;
      JSValue jsunit = BuildObject(ctx, unit_class_id, pmyUnit);
      if (JS_IsException(jsunit))
      {
        js_free(ctx, pmyUnit);
        pmyUnit = nullptr;
        return JS_FALSE;
      }

      return jsunit;
    }
  }
  // MTODO
  // else if (pUnit->dwType == UNIT_MISSILE)
  // {
  //   myUnit *pmyUnit = (myUnit *)js_mallocz(ctx, sizeof(*pmyUnit));;
  //   if (!pmyUnit)
  //     return JS_FALSE;

  //   UnitAny *pOwner = D2COMMON_GetMissileOwnerUnit(pUnit);
  //   if (!pOwner)
  //     return JS_FALSE;

  //   pmyUnit->dwPrivateType = PRIVATE_UNIT;
  //   pmyUnit->dwUnitId = pOwner->dwUnitId;
  //   pmyUnit->dwClassId = pOwner->dwTxtFileNo;
  //   pmyUnit->dwMode = pOwner->dwMode;
  //   pmyUnit->dwType = pOwner->dwType;
  //   pmyUnit->szName[0] = 0;

  //   JSValue jsunit = BuildObject(ctx, unit_class_id, pmyUnit);
  //   if (JS_IsException(jsunit))
  // {
  // js_free(ctx, pmyUnit);
  //     return JS_FALSE;
  // }

  //   return jsunit;
  // }

  return JS_FALSE;
}

// Works only on players sinces monsters _CANT_ have mercs!
JSAPI_FUNC(unit_getMerc)
{
  GAME_READY();

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (lpUnit && (lpUnit->dwPrivateType & PRIVATE_UNIT) == PRIVATE_UNIT)
  {
    UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);
    if (pUnit && pUnit->dwType == UNIT_PLAYER)
    {
      UnitAny *pMerc = GetMercUnit(pUnit);
      if (pMerc)
      {
        myUnit *pmyUnit = (myUnit *)js_mallocz(ctx, sizeof(*pmyUnit));
        if (!pmyUnit)
          return JS_FALSE;

        pmyUnit->dwPrivateType = PRIVATE_UNIT;
        pmyUnit->dwUnitId = pMerc->dwUnitId;
        pmyUnit->dwClassId = pMerc->dwTxtFileNo;
        pmyUnit->dwMode = 0;
        pmyUnit->dwType = UNIT_MONSTER;
        pmyUnit->szName[0] = 0;

        JSValue jsunit = BuildObject(ctx, unit_class_id, pmyUnit);
        if (JS_IsException(jsunit))
        {
          js_free(ctx, pmyUnit);
          pmyUnit = nullptr;
          return JS_FALSE;
        }

        return jsunit;
      }
    }
  }
  return JS_FALSE;
}

JSAPI_FUNC(my_getMercHP)
{
  GAME_READY();

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  UnitAny *pUnit = lpUnit ? D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType) : D2CLIENT_GetPlayerUnit();

  if (pUnit)
  {
    UnitAny *pMerc = GetMercUnit(pUnit);
    if (pMerc)
      return JS_NewUint32(ctx, (pUnit->dwMode == 12 ? 0 : D2CLIENT_GetUnitHPPercent(pMerc->dwUnitId)));
  }

  return JS_FALSE;
}

JSAPI_FUNC(unit_getNext)
{
  Private *unit = (Private *)JS_GetOpaque(this_val, unit_class_id);

  if (!unit)
    return JS_FALSE;

  if (unit->dwPrivateType == PRIVATE_UNIT)
  {
    myUnit *lpUnit = (myUnit *)unit;
    UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);

    if (!pUnit)
      return JS_FALSE;

    if (argc > 0 && JS_IsString(argv[0]))
    {
      const char *szText = JS_ToCString(ctx, argv[0]);
      strcpy_s(lpUnit->szName, 128, szText);
      JS_FreeCString(ctx, szText);
    }

    if (argc > 0 && JS_IsNumber(argv[0]) && !JS_IsNull(argv[1]))
      JS_ToUint32(ctx, (uint32_t *)&lpUnit->dwClassId, argv[0]); // DWORD to (uint32_t *) safe

    if (argc > 1 && JS_IsNumber(argv[1]) && !JS_IsNull(argv[2]))
      JS_ToUint32(ctx, (uint32_t *)&lpUnit->dwMode, argv[1]); // DWORD to (uint32_t *) safe

    pUnit = GetNextUnit(pUnit, lpUnit->szName, lpUnit->dwClassId, lpUnit->dwType, lpUnit->dwMode);

    if (!pUnit)
      return JS_FALSE;

    lpUnit->dwUnitId = pUnit->dwUnitId;
    JS_SetOpaque(this_val, lpUnit);
    return JS_TRUE;
  }
  else if (unit->dwPrivateType == PRIVATE_ITEM)
  {
    invUnit *pmyUnit = (invUnit *)unit;
    if (!pmyUnit)
      return JS_FALSE;

    UnitAny *pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);
    UnitAny *pOwner = D2CLIENT_FindUnit(pmyUnit->dwOwnerId, pmyUnit->dwOwnerType);
    if (!pUnit || !pOwner)
      return JS_FALSE;

    if (argc > 0 && JS_IsString(argv[0]))
    {
      const char *szText = JS_ToCString(ctx, argv[0]);
      strcpy_s(pmyUnit->szName, 128, szText);
      JS_FreeCString(ctx, szText);
    }

    if (argc > 0 && JS_IsNumber(argv[0]) && !JS_IsNull(argv[1]))
      JS_ToUint32(ctx, (uint32_t *)&pmyUnit->dwClassId, argv[0]); // DWORD to (uint32_t *) safe

    if (argc > 1 && JS_IsNumber(argv[1]) && !JS_IsNull(argv[2]))
      JS_ToUint32(ctx, (uint32_t *)&pmyUnit->dwMode, argv[1]); // DWORD to (uint32_t *) safe

    UnitAny *nextItem = GetInvNextUnit(pUnit, pOwner, pmyUnit->szName, pmyUnit->dwClassId, pmyUnit->dwMode);
    if (!nextItem)
      return JS_FALSE;

    pmyUnit->dwUnitId = nextItem->dwUnitId;
    JS_SetOpaque(this_val, pmyUnit);
    return JS_TRUE;
  }

  return JS_FALSE;
}

JSAPI_FUNC(my_getRepairCost)
{
  GAME_READY();

  UnitAny *npc = D2CLIENT_GetCurrentInteractingNPC();
  uint32_t nNpcClassId = (npc ? npc->dwTxtFileNo : 0x9A);

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &nNpcClassId, argv[0]);

  DWORD cost = D2COMMON_GetRepairCost(0, D2CLIENT_GetPlayerUnit(), nNpcClassId, D2CLIENT_GetDifficulty(), *p_D2CLIENT_ItemPriceList, 0);

  return JS_NewUint32(ctx, cost);
}

JSAPI_FUNC(item_getFlags)
{
  GAME_READY();

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);

  if (!pUnit || pUnit->dwType != UNIT_ITEM)
    return JS_FALSE;

  return JS_NewUint32(ctx, pUnit->pItemData->dwFlags);
}

JSAPI_FUNC(item_getFlag)
{
  GAME_READY();

  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);
  if (!pUnit || pUnit->dwType != UNIT_ITEM)
    return JS_FALSE;

  uint32_t nFlag;
  JS_ToUint32(ctx, &nFlag, argv[0]);

  return JS_NewBool(ctx, !!(nFlag & pUnit->pItemData->dwFlags));
}

JSAPI_FUNC(unit_getEnchant)
{
  GAME_READY();

  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  myUnit *pmyUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);

  if (!pUnit || pUnit->dwType != UNIT_MONSTER)
    return JS_FALSE;

  uint32_t nEnchant;
  JS_ToUint32(ctx, &nEnchant, argv[0]);

  for (int i = 0; i < 9; i++)
    if (pUnit->pMonsterData->anEnchants[i] == nEnchant)
    {
      return JS_TRUE;
      break;
    }

  return JS_FALSE;
}

JSAPI_FUNC(unit_getMinionCount)
{
  GAME_READY();

  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t nType;
  JS_ToUint32(ctx, &nType, argv[0]);

  myUnit *pmyUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);

  if (!pUnit || (pUnit->dwType != UNIT_MONSTER && pUnit->dwType != UNIT_PLAYER))
    return JS_FALSE;

  return JS_NewUint32(ctx, D2CLIENT_GetMinionCount(pUnit, (DWORD)nType));
}

JSAPI_FUNC(item_getItemCost)
{
  GAME_READY();

  uint32_t nMode;
  UnitAny *npc = D2CLIENT_GetCurrentInteractingNPC();
  uint32_t nNpcClassId = (npc ? npc->dwTxtFileNo : 0x9A); // defaults to Charsi's NPC id
  uint32_t nDifficulty = D2CLIENT_GetDifficulty();

  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  myUnit *lpUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

  if (!lpUnit || (lpUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);

  if (!pUnit || pUnit->dwType != UNIT_ITEM)
    return JS_FALSE;

  JS_ToUint32(ctx, &nMode, argv[0]);

  if (argc > 1)
  {
    if (JS_IsObject(argv[1]))
    {
      myUnit *pmyNpc = (myUnit *)JS_GetOpaque(this_val, unit_class_id);

      if (!pmyNpc || (pmyNpc->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
        return JS_FALSE;

      UnitAny *pNpc = D2CLIENT_FindUnit(pmyNpc->dwUnitId, pmyNpc->dwType);

      if (!pNpc)
        return JS_FALSE;
      nNpcClassId = pNpc->dwTxtFileNo;
    }
    else if (JS_IsNumber(argv[1]) && !JS_IsNull(argv[1]))
    {
      JS_ToUint32(ctx, &nNpcClassId, argv[1]);
    }

    // TODO:: validate the base stat table sizes to make sure the game doesn't crash with checking values past the end of the table
    int retVal = 0;
    if (FillBaseStat("monstats", nNpcClassId, "inventory", &retVal, sizeof(int)) && retVal == 0)
      nNpcClassId = 0x9A; // invalid npcid incoming! default to charsi to allow the game to continue
  }

  if (argc > 2 && JS_IsNumber(argv[2]))
    JS_ToUint32(ctx, &nDifficulty, argv[2]);

  switch (nMode)
  {
  case 0: // Buy
  case 1: // Sell
    return JS_NewUint32(ctx, D2COMMON_GetItemPrice(D2CLIENT_GetPlayerUnit(), pUnit, nDifficulty, *p_D2CLIENT_ItemPriceList, nNpcClassId, nMode));
    break;
  case 2: // Repair
    return JS_NewUint32(ctx, D2COMMON_GetItemPrice(D2CLIENT_GetPlayerUnit(), pUnit, nDifficulty, *p_D2CLIENT_ItemPriceList, nNpcClassId, 3));
    break;
  default:
    break;
  }

  return JS_FALSE;
}

JSAPI_FUNC(unit_move)
{
  GAME_READY();

  myUnit *pmyUnit = (myUnit *)JS_GetOpaque(this_val, unit_class_id);
  ;

  if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);

  UnitAny *pPlayer = D2CLIENT_GetPlayerUnit();

  if (!pPlayer || !pUnit)
    return JS_FALSE;

  uint32_t x, y;

  if (pUnit == pPlayer)
  {

    if (argc < 2)
      return JS_FALSE;

    if (JS_ToUint32(ctx, &x, argv[0]) < 0)
      return JS_FALSE;
    if (JS_ToUint32(ctx, &y, argv[1]) < 0)
      return JS_FALSE;
  }
  else
  {
    x = D2CLIENT_GetUnitX(pUnit);
    y = D2CLIENT_GetUnitY(pUnit);
  }

  ClickMap(0, (WORD)x, (WORD)y, FALSE, NULL);
  Sleep(50);
  ClickMap(2, (WORD)x, (WORD)y, FALSE, NULL);
  //	D2CLIENT_Move((WORD)x, (WORD)y);
  return JS_TRUE;
}

static const JSCFunctionListEntry js_unit_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("type", get_unit_property, NULL, UNIT_TYPE),
    JS_CGETSET_MAGIC_DEF("classid", get_unit_property, NULL, UNIT_CLASSID),
    JS_CGETSET_MAGIC_DEF("mode", get_unit_property, NULL, UNIT_MODE),
    JS_CGETSET_MAGIC_DEF("name", get_unit_property, NULL, UNIT_NAME),
    JS_CGETSET_MAGIC_DEF("act", get_unit_property, NULL, UNIT_ACT),
    JS_CGETSET_MAGIC_DEF("gid", get_unit_property, NULL, UNIT_ID),
    JS_CGETSET_MAGIC_DEF("x", get_unit_property, NULL, UNIT_XPOS),
    JS_CGETSET_MAGIC_DEF("y", get_unit_property, NULL, UNIT_YPOS),
    JS_CGETSET_MAGIC_DEF("targetx", get_unit_property, NULL, UNIT_TARGETX),
    JS_CGETSET_MAGIC_DEF("targety", get_unit_property, NULL, UNIT_TARGETY),
    JS_CGETSET_MAGIC_DEF("area", get_unit_property, NULL, UNIT_AREA),
    JS_CGETSET_MAGIC_DEF("hp", get_unit_property, NULL, UNIT_HP),
    JS_CGETSET_MAGIC_DEF("hpmax", get_unit_property, NULL, UNIT_HPMAX),
    JS_CGETSET_MAGIC_DEF("mp", get_unit_property, NULL, UNIT_MP),
    JS_CGETSET_MAGIC_DEF("mpmax", get_unit_property, NULL, UNIT_MPMAX),
    JS_CGETSET_MAGIC_DEF("stamina", get_unit_property, NULL, UNIT_STAMINA),
    JS_CGETSET_MAGIC_DEF("staminamax", get_unit_property, NULL, UNIT_STAMINAMAX),
    JS_CGETSET_MAGIC_DEF("charlvl", get_unit_property, NULL, UNIT_CHARLVL),
    JS_CGETSET_MAGIC_DEF("itemcount", get_unit_property, NULL, UNIT_ITEMCOUNT),
    JS_CGETSET_MAGIC_DEF("owner", get_unit_property, NULL, UNIT_OWNER),
    JS_CGETSET_MAGIC_DEF("ownertype", get_unit_property, NULL, UNIT_OWNERTYPE),
    JS_CGETSET_MAGIC_DEF("spectype", get_unit_property, NULL, UNIT_SPECTYPE),
    JS_CGETSET_MAGIC_DEF("direction", get_unit_property, NULL, UNIT_DIRECTION),
    JS_CGETSET_MAGIC_DEF("uniqueid", get_unit_property, NULL, UNIT_UNIQUEID),

    JS_CGETSET_MAGIC_DEF("code", get_unit_property, NULL, ITEM_CODE),
    JS_CGETSET_MAGIC_DEF("prefix", get_unit_property, NULL, ITEM_PREFIX),
    JS_CGETSET_MAGIC_DEF("suffix", get_unit_property, NULL, ITEM_SUFFIX),
    JS_CGETSET_MAGIC_DEF("prefixes", get_unit_property, NULL, ITEM_PREFIXES),
    JS_CGETSET_MAGIC_DEF("suffixes", get_unit_property, NULL, ITEM_SUFFIXES),
    JS_CGETSET_MAGIC_DEF("prefixnum", get_unit_property, NULL, ITEM_PREFIXNUM),
    JS_CGETSET_MAGIC_DEF("suffixnum", get_unit_property, NULL, ITEM_SUFFIXNUM),
    JS_CGETSET_MAGIC_DEF("prefixnums", get_unit_property, NULL, ITEM_PREFIXNUMS),
    JS_CGETSET_MAGIC_DEF("suffixnums", get_unit_property, NULL, ITEM_SUFFIXNUMS),
    JS_CGETSET_MAGIC_DEF("fname", get_unit_property, NULL, ITEM_FNAME),
    JS_CGETSET_MAGIC_DEF("quality", get_unit_property, NULL, ITEM_QUALITY),
    JS_CGETSET_MAGIC_DEF("node", get_unit_property, NULL, ITEM_NODE),
    JS_CGETSET_MAGIC_DEF("location", get_unit_property, NULL, ITEM_LOC),
    JS_CGETSET_MAGIC_DEF("sizex", get_unit_property, NULL, ITEM_SIZEX),
    JS_CGETSET_MAGIC_DEF("sizey", get_unit_property, NULL, ITEM_SIZEY),
    JS_CGETSET_MAGIC_DEF("itemType", get_unit_property, NULL, ITEM_TYPE),
    JS_CGETSET_MAGIC_DEF("description", get_unit_property, NULL, ITEM_DESC),
    JS_CGETSET_MAGIC_DEF("bodylocation", get_unit_property, NULL, ITEM_BODYLOCATION),
    JS_CGETSET_MAGIC_DEF("ilvl", get_unit_property, NULL, ITEM_LEVEL),
    JS_CGETSET_MAGIC_DEF("lvlreq", get_unit_property, NULL, ITEM_LEVELREQ),
    JS_CGETSET_MAGIC_DEF("gfx", get_unit_property, NULL, ITEM_GFX),

    JS_CGETSET_MAGIC_DEF("objtype", get_unit_property, NULL, OBJECT_TYPE),
    JS_CGETSET_MAGIC_DEF("islocked", get_unit_property, NULL, OBJECT_LOCKED),

    JS_CFUNC_DEF("getItem", 1, unit_getItem),
    JS_CFUNC_DEF("getItems", 0, unit_getItems),
    JS_CFUNC_DEF("getState", 1, unit_getState),
    JS_CFUNC_DEF("getStat", 1, unit_getStat),
    JS_CFUNC_DEF("repair", 0, unit_repair),
    JS_CFUNC_DEF("interact", 0, unit_interact),
    JS_CFUNC_DEF("getSkill", 0, unit_getSkill),
    JS_CFUNC_DEF("setSkill", 2, unit_setSkill),
    JS_CFUNC_DEF("useMenu", 1, unit_useMenu),
    JS_CFUNC_DEF("shop", 2, item_shop),
    JS_CFUNC_DEF("getNext", 0, unit_getNext),
    JS_CFUNC_DEF("cancel", 0, unit_cancel),
    JS_CFUNC_DEF("getQuest", 2, unit_getQuest),
    JS_CFUNC_DEF("getMerc", 0, unit_getMerc),

    JS_CFUNC_DEF("getParent", 0, unit_getParent),
    JS_CFUNC_DEF("getFlags", 1, item_getFlags),
    JS_CFUNC_DEF("getFlag", 1, item_getFlag),

    JS_CFUNC_DEF("getEnchant", 1, unit_getEnchant),
    JS_CFUNC_DEF("move", 2, unit_move),
    JS_CFUNC_DEF("getMinionCount", 1, unit_getMinionCount),
    JS_CFUNC_DEF("getItemCost", 1, item_getItemCost)};

// static const JSCFunctionListEntry js_item_proto_funcs[] = {
// };

static const JSCFunctionListEntry js_me_funcs[] = {
    JS_CGETSET_MAGIC_DEF("account", get_me_property, NULL, ME_ACCOUNT),
    JS_CGETSET_MAGIC_DEF("charname", get_me_property, NULL, ME_CHARNAME),
    JS_CGETSET_MAGIC_DEF("diff", get_me_property, NULL, ME_DIFF),
    JS_CGETSET_MAGIC_DEF("maxdiff", get_me_property, NULL, ME_MAXDIFF),
    JS_CGETSET_MAGIC_DEF("gamename", get_me_property, NULL, ME_GAMENAME),
    JS_CGETSET_MAGIC_DEF("gamepassword", get_me_property, NULL, ME_GAMEPASSWORD),
    JS_CGETSET_MAGIC_DEF("gameserverip", get_me_property, NULL, ME_GAMESERVERIP),
    JS_CGETSET_MAGIC_DEF("gamestarttime", get_me_property, NULL, ME_GAMESTARTTIME),
    JS_CGETSET_MAGIC_DEF("gametype", get_me_property, NULL, ME_GAMETYPE),
    JS_CGETSET_MAGIC_DEF("itemoncursor", get_me_property, NULL, ME_ITEMONCURSOR),
    JS_CGETSET_MAGIC_DEF("automap", get_me_property, set_me_property, ME_AUTOMAP),
    JS_CGETSET_MAGIC_DEF("ladder", get_me_property, NULL, ME_LADDER),
    JS_CGETSET_MAGIC_DEF("ping", get_me_property, NULL, ME_PING),
    JS_CGETSET_MAGIC_DEF("fps", get_me_property, NULL, ME_FPS),
    JS_CGETSET_MAGIC_DEF("playertype", get_me_property, NULL, ME_PLAYERTYPE),
    JS_CGETSET_MAGIC_DEF("realm", get_me_property, NULL, ME_REALM),
    JS_CGETSET_MAGIC_DEF("realmshort", get_me_property, NULL, ME_REALMSHORT),
    JS_CGETSET_MAGIC_DEF("mercrevivecost", get_me_property, NULL, ME_MERCREVIVECOST),
    JS_CGETSET_MAGIC_DEF("runwalk", get_me_property, set_me_property, ME_RUNWALK),
    JS_CGETSET_MAGIC_DEF("weaponswitch", get_me_property, NULL, ME_WSWITCH),
    JS_CGETSET_MAGIC_DEF("chickenhp", get_me_property, set_me_property, ME_CHICKENHP),
    JS_CGETSET_MAGIC_DEF("chickenmp", get_me_property, set_me_property, ME_CHICKENMP),
    JS_CGETSET_MAGIC_DEF("quitonhostile", get_me_property, set_me_property, ME_QUITONHOSTILE),
    JS_CGETSET_MAGIC_DEF("blockKeys", get_me_property, set_me_property, ME_BLOCKKEYS),
    JS_CGETSET_MAGIC_DEF("blockMouse", get_me_property, set_me_property, ME_BLOCKMOUSE),
    JS_CGETSET_MAGIC_DEF("gameReady", get_me_property, NULL, ME_GAMEREADY),
    JS_CGETSET_MAGIC_DEF("profile", get_me_property, NULL, ME_PROFILE),
    JS_CGETSET_MAGIC_DEF("nopickup", get_me_property, set_me_property, ME_NOPICKUP),
    JS_CGETSET_MAGIC_DEF("pid", get_me_property, NULL, ME_PID),
    JS_CGETSET_MAGIC_DEF("unsupported", get_me_property, NULL, ME_UNSUPPORTED),
    JS_CGETSET_MAGIC_DEF("charflags", get_me_property, NULL, ME_CHARFLAGS),
    JS_CGETSET_MAGIC_DEF("screensize", get_me_property, NULL, OOG_SCREENSIZE),
    JS_CGETSET_MAGIC_DEF("windowtitle", get_me_property, NULL, OOG_WINDOWTITLE),
    JS_CGETSET_MAGIC_DEF("ingame", get_me_property, NULL, OOG_INGAME),
    JS_CGETSET_MAGIC_DEF("quitonerror", get_me_property, set_me_property, OOG_QUITONERROR),
    JS_CGETSET_MAGIC_DEF("maxgametime", get_me_property, set_me_property, OOG_MAXGAMETIME),

    JS_CFUNC_DEF("revive", 0, my_revive),
    JS_CFUNC_DEF("overhead", 0, my_overhead),
    JS_CFUNC_DEF("getRepairCost", 1, my_getRepairCost),
    JS_CFUNC_DEF("updatePlayerGid", 1, my_updatePlayerGid),
};

JSAPI_FUNC(my_clickMap)
{
  GAME_READY();

  if (argc < 3)
    return JS_FALSE;

  uint32_t wX, wY, dwType;
  bool bShift;

  if (JS_ToUint32(ctx, &dwType, argv[0]) < 0)
    return JS_FALSE;

  bShift = !!JS_ToBool(ctx, argv[1]);

  if (argc == 3 && JS_IsNumber(argv[0]) &&
      (JS_IsNumber(argv[1]) || JS_IsBool(argv[1])) &&
      JS_IsObject(argv[2]) && !JS_IsNull(argv[2]))
  {
    myUnit *mypUnit = (myUnit *)JS_GetOpaque(argv[2], unit_class_id);
    if (!mypUnit || (mypUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
      return JS_FALSE;

    UnitAny *pUnit = D2CLIENT_FindUnit(mypUnit->dwUnitId, mypUnit->dwType);
    if (!pUnit)
      return JS_FALSE;

    Vars.dwSelectedUnitId = 0;
    Vars.dwSelectedUnitType = 0;

    return ClickMap(dwType, wX, wY, bShift, pUnit);
  }
  else if (argc > 3 && JS_IsNumber(argv[0]) &&
           (JS_IsNumber(argv[1]) || JS_IsBool(argv[1])) &&
           JS_IsNumber(argv[2]) && JS_IsNumber(argv[3]))
  {
    if (JS_ToUint32(ctx, &wX, argv[2]) < 0)
      return JS_FALSE;

    if (JS_ToUint32(ctx, &wY, argv[3]) < 0)
      return JS_FALSE;

    return ClickMap(dwType, wX, wY, bShift, NULL);
  }
  return JS_FALSE;
}

JSAPI_FUNC(my_getDistance)
{
  int32_t nX1 = 0, nX2 = 0, nY1 = 0, nY2 = 0;

  switch (argc)
  {
  case 1:
  {
    if (!JS_IsObject(argv[0]))
      return JS_FALSE;

    nX1 = D2CLIENT_GetUnitX(D2CLIENT_GetPlayerUnit());
    nY1 = D2CLIENT_GetUnitY(D2CLIENT_GetPlayerUnit());

    JSValue x2, y2;
    x2 = JS_GetPropertyStr(ctx, argv[0], "x");
    y2 = JS_GetPropertyStr(ctx, argv[0], "y");
    JS_ToInt32(ctx, &nX2, x2);
    JS_ToInt32(ctx, &nY2, y2);
  }
  break;

  case 2:
    if (JS_IsNumber(argv[0]) && JS_IsNumber(argv[1]))
    {
      nX1 = D2CLIENT_GetUnitX(D2CLIENT_GetPlayerUnit());
      nY1 = D2CLIENT_GetUnitY(D2CLIENT_GetPlayerUnit());
      JS_ToInt32(ctx, &nX2, argv[0]);
      JS_ToInt32(ctx, &nY2, argv[1]);
    }
    else if (JS_IsObject(argv[0]) && JS_IsObject(argv[1]))
    {
      JSValue x1, y1, x2, y2;
      x1 = JS_GetPropertyStr(ctx, argv[0], "x");
      y1 = JS_GetPropertyStr(ctx, argv[0], "y");
      x2 = JS_GetPropertyStr(ctx, argv[1], "x");
      y2 = JS_GetPropertyStr(ctx, argv[1], "y");
      JS_ToInt32(ctx, &nX1, x1);
      JS_ToInt32(ctx, &nY1, y1);
      JS_ToInt32(ctx, &nX2, x2);
      JS_ToInt32(ctx, &nY2, y2);
    }
    break;
  case 3:
    if (JS_IsObject(argv[0]) && JS_IsNumber(argv[1]) && JS_IsNumber(argv[2]))
    {
      myUnit *pUnitData = (myUnit *)JS_GetOpaque(argv[0], unit_class_id);
      if (!pUnitData || (pUnitData->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
        return JS_FALSE;

      UnitAny *pUnitAny = D2CLIENT_FindUnit(pUnitData->dwUnitId, pUnitData->dwType);
      if (!pUnitAny)
        return JS_FALSE;

      nX1 = D2CLIENT_GetUnitX(pUnitAny);
      nY1 = D2CLIENT_GetUnitY(pUnitAny);
      JS_ToInt32(ctx, &nX2, argv[1]);
      JS_ToInt32(ctx, &nY2, argv[2]);
    }
    else if (JS_IsNumber(argv[0]) && JS_IsNumber(argv[1]) && JS_IsObject(argv[2]))
    {
      JS_ToInt32(ctx, &nX1, argv[0]);
      JS_ToInt32(ctx, &nY1, argv[1]);

      myUnit *pUnitData = (myUnit *)JS_GetOpaque(argv[2], unit_class_id);
      if (!pUnitData || (pUnitData->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
        return JS_FALSE;

      UnitAny *pUnitAny = D2CLIENT_FindUnit(pUnitData->dwUnitId, pUnitData->dwType);
      if (!pUnitAny)
        return JS_FALSE;

      nX2 = D2CLIENT_GetUnitX(pUnitAny);
      nY2 = D2CLIENT_GetUnitY(pUnitAny);
    }

    break;
  case 4:
    if (JS_IsNumber(argv[0]) && JS_IsNumber(argv[1]) && JS_IsNumber(argv[2]) && JS_IsNumber(argv[3]))
    {
      JS_ToInt32(ctx, &nX1, argv[0]);
      JS_ToInt32(ctx, &nY1, argv[1]);
      JS_ToInt32(ctx, &nX2, argv[2]);
      JS_ToInt32(ctx, &nY2, argv[3]);
    }
    break;

  default:
    return JS_FALSE;
    break;
  }

  double dbDist = abs(GetDistance(nX1, nY1, nX2, nY2));

  return JS_NewFloat64(ctx, dbDist);
}

JSAPI_FUNC(my_getUnit)
{
  if (argc < 1)
    return JS_FALSE;

  int nType = -1;
  uint32_t nClassId = -1;
  uint32_t nMode = -1;
  uint32_t nUnitId = -1;
  char szName[128] = "";

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToInt32(ctx, &nType, argv[0]);

  if (argc > 1 && JS_IsString(argv[1]))
  {
    const char *szText = JS_ToCString(ctx, argv[1]);
    strcpy_s(szName, sizeof(szName), szText);
    JS_FreeCString(ctx, szText);
  }

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &nClassId, argv[1]);

  if (argc > 2 && JS_IsNumber(argv[2]))
    JS_ToUint32(ctx, &nMode, argv[2]);

  if (argc > 3 && JS_IsNumber(argv[3]))
    JS_ToUint32(ctx, &nUnitId, argv[3]);

  UnitAny *pUnitAny = nullptr;
  if (nType == 100)
    pUnitAny = D2CLIENT_GetCursorItem();
  else if (nType == 101)
  {
    pUnitAny = D2CLIENT_GetSelectedUnit();
    if (!pUnitAny)
      pUnitAny = (*p_D2CLIENT_SelectedInvItem);
  }
  else
    pUnitAny = GetUnit(szName, nClassId, nType, nMode, nUnitId);

  if (!pUnitAny)
    return JS_FALSE;

  myUnit *pmyUnit = (myUnit *)js_mallocz(ctx, sizeof(*pmyUnit));
  if (!pmyUnit)
    return JS_FALSE;

  pmyUnit->dwPrivateType = PRIVATE_UNIT;
  pmyUnit->dwClassId = nClassId;
  pmyUnit->dwMode = nMode;
  pmyUnit->dwType = pUnitAny->dwType;
  pmyUnit->dwUnitId = pUnitAny->dwUnitId;
  strcpy_s(pmyUnit->szName, sizeof(pmyUnit->szName), szName);

  JSValue jsunit = BuildObject(ctx, unit_class_id, pmyUnit);
  if (JS_IsException(jsunit))
  {
    js_free(ctx, pmyUnit);
    pmyUnit = nullptr;
    return JS_FALSE;
  }

  return jsunit;
}

JSAPI_FUNC(my_checkCollision)
{
  GAME_READY();

  if (argc == 3 && JS_IsObject(argv[0]) && JS_IsObject(argv[1]) && JS_IsNumber(argv[2]))
  {
    myUnit *pUnitA = (myUnit *)JS_GetOpaque(argv[0], unit_class_id);
    myUnit *pUnitB = (myUnit *)JS_GetOpaque(argv[1], unit_class_id);

    uint32_t nBitMask;
    JS_ToUint32(ctx, &nBitMask, argv[2]);

    if (!pUnitA || (pUnitA->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT || !pUnitB || (pUnitB->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
      return JS_FALSE;

    UnitAny *pUnit1 = D2CLIENT_FindUnit(pUnitA->dwUnitId, pUnitA->dwType);
    UnitAny *pUnit2 = D2CLIENT_FindUnit(pUnitB->dwUnitId, pUnitB->dwType);

    if (!pUnit1 || !pUnit2)
      return JS_FALSE;

    return JS_NewUint32(ctx, D2COMMON_CheckUnitCollision(pUnit1, pUnit2, (WORD)nBitMask));
  }

  return JS_FALSE;
}

JSAPI_FUNC(my_clickItem)
{
  typedef void __fastcall clickequip(UnitAny * pPlayer, Inventory * pIventory, int loc);

  GAME_READY();

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;

  if (*p_D2CLIENT_TransactionDialog != 0 || *p_D2CLIENT_TransactionDialogs != 0 || *p_D2CLIENT_TransactionDialogs_2 != 0)
  {
    delete cRoom;
    return JS_FALSE;
  }

  myUnit *pmyUnit = nullptr;
  UnitAny *pUnit = nullptr;

  // int ScreenSize = D2GFX_GetScreenSize();

  POINT Belt[] = {
      {0, 0}, // 0
      {1, 0}, // 1
      {2, 0}, // 2
      {3, 0}, // 3

      {0, 1}, // 4
      {1, 1}, // 5
      {2, 1}, // 6
      {3, 1}, // 7

      {0, 2}, // 8
      {1, 2}, // 9
      {2, 2}, // 10
      {3, 2}, // 11

      {0, 3}, // 12
      {1, 3}, // 13
      {2, 3}, // 14
      {3, 3}, // 15
  };

  *p_D2CLIENT_CursorHoverX = 0xFFFFFFFF;
  *p_D2CLIENT_CursorHoverY = 0xFFFFFFFF;

  if (argc == 1 && JS_IsObject(argv[0]))
  {
    pmyUnit = (myUnit *)JS_GetOpaque(argv[0], unit_class_id);

    if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    {
      delete cRoom;
      return JS_FALSE;
    }

    pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);

    if (!pUnit)
    {
      delete cRoom;
      return JS_FALSE;
    }

    clickequip *click = (clickequip *)*(DWORD *)(D2CLIENT_BodyClickTable + (4 * pUnit->pItemData->BodyLocation));

    if (!click)
    {
      delete cRoom;
      return JS_FALSE;
    }

    click(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, pUnit->pItemData->BodyLocation);
    delete cRoom;
    return JS_TRUE;
  }
  else if (argc == 2 && JS_IsNumber(argv[0]) && JS_IsNumber(argv[1]))
  {
    uint32_t nClickType, nBodyLoc;
    JS_ToUint32(ctx, &nClickType, argv[0]);
    JS_ToUint32(ctx, &nBodyLoc, argv[1]);

    if (nClickType == 0)
    {
      clickequip *click = (clickequip *)*(DWORD *)(D2CLIENT_BodyClickTable + (4 * nBodyLoc));

      if (!click)
      {
        delete cRoom;
        return JS_FALSE;
      }

      click(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, nBodyLoc);
    }
    // Click Merc Gear
    else if (nClickType == 4)
    {
      if (nBodyLoc == 1 || nBodyLoc == 3 || nBodyLoc == 4)
      {
        UnitAny *pMerc = GetMercUnit(D2CLIENT_GetPlayerUnit());

        if (pMerc)
          D2CLIENT_MercItemAction(0x61, nBodyLoc);
      }
    }

    delete cRoom;
    return JS_TRUE;
  }
  else if (argc == 2 && JS_IsNumber(argv[0]) && JS_IsObject(argv[1]))
  {
    pmyUnit = (myUnit *)JS_GetOpaque(argv[1], unit_class_id);

    if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    {
      delete cRoom;
      return JS_FALSE;
    }

    pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);

    uint32_t nClickType;
    JS_ToUint32(ctx, &nClickType, argv[0]);

    if (!pUnit || !(pUnit->dwType == UNIT_ITEM) || !pUnit->pItemData)
    {
      delete cRoom;
      JS_THROW_ERROR(ctx, "Object is not an item!");
    }

    int InventoryLocation = GetItemLocation(pUnit);
    int ClickLocation = LOCATION_NULL;

    int x = pUnit->pItemPath->dwPosX;
    int y = pUnit->pItemPath->dwPosY;

    *p_D2CLIENT_CursorHoverX = x;
    *p_D2CLIENT_CursorHoverY = y;

    InventoryLayout *pLayout = nullptr;

    if (nClickType == 4)
    {
      UnitAny *pMerc = GetMercUnit(D2CLIENT_GetPlayerUnit());

      if (pMerc)
        if (pUnit->pItemData && pUnit->pItemData->pOwner)
          if (pUnit->pItemData->pOwner->dwUnitId == pMerc->dwUnitId)
          {
            D2CLIENT_MercItemAction(0x61, pUnit->pItemData->BodyLocation);
          }

      delete cRoom;
      return JS_TRUE;
    }
    else if (InventoryLocation == LOCATION_INVENTORY || InventoryLocation == LOCATION_STASH || InventoryLocation == LOCATION_CUBE)
    {
      switch (InventoryLocation)
      {
      case LOCATION_INVENTORY:
        pLayout = (InventoryLayout *)p_D2CLIENT_InventoryLayout;
        ClickLocation = CLICKTARGET_INVENTORY;
        break;
      case LOCATION_STASH:
        pLayout = (InventoryLayout *)p_D2CLIENT_StashLayout;
        ClickLocation = CLICKTARGET_STASH;
        break;
      case LOCATION_CUBE:
        pLayout = (InventoryLayout *)p_D2CLIENT_CubeLayout;
        ClickLocation = CLICKTARGET_CUBE;
        break;
      }

      x = pLayout->Left + x * pLayout->SlotPixelWidth + 10;
      y = pLayout->Top + y * pLayout->SlotPixelHeight + 10;

      if (nClickType == 0)
        D2CLIENT_LeftClickItem(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, x, y, nClickType, pLayout, ClickLocation);
      // D2CLIENT_LeftClickItem(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, x, y, nClickType, pLayout,
      // pUnit->pItemData->ItemLocation);
      else
        D2CLIENT_RightClickItem(x, y, ClickLocation, D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory);
      // D2CLIENT_RightClickItem(x,y, pUnit->pItemData->ItemLocation, D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory);
    }
    else if (InventoryLocation == LOCATION_BELT)
    {
      int i = x;

      if (i < 0 || i > 0x0F)
      {
        delete cRoom;
        return JS_FALSE;
      }

      if (D2GFX_GetScreenSize() == 2)
      {
        x = 440 + (Belt[i].x * 29);
        y = 580 - (Belt[i].y * 29);
      }
      else
      {
        x = 360 + (Belt[i].x * 29);
        y = 460 - (Belt[i].y * 29);
      }
      if (nClickType == 0)
        D2CLIENT_ClickBelt(x, y, D2CLIENT_GetPlayerUnit()->pInventory);
      else
        D2CLIENT_ClickBeltRight(D2CLIENT_GetPlayerUnit()->pInventory, D2CLIENT_GetPlayerUnit(), nClickType == 1 ? FALSE : TRUE, i);
    }
    else if (D2CLIENT_GetCursorItem() == pUnit)
    {
      if (nClickType < 1 || nClickType > 12)
      {
        delete cRoom;
        return JS_FALSE;
      }

      clickequip *click = (clickequip *)*(DWORD *)(D2CLIENT_BodyClickTable + (4 * nClickType));

      if (!click)
      {
        delete cRoom;
        return JS_FALSE;
      }

      click(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, nClickType);
    }
  }
  else if (argc == 4)
  {
    if (JS_IsNumber(argv[0]) && JS_IsNumber(argv[1]) && JS_IsNumber(argv[2]) && JS_IsNumber(argv[3]))
    {
      uint32_t nButton, nX, nY, nLoc;
      JS_ToUint32(ctx, &nButton, argv[0]);
      JS_ToUint32(ctx, &nX, argv[1]);
      JS_ToUint32(ctx, &nY, argv[2]);
      JS_ToUint32(ctx, &nLoc, argv[3]);

      int clickTarget = LOCATION_NULL;
      InventoryLayout *pLayout = NULL;

      *p_D2CLIENT_CursorHoverX = nX;
      *p_D2CLIENT_CursorHoverY = nY;

      // Fixing the x/y click spot for items taking more than one inventory square- so Diablo can handle it!
      if (nLoc != LOCATION_BELT)
      {
        UnitAny *pItem = D2CLIENT_GetCursorItem();
        if (pItem)
        {
          ItemTxt *pTxt = D2COMMON_GetItemText(pItem->dwTxtFileNo);
          if (pTxt)
          {
            if (pTxt->ySize > 1)
              nY += 1;

            if (pTxt->xSize > 1)
              nX += 1;
          }
        }
      }
      // nLoc is click target locations=: LOCATION_INVENTORY=inventory, LOCATION_TRADE=player trade, LOCATION_CUBE=cube, LOCATION_STASH=stash,
      // LOCATION_BELT=belt
      if (nLoc == LOCATION_INVENTORY || nLoc == LOCATION_TRADE || nLoc == LOCATION_CUBE || nLoc == LOCATION_STASH)
      {
        switch (nLoc)
        {
        case LOCATION_INVENTORY:
          pLayout = (InventoryLayout *)p_D2CLIENT_InventoryLayout;
          clickTarget = CLICKTARGET_INVENTORY;
          break;
        case LOCATION_TRADE:
          pLayout = (InventoryLayout *)p_D2CLIENT_TradeLayout;
          clickTarget = CLICKTARGET_TRADE;
          break;
        case LOCATION_CUBE:
          pLayout = (InventoryLayout *)p_D2CLIENT_CubeLayout;
          clickTarget = CLICKTARGET_CUBE;
          break;
        case LOCATION_STASH:
          pLayout = (InventoryLayout *)p_D2CLIENT_StashLayout;
          clickTarget = CLICKTARGET_STASH;
          break;
        }

        int x = pLayout->Left + nX * pLayout->SlotPixelWidth + 10;
        int y = pLayout->Top + nY * pLayout->SlotPixelHeight + 10;

        if (nButton == 0) // Left Click
          D2CLIENT_LeftClickItem(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, x, y, 1, pLayout, clickTarget);
        else if (nButton == 1) // Right Click
          D2CLIENT_RightClickItem(x, y, clickTarget, D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory);
        else if (nButton == 2) // Shift Left Click
          D2CLIENT_LeftClickItem(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, x, y, 5, pLayout, clickTarget);

        delete cRoom;
        return JS_TRUE;
      }
      else if (nLoc == LOCATION_BELT) // Belt
      {
        int z = -1;

        for (UINT i = 0; i < ARRAYSIZE(Belt); i++)
        {
          if (Belt[i].x == (LONG)nX && Belt[i].y == (LONG)nY)
          {
            z = (int)i;
            break;
          }
        }

        if (z == -1)
        {
          delete cRoom;
          return JS_TRUE;
        }

        int x = 0;
        int y = 0;

        if (D2GFX_GetScreenSize() == 2)
        {
          x = 440 + (Belt[z].x * 29);
          y = 580 - (Belt[z].y * 29);
        }
        else
        {
          x = 360 + (Belt[z].x * 29);
          y = 460 - (Belt[z].y * 29);
        }

        if (nButton == 0)
          D2CLIENT_ClickBelt(x, y, D2CLIENT_GetPlayerUnit()->pInventory);
        else if (nButton == 1)
          D2CLIENT_ClickBeltRight(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, FALSE, z);
        else if (nButton == 2)
          D2CLIENT_ClickBeltRight(D2CLIENT_GetPlayerUnit(), D2CLIENT_GetPlayerUnit()->pInventory, TRUE, z);

        delete cRoom;
        return JS_TRUE;
      }
    }
  }

  delete cRoom;
  return JS_FALSE;
}

JSAPI_FUNC(my_getInteractedNPC)
{
  GAME_READY();

  UnitAny *pNPC = D2CLIENT_GetCurrentInteractingNPC();
  if (!pNPC)
    return JS_FALSE;

  myUnit *pmyUnit = (myUnit *)js_mallocz(ctx, sizeof(*pmyUnit));
  if (!pmyUnit)
    return JS_FALSE;

  char szName[256] = "";
  pmyUnit->dwPrivateType = PRIVATE_UNIT;
  pmyUnit->dwClassId = pNPC->dwTxtFileNo;
  pmyUnit->dwMode = pNPC->dwMode;
  pmyUnit->dwType = pNPC->dwType;
  pmyUnit->dwUnitId = pNPC->dwUnitId;
  strcpy_s(pmyUnit->szName, sizeof(pmyUnit->szName), szName);

  JSValue jsunit = BuildObject(ctx, unit_class_id, pmyUnit);
  if (JS_IsException(jsunit))
  {
    js_free(ctx, pmyUnit);
    pmyUnit = nullptr;
    return JS_FALSE;
  }

  return jsunit;
}

JSAPI_FUNC(my_moveNPC)
{
  GAME_READY();

  if (!Vars.bEnableUnsupported)
    JS_THROW_SINGLE_LINE(ctx, "moveNPC requires EnableUnsupported = true in d2boot.ini");

  if (argc < 2)
    JS_THROW_SINGLE_LINE(ctx, "Not enough parameters were passed to moveNPC!");

  myUnit *pNpc = (myUnit *)JS_GetOpaque(argv[0], unit_class_id);
  if (!pNpc || pNpc->dwType != 1)
    JS_THROW_SINGLE_LINE(ctx, "Invalid NPC passed to moveNPC!");

  uint32_t dwX, dwY;
  JS_ToUint32(ctx, &dwX, argv[1]);
  JS_ToUint32(ctx, &dwY, argv[2]);

  BYTE aPacket[17];
  aPacket[0] = 0x59;
  *(DWORD *)&aPacket[1] = pNpc->dwType;
  *(DWORD *)&aPacket[5] = pNpc->dwUnitId;
  *(DWORD *)&aPacket[9] = dwX;
  *(DWORD *)&aPacket[13] = dwY;

  D2NET_SendPacket(sizeof(aPacket), 1, aPacket);
  return JS_TRUE;
}

JSAPI_FUNC(my_copyUnit)
{
  if (argc >= 1 && JS_IsObject(argv[0]) && !JS_IsNull(argv[0]))
  {
    Private *myPrivate = (Private *)JS_GetOpaque(argv[0], unit_class_id);

    if (!myPrivate)
      return JS_FALSE;

    if (myPrivate->dwPrivateType == PRIVATE_UNIT)
    {
      myUnit *lpOldUnit = (myUnit *)JS_GetOpaque(argv[0], unit_class_id);
      myUnit *lpUnit = (myUnit *)js_malloc(ctx, sizeof(*lpUnit));

      if (lpUnit)
      {
        memcpy(lpUnit, lpOldUnit, sizeof(myUnit));
        JSValue jsunit = BuildObject(ctx, unit_class_id, lpUnit);

        if (JS_IsException(jsunit))
        {
          js_free(ctx, lpUnit);
          lpUnit = nullptr;
          JS_THROW_ERROR(ctx, "Couldn't copy unit");
        }
        return jsunit;
      }
    }
    else if (myPrivate->dwPrivateType == PRIVATE_ITEM)
    {
      invUnit *lpOldUnit = (invUnit *)JS_GetOpaque(argv[0], unit_class_id);
      invUnit *lpUnit = (invUnit *)js_malloc(ctx, sizeof(*lpUnit));

      if (lpUnit)
      {
        memcpy(lpUnit, lpOldUnit, sizeof(invUnit));
        JSValue jsunit = BuildObject(ctx, unit_class_id, lpUnit);

        if (JS_IsException(jsunit))
        {
          js_free(ctx, lpUnit);
          lpUnit = nullptr;
          JS_THROW_ERROR(ctx, "Couldn't copy unit");
        }
        return jsunit;
      }
    }
  }

  return JS_FALSE;
}

static const JSCFunctionListEntry js_unit_module_funcs[] = {
    JS_CFUNC_DEF("getUnit", 1, my_getUnit),
    JS_CFUNC_DEF("getMercHP", 0, my_getMercHP),
    JS_CFUNC_DEF("clickMap", 2, my_clickMap),
    JS_CFUNC_DEF("getDistance", 1, my_getDistance),
    JS_CFUNC_DEF("checkCollision", 2, my_checkCollision),
    JS_CFUNC_DEF("clickItem", 0, my_clickItem),
    JS_CFUNC_DEF("getInteractedNPC", 0, my_getInteractedNPC),
    JS_CFUNC_DEF("moveNPC", 0, my_moveNPC),
    JS_CFUNC_DEF("copyUnit", 1, my_copyUnit),
};

static JSValue js_unit_me(JSContext *ctx)
{
  myUnit *pUnit;
  JSValue me = BuildObject(ctx, unit_class_id);
  if (JS_IsException(me))
    return JS_FALSE;

  pUnit = (myUnit *)js_mallocz(ctx, sizeof(*pUnit));
  if (!pUnit)
  {
    JS_FreeValue(ctx, me);
    return JS_FALSE;
  }

  // JS_SetPropertyFunctionList(ctx, me, js_unit_proto_funcs, ARRAYSIZE(js_unit_proto_funcs));
  JS_SetPropertyFunctionList(ctx, me, js_me_funcs, ARRAYSIZE(js_me_funcs));

  UnitAny *player = D2CLIENT_GetPlayerUnit();
  pUnit->dwPrivateType = PRIVATE_UNIT;
  pUnit->dwType = UNIT_PLAYER;
  pUnit->dwMode = (DWORD)-1;
  pUnit->dwClassId = (DWORD)-1;
  pUnit->dwUnitId = player ? player->dwUnitId : 0;

  JS_SetOpaque(me, pUnit);
  return me;
}

int js_module_unit_init(JSContext *ctx, JSModuleDef *m)
{
  JSValue unit_proto, unit_class;

  /* create the Unit class */
  JS_NewClassID(&unit_class_id);
  JS_NewClass(JS_GetRuntime(ctx), unit_class_id, &js_unit_class);

  unit_proto = JS_NewObject(ctx);
  unit_class = JS_NewCFunction2(ctx, js_unit_ctor, "Unit", 0, JS_CFUNC_constructor, 0);
  JS_SetPropertyFunctionList(ctx, unit_proto, js_unit_proto_funcs, ARRAYSIZE(js_unit_proto_funcs));
  // JS_SetPropertyFunctionList(ctx, unit_proto, js_item_proto_funcs, ARRAYSIZE(js_item_proto_funcs));

  JS_SetConstructor(ctx, unit_class, unit_proto);
  JS_SetClassProto(ctx, unit_class_id, unit_proto);

  JS_SetModuleExportList(ctx, m, js_unit_module_funcs, ARRAYSIZE(js_unit_module_funcs));
  JS_SetModuleExport(ctx, m, "Unit", unit_class);
  JS_SetModuleExport(ctx, m, "me", js_unit_me(ctx));
  return TRUE;
}

int js_module_unit_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_unit_module_funcs, ARRAYSIZE(js_unit_module_funcs));
  JS_AddModuleExport(ctx, m, "Unit");
  JS_AddModuleExport(ctx, m, "me");

  return TRUE;
}
