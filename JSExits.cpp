#include "JSExits.h"
#include "MapHeader.h"

enum exit_id
{
  EXIT_X,
  EXIT_Y,
  EXIT_TARGET,
  EXIT_TYPE,
  EXIT_TILEID,
  EXIT_LEVELID
};

JSClassID exit_class_id;

static void js_exit_finalizer(JSRuntime *rt, JSValue val)
{
  myExit *pExit = (myExit *)JS_GetOpaque(val, exit_class_id);
  if (pExit)
    js_free_rt(rt, pExit);
}

static JSClassDef js_exit_class = {
    "Exit",
    .finalizer = js_exit_finalizer,
};

static JSValue js_exit_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_PGM(exit_getProperty)
{
  myExit *pExit = (myExit *)JS_GetOpaque(this_val, exit_class_id);
  if (!pExit)
    return JS_FALSE;

  JSValue val = JS_FALSE;
  switch (magic)
  {
  case EXIT_X:
    val = JS_NewUint32(ctx, pExit->x);
    break;
  case EXIT_Y:
    val = JS_NewUint32(ctx, pExit->y);
    break;
  case EXIT_TARGET:
    val = JS_NewUint32(ctx, pExit->id);
    break;
  case EXIT_TYPE:
    val = JS_NewUint32(ctx, pExit->type);
    break;
  case EXIT_TILEID:
    val = JS_NewUint32(ctx, pExit->tileid);
    break;
  case EXIT_LEVELID:
    val = JS_NewUint32(ctx, pExit->level);
    break;
  default:
    break;
  }
  return val;
}

static const JSCFunctionListEntry js_exit_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("x", exit_getProperty, NULL, EXIT_X),
    JS_CGETSET_MAGIC_DEF("y", exit_getProperty, NULL, EXIT_Y),
    JS_CGETSET_MAGIC_DEF("target", exit_getProperty, NULL, EXIT_TARGET),
    JS_CGETSET_MAGIC_DEF("type", exit_getProperty, NULL, EXIT_TYPE),
    JS_CGETSET_MAGIC_DEF("tileid", exit_getProperty, NULL, EXIT_TILEID),
    JS_CGETSET_MAGIC_DEF("level", exit_getProperty, NULL, EXIT_LEVELID),
};

static const JSCFunctionListEntry js_exit_module_funcs[] = {};

int js_module_exit_init(JSContext *ctx, JSModuleDef *m)
{
  /* create the exit class */
  JS_NewClassID(&exit_class_id);
  JS_NewClass(JS_GetRuntime(ctx), exit_class_id, &js_exit_class);

  JSValue exit_proto, exit_class;
  exit_proto = JS_NewObject(ctx);
  exit_class = JS_NewCFunction2(ctx, js_exit_ctor, "Exit", 0, JS_CFUNC_constructor, 0);
  JS_SetPropertyFunctionList(ctx, exit_proto, js_exit_proto_funcs, ARRAYSIZE(js_exit_proto_funcs));

  JS_SetConstructor(ctx, exit_class, exit_proto);
  JS_SetClassProto(ctx, exit_class_id, exit_proto);

  JS_SetModuleExport(ctx, m, "Exit", exit_class);
  JS_SetModuleExportList(ctx, m, js_exit_module_funcs, ARRAYSIZE(js_exit_module_funcs));
  return TRUE;
}

int js_module_exit_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_exit_module_funcs, ARRAYSIZE(js_exit_module_funcs));
  JS_AddModuleExport(ctx, m, "Exit");

  return TRUE;
}
