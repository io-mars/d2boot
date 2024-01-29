#include "JSArea.h"
#include "MapHeader.h"
#include "JSExits.h"

enum aunit_id
{
  AUNIT_EXITS,
  AUNIT_NAME,
  AUNIT_X,
  AUNIT_XSIZE,
  AUNIT_Y,
  AUNIT_YSIZE,
  AUNIT_ID,
  AUNIT_LEVEL
};

struct myArea
{
  DWORD AreaId;
  DWORD Exits;
  // JSValue ExitArray;
};

static JSClassID area_class_id;

static void js_area_finalizer(JSRuntime *rt, JSValue val)
{
  myArea *pArea = (myArea *)JS_GetOpaque(val, area_class_id);
  if (pArea)
    js_free_rt(rt, pArea);
}

static JSClassDef js_area_class = {
    "Area",
    .finalizer = js_area_finalizer,
};

static JSValue js_area_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_PGM(area_getProperty)
{
  myArea *pArea = (myArea *)JS_GetOpaque(this_val, area_class_id);

  if (!pArea)
    return JS_FALSE;

  Level *pLevel = GetLevel(pArea->AreaId);
  if (!pLevel)
    return JS_FALSE;

  JSValue val = JS_FALSE;
  switch (magic)
  {
  case AUNIT_EXITS:
    // if (JS_IsNull(pArea->ExitArray))
    {
      val = JS_NewArray(ctx);

      ActMap *map = ActMap::GetMap(pLevel);

      ExitArray exits;
      map->GetExits(exits);
      map->CleanUp();

      int count = exits.size();
      extern JSClassID exit_class_id;

      for (int i = 0; i < count; i++)
      {
        myExit *exit = (myExit *)js_mallocz(ctx, sizeof(*exit));
        if (!exit)
          return JS_FALSE;

        exit->id = exits[i].Target;
        exit->x = exits[i].Position.first;
        exit->y = exits[i].Position.second;
        exit->type = exits[i].Type;
        exit->tileid = exits[i].TileId;
        exit->level = pArea->AreaId;

        JSValue jsExit = BuildObject(ctx, exit_class_id, exit);
        if (JS_IsException(jsExit))
        {
          js_free(ctx, exit);
          exit = nullptr;
          JS_THROW_ERROR(ctx, "Failed to create exit object!");
        }

        JS_DefinePropertyValueUint32(ctx, val, i, jsExit, JS_PROP_C_W_E);
      }
    }

    break;
  case AUNIT_NAME:
  {
    LevelTxt *pTxt = D2COMMON_GetLevelText(pArea->AreaId);
    if (pTxt)
      val = JS_NewString(ctx, pTxt->szName);
  }
  break;
  case AUNIT_X:
    val = JS_NewUint32(ctx, pLevel->dwPosX);
    break;
  case AUNIT_Y:
    val = JS_NewUint32(ctx, pLevel->dwPosY);
    break;
  case AUNIT_XSIZE:
    val = JS_NewUint32(ctx, pLevel->dwSizeX);
    break;
  case AUNIT_YSIZE:
    val = JS_NewUint32(ctx, pLevel->dwSizeY);
    break;
  case AUNIT_ID:
    val = JS_NewUint32(ctx, pLevel->dwLevelNo);
    break;
  case AUNIT_LEVEL:
  {
    LevelTxt *pTxt = D2COMMON_GetLevelText(pArea->AreaId);
    if (pTxt)
    {
      int diff = D2CLIENT_GetDifficulty();
      val = JS_NewUint32(ctx, pTxt->nMonLv[*p_D2CLIENT_ExpCharFlag][diff]);
    }
  }
  break;
  }

  return val;
}

JSAPI_FUNC(my_getArea)
{
  GAME_READY();

  uint32_t nArea = GetPlayerArea();

  if (argc == 1)
  {
    if (JS_IsNumber(argv[0]))
      JS_ToUint32(ctx, &nArea, argv[0]);
    else
      JS_THROW_SINGLE_LINE(ctx, "Invalid parameter passed to getArea!");
  }

  if (nArea < 0)
    JS_THROW_SINGLE_LINE(ctx, "Invalid parameter passed to getArea!");

  Level *pLevel = GetLevel(nArea);

  if (!pLevel)
    return JS_FALSE;

  myArea *pArea = (myArea *)js_mallocz(ctx, sizeof(*pArea));
  if (!pArea)
    return JS_FALSE;

  pArea->AreaId = nArea;
  // pArea->ExitArray = JS_NULL;

  JSValue jsArea = BuildObject(ctx, area_class_id, pArea);
  if (JS_IsException(jsArea))
  {
    js_free(ctx, pArea);
    pArea = nullptr;
    JS_THROW_ERROR(ctx, "Failed to build area unit!");
  }

  return jsArea;
}

static const JSCFunctionListEntry js_area_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("exits", area_getProperty, NULL, AUNIT_EXITS),
    JS_CGETSET_MAGIC_DEF("name", area_getProperty, NULL, AUNIT_NAME),
    JS_CGETSET_MAGIC_DEF("x", area_getProperty, NULL, AUNIT_X),
    JS_CGETSET_MAGIC_DEF("xsize", area_getProperty, NULL, AUNIT_XSIZE),
    JS_CGETSET_MAGIC_DEF("y", area_getProperty, NULL, AUNIT_Y),
    JS_CGETSET_MAGIC_DEF("ysize", area_getProperty, NULL, AUNIT_YSIZE),
    JS_CGETSET_MAGIC_DEF("id", area_getProperty, NULL, AUNIT_ID),
    JS_CGETSET_MAGIC_DEF("level", area_getProperty, NULL, AUNIT_LEVEL),
};

static const JSCFunctionListEntry js_area_module_funcs[] = {
    JS_CFUNC_DEF("getArea", 1, my_getArea),
};

int js_module_area_init(JSContext *ctx, JSModuleDef *m)
{
  /* create the area class */
  JS_NewClassID(&area_class_id);
  JS_NewClass(JS_GetRuntime(ctx), area_class_id, &js_area_class);

  JSValue area_proto, area_class;
  area_proto = JS_NewObject(ctx);
  area_class = JS_NewCFunction2(ctx, js_area_ctor, "Area", 0, JS_CFUNC_constructor, 0);
  JS_SetPropertyFunctionList(ctx, area_proto, js_area_proto_funcs, ARRAYSIZE(js_area_proto_funcs));

  JS_SetConstructor(ctx, area_class, area_proto);
  JS_SetClassProto(ctx, area_class_id, area_proto);

  JS_SetModuleExport(ctx, m, "Area", area_class);
  JS_SetModuleExportList(ctx, m, js_area_module_funcs, ARRAYSIZE(js_area_module_funcs));
  return TRUE;
}

int js_module_area_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_area_module_funcs, ARRAYSIZE(js_area_module_funcs));
  JS_AddModuleExport(ctx, m, "Area");

  return TRUE;
}
