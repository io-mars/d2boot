#include "JSRoom.h"
#include "CriticalSections.h"
#include "JSPresetUnit.h"
#include "JSUnit.h"
#include "Room.h"

enum room_id
{
  ROOM_NUM,
  ROOM_XPOS,
  ROOM_YPOS,
  ROOM_XSIZE,
  ROOM_YSIZE,
  ROOM_SUBNUMBER,
  ROOM_AREA,
  ROOM_LEVEL,
  ROOM_CORRECTTOMB,
};

static JSClassID room_class_id;

static void js_room_finalizer(JSRuntime *rt, JSValue val)
{
  // Room2 *room = (Room2 *)JS_GetOpaque(val, room_class_id);
  // if (room)
  //   js_free_rt(rt, room);
  JS_SetOpaque(val, nullptr);
}

static JSClassDef js_room_class = {
    "Room",
    .finalizer = js_room_finalizer,
};

static JSValue js_room_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_PGM(get_room_property)
{
  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);
  if (!pRoom2)
    return JS_FALSE;

  switch (magic)
  {
  case ROOM_NUM:
    if (pRoom2->dwPresetType != 2)
      return JS_NewInt32(ctx, -1);
    else if (pRoom2->pType2Info)
      return JS_NewUint32(ctx, pRoom2->pType2Info->dwRoomNumber);
  case ROOM_XPOS:
    return JS_NewUint32(ctx, pRoom2->dwPosX);
  case ROOM_YPOS:
    return JS_NewUint32(ctx, pRoom2->dwPosY);
  case ROOM_XSIZE:
    return JS_NewUint32(ctx, pRoom2->dwSizeX * 5);
  case ROOM_YSIZE:
    return JS_NewUint32(ctx, pRoom2->dwSizeY * 5);
  case ROOM_AREA:
  case ROOM_LEVEL:
    if (pRoom2->pLevel)
      return JS_NewUint32(ctx, pRoom2->pLevel->dwLevelNo);

    break;
  case ROOM_CORRECTTOMB:
    if (pRoom2->pLevel && pRoom2->pLevel->pMisc && pRoom2->pLevel->pMisc->dwStaffTombLevel)
      return JS_NewUint32(ctx, pRoom2->pLevel->pMisc->dwStaffTombLevel);
    break;

  default:
    break;
  }

  return JS_FALSE;
}

JSAPI_FUNC(my_getRoom)
{
  GAME_READY();

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;

  if (argc == 1 && JS_IsNumber(argv[0]))
  {
    uint32_t levelId;
    JS_ToUint32(ctx, &levelId, argv[0]);
    Room2 *pRoom2;

    if (levelId == 0) // 1 Parameter, AreaId
    {
      Room1 *pRoom1 = D2COMMON_GetRoomFromUnit(D2CLIENT_GetPlayerUnit());

      if (!pRoom1 || !pRoom1->pRoom2)
      {
        delete cRoom;
        return JS_FALSE;
      }
      pRoom2 = pRoom1->pRoom2;
    }
    else
    {
      Level *pLevel = GetLevel(levelId);

      if (!pLevel || !pLevel->pRoom2First)
      {
        delete cRoom;
        return JS_FALSE;
      }

      pRoom2 = pLevel->pRoom2First;
    }

    JSValue jsRoom = BuildObject(ctx, room_class_id, pRoom2);
    if (JS_IsException(jsRoom))
    {
      delete cRoom;
      return JS_FALSE;
    }

    delete cRoom;
    return jsRoom;
  }
  else if (argc == 3 || argc == 2) // area ,x and y /
  {
    Level *pLevel = NULL;
    uint32_t levelId;

    if (argc == 3)
    {
      JS_ToUint32(ctx, &levelId, argv[0]);
      pLevel = GetLevel(levelId);
    }
    else if (D2CLIENT_GetPlayerUnit() && D2CLIENT_GetPlayerUnit()->pPath && D2CLIENT_GetPlayerUnit()->pPath->pRoom1 &&
             D2CLIENT_GetPlayerUnit()->pPath->pRoom1->pRoom2)
    {
      pLevel = D2CLIENT_GetPlayerUnit()->pPath->pRoom1->pRoom2->pLevel;
    }

    if (!pLevel || !pLevel->pRoom2First)
    {
      delete cRoom;
      return JS_FALSE;
    }

    uint32_t nX = 0;
    uint32_t nY = 0;

    if (argc == 2)
    {
      JS_ToUint32(ctx, &nX, argv[0]);
      JS_ToUint32(ctx, &nY, argv[1]);
    }
    else if (argc == 3)
    {
      JS_ToUint32(ctx, &nX, argv[1]);
      JS_ToUint32(ctx, &nY, argv[2]);
    }
    if (!nX || !nY)
    {
      delete cRoom;
      return JS_FALSE;
    }

    // Scan for the room with the matching x,y coordinates.
    for (Room2 *pRoom = pLevel->pRoom2First; pRoom; pRoom = pRoom->pRoom2Next)
    {
      bool bAdded = FALSE;
      if (!pRoom->pRoom1)
      {
        D2COMMON_AddRoomData(D2CLIENT_GetPlayerUnit()->pAct, pLevel->dwLevelNo, pRoom->dwPosX, pRoom->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
        bAdded = TRUE;
      }

      CollMap *map = pRoom->pRoom1->Coll;
      if (nX >= map->dwPosGameX && nY >= map->dwPosGameY && nX < (map->dwPosGameX + map->dwSizeGameX) && nY < (map->dwPosGameY + map->dwSizeGameY))
      {
        if (bAdded)
          D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pLevel->dwLevelNo, pRoom->dwPosX, pRoom->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);

        JSValue jsRoom = BuildObject(ctx, room_class_id, pRoom);
        if (JS_IsException(jsRoom))
        {
          delete cRoom;
          return JS_FALSE;
        }

        delete cRoom;
        cRoom = nullptr;
        return jsRoom;
      }

      if (bAdded)
        D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pLevel->dwLevelNo, pRoom->dwPosX, pRoom->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
    }

    JSValue jsRoom = BuildObject(ctx, room_class_id, pLevel->pRoom2First);
    if (JS_IsException(jsRoom))
    {
      delete cRoom;
      return JS_FALSE;
    }

    delete cRoom;
    return jsRoom;
  }
  else
  {
    JSValue jsRoom = BuildObject(ctx, room_class_id, D2CLIENT_GetPlayerUnit()->pPath->pRoom1->pRoom2->pLevel->pRoom2First);
    if (JS_IsException(jsRoom))
    {
      delete cRoom;
      return JS_FALSE;
    }

    delete cRoom;
    return jsRoom;
  }
  delete cRoom;
  return JS_FALSE;
}

JSAPI_FUNC(room_getCollision)
{
  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);

  bool bAdded = FALSE;
  CollMap *pCol = NULL;

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;
  if (!pRoom2 || !GameReady())
  {
    delete cRoom;
    return JS_FALSE;
  }

  if (!pRoom2->pRoom1)
  {
    bAdded = TRUE;
    D2COMMON_AddRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
  }

  if (pRoom2->pRoom1)
    pCol = pRoom2->pRoom1->Coll;

  if (!pCol)
  {
    if (bAdded)
      D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
    delete cRoom;
    return JS_FALSE;
  }

  DWORD x = pCol->dwPosGameX - pRoom2->pLevel->dwPosX * 5;
  DWORD y = pCol->dwPosGameY - pRoom2->pLevel->dwPosY * 5;
  DWORD nCx = pCol->dwSizeGameX;
  DWORD nCy = pCol->dwSizeGameY;
  DWORD nLimitX = x + nCx;
  DWORD nLimitY = y + nCy;

  DWORD nCurrentArrayY = 0;
  WORD *p = pCol->pMapStart;

  JSValue jsArrayY = JS_NewArray(ctx);
  if (JS_IsException(jsArrayY))
    return JS_FALSE;

  for (DWORD j = y; j < nLimitY; j++)
  {
    JSValue jsArrayX = JS_NewArray(ctx);
    if (JS_IsException(jsArrayX))
      return JS_FALSE;

    int nCurrentArrayX = 0;
    for (DWORD i = x; i < nLimitX; i++)
    {
      JSValue nNode = JS_NewInt32(ctx, *p);

      if (JS_DefinePropertyValueUint32(ctx, jsArrayX, nCurrentArrayX, nNode, JS_PROP_C_W_E) < 0)
      {
        if (bAdded)
          D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY,
                                  D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
        delete cRoom;
        return JS_FALSE;
      }

      nCurrentArrayX++;
      p++;
    }

    if (JS_DefinePropertyValueUint32(ctx, jsArrayY, nCurrentArrayY, jsArrayX, JS_PROP_C_W_E) < 0)
    {
      if (bAdded)
        D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY,
                                D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
      delete cRoom;
      return JS_FALSE;
    }
    nCurrentArrayY++;
  }

  if (bAdded)
    D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);

  delete cRoom;
  return jsArrayY;
}

JSAPI_FUNC(room_getNearby)
{
  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);

  if (!pRoom2)
    return JS_FALSE;

  JSValue jsArray = JS_NewArray(ctx);
  if (JS_IsException(jsArray))
    return JS_FALSE;

  for (DWORD i = 0; i < pRoom2->dwRoomsNear; ++i)
  {
    JSValue jsRoom = BuildObject(ctx, room_class_id, pRoom2->pRoom2Near[i]);
    if (JS_IsException(jsRoom))
    {
      return JS_FALSE;
    }

    JS_DefinePropertyValueUint32(ctx, jsArray, i, jsRoom, JS_PROP_C_W_E);
  }

  return jsArray;
}

JSAPI_FUNC(room_getNext)
{
  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);
  if (!pRoom2)
    return JS_FALSE;

  pRoom2 = pRoom2->pRoom2Next;

  if (!pRoom2)
    return JS_FALSE;

  JS_SetOpaque(this_val, pRoom2);
  return JS_TRUE;
}

JSAPI_FUNC(room_getCollisionTypeArray)
{
  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);

  bool bAdded = FALSE;
  CollMap *pCol = NULL;

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;
  if (!pRoom2 || !GameReady())
  {
    delete cRoom;
    return JS_FALSE;
  }

  if (!pRoom2->pRoom1)
  {
    bAdded = TRUE;
    D2COMMON_AddRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
  }

  if (pRoom2->pRoom1)
    pCol = pRoom2->pRoom1->Coll;

  if (!pCol)
  {
    if (bAdded)
      D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
    delete cRoom;
    return JS_FALSE;
  }

  int x = pCol->dwPosGameX - pRoom2->pLevel->dwPosX * 5;
  int y = pCol->dwPosGameY - pRoom2->pLevel->dwPosY * 5;
  int nCx = pCol->dwSizeGameX;
  int nCy = pCol->dwSizeGameY;

  int nLimitX = x + nCx;
  int nLimitY = y + nCy;

  int nCurrentArrayY = 0;

  WORD *p = pCol->pMapStart;

  JSValue jsobjy = JS_NewArray(ctx);
  if (JS_IsException(jsobjy))
    return JS_FALSE;

  for (int j = y; j < nLimitY; j++)
  {
    int nCurrentArrayX = 0;
    for (int i = x; i < nLimitX; i++)
    {
      JSValue nNode = JS_NewUint32(ctx, *p);

      if (JS_DefinePropertyValueUint32(ctx, jsobjy, nCurrentArrayY * nCx + nCurrentArrayX, nNode, JS_PROP_C_W_E) < 0)
      {
        if (bAdded)
          D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY,
                                  D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
        delete cRoom;
        return JS_FALSE;
      }

      nCurrentArrayX++;
      p++;
    }
    nCurrentArrayY++;
  }

  if (bAdded)
    D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);

  delete cRoom;
  return jsobjy;
}

JSAPI_FUNC(room_getPresetUnits)
{
  extern JSClassID presetunit_class_id;

  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);

  uint32_t nType = 0, nClass = 0;

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &nType, argv[0]);

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &nClass, argv[0]);

  bool bAdded = FALSE;
  DWORD dwArrayCount = 0;

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;
  if (!pRoom2 || !GameReady())
  {
    delete cRoom;
    return JS_FALSE;
  }

  if (!pRoom2->pRoom1)
  {
    bAdded = TRUE;
    D2COMMON_AddRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
  }

  JSValue returnArray = JS_NewArray(ctx);
  for (PresetUnit *pUnit = pRoom2->pPreset; pUnit; pUnit = pUnit->pPresetNext)
  {
    if ((pUnit->dwType == nType || nType == 0) && (pUnit->dwTxtFileNo == nClass || nClass == 0))
    {
      JSValue jsUnit = BuildObject(ctx, presetunit_class_id);
      if (JS_IsException(jsUnit))
      {
        delete cRoom;
        JS_THROW_ERROR(ctx, "Failed to create presetunit object");
      }

      DPVIE(ctx, jsUnit, "x", pUnit->dwPosX);
      DPVIE(ctx, jsUnit, "y", pUnit->dwPosY);
      DPVIE(ctx, jsUnit, "roomx", pRoom2->dwPosX);
      DPVIE(ctx, jsUnit, "roomy", pRoom2->dwPosY);
      DPVIE(ctx, jsUnit, "type", pUnit->dwType);
      DPVIE(ctx, jsUnit, "id", pUnit->dwTxtFileNo);
      DPVIE(ctx, jsUnit, "level", pRoom2->pLevel->dwLevelNo);

      JS_DefinePropertyValueUint32(ctx, returnArray, dwArrayCount, jsUnit, JS_PROP_C_W_E);

      dwArrayCount++;
    }
  }

  if (bAdded)
    D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);

  delete cRoom;
  return returnArray;
}

JSAPI_FUNC(room_reveal)
{
  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);

  BOOL bDrawPresets = false;
  if (argc == 1 && JS_IsBool(argv[0]))
    bDrawPresets = !!JS_ToBool(ctx, argv[0]);

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;
  if (!pRoom2 || !GameReady())
  {
    delete cRoom;
    return JS_FALSE;
  }
  JSValue res = JS_NewBool(ctx, RevealRoom(pRoom2, bDrawPresets));
  delete cRoom;
  return res;
}

// Don't know whether it works or not
JSAPI_FUNC(room_getStat)
{
  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);

  if (argc < 1 || !JS_IsNumber(argv[0]))
    return JS_FALSE;

  uint32_t nStat;
  JS_ToUint32(ctx, &nStat, argv[0]);

  bool bAdded = false;

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;
  if (!pRoom2 || !GameReady())
  {
    delete cRoom;
    return JS_FALSE;
  }
  if (!pRoom2->pRoom1)
  {
    bAdded = true;
    D2COMMON_AddRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
  }

  if (!pRoom2->pRoom1)
  {
    delete cRoom;
    return JS_FALSE;
  }

  JSValue res = JS_UNDEFINED;
  if (nStat == 0) // xStart
    res = JS_NewUint32(ctx, pRoom2->pRoom1->dwXStart);
  else if (nStat == 1)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->dwYStart);
  else if (nStat == 2)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->dwXSize);
  else if (nStat == 3)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->dwYSize);
  else if (nStat == 4)
    res = JS_NewUint32(ctx, pRoom2->dwPosX);
  else if (nStat == 5)
    res = JS_NewUint32(ctx, pRoom2->dwPosY);
  else if (nStat == 6)
    res = JS_NewUint32(ctx, pRoom2->dwSizeX);
  else if (nStat == 7)
    res = JS_NewUint32(ctx, pRoom2->dwSizeY);
  //	else if(nStat == 8)
  //		*res = JS_NewUint32(ctx, pRoom2->pRoom1->dwYStart); // God knows??!!??!?!?!?!
  else if (nStat == 9)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->Coll->dwPosGameX);
  else if (nStat == 10)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->Coll->dwPosGameY);
  else if (nStat == 11)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->Coll->dwSizeGameX);
  else if (nStat == 12)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->Coll->dwSizeGameY);
  else if (nStat == 13)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->Coll->dwPosRoomX);
  else if (nStat == 14)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->Coll->dwPosGameY);
  else if (nStat == 15)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->Coll->dwSizeRoomX);
  else if (nStat == 16)
    res = JS_NewUint32(ctx, pRoom2->pRoom1->Coll->dwSizeRoomY);

  if (bAdded)
    D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pRoom2->pLevel->dwLevelNo, pRoom2->dwPosX, pRoom2->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);

  delete cRoom;
  return res;
}

JSAPI_FUNC(room_getFirst)
{
  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);
  if (!pRoom2 || !pRoom2->pLevel || !pRoom2->pLevel->pRoom2First)
    return JS_FALSE;

  JSValue jsroom = BuildObject(ctx, room_class_id, pRoom2->pLevel->pRoom2First);
  if (JS_IsException(jsroom))
    return JS_FALSE;

  return jsroom;
}

JSAPI_FUNC(room_unitInRoom)
{
  extern JSClassID unit_class_id;

  Room2 *pRoom2 = (Room2 *)JS_GetOpaque(this_val, room_class_id);
  if (!pRoom2 || argc < 1 || !JS_IsObject(argv[0]))
    return JS_FALSE;

  myUnit *pmyUnit = (myUnit *)JS_GetOpaque(argv[0], unit_class_id);

  if (!pmyUnit || (pmyUnit->dwPrivateType & PRIVATE_UNIT) != PRIVATE_UNIT)
    return JS_FALSE;

  UnitAny *pUnit = D2CLIENT_FindUnit(pmyUnit->dwUnitId, pmyUnit->dwType);

  if (!pUnit)
    return JS_FALSE;

  Room1 *pRoom1 = D2COMMON_GetRoomFromUnit(pUnit);

  if (!pRoom1 || !pRoom1->pRoom2)
    return JS_FALSE;

  return JS_NewBool(ctx, !!(pRoom1->pRoom2 == pRoom2));
}

static const JSCFunctionListEntry js_module_funcs[] = {
    JS_CFUNC_DEF("getRoom", 1, my_getRoom),
};

static const JSCFunctionListEntry js_room_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("number", get_room_property, NULL, ROOM_NUM),
    JS_CGETSET_MAGIC_DEF("x", get_room_property, NULL, ROOM_XPOS),
    JS_CGETSET_MAGIC_DEF("y", get_room_property, NULL, ROOM_YPOS),
    JS_CGETSET_MAGIC_DEF("xsize", get_room_property, NULL, ROOM_XSIZE),
    JS_CGETSET_MAGIC_DEF("ysize", get_room_property, NULL, ROOM_YSIZE),
    JS_CGETSET_MAGIC_DEF("subnumber", get_room_property, NULL, ROOM_SUBNUMBER),
    JS_CGETSET_MAGIC_DEF("area", get_room_property, NULL, ROOM_AREA),
    JS_CGETSET_MAGIC_DEF("level", get_room_property, NULL, ROOM_LEVEL),
    JS_CGETSET_MAGIC_DEF("correcttomb", get_room_property, NULL, ROOM_CORRECTTOMB),

    JS_CFUNC_DEF("getNext", 0, room_getNext),
    JS_CFUNC_DEF("getCollision", 0, room_getCollision),
    JS_CFUNC_DEF("getNearby", 0, room_getNearby),
    JS_CFUNC_DEF("getCollisionA", 0, room_getCollisionTypeArray),
    JS_CFUNC_DEF("reveal", 1, room_reveal),
    JS_CFUNC_DEF("getPresetUnits", 0, room_getPresetUnits),
    JS_CFUNC_DEF("getStat", 0, room_getStat),
    JS_CFUNC_DEF("getFirst", 0, room_getFirst),
    JS_CFUNC_DEF("unitInRoom", 1, room_unitInRoom),
};

int js_module_room_init(JSContext *ctx, JSModuleDef *m)
{
  JSValue room_proto, room_class;

  /* create the Room class */
  JS_NewClassID(&room_class_id);
  JS_NewClass(JS_GetRuntime(ctx), room_class_id, &js_room_class);

  room_proto = JS_NewObject(ctx);
  // room_class = JS_NewCFunction(ctx, js_room_ctor, "Room", 0);
  room_class = JS_NewCFunction2(ctx, js_room_ctor, "Room", 0, JS_CFUNC_constructor, 0);
  JS_SetPropertyFunctionList(ctx, room_proto, js_room_proto_funcs, ARRAYSIZE(js_room_proto_funcs));

  JS_SetConstructor(ctx, room_class, room_proto);
  JS_SetClassProto(ctx, room_class_id, room_proto);

  JS_SetModuleExportList(ctx, m, js_module_funcs, ARRAYSIZE(js_module_funcs));
  JS_SetModuleExport(ctx, m, "Room", room_class);

  return TRUE;
}

int js_module_room_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_module_funcs, ARRAYSIZE(js_module_funcs));
  JS_AddModuleExport(ctx, m, "Room");

  return TRUE;
}
