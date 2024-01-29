#pragma once

#include <windows.h>
#include <string>
#include <map>
#include <list>
#include "JSHelpers.h"
#include "JSUnit.h"
#include "Events.h"

enum ScriptState
{
  InGame,
  OutOfGame,
  Command
};

enum class ExecuteState
{
  Standby,
  Starting,
  executing,
  Stopped
};

struct Caller
{
  JSValue action;
  JSValue owner;

  Caller &operator=(const Caller &source)
  {
    this->action = source.action;
    this->owner = source.owner;

    return *this;
  }

  bool operator==(const Caller &source) const
  {
    return this->action == source.action && this->owner == source.owner;
  }
};

typedef std::list<Caller> FunctionList;
typedef std::map<std::string, FunctionList> FunctionMap;

class Script
{
private:
  JSRuntime *runtime;
  JSContext *context;
  JSValue script;
  myUnit *me;
  unsigned int argc;
  void **argv;
  wchar_t *fileName;
  char *szFileName;
  int execCount;
  ScriptState scriptState;
  JSValue globalObject;
  bool isLocked, isPaused, isReallyPaused, isAborted;

  HANDLE threadHandle;
  CRITICAL_SECTION lock;
  ExecuteState execState;

  Script(const wchar_t *file, ScriptState state, unsigned int argc = 0, void **argv = nullptr);
  ~Script();
  bool BeginThread(LPTHREAD_START_ROUTINE ThreadFunc);

public:
  friend class ScriptEngine;
  DWORD threadId;
  bool hasActiveCX; // hack to get away from JS_IsRunning
  HANDLE eventSignal;
  FunctionMap functions;

  void Run(void);
  void Join(void);
  void Pause(void);
  void Resume(void);
  bool IsPaused(void);
  void ExecEvent(void);
  void WaitForExecEvent(int timeout);

  inline JSContext *GetContext(void)
  {
    return context;
  }

  inline JSRuntime *GetRuntime(void)
  {
    return runtime;
  }

  inline void SetPauseState(bool reallyPaused)
  {
    isReallyPaused = reallyPaused;
  }

  inline bool IsReallyPaused(void)
  {
    return isReallyPaused;
  }

  inline const wchar_t *GetFilename(void)
  {
    return fileName;
  }

  inline ScriptState GetState(void)
  {
    return scriptState;
  }

  inline void TriggerInterruptHandler(void)
  {
    if (hasActiveCX)
      JS_TriggerInterruptHandler(context);
  }

  inline int GetExecutionCount(void)
  {
    return execCount;
  }

  DWORD GetThreadId(void);

  void Stop(bool force = false, bool reallyForce = false);
  const wchar_t *GetShortFilename(void);

  // UGLY HACK to fix up the player gid on game join for cached scripts/oog scripts
  void UpdatePlayerGid(void);
  void RunCommand(const wchar_t *command);

  bool IsRunning(void);
  bool IsAborted(void);

  bool IsListenerRegistered(const char *evtName, bool extra = false);
  void RegisterEvent(const char *evtName, const JSValue procVal, const JSValue thisVal = JS_UNDEFINED);
  void UnregisterEvent(const char *evtName, const JSValue procVal, const JSValue thisVal = JS_UNDEFINED);
  void ClearEvent(const char *evtName);
  void ClearAllEvents(void);
  void FireEvent(Event *);
  std::list<Event *> EventList;
};

DWORD WINAPI ScriptThread(void *data);
