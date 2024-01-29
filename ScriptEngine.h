#pragma once
#ifndef __SCRIPTENGINE_H__
#define __SCRIPTENGINE_H__

#include <list>
#include <map>
#include <atomic>
#include <string>
#include "Script.h"

typedef std::map<std::wstring, Script *> ScriptMap;

typedef bool(__fastcall *ScriptCallback)(Script *, void *, unsigned int);

enum EngineState
{
  Starting,
  Running,
  Paused,
  Stopping,
  Stopped
};

class ScriptEngine
{
private:
  ScriptEngine(void){};
  ~ScriptEngine();
  static Script *console;
  static EngineState state;
  static CRITICAL_SECTION scriptListLock;
  static std::atomic<int> actives;
  static HANDLE execEventSignal;
  static wchar_t *consoleName;

public:
  friend class Script;
  static ScriptMap scripts;

  // static CRITICAL_SECTION lock;

  static bool Startup(void);
  static void Shutdown(void);

  static EngineState GetState(void) { return state; }

  // static void FlushCache(void);

  static Script *CompileFile(const wchar_t *file, ScriptState state, unsigned int argc = 0, void **argv = nullptr, bool recompile = false);
  static bool EvalScript(Script *script);
  static void RunCommand(const wchar_t *command);

  static bool DisposeScript(Script *script, bool erased = true);
  static void DisposeScriptAll();

  static void LockScriptList(const char *loc);
  static void UnLockScriptList(const char *loc);

  static bool ForEachScript(ScriptCallback callback, EachHelper *helper, unsigned int argc, bool extra = false);

  static bool WaitForDisposed(const bool isShutdown = false);
  static unsigned int GetExecCount();
  static unsigned int GetCount(bool active = true, bool unexecuted = false);

  static void StopAll(const bool forceStop = false);
  static bool ToggleScript(const bool isPause = false);

  static void UpdateConsole();
};

bool __fastcall StopIngameScript(Script *script, void *, unsigned int);

int InterruptHandler(JSRuntime *rt, void *opaque);
bool SetSkill(JSContext *ctx, WORD wSkillId, bool bLeft, DWORD dwItemId);
bool ExecScriptEvent(Event *evt, bool clearList);

#endif
