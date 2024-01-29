#include "JSScript.h"
#include "ScriptEngine.h"
#include "Script.h"
#include "Events.h"
#include "Helpers.h"
#include "D2Boot.h"

enum script_id
{
  SCRIPT_FILENAME,
  SCRIPT_GAMETYPE,
  SCRIPT_RUNNING,
  SCRIPT_THREADID,
  SCRIPT_MEMORY,
};

struct FindHelper : EachHelper
{
  const DWORD tid;
  const wchar_t *sname;
  Script *script;
};

static bool __fastcall FindScriptByName(Script *script, void *helper, unsigned int argc)
{
  FindHelper *findHelper = (FindHelper *)helper;
  // static uint pathlen = wcslen(Vars.szScriptPath) + 1;
  const wchar_t *fname = script->GetShortFilename();
  if (_wcsicmp(fname, findHelper->sname) == 0)
  {
    findHelper->script = script;
    return false;
  }
  return true;
}

static bool __fastcall FindScriptByTid(Script *script, void *helper, unsigned int argc)
{
  FindHelper *findHelper = (FindHelper *)helper;
  if (script->GetThreadId() == findHelper->tid)
  {
    findHelper->script = script;
    return false;
  }
  return true;
}

static JSClassID script_class_id;

static void js_script_finalizer(JSRuntime *rt, JSValue val)
{
  JS_SetOpaque(val, nullptr);
}

static JSClassDef js_script_class = {
    "Script",
    .finalizer = js_script_finalizer,
};

static JSValue js_script_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_FUNC(my_getScript)
{
  Script *script = nullptr;

  if (argc == 1 && JS_IsBool(argv[0]) && JS_ToBool(ctx, argv[0]))
  {
    // script = (Script *)JS_GetOpaque(this_val, script_class_id);
    script = (Script *)JS_GetContextOpaque(ctx);
  }
  else if (argc == 1 && JS_IsNumber(argv[0]))
  {
    // loop over the Scripts in ScriptEngine and find the one with the right threadid
    uint32_t tid;
    JS_ToUint32(ctx, &tid, argv[0]);

    // the FindScriptByTid no FireEvent, the stack variable is safe.
    const EventMeta meta = {(unsigned int)-1, "find", false, true};
    FindHelper helper = {&meta, tid, nullptr, nullptr};

    ScriptEngine::ForEachScript(FindScriptByTid, &helper, 1);

    if (helper.script)
      script = helper.script;
    else
      return JS_FALSE;
  }
  else if (argc == 1 && JS_IsString(argv[0]))
  {
    wchar_t *sname = nullptr;
    JS_ToUnicodeString(ctx, &sname, argv[0]);

    // if (sname)
    //   StringReplaceChar(sname, '/', '\\', wcslen(sname));

    // the FindScriptByName no FireEvent, the stack variable is safe.
    const EventMeta meta = {(unsigned int)-1, "find", false, true};
    FindHelper helper = {&meta, 0, sname, nullptr};
    ScriptEngine::ForEachScript(FindScriptByName, &helper, 1);

    free(sname);
    sname = nullptr;

    if (helper.script)
      script = helper.script;
    else
      return JS_FALSE;
  }
  else
  {
    if (ScriptEngine::scripts.size() > 0)
    {
      //	EnterCriticalSection(&ScriptEngine::lock);
      ScriptEngine::LockScriptList("getScript");
      script = ScriptEngine::scripts.begin()->second;
      ScriptEngine::UnLockScriptList("getScript");
      //	LeaveCriticalSection(&ScriptEngine::lock);
    }

    if (!script)
      return JS_FALSE;
  }

  JSValue res = BuildObject(ctx, script_class_id, script);
  if (JS_IsException(res))
    JS_THROW_SINGLE_LINE(ctx, "Failed to build the script object");

  return res;
}

JSAPI_FUNC(my_getScripts)
{
  JSValue returnArray = JS_NewArray(ctx);

  if (JS_IsException(returnArray))
    return JS_FALSE;

  DWORD dwArrayCount = 0;

  ScriptEngine::LockScriptList("getScripts");
  for (const auto &pair : ScriptEngine::scripts)
  {
    JSValue res = BuildObject(ctx, script_class_id, pair.second);
    if (JS_IsException(res))
      JS_THROW_SINGLE_LINE(ctx, "Failed to build the script object");

    JS_DefinePropertyValueUint32(ctx, returnArray, dwArrayCount, res, JS_PROP_C_W_E);
    dwArrayCount++;
  }
  ScriptEngine::UnLockScriptList("getScripts");

  return returnArray;
}

JSAPI_PGM(get_script_property)
{
  Script *pScript = (Script *)JS_GetOpaque(this_val, script_class_id);
  if (!pScript)
    return JS_FALSE;

  switch (magic)
  {
  case SCRIPT_FILENAME:
  {
    JSValue res = JS_NewUTF8String(ctx, pScript->GetShortFilename());
    return res;
  }
  case SCRIPT_GAMETYPE:
    return JS_NewBool(ctx, pScript->GetState() == InGame ? false : true);
  case SCRIPT_RUNNING:
    return JS_NewBool(ctx, pScript->IsRunning());
  case SCRIPT_THREADID:
    return JS_NewUint32(ctx, pScript->GetThreadId());
  case SCRIPT_MEMORY:
  {
    JSMemoryUsage stats;
    JSRuntime *rt = JS_GetRuntime(ctx);
    JS_ComputeMemoryUsage(rt, &stats);
    return JS_NewBigInt64(ctx, stats.memory_used_size);
  }
  default:
    break;
  }

  return JS_FALSE;
}

JSAPI_FUNC(script_getNext)
{
  Script *pScript = (Script *)JS_GetOpaque(this_val, script_class_id);

  ScriptEngine::LockScriptList("scrip.getNext");
  for (ScriptMap::iterator it = ScriptEngine::scripts.begin(); it != ScriptEngine::scripts.end(); it++)
  {
    if (it->second == pScript)
    {
      it++;
      if (it == ScriptEngine::scripts.end())
        break;
      JS_SetOpaque(this_val, it->second);
      ScriptEngine::UnLockScriptList("scrip.getNext");
      return JS_TRUE;
    }
  }
  ScriptEngine::UnLockScriptList("scrip.getNext");

  return JS_FALSE;
}

JSAPI_FUNC(script_stop)
{
  Script *pScript = (Script *)JS_GetOpaque(this_val, script_class_id);

  if (pScript->IsRunning())
    pScript->Stop();

  return JS_TRUE;
}

JSAPI_FUNC(script_pause)
{
  Script *pScript = (Script *)JS_GetOpaque(this_val, script_class_id);

  if (pScript->IsRunning())
    pScript->Pause();

  return JS_TRUE;
}

JSAPI_FUNC(script_resume)
{
  Script *pScript = (Script *)JS_GetOpaque(this_val, script_class_id);

  if (pScript->IsPaused())
    pScript->Resume();

  return JS_TRUE;
}

JSAPI_FUNC(script_join)
{
  Script *pScript = (Script *)JS_GetOpaque(this_val, script_class_id);

  pScript->Join();

  return JS_TRUE;
}

JSAPI_FUNC(script_send)
{
  Script *pScript = (Script *)JS_GetOpaque(this_val, script_class_id);

  if (!pScript || !pScript->IsRunning())
    return JS_FALSE;

  // only support one parameter, string or json string
  if (argc > 1)
    return JS_FALSE;

  ScriptEngine::LockScriptList("script.send");
  Event *evt = new Event;
  evt->owner = pScript;
  evt->meta = GetEventMeta("scriptmsg");
  evt->argc = 1;

  const char *msg = JS_ToCString(ctx, argv[0]);
  evt->size = strlen(msg);

  // the argv will free at ExecScriptEvent
  // a json string
  if (msg[0] == '{' || msg[0] == '"')
  {
    evt->argv = strdup(msg);
  }
  else
  {
    evt->size = evt->size + 2 + 1;
    evt->argv = malloc(evt->size * sizeof(char));
    sprintf((char *)evt->argv, "\"%s\"", msg);
  }

  JS_FreeCString(ctx, msg);

  pScript->FireEvent(evt);

  ScriptEngine::UnLockScriptList("script.send");

  return JS_TRUE;
}

static const JSCFunctionListEntry js_script_module_funcs[] = {
    JS_CFUNC_DEF("getScript", 1, my_getScript),
    JS_CFUNC_DEF("getScripts", 0, my_getScripts),
};

static const JSCFunctionListEntry js_script_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("name", get_script_property, NULL, SCRIPT_FILENAME),
    JS_CGETSET_MAGIC_DEF("type", get_script_property, NULL, SCRIPT_GAMETYPE),
    JS_CGETSET_MAGIC_DEF("running", get_script_property, NULL, SCRIPT_RUNNING),
    JS_CGETSET_MAGIC_DEF("threadid", get_script_property, NULL, SCRIPT_THREADID),
    JS_CGETSET_MAGIC_DEF("memory", get_script_property, NULL, SCRIPT_MEMORY),

    JS_CFUNC_DEF("getNext", 0, script_getNext),
    JS_CFUNC_DEF("pause", 0, script_pause),
    JS_CFUNC_DEF("resume", 0, script_resume),
    JS_CFUNC_DEF("stop", 0, script_stop),
    JS_CFUNC_DEF("join", 0, script_join),
    JS_CFUNC_DEF("send", 1, script_send),

};

int js_module_script_init(JSContext *ctx, JSModuleDef *m)
{
  JSValue script_proto, script_class;
  /* create the script class */
  JS_NewClassID(&script_class_id);
  JS_NewClass(JS_GetRuntime(ctx), script_class_id, &js_script_class);

  script_proto = JS_NewObject(ctx);
  script_class = JS_NewCFunction2(ctx, js_script_ctor, "Script", 0, JS_CFUNC_constructor, 0);
  JS_SetPropertyFunctionList(ctx, script_proto, js_script_proto_funcs, ARRAYSIZE(js_script_proto_funcs));

  JS_SetConstructor(ctx, script_class, script_proto);
  JS_SetClassProto(ctx, script_class_id, script_proto);
  JS_SetModuleExport(ctx, m, "Script", script_class);

  JS_SetModuleExportList(ctx, m, js_script_module_funcs, ARRAYSIZE(js_script_module_funcs));

  return TRUE;
}

int js_module_script_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_script_module_funcs, ARRAYSIZE(js_script_module_funcs));
  JS_AddModuleExport(ctx, m, "Script");

  return TRUE;
}
