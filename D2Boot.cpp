#include <shlwapi.h>

#include "D2Boot.h"
#include "Offset.h"
#include "Helpers.h"
#include "ScreenHook.h"
#include "Console.h"
#include "D2Handlers.h"
#include "CommandLine.h"

static HANDLE hD2Thread = INVALID_HANDLE_VALUE;
// static HANDLE hEventThread = INVALID_HANDLE_VALUE;

BOOL initialize(HANDLE hModule, LPVOID lpReserved)
{
  if (lpReserved != NULL)
  {
    Vars.pModule = (Module *)lpReserved;

    if (!Vars.pModule)
      return FALSE;

    wcscpy_s(Vars.szPath, MAX_PATH, Vars.pModule->szPath);
    Vars.bLoadedWithCGuard = TRUE;
  }
  else
  {
    Vars.hModule = (HMODULE)hModule;
    GetModuleFileName((HMODULE)hModule, Vars.szPath, MAX_PATH);
    PathRemoveFileSpec(Vars.szPath);
    wcscat_s(Vars.szPath, MAX_PATH, L"\\");
    Vars.bLoadedWithCGuard = FALSE;
  }

  InitSettings();

  InitCommandLine();
  ParseCommandLine(Vars.szCommandLine);

  sLine *command = nullptr;

  Vars.bUseRawCDKey = FALSE;

  if ((command = GetCommand(L"-title")))
  {
    int len = wcslen((wchar_t *)command->szText);
    wcsncat(Vars.szTitle, command->szText, len);
  }

  if ((command = GetCommand(L"-profile")))
  {
    int len = wcslen((wchar_t *)command->szText);
    wcsncat(Vars.szProfile, command->szText, len);
  }

  if (GetCommand(L"-sleepy"))
    Vars.bSleepy = TRUE;

  if (GetCommand(L"-cachefix"))
    Vars.bCacheFix = TRUE;

  if (GetCommand(L"-multi"))
    Vars.bMulti = TRUE;

  if (GetCommand(L"-ftj"))
    Vars.bReduceFTJ = TRUE;

  if ((command = GetCommand(L"-d2c")))
  {
    Vars.bUseRawCDKey = TRUE;
    char *keys = UnicodeToAnsi(command->szText);
    strncat(Vars.szClassic, keys, 30 - 1);
    free(keys);
  }

  if ((command = GetCommand(L"-d2x")))
  {
    char *keys = UnicodeToAnsi(command->szText);
    strncat(Vars.szLod, keys, 30 - 1);
    free(keys);
  }
  FreeCommandLine();

  Vars.bShutdownFromDllMain = FALSE;

  return TRUE;
}

BOOL APIENTRY DllMain(HANDLE hModule, DWORD dwReason, LPVOID lpReserved)
{
  switch (dwReason)
  {
  case DLL_PROCESS_ATTACH:
  {
    DisableThreadLibraryCalls((HMODULE)hModule);

#ifdef DEBUG
    wchar_t szProcess[20] = L"";
    GetEnvironmentVariable(L"ATTACH_CONSOLE_PROCESS", szProcess, 20);
    DWORD dwProcess = _wtoi(szProcess);
    AttachConsole(dwProcess);
    freopen("conout$", "w", stdout);
    freopen("conin$", "r", stdin);
    freopen("conout$", "w", stdout);
    freopen("conout$", "w", stderr);
#endif
    if (!initialize(hModule, lpReserved))
      return FALSE;

    SetUnhandledExceptionFilter(ExceptionHandler);

    // if (!Startup())
    //   return FALSE;
  }
  break;

  case DLL_PROCESS_DETACH:
    // {
    //   Vars.bShutdownFromDllMain = TRUE;
    //   Shutdown();
    // }
#ifdef DEBUG
    // system("pause");
    fclose(stderr);
    fclose(stdout);
    fclose(stdin);
    // FreeConsole();
#endif
    break;
  }
  return TRUE;
}

BOOL Startup(void)
{
  InitializeCriticalSection(&Vars.cEventSection);
  // InitializeCriticalSection(&Vars.cRoomSection);
  // InitializeCriticalSection(&Vars.cMiscSection);
  // InitializeCriticalSection(&Vars.cScreenhookSection);
  // InitializeCriticalSection(&Vars.cPrintSection);
  InitializeCriticalSection(&Vars.cBoxHookSection);
  InitializeCriticalSection(&Vars.cFrameHookSection);
  InitializeCriticalSection(&Vars.cLineHookSection);
  InitializeCriticalSection(&Vars.cImageHookSection);
  InitializeCriticalSection(&Vars.cTextHookSection);
  // InitializeCriticalSection(&Vars.cFlushCacheSection);
  InitializeCriticalSection(&Vars.cConsoleSection);
  InitializeCriticalSection(&Vars.cGameLoopSection);
  // InitializeCriticalSection(&Vars.cUnitListSection);
  InitializeCriticalSection(&Vars.cFileSection);

  Vars.bNeedShutdown = TRUE;
  Vars.bChangedAct = FALSE;
  Vars.bGameLoopEntered = FALSE;

  Vars.SectionCount = 0;

  Genhook::Initialize();
  DefineOffsets();
  InstallPatches();
  InstallConditional();

  DWORD lpThreadId;
  if ((hD2Thread = CreateThread(NULL, 0, D2Thread, NULL, 0, &lpThreadId)) == NULL)
    return FALSE;

  return true;
}

void DetachShutdown(void)
{
  if (Vars.bNeedShutdown)
  {
    Vars.bShutdownFromDllMain = TRUE;
    Shutdown();
  }
}

void Shutdown(void)
{
  if (!Vars.bNeedShutdown)
    return;

  Vars.bActive = FALSE;

  if (!Vars.bShutdownFromDllMain)
  {
    WaitForSingleObject(hD2Thread, INFINITE);
  }
  else
  {
    int tries = 20;
    while (!Vars.bShutdown && tries > 0)
    {
      Sleep(100); // waiting for the work thread run over!
      tries--;
    }

    if (Vars.bShutdown)
      Sleep(100); // sleep agian, make sure D2Thread was runed over, otherwise maybe crashed!
    else
      Log(L"WARNING: D2Boot Shutdown timeout.");
  }

  SetWindowLong(D2GFX_GetHwnd(), GWL_WNDPROC, (LONG)Vars.oldWNDPROC);

  RemoveConditional();
  RemovePatches();
  // waitting draw over, others should be crashed when printing screeen console!
  // Sleep(50);

  // destory Genhook
  Genhook::Destroy();

  // delete cellfile
  deleteCellFiles();

  KillTimer(D2GFX_GetHwnd(), Vars.uTimer);

  // UnhookWindowsHookEx(Vars.hMouseHook);
  UnhookWindowsHookEx(Vars.hKeybHook);

  CloseHandle(Vars.eventSignal);
  CloseHandle(hD2Thread);
  hD2Thread = NULL;

  DeleteCriticalSection(&Vars.cEventSection);
  // DeleteCriticalSection(&Vars.cRoomSection);
  // DeleteCriticalSection(&Vars.cMiscSection);
  // DeleteCriticalSection(&Vars.cScreenhookSection);
  // DeleteCriticalSection(&Vars.cPrintSection);
  DeleteCriticalSection(&Vars.cBoxHookSection);
  DeleteCriticalSection(&Vars.cFrameHookSection);
  DeleteCriticalSection(&Vars.cLineHookSection);
  DeleteCriticalSection(&Vars.cImageHookSection);
  DeleteCriticalSection(&Vars.cTextHookSection);
  // DeleteCriticalSection(&Vars.cFlushCacheSection);
  DeleteCriticalSection(&Vars.cConsoleSection);
  DeleteCriticalSection(&Vars.cGameLoopSection);
  // DeleteCriticalSection(&Vars.cUnitListSection);
  DeleteCriticalSection(&Vars.cFileSection);

  Log(L"D2Boot Shutdown complete.");
  Vars.bNeedShutdown = false;
}
