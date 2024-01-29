#include "JSPresetUnit.h"
#include "CriticalSections.h"

// struct myPresetUnit
// {
//   DWORD dwType;
//   DWORD dwRoomX;
//   DWORD dwRoomY;
//   DWORD dwPosX;
//   DWORD dwPosY;
//   DWORD dwId;
//   DWORD dwLevel;
// };

// static void js_presetunit_finalizer(JSRuntime *rt, JSValue val)
// {
//   // JSPresetUnit *s = (JSPresetUnit *)JS_GetOpaque(val, presetunit_class_id);
//   /* Note: 's' can be NULL in case JS_SetOpaque() was not called */
//   // js_free_rt(rt, s);
// }

JSClassID presetunit_class_id;

static JSClassDef js_presetunit_class = {
    "PresetUnit",
    // .finalizer = js_presetunit_finalizer,
};

static JSValue js_presetunit_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_FUNC(my_getPresetunit)
{
  GAME_READY();

  if (argc < 1)
  {
    return JS_FALSE;
  }
  uint32_t levelId = 0;
  JS_ToUint32(ctx, &levelId, argv[0]);

  Level *pLevel = GetLevel(levelId);
  if (!pLevel)
    JS_THROW_SINGLE_LINE(ctx, "getPresetunit failed, couldn't access the level!");

  uint32_t nType = 0, nClassId = 0;
  if (argc >= 2)
    JS_ToUint32(ctx, &nType, argv[1]);

  if (argc >= 3)
    JS_ToUint32(ctx, &nClassId, argv[2]);

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;

  bool bAddedRoom = false;
  for (Room2 *pRoom = pLevel->pRoom2First; pRoom; pRoom = pRoom->pRoom2Next)
  {
    bAddedRoom = false;
    if (!pRoom->pRoom1)
    {
      D2COMMON_AddRoomData(D2CLIENT_GetPlayerUnit()->pAct, pLevel->dwLevelNo, pRoom->dwPosX, pRoom->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
      bAddedRoom = true;
    }

    for (PresetUnit *pUnit = pRoom->pPreset; pUnit; pUnit = pUnit->pPresetNext)
    {
      // Does it fit?
      if ((nType == 0 || pUnit->dwType == nType) && (nClassId == 0 || pUnit->dwTxtFileNo == nClassId))
      {
        // Yes it fits! Return it
        // JSPresetUnit *pPresetUnit = new JSPresetUnit;
        // pPresetUnit->dwPosX = pUnit->dwPosX;
        // pPresetUnit->dwPosY = pUnit->dwPosY;
        // pPresetUnit->dwRoomX = pRoom->dwPosX;
        // pPresetUnit->dwRoomY = pRoom->dwPosY;
        // pPresetUnit->dwType = pUnit->dwType;
        // pPresetUnit->dwId = pUnit->dwTxtFileNo;
        // pPresetUnit->dwLevel = levelId;

        JSValue object = BuildObject(ctx, presetunit_class_id);
        if (JS_IsException(object))
        {
          delete cRoom;
          JS_THROW_ERROR(ctx, "Failed to create presetunit object");
        }

        DPVIE(ctx, object, "x", pUnit->dwPosX);
        DPVIE(ctx, object, "y", pUnit->dwPosY);
        DPVIE(ctx, object, "roomx", pRoom->dwPosX);
        DPVIE(ctx, object, "roomy", pRoom->dwPosY);
        DPVIE(ctx, object, "type", pUnit->dwType);
        DPVIE(ctx, object, "id", pUnit->dwTxtFileNo);
        DPVIE(ctx, object, "level", levelId);
        // JS_DefinePropertyValueStr(ctx, object, "x", JS_NewUint32(ctx, pUnit->dwPosX), JS_PROP_ENUMERABLE);
        // JS_DefinePropertyValueStr(ctx, object, "y", JS_NewUint32(ctx, pUnit->dwPosY), JS_PROP_ENUMERABLE);
        // JS_DefinePropertyValueStr(ctx, object, "roomx", JS_NewUint32(ctx, pRoom->dwPosX), JS_PROP_ENUMERABLE);
        // JS_DefinePropertyValueStr(ctx, object, "roomy", JS_NewUint32(ctx, pRoom->dwPosY), JS_PROP_ENUMERABLE);
        // JS_DefinePropertyValueStr(ctx, object, "type", JS_NewUint32(ctx, pUnit->dwType), JS_PROP_ENUMERABLE);
        // JS_DefinePropertyValueStr(ctx, object, "id", JS_NewUint32(ctx, pUnit->dwTxtFileNo), JS_PROP_ENUMERABLE);
        // JS_DefinePropertyValueStr(ctx, object, "level", JS_NewUint32(ctx, levelId), JS_PROP_ENUMERABLE);

        // JS_SetOpaque(jsPresetUnit, pPresetUnit);
        if (bAddedRoom)
        {
          D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pLevel->dwLevelNo, pRoom->dwPosX, pRoom->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
          bAddedRoom = FALSE;
        }
        delete cRoom;
        return object;
      }
    }

    if (bAddedRoom)
    {
      D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pLevel->dwLevelNo, pRoom->dwPosX, pRoom->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
      bAddedRoom = FALSE;
    }
  }

  delete cRoom;
  return JS_FALSE;
}

JSAPI_FUNC(my_getPresetUnits)
{
  GAME_READY();

  if (argc < 1)
    return JS_FALSE;

  uint32_t levelId;
  JS_ToUint32(ctx, &levelId, argv[0]);
  Level *pLevel = GetLevel(levelId);

  if (!pLevel)
    JS_THROW_SINGLE_LINE(ctx, "getPresetUnits failed, couldn't access the level!");

  uint32_t nClassId = 0, nType = 0;

  if (argc >= 2)
    JS_ToUint32(ctx, &nType, argv[1]);

  if (argc >= 3)
    JS_ToUint32(ctx, &nClassId, argv[2]);

  AutoCriticalRoom *cRoom = new AutoCriticalRoom;

  bool bAddedRoom = FALSE;
  DWORD dwArrayCount = 0;

  JSValue returnArray = JS_NewArray(ctx);
  for (Room2 *pRoom = pLevel->pRoom2First; pRoom; pRoom = pRoom->pRoom2Next)
  {
    bAddedRoom = FALSE;

    if (!pRoom->pPreset)
    {
      D2COMMON_AddRoomData(D2CLIENT_GetPlayerUnit()->pAct, pLevel->dwLevelNo, pRoom->dwPosX, pRoom->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
      bAddedRoom = TRUE;
    }

    for (PresetUnit *pUnit = pRoom->pPreset; pUnit; pUnit = pUnit->pPresetNext)
    {
      // Does it fit?
      if ((nType == 0 || pUnit->dwType == nType) && (nClassId == 0 || pUnit->dwTxtFileNo == nClassId))
      {
        JSValue object = BuildObject(ctx, presetunit_class_id);
        if (JS_IsException(object))
        {
          delete cRoom;
          JS_THROW_ERROR(ctx, "Failed to create presetunit object");
        }

        DPVIE(ctx, object, "x", pUnit->dwPosX);
        DPVIE(ctx, object, "y", pUnit->dwPosY);
        DPVIE(ctx, object, "roomx", pRoom->dwPosX);
        DPVIE(ctx, object, "roomy", pRoom->dwPosY);
        DPVIE(ctx, object, "type", pUnit->dwType);
        DPVIE(ctx, object, "id", pUnit->dwTxtFileNo);
        DPVIE(ctx, object, "level", levelId);

        JS_DefinePropertyValueUint32(ctx, returnArray, dwArrayCount, object, JS_PROP_C_W_E);
        dwArrayCount++;
      }
    }

    if (bAddedRoom)
    {
      D2COMMON_RemoveRoomData(D2CLIENT_GetPlayerUnit()->pAct, pLevel->dwLevelNo, pRoom->dwPosX, pRoom->dwPosY, D2CLIENT_GetPlayerUnit()->pPath->pRoom1);
      bAddedRoom = FALSE;
    }
  }

  delete cRoom;
  return returnArray;
}

static const JSCFunctionListEntry js_presetunit_proto_funcs[] = {};

static const JSCFunctionListEntry js_presetunit_module_funcs[] = {
    JS_CFUNC_DEF("getPresetUnit", 1, my_getPresetunit),
    JS_CFUNC_DEF("getPresetUnits", 1, my_getPresetUnits),
};

int js_module_presetunit_init(JSContext *ctx, JSModuleDef *m)
{
  /* create the Preset Unit class */
  JS_NewClassID(&presetunit_class_id);
  JS_NewClass(JS_GetRuntime(ctx), presetunit_class_id, &js_presetunit_class);

  JSValue presetunit_proto, presetunit_class;
  presetunit_proto = JS_NewObject(ctx);
  presetunit_class = JS_NewCFunction2(ctx, js_presetunit_ctor, "PresetUnit", 0, JS_CFUNC_constructor, 0);
  JS_SetConstructor(ctx, presetunit_class, presetunit_proto);
  JS_SetClassProto(ctx, presetunit_class_id, presetunit_proto);

  JS_SetPropertyFunctionList(ctx, presetunit_proto, js_presetunit_proto_funcs, ARRAYSIZE(js_presetunit_proto_funcs));
  JS_SetModuleExport(ctx, m, "PresetUnit", presetunit_class);

  JS_SetModuleExportList(ctx, m, js_presetunit_module_funcs, ARRAYSIZE(js_presetunit_module_funcs));
  return TRUE;
}

int js_module_presetunit_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_presetunit_module_funcs, ARRAYSIZE(js_presetunit_module_funcs));
  JS_AddModuleExport(ctx, m, "PresetUnit");

  return TRUE;
}
