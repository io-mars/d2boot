#include <vector>
#include <assert.h>
#include "ScriptEngine.h"
#include "D2Boot.h"
#include "Helpers.h"
#include "Events.h"
#include "ScreenHook.h"

Script *ScriptEngine::console = nullptr;
EngineState ScriptEngine::state = Stopped;
// CRITICAL_SECTION ScriptEngine::lock = {0};
CRITICAL_SECTION ScriptEngine::scriptListLock = {0};
ScriptMap ScriptEngine::scripts = ScriptMap();
std::atomic<int> ScriptEngine::actives = {0};
HANDLE ScriptEngine::execEventSignal = nullptr;
wchar_t *ScriptEngine::consoleName = (wchar_t *)L"console";

// bool __fastcall DisposeScript(Script *script, void *, unsigned int);
bool __fastcall StopScript(Script *script, void *argv, unsigned int argc);

ScriptEngine::~ScriptEngine()
{
}

void ScriptEngine::LockScriptList(const char *loc)
{
  EnterCriticalSection(&scriptListLock);
}

void ScriptEngine::UnLockScriptList(const char *loc)
{
  LeaveCriticalSection(&scriptListLock);
}

Script *ScriptEngine::CompileFile(const wchar_t *file, ScriptState state, unsigned int argc, void **argv, bool recompile)
{
  if (GetState() != Running)
    return nullptr;

  wchar_t *fileName = _wcsdup(file);

  // format filename first!
  _wcslwr_s(fileName, wcslen(fileName) + 1);
  // StringReplaceChar(fileName, L'/', L'\\', wcslen(fileName));

  // DEBUG_LOG("--CCC--CompileFile key:[%ls]---state:[%d]-actives:[%d]--count[%d]", fileName, state, actives.load(), scripts.count(fileName));

  try
  {
    if (scripts.count(fileName))
      scripts[fileName]->Stop();

    Script *script = new Script(fileName, state, argc, argv);
    scripts[fileName] = script;
    free(fileName);

    return script;
  }
  catch (std::exception &ex)
  {
    Print(L"[\u00FFc1D2Boot :: exception\u00FFc0] compile file error: %s", ex.what());
    free(fileName);
    return nullptr;
  }
}

bool ScriptEngine::EvalScript(Script *script)
{
  if (script && script->BeginThread(ScriptThread))
  {
    if (script->scriptState != Command)
      actives++;

    // DEBUG_LOG("--EEE--CompileFile:[%ls]---state:[%d]-actives:[%d]", script->GetShortFilename(), state, actives.load());

    return true;
  }

  Print(L"[\u00FFc1D2Boot :: error\u00FFc0] eval script error: script is null or thread fail.");
  return false;
}

void ScriptEngine::RunCommand(const wchar_t *command)
{
  if (GetState() != Running)
    return;
  try
  {
    // EnterCriticalSection(&lock);
    console->RunCommand(command);
    // LeaveCriticalSection(&lock);
  }
  catch (std::exception &e)
  {
    // LeaveCriticalSection(&lock);
    wchar_t *what = AnsiToUnicode(e.what());
    Print(what);
    free(what);
  }
}

unsigned int ScriptEngine::GetCount(bool active, bool unexecuted)
{
  if (GetState() != Running)
    return 0;
  LockScriptList("getCount");
  // EnterCriticalSection(&lock);
  int count = scripts.size();
  for (ScriptMap::iterator it = scripts.begin(); it != scripts.end(); it++)
  {
    if (!active && it->second->IsRunning() && !it->second->IsAborted())
      count--;
    if (!unexecuted && it->second->GetExecutionCount() == 0 && !it->second->IsRunning())
      count--;
  }
  assert(count >= 0);
  UnLockScriptList("getCount");
  return count;
}

unsigned int ScriptEngine::GetExecCount()
{
  if (GetState() != Running)
    return 0;

  LockScriptList("getExecCount");
  int count = 0;
  for (ScriptMap::iterator it = scripts.begin(); it != scripts.end(); it++)
  {
    if (it->second->execState == ExecuteState::executing)
      count++;
  }
  UnLockScriptList("getExecCount");
  return count;
}

bool ScriptEngine::WaitForDisposed(const bool isShutdown)
{
  int tries = 20;
  while ((actives > 0 || (isShutdown && scripts.count(consoleName) > 0)) && tries > 0)
  {
    WaitForSingleObject(execEventSignal, 50);
    // DWORD dwCode = WaitForSingleObject(execEventSignal, 50);
    // DEBUG_LOG("--WaitForDisposed----try:%d---actives:%d--console:[%d]--WaitFor:-%ld\n", tries, actives.load(), scripts.count(L"console"), dwCode);
    tries--;
  }

  if (actives == 0)
    return true;

  Log(L"waiting for dispose error, actives:\"%d\".", actives.load());
  return false;
}

bool ScriptEngine::Startup(void)
{
  bool result = false;
  if (GetState() == Stopped)
  {
    state = Starting;
    InitializeCriticalSection(&scriptListLock);
    execEventSignal = CreateEvent(nullptr, FALSE, FALSE, L"ExecEventSignal");

    // InitializeCriticalSection(&lock);
    // EnterCriticalSection(&lock);
    LockScriptList("startup - enter");
    if (wcslen(Vars.szConsole) > 0)
    {
      wchar_t file[_MAX_FNAME + _MAX_PATH];
      swprintf_s(file, _countof(file), L"%s/%s", Vars.szScriptPath, Vars.szConsole);
      console = new Script(file, Command);
    }
    else
    {
      console = new Script(L"", Command);
    }

    if (console)
    {
      scripts[consoleName] = console;
      result = EvalScript(console);
      state = Running;
    }
    // LeaveCriticalSection(&lock);
    UnLockScriptList("startup - leave");
  }

  return result;
}

void ScriptEngine::Shutdown(void)
{
  if (GetState() == Running)
  {
    // bring the engine down properly
    // EnterCriticalSection(&lock);
    LockScriptList("ShutdownStop");

    // set engine state to stopping
    state = Stopping;
    StopAll(true);

    console->Stop(true, true);
    UnLockScriptList("ShutdownStop");

    WaitForDisposed(true);

    LockScriptList("Shutdown");
    // clear all scripts now that they're stopped
    if (!scripts.empty())
      scripts.clear();

    // clean all hook, the hook should deleted when disposed
    Genhook::Clean();

    UnLockScriptList("Shutdown");

    CloseHandle(execEventSignal);
    // LeaveCriticalSection(&lock);
    // DeleteCriticalSection(&lock);
    state = Stopped;
    Vars.bShutdown = TRUE;
  }
}

// void ScriptEngine::FlushCache(void)
// {
//   if (GetState() != Running)
//     return;

//   static bool isFlushing = false;

//   if (isFlushing || Vars.bDisableCache)
//     return;

//   // EnterCriticalSection(&lock);
//   // TODO: examine if this lock is necessary any more
//   EnterCriticalSection(&Vars.cFlushCacheSection);
//   isFlushing = true;
//   DisposeScriptAll();
//   isFlushing = false;
//   LeaveCriticalSection(&Vars.cFlushCacheSection);
//   // LeaveCriticalSection(&lock);
// }

bool ScriptEngine::ForEachScript(ScriptCallback callback, EachHelper *helper, unsigned int argc, bool extra)
{
  if (callback == nullptr || scripts.size() < 1)
    return false;

  bool block = false;

  LockScriptList("forEachScript");
  for (const auto &[name, script] : scripts)
  {
    // only callback the script that owner this event
    if (helper == nullptr ||
        (helper->meta && (helper->meta->every || script->IsListenerRegistered(helper->meta->name, extra))))
    {
      // DEBUG_LOG("--III--ForEachScript--callback--script name:[%ls]--script shortname:[%ls]--event:[%s]", name.c_str(), script->GetShortFilename(), helper ? helper->meta->name : "NULLname");
      if (callback(script, helper, argc))
        block = true;
    }
  }
  UnLockScriptList("forEachScript");

  return block;
}

void ScriptEngine::StopAll(const bool forceStop)
{
  if (GetState() != Running && !forceStop)
    return;

  // the StopScript no FireEvent, the stack variable is safe.
  const EventMeta meta = {(unsigned int)-1, "stop", false, true};
  StopEventHelper helper = {&meta, forceStop};
  ForEachScript(StopScript, &helper, 1);
}

bool ScriptEngine::ToggleScript(const bool isPause)
{
  bool resumed = false;
  LockScriptList("ResumeScript");

  for (const auto &[name, script] : scripts)
  {
    if (script->IsPaused())
    {
      script->Resume();
      resumed = true;
    }

    if (isPause && script->IsRunning())
    {
      script->Pause();
    }
  }
  UnLockScriptList("ResumeScript");
  return resumed;
}

void ScriptEngine::UpdateConsole()
{
  console->UpdatePlayerGid();
}

void ScriptEngine::DisposeScriptAll()
{
  LockScriptList("DisposeScriptAll");
  for (ScriptMap::iterator it = scripts.begin(); it != scripts.end();) // NOTE: cant it++ in here! erase will broken it
  {
    if (DisposeScript(it->second, false))
      scripts.erase(it++);
  }
  UnLockScriptList("DisposeScriptAll");
}

bool ScriptEngine::DisposeScript(Script *script, bool erased)
{
  bool bConsole = script->scriptState == Command;
  wchar_t *fileName;
  bool res = false;

  if (bConsole)
    fileName = _wcsdup(consoleName);
  else
    fileName = _wcsdup(script->GetFilename());

  // clean all event
  script->hasActiveCX = false;
  while (script->EventList.size() > 0)
  {
    EnterCriticalSection(&Vars.cEventSection);
    Event *evt = script->EventList.back();
    script->EventList.pop_back();
    LeaveCriticalSection(&Vars.cEventSection);
    ExecScriptEvent(evt, true); // clean list and pop events
  }

  // clear all
  script->ClearAllEvents();

  if (erased)
  {
    LockScriptList("DisposeScript");

    if (scripts.count(fileName))
      scripts.erase(fileName);

    UnLockScriptList("DisposeScript");
  }

  if (GetCurrentThreadId() == script->threadId)
  {
    delete script;
    script = nullptr;
    if (!bConsole)
    {
      actives--;
      SetEvent(execEventSignal);
      res = true;
    }
  }
  else
  {
    Log(L"WARNING dispose script:\"%ls\" error.", fileName);
    // bad things happen if we delete from another thread
    // must a heap variable!
    const EventMeta *meta = new EventMeta{(unsigned int)-1, "DisposeMe", false, false};
    Event *evt = new Event;
    evt->owner = script;
    evt->meta = meta;
    script->FireEvent(evt);
  }

  free(fileName);
  return res;
}

int InterruptHandler(JSRuntime *rt, void *opaque)
{
  Script *script = (Script *)opaque;

  bool pause = script->IsPaused();

  if (pause)
    script->SetPauseState(true);

  while (script->IsPaused())
  {
    Sleep(50);
    JS_RunGC(rt);
  }

  if (pause)
    script->SetPauseState(false);

  if (!(script->IsAborted() || ((script->GetState() == InGame) && ClientState() == ClientStateMenu)))
  {
    script->ExecEvent();
    return (script->IsAborted() || ((script->GetState() == InGame) && ClientState() == ClientStateMenu));
  }
  else
  {
    return true;
  }
}

static bool EventCallInner(JSContext *ctx, Script *script, const char *eventName, const int argc, JSValue *argv)
{
  JSValue ret = JS_UNDEFINED;
  bool block = false;

  for (const Caller &ec : script->functions[eventName])
  {
    // DEBUG_LOG("--ECI-->>>--caller:[%lld]--function name:[%s]--this:[%s]", ec.action, JS_ToCString(ctx, JS_GetPropertyStr(ctx, ec.action, "name")), JS_ToCString(ctx, JS_JSONStringify(ctx, ec.owner, JS_UNDEFINED, JS_UNDEFINED)));
    ret = JS_Call(ctx, ec.action, ec.owner, argc, argv);
    if (JS_IsException(ret))
    {
      JS_ReportError(ctx);
      JS_FreeValue(ctx, ret);
      return false;
    }

    block |= (JS_IsBool(ret) && JS_ToBool(ctx, ret));
    JS_FreeValue(ctx, ret);
  }
  return block;
}

bool ExecScriptEvent(Event *evt, bool clearList)
{
  // DEBUG_LOG("--EES-->>>--Event id:[%d] name:[%s] blocked:[%d] argv[%s]--GetShortFilename:%ls",
  //           evt->meta->id, evt->meta->name, evt->meta->blocked, (char *)evt->argv, evt->owner->GetShortFilename());

  // only free event, included blocked
  if (clearList)
  {
    evt->owner = nullptr;
    evt->meta = nullptr;

    free(evt->argv);
    evt->argv = nullptr;

    delete (DWORD *)evt->result;
    evt->result = nullptr;

    delete evt;
    evt = nullptr;

    // return now!
    return true;
  }

  JSContext *ctx = nullptr;
  JSValue jsArgv = JS_UNDEFINED;
  int argc = 0;

  ctx = evt->owner->GetContext();

  if (!evt->meta || !evt->meta->name)
    return false;

  if (evt->argv)
  {
    argc = 1;

    switch (evt->meta->mode)
    {
    case EAM_BYTE:
      // return a ArrayBuffer, let package=new Uint8Array(bytes); package[0] in js
      // jsArgv = JS_NewArrayBuffer(ctx, (uint8_t *)evt->argv, evt->size, NULL, NULL, FALSE);

      // return a array
      jsArgv = JS_NewArray(ctx);
      for (size_t i = 0; i < evt->size; i++)
      {
        JS_DefinePropertyValueUint32(ctx, jsArgv, i, JS_NewUint32(ctx, ((BYTE *)evt->argv)[i]), JS_PROP_C_W_E);
      }
      break;

    default:
      jsArgv = JS_ParseJSON(ctx, (char *)evt->argv, strlen((char *)evt->argv), "EventArgv");
      break;
    }

    if (JS_IsException(jsArgv))
    {
      JS_ReportError(ctx, "event name:[%s] the argv string:[%s]", evt->meta->name, (char *)evt->argv);
      JS_FreeValue(ctx, jsArgv);

      // FREE evt's argv NOW, even if it's blocked!
      free(evt->argv);
      evt->argv = nullptr;

      if (!evt->meta->blocked)
      {
        delete evt;
        evt = nullptr;
      }
      return false;
    }

    // FREE evt's argv NOW, even if it's blocked!
    free(evt->argv);
    evt->argv = nullptr;
  }

  // Exec script's event
  if (evt->meta->id > EM_FIRST && evt->meta->id < EM_LAST)
  {
    bool succeed = false;
    succeed = EventCallInner(ctx, evt->owner, evt->meta->name, argc, &jsArgv);
    JS_FreeValue(ctx, jsArgv);

    // set return value
    if (evt->meta->blocked)
    {
      // DEBUG_LOG("--EES--ExecScriptEvent---blocker event, setEvent, name:[%s] blocked:[%d] argv:[%s]", evt->meta->name, evt->meta->blocked, (char *)evt->argv);
      // *(DWORD *)evt->result = succeed;
      evt->result = new DWORD(succeed);
      SetEvent(Vars.eventSignal);
    }
    else
    {
      // only free normal event (NOT blocker)!
      delete evt;
      evt = nullptr;
    }

    return true;
  }

  if (strcmp(evt->meta->name, "DisposeMe") == 0)
  {
    ScriptEngine::DisposeScript(evt->owner);

    JS_FreeValue(ctx, jsArgv);
    // must free by self
    delete evt->meta;
    evt->meta = nullptr;
    delete evt;
    evt = nullptr;

    return true;
  }

  return false;
}

bool __fastcall StopScript(Script *script, void *helper, unsigned argc)
{
  script->TriggerInterruptHandler();
  if (script->GetState() != Command)
    script->Stop(((StopEventHelper *)helper)->force, ScriptEngine::GetState() == Stopping);
  return true;
}

bool __fastcall StopIngameScript(Script *script, void *, unsigned int)
{
  if (script->GetState() == InGame)
    script->Stop(true);
  return true;
}

// bool SetSkill(JSContext *ctx, uint16_t wSkillId, bool bLeft, uint32_t dwItemId = 0xFFFFFFFF);
bool SetSkill(JSContext *ctx, WORD wSkillId, bool bLeft, DWORD dwItemId)
{
  if (ClientState() != ClientStateInGame)
    return false;

  if (!GetSkill(wSkillId))
    return false;

  BYTE aPacket[9];

  aPacket[0] = 0x3C;
  *(WORD *)&aPacket[1] = wSkillId;
  aPacket[3] = 0;
  aPacket[4] = (bLeft) ? 0x80 : 0;
  *(DWORD *)&aPacket[5] = dwItemId;

  D2CLIENT_SendGamePacket(9, aPacket);

  UnitAny *me = D2CLIENT_GetPlayerUnit();
  int timeout = 0;
  Skill *hand = nullptr;
  while (ClientState() == ClientStateInGame)
  {
    hand = (bLeft ? me->pInfo->pLeftSkill : me->pInfo->pRightSkill);
    if (hand->pSkillInfo->wSkillId != wSkillId)
    {
      if (timeout > 10)
        return false;
      timeout++;
    }
    else
      return true;

    // run events to avoid packet block deadlock
    Script *script = (Script *)JS_GetContextOpaque(ctx);
    script->WaitForExecEvent(100);
  }

  return false;
}