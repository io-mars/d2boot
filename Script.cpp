#include <algorithm>
#include "Script.h"
#include "ScriptEngine.h"
#include "BootException.h"
#include "JSHelpers.h"
#include "D2Boot.h"
#include "Helpers.h"

#include "JSBoot.h"

// using namespace std;

Script::Script(const wchar_t *file, ScriptState state, unsigned int argc, void **argv)
    : script(JS_NULL), argc(argc), argv(argv), execCount(0), scriptState(state), globalObject(JS_NULL), isPaused(false), isReallyPaused(false), isAborted(false), threadHandle(INVALID_HANDLE_VALUE), threadId(0)
{
  InitializeCriticalSection(&lock);
  hasActiveCX = false;
  eventSignal = CreateEvent(nullptr, true, false, nullptr);

  if (scriptState == Command && wcslen(file) < 1)
  {
    fileName = _wcsdup(L"CommandLine");
  }
  else
  {
    if (_waccess(file, 0) != 0)
    {
      Log(L"could not access file:%ls", file);
      throw BootException("could not access file: %ls", file);
    }

    fileName = _wcsdup(file);
    if (!fileName)
      throw BootException("could not dup filename: %ls", file);
  }
  szFileName = UnicodeToAnsi(fileName);
  execState = ExecuteState::Standby;
}

Script::~Script()
{
  if (argv)
  {
    // MTODO
    argv = nullptr;
  }

  // the dup callback func freeValue, DisposeScript have called ClearAllEvents
  ClearAllEvents();

  // crashed when free script!
  //  if (script)
  //  {
  //    JS_FreeValue(context, script);
  //  }

  // JS_FreeValue(context, script);
  if (context)
  {
    JS_FreeContext(context);
    context = nullptr;
  }
  if (runtime)
  {
    JS_FreeRuntime(runtime);
    runtime = nullptr;
  }

  CloseHandle(eventSignal);
  if (threadHandle != INVALID_HANDLE_VALUE)
    CloseHandle(threadHandle);

  free(fileName);
  fileName = nullptr;
  free(szFileName);
  szFileName = nullptr;

  // LeaveCriticalSection(&lock);
  DeleteCriticalSection(&lock);
}

DWORD Script::GetThreadId(void)
{
  return (threadHandle == INVALID_HANDLE_VALUE ? -1 : threadId);
}

void Script::RunCommand(const wchar_t *command)
{
  // RUNCOMMANDSTRUCT* rcs = new RUNCOMMANDSTRUCT;
  // rcs->script = this;
  // rcs->command = _wcsdup(command);

  if (isAborted)
  { // this should never happen -bob
    // RUNCOMMANDSTRUCT* rcs = new RUNCOMMANDSTRUCT;

    // rcs->script = this;
    // rcs->command = _wcsdup(L"delay(1000000);");

    Log(L"Console Aborted HELP!");
    // HANDLE hwnd = CreateThread(NULL, 0, RunCommandThread, (void*) rcs, 0, NULL);
  }

  const EventMeta meta = {(unsigned int)-1, "Command", false, false};
  Event *evt = new Event;
  evt->owner = this;
  evt->argc = argc;
  evt->meta = &meta;

  // MTODO
  // evt->meta = command;

  EnterCriticalSection(&Vars.cEventSection);
  evt->owner->EventList.push_front(evt);
  LeaveCriticalSection(&Vars.cEventSection);
  evt->owner->TriggerInterruptHandler();
  SetEvent(evt->owner->eventSignal);
}

bool Script::BeginThread(LPTHREAD_START_ROUTINE ThreadFunc)
{
  EnterCriticalSection(&lock);
  DWORD dwExitCode = STILL_ACTIVE;

  if ((!GetExitCodeThread(threadHandle, &dwExitCode) || dwExitCode != STILL_ACTIVE) && (threadHandle = CreateThread(0, 0, ThreadFunc, this, 0, &threadId)) != NULL)
  {
    LeaveCriticalSection(&lock);
    return true;
  }

  threadHandle = INVALID_HANDLE_VALUE;
  LeaveCriticalSection(&lock);
  return false;
}

bool Script::IsRunning(void)
{
  return context && !(IsAborted() || IsPaused() || !hasActiveCX);
}

bool Script::IsAborted(void)
{
  return isAborted;
}

void Script::UpdatePlayerGid(void)
{
  // me alway is NULL, just leave here.
  if (me)
    me->dwUnitId = (D2CLIENT_GetPlayerUnit() == NULL ? 0 : D2CLIENT_GetPlayerUnit()->dwUnitId);
}

void Script::Run(void)
{
  execState = ExecuteState::Starting;

  runtime = JS_NewRuntime();
  context = JS_NewContext(runtime);

  JS_SetModuleLoaderFunc(runtime, JS_ModuleNormalizeName, JS_ModuleLoader, nullptr);
  // set promise rejection tracker
  JS_SetHostPromiseRejectionTracker(runtime, JS_PromiseTracker, nullptr);
  // add console and print support
  js_std_add_helpers(context, argc, (char **)argv);

  js_init_module_std(context, "std");
  js_init_module_os(context, "os");
  js_init_module_boot(context, "boot");

  JS_SetInterruptHandler(runtime, InterruptHandler, this);
  JS_SetContextOpaque(context, this);

  // globalObject = JS_GetGlobalObject(context);
  // JSValue meVal = JS_GetPropertyStr(context, globalObject, "me");
  // if (!JS_IsException(meVal) && !JS_IsUndefined(meVal))
  // {
  //   me = (myUnit *)JS_GetOpaque(meVal, NULL);
  // }

  if (scriptState == Command)
  {
    if (wcslen(Vars.szConsole) > 0)
    {
      uint8_t *buf;
      size_t buf_len;

      buf = js_load_file(context, &buf_len, szFileName);
      script = JS_Eval(context, (char *)buf, buf_len, "<ConsoleScript>", JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
      js_free(context, buf);
    }
    else
    {
      const char *cmd = "import * as boot from 'boot';\
        boot.print('\\xFFc2D2Boot\\xFFc0 :: Started Console');\
        while (true){boot.delay(10000)}";

      script = JS_Eval(context, cmd, strlen(cmd), "<CommandLine>", JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
    }
  }
  else
  {
    uint8_t *buf;
    size_t buf_len;

    buf = js_load_file(context, &buf_len, szFileName);
    script = JS_Eval(context, (char *)buf, buf_len, szFileName + wcslen(Vars.szScriptPath) + 1, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
    js_free(context, buf);
  }

  if (JS_IsException(script))
  {
    execState = ExecuteState::Stopped;
    JS_ReportError(context);
    return;
  }

  // only let the script run if it's not already running
  if (IsRunning())
  {
    execState = ExecuteState::executing;
    return;
  }

  hasActiveCX = true;
  isAborted = false;

  execState = ExecuteState::executing;
  // add import.meta support
  js_module_set_import_meta(context, script, TRUE, FALSE);
  JSValue val = JS_EvalFunction(context, script);

  if (JS_IsException(val))
  {
    execState = ExecuteState::Stopped;
    JS_ReportError(context);
    return;
  }

  // js_std_loop(context);
  int err;
  JSContext *ctx1;
  for (;;)
  {
    err = JS_ExecutePendingJob(JS_GetRuntime(context), &ctx1);
    if (err <= 0)
    {
      if (err < 0)
        JS_ReportError(ctx1);

      break;
    }
  }

  JS_FreeValue(context, val);

  execCount++;
  execState = ExecuteState::Stopped;
}

void Script::Pause(void)
{
  if (!IsAborted() && !IsPaused())
    isPaused = true;

  TriggerInterruptHandler();
  SetEvent(eventSignal);
}

void Script::Join(void)
{
  EnterCriticalSection(&lock);
  HANDLE hThread = threadHandle;
  LeaveCriticalSection(&lock);

  if (hThread != INVALID_HANDLE_VALUE)
    WaitForSingleObject(hThread, INFINITE);
}

void Script::Resume(void)
{
  if (!IsAborted() && IsPaused())
    isPaused = false;

  TriggerInterruptHandler();
  SetEvent(eventSignal);
}

bool Script::IsPaused(void)
{
  return isPaused;
}

void Script::Stop(bool force, bool reallyForce)
{
  // if we've already stopped, just return
  if (isAborted)
    return;

  EnterCriticalSection(&lock);
  // tell everyone else that the script is aborted FIRST
  isAborted = true;
  isPaused = false;
  isReallyPaused = false;
  if (GetState() != Command)
  {
    const wchar_t *displayName = fileName + wcslen(Vars.szScriptPath) + 1;
    Print(L"Script %ls ended", displayName);
  }

  // trigger call back so script ends
  TriggerInterruptHandler();
  SetEvent(eventSignal);

  // normal wait: 500ms, forced wait: 300ms, really forced wait: 100ms
  int maxCount = (force ? (reallyForce ? 10 : 30) : 50);
  if (GetCurrentThreadId() != GetThreadId())
  {
    for (int i = 0; hasActiveCX == true; i++)
    {
      // if we pass the time frame, just ignore the wait because the thread will end forcefully anyway
      if (i >= maxCount)
        break;
      Sleep(10);
    }
  }
  LeaveCriticalSection(&lock);
}

const wchar_t *Script::GetShortFilename(void)
{
  if (wcscmp(fileName, L"CommandLine") == 0)
    return fileName;
  else
    return (fileName + wcslen(Vars.szScriptPath) + 1);
}

bool Script::IsListenerRegistered(const char *evtName, bool extra)
{
  if (strlen(evtName) == 0)
    return false;

  if (functions.count(evtName) > 0)
    return true;

  if (extra)
  {
    char bname[30] = "";
    sprintf(bname, "%sblocker", evtName);
    return functions.count(bname) > 0;
  }

  return false;
}

void Script::RegisterEvent(const char *evtName, const JSValue procVal, const JSValue thisVal)
{
  EnterCriticalSection(&lock);
  if (JS_IsFunction(context, procVal) && strlen(evtName) > 0)
  {
    // procVal might be destroyed when calling itself (if it frees the handler), so must take extra care
    // support for arrow function
    JSValue action = JS_DupValue(context, procVal);
    JSValue owner = JS_DupValue(context, thisVal);

    Caller caller = {action, owner};
    // DEBUG_LOG("--REG---eventName[%s] script:[%ls] proc point:[%p]-JSV:[%lld] dupProc point:[%p]-JSV:[%lld]", evtName, GetShortFilename(), &procVal, procVal, &action, action);

    functions[evtName].push_back(caller);
  }
  LeaveCriticalSection(&lock);
}

void Script::UnregisterEvent(const char *evtName, const JSValue procVal, const JSValue thisVal)
{
  if (strlen(evtName) < 1)
    return;

  EnterCriticalSection(&lock);

  Caller caller = {JS_UNDEFINED, JS_UNDEFINED};
  for (const auto &item : functions[evtName])
  {
    // equal caller only
    if (item.action == procVal)
    {
      caller = item;
      break;
    }
  }

  // free first by JS_DupValue
  JS_FreeValue(context, caller.action);
  JS_FreeValue(context, caller.owner);

  functions[evtName].remove(caller);

  // Remove event completely if there are no listeners for it.
  if (functions.count(evtName) > 0 && functions[evtName].size() == 0)
    functions.erase(evtName);

  LeaveCriticalSection(&lock);
}

void Script::ClearEvent(const char *evtName)
{
  EnterCriticalSection(&lock);
  for (const auto &funcItem : functions[evtName])
  {
    JS_FreeValue(context, funcItem.action);
    JS_FreeValue(context, funcItem.owner);
  }
  functions[evtName].clear();
  LeaveCriticalSection(&lock);
}

void Script::ClearAllEvents(void)
{
  EnterCriticalSection(&lock);
  for (const auto &item : functions)
  {
    ClearEvent(item.first.c_str());
  }
  functions.clear();
  LeaveCriticalSection(&lock);
}

void Script::FireEvent(Event *evt)
{
  EnterCriticalSection(&Vars.cEventSection);
  evt->owner->EventList.push_front(evt);
  LeaveCriticalSection(&Vars.cEventSection);

  if (evt->owner && evt->owner->IsRunning())
  {
    evt->owner->TriggerInterruptHandler();
  }

  SetEvent(eventSignal);
}

void Script::ExecEvent(void)
{
  while (EventList.size() > 0 && !!!(IsAborted() || ((GetState() == InGame) && ClientState() == ClientStateMenu)))
  {
    EnterCriticalSection(&Vars.cEventSection);
    Event *evt = EventList.back();
    EventList.pop_back();
    LeaveCriticalSection(&Vars.cEventSection);
    // DEBUG_LOG("--ExecEvent--event name:%s--GetShortFilename:%ls", evt->meta->name, evt->owner->GetShortFilename());

    ExecScriptEvent(evt, false);
  }
}

void Script::WaitForExecEvent(int timeout)
{
  if (timeout <= 0)
    return;

  DWORD start = GetTickCount();
  int amt = timeout - (GetTickCount() - start);

  while (amt > 0)
  { // had a script deadlock here, make sure were positve with amt
    WaitForSingleObjectEx(eventSignal, amt, true);
    ResetEvent(eventSignal);
    if (IsAborted())
      break;

    // pop event and exec
    ExecEvent();

    amt = timeout - (GetTickCount() - start);
    // SleepEx(10,true);	// ex for delayed setTimer
  }
}

// __try __except only for SEH
// #ifdef DEBUG
// typedef struct tagTHREADNAME_INFO
// {
//   DWORD dwType;     // must be 0x1000
//   LPCWSTR szName;   // pointer to name (in user addr space)
//   DWORD dwThreadID; // thread ID (-1=caller thread)
//   DWORD dwFlags;    // reserved for future use, must be zero
// } THREADNAME_INFO;

// void SetThreadName(DWORD dwThreadID, LPCWSTR szThreadName)
// {
//   THREADNAME_INFO info;
//   info.dwType = 0x1000;
//   info.szName = szThreadName;
//   info.dwThreadID = dwThreadID;
//   info.dwFlags = 0;

//   //   __try
//   //   {
//   //     RaiseException(0x406D1388, 0, sizeof(info) / sizeof(DWORD), (DWORD *)&info);
//   //   }
//   //   __except (EXCEPTION_CONTINUE_EXECUTION)
//   //   {
//   //   }
// }
// #endif

DWORD WINAPI ScriptThread(void *data)
{
  Script *script = (Script *)data;
  if (script)
  {
    // #ifdef DEBUG
    //     SetThreadName(0xFFFFFFFF, script->GetShortFilename());
    // #endif
    script->Run();
    // if (Vars.bDisableCache)
    ScriptEngine::DisposeScript(script);
  }
  return 0;
}
