#include "JSParty.h"
#include "JSUnit.h"

enum party_id
{
  PARTY_AREA,
  PARTY_X,
  PARTY_Y,
  PARTY_GID,
  PARTY_LIFE,
  PARTY_NAME,
  PARTY_FLAG,
  PARTY_ID,
  PARTY_CLASSID,
  PARTY_LEVEL
};

static JSClassID party_class_id;

static void js_party_finalizer(JSRuntime *rt, JSValue val)
{
  JS_SetOpaque(val, nullptr);
  // RosterUnit *unit = (RosterUnit *)JS_GetOpaque(val, party_class_id);
  // js_free_rt(rt, unit);
}

static JSClassDef js_party_class = {
    "Party",
    .finalizer = js_party_finalizer,
};

static JSValue js_party_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_PGM(party_getProperty)
{
  RosterUnit *pUnit = (RosterUnit *)JS_GetOpaque(this_val, party_class_id);

  if (!pUnit)
    return JS_FALSE;

  switch (magic)
  {
  case PARTY_NAME:
    return JS_NewString(ctx, pUnit->szName);
    break;
  case PARTY_X:
    return JS_NewUint32(ctx, pUnit->Xpos);
    break;
  case PARTY_Y:
    return JS_NewUint32(ctx, pUnit->Ypos);
    break;
  case PARTY_AREA:
    return JS_NewUint32(ctx, pUnit->dwLevelId);
    break;
  case PARTY_GID:
    return JS_NewUint32(ctx, pUnit->dwUnitId);
    break;
  case PARTY_LIFE:
    return JS_NewUint32(ctx, pUnit->dwPartyLife);
    break;
  case PARTY_CLASSID:
    return JS_NewUint32(ctx, pUnit->dwClassId);
    break;
  case PARTY_LEVEL:
    return JS_NewUint32(ctx, pUnit->wLevel);
    break;
  case PARTY_FLAG:
    return JS_NewUint32(ctx, pUnit->dwPartyFlags);
    break;
  case PARTY_ID:
    return JS_NewUint32(ctx, pUnit->wPartyId);
    break;
  default:
    break;
  }
  return JS_FALSE;
}

JSAPI_FUNC(party_getNext)
{
  GAME_READY();

  RosterUnit *pUnit = (RosterUnit *)JS_GetOpaque(this_val, party_class_id);

  if (!pUnit)
    return JS_FALSE;

  pUnit = pUnit->pNext;

  if (!pUnit)
    return JS_FALSE;

  JS_SetOpaque(this_val, pUnit);
  return JS_TRUE;
}

JSAPI_FUNC(my_getParty)
{
  GAME_READY();

  RosterUnit *pUnit = *p_D2CLIENT_PlayerUnitList;

  if (!pUnit)
    return JS_FALSE;

  if (argc == 1)
  {
    UnitAny *inUnit = nullptr;
    const char *nPlayerName = nullptr;
    uint32_t nPlayerId = 0;

    if (JS_IsString(argv[0]))
    {
      nPlayerName = JS_ToCString(ctx, argv[0]);
    }
    else if (JS_IsNumber(argv[0]))
    {
      if (JS_ToUint32(ctx, &nPlayerId, argv[0]) < 0)
        JS_THROW_SINGLE_LINE(ctx, "Unable to get ID");
    }
    else if (JS_IsObject(argv[0]))
    {
      extern JSClassID unit_class_id;
      myUnit *lpUnit = (myUnit *)JS_GetOpaque(argv[0], unit_class_id);

      if (!lpUnit)
        return JS_FALSE;

      inUnit = D2CLIENT_FindUnit(lpUnit->dwUnitId, lpUnit->dwType);
      if (!inUnit)
        JS_THROW_SINGLE_LINE(ctx, "Unable to get Unit");

      nPlayerId = inUnit->dwUnitId;
    }

    if (!nPlayerName && !nPlayerId)
      return JS_FALSE;

    bool bFound = FALSE;

    for (RosterUnit *pScan = pUnit; pScan; pScan = pScan->pNext)
    {
      if (nPlayerId && pScan->dwUnitId == nPlayerId)
      {
        bFound = TRUE;
        pUnit = pScan;
        break;
      }
      if (nPlayerName && _stricmp(pScan->szName, nPlayerName) == 0)
      {
        bFound = TRUE;
        pUnit = pScan;
        break;
      }
    }
    if (nPlayerName)
      JS_FreeCString(ctx, nPlayerName);

    if (!bFound)
      return JS_FALSE;
  }

  JSValue jsUnit = BuildObject(ctx, party_class_id, pUnit);
  if (JS_IsException(jsUnit))
    return JS_FALSE;

  return jsUnit;
}

JSAPI_FUNC(my_clickParty)
{
  GAME_READY();

  if (argc < 2 || !JS_IsObject(argv[0]) || !JS_IsNumber(argv[1]))
    return JS_FALSE;

  UnitAny *myUnit = D2CLIENT_GetPlayerUnit();
  RosterUnit *pUnit = (RosterUnit *)JS_GetOpaque(argv[0], party_class_id);
  RosterUnit *mypUnit = *p_D2CLIENT_PlayerUnitList;

  if (!pUnit || !mypUnit)
    return JS_FALSE;

  BOOL bFound = FALSE;

  for (RosterUnit *pScan = mypUnit; pScan; pScan = pScan->pNext)
    if (pScan->dwUnitId == pUnit->dwUnitId)
      bFound = TRUE;

  if (!bFound)
    return JS_FALSE;

  uint32_t nMode;
  JS_ToUint32(ctx, &nMode, argv[1]);

  BnetData *pData = (*p_D2LAUNCH_BnData);

  // Attempt to loot player, check first if it's hardcore
  if (nMode == 0 && pData && !(pData->nCharFlags & PLAYER_TYPE_HARDCORE))
    return JS_FALSE;

  // Attempt to party a player who is already in party ^_~
  if (nMode == 2 && pUnit->wPartyId != 0xFFFF && mypUnit->wPartyId == pUnit->wPartyId && pUnit->wPartyId != 0xFFFF)
    return JS_FALSE;

  // don't leave a party if we are in none!
  if (nMode == 3 && pUnit->wPartyId == 0xFFFF)
    return JS_FALSE;
  else if (nMode == 3 && pUnit->wPartyId != 0xFFFF)
  {
    D2CLIENT_LeaveParty();
    return JS_FALSE;
  }

  if (nMode < 0 || nMode > 5)
    return JS_FALSE;

  // Trying to click self
  if (pUnit->dwUnitId == myUnit->dwUnitId)
    return JS_FALSE;

  if (nMode == 0)
    D2CLIENT_HostilePartyUnit(pUnit, 2);
  else if (nMode == 1)
    D2CLIENT_HostilePartyUnit(pUnit, 1);
  else if (nMode == 4)
    D2CLIENT_HostilePartyUnit(pUnit, 3);
  else if (nMode == 5)
    D2CLIENT_HostilePartyUnit(pUnit, 4);
  else
    D2CLIENT_ClickParty(pUnit, nMode);

  return JS_TRUE;
}

static const JSCFunctionListEntry js_party_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("x", party_getProperty, NULL, PARTY_X),
    JS_CGETSET_MAGIC_DEF("y", party_getProperty, NULL, PARTY_Y),
    JS_CGETSET_MAGIC_DEF("area", party_getProperty, NULL, PARTY_AREA),
    JS_CGETSET_MAGIC_DEF("gid", party_getProperty, NULL, PARTY_GID),
    JS_CGETSET_MAGIC_DEF("life", party_getProperty, NULL, PARTY_LIFE),
    JS_CGETSET_MAGIC_DEF("partyflag", party_getProperty, NULL, PARTY_FLAG),
    JS_CGETSET_MAGIC_DEF("partyid", party_getProperty, NULL, PARTY_ID),
    JS_CGETSET_MAGIC_DEF("name", party_getProperty, NULL, PARTY_NAME),
    JS_CGETSET_MAGIC_DEF("classid", party_getProperty, NULL, PARTY_CLASSID),
    JS_CGETSET_MAGIC_DEF("level", party_getProperty, NULL, PARTY_LEVEL),

    JS_CFUNC_DEF("getNext", 0, party_getNext),
};

static const JSCFunctionListEntry js_party_module_funcs[] = {
    JS_CFUNC_DEF("getParty", 1, my_getParty),
    JS_CFUNC_DEF("clickParty", 1, my_clickParty),
};

int js_module_party_init(JSContext *ctx, JSModuleDef *m)
{
  /* create the party class */
  JS_NewClassID(&party_class_id);
  JS_NewClass(JS_GetRuntime(ctx), party_class_id, &js_party_class);

  JSValue party_proto, party_class;
  party_proto = JS_NewObject(ctx);
  party_class = JS_NewCFunction2(ctx, js_party_ctor, "Party", 0, JS_CFUNC_constructor, 0);
  JS_SetPropertyFunctionList(ctx, party_proto, js_party_proto_funcs, ARRAYSIZE(js_party_proto_funcs));

  JS_SetConstructor(ctx, party_class, party_proto);
  JS_SetClassProto(ctx, party_class_id, party_proto);

  JS_SetModuleExport(ctx, m, "Party", party_class);
  JS_SetModuleExportList(ctx, m, js_party_module_funcs, ARRAYSIZE(js_party_module_funcs));
  return TRUE;
}

int js_module_party_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_party_module_funcs, ARRAYSIZE(js_party_module_funcs));
  JS_AddModuleExport(ctx, m, "Party");

  return TRUE;
}
