#pragma once

#ifndef __D2BOOT_H__
#define __D2BOOT_H__

#define D2BOOT_MAJOR L"1.1.3"
#ifdef DEBUG
#define D2BOOT_VERSION D2BOOT_MAJOR L"d"
#else
#define D2BOOT_VERSION D2BOOT_MAJOR L"u"
#endif

#define DLLAPI __declspec(dllexport)

#include <windows.h>
#include <map>
#include "D2Structs.h"

#define PRIVATE_UNIT 1
#define PRIVATE_ITEM 3

struct Module
{
  union
  {
    HMODULE hModule;
    DWORD dwBaseAddress;
  };
  DWORD _1;
  wchar_t szPath[MAX_PATH];
};

struct Variables
{
  int nChickenHP;
  int nChickenMP;
  // DWORD dwInjectTime;
  DWORD dwGameTime;
  BOOL bDontCatchNextMsg;
  BOOL bClickAction;
  BOOL bNeedShutdown;
  // BOOL bUseGamePrint;
  BOOL bShutdownFromDllMain;
  BOOL bChangedAct;
  BOOL bGameLoopEntered;
  DWORD dwGameThreadId;
  // DWORD dwLocale;

  DWORD dwMaxGameTime;
  DWORD dwGameTimeout;
  BOOL bTakeScreenshot;
  BOOL bQuitOnError;
  BOOL bQuitOnHostile;
  BOOL bStartAtMenu;
  BOOL bActive;
  BOOL bBlockKeys;
  BOOL bBlockMouse;
  BOOL bDisableCache;
  BOOL bUseProfileScript;
  BOOL bLoadedWithCGuard;
  BOOL bLogConsole;
  BOOL bEnableUnsupported;
  // BOOL bForwardMessageBox;
  BOOL bUseRawCDKey;
  BOOL bQuitting;
  BOOL bShutdown;
  BOOL bCacheFix;
  BOOL bMulti;
  BOOL bSleepy;
  BOOL bReduceFTJ;
  // int dwMemUsage;
  int dwConsoleFont;
  HANDLE eventSignal;
  Module *pModule;
  HMODULE hModule;
  HWND hHandle;

  wchar_t szPath[_MAX_PATH];
  // wchar_t szLogPath[_MAX_PATH];
  wchar_t szScriptPath[_MAX_PATH];
  wchar_t szProfile[256];
  wchar_t szStarter[_MAX_FNAME];
  wchar_t szConsole[_MAX_FNAME];
  wchar_t szDefault[_MAX_FNAME];
  // iomars
  wchar_t szTestScript[_MAX_FNAME];
  wchar_t szScriptAtAlias[_MAX_FNAME];

  // char szHosts[256];
  char szClassic[30];
  char szLod[30];
  wchar_t szTitle[256];
  wchar_t szCommandLine[256];

  WNDPROC oldWNDPROC;
  HHOOK hMouseHook;
  HHOOK hKeybHook;

  UINT_PTR uTimer;
  long SectionCount;

  // std::queue<std::wstring> qPrintBuffer;
  // std::map<const wchar_t *, CellFile *> mCachedCellFiles;
  // std::vector<std::pair<DWORD, DWORD>> vUnitList;
  // std::list<Event*> EventList;
  CRITICAL_SECTION cEventSection;
  // CRITICAL_SECTION cRoomSection;
  // CRITICAL_SECTION cMiscSection;
  // CRITICAL_SECTION cScreenhookSection;
  // CRITICAL_SECTION cPrintSection;
  CRITICAL_SECTION cTextHookSection;
  CRITICAL_SECTION cImageHookSection;
  CRITICAL_SECTION cBoxHookSection;
  CRITICAL_SECTION cFrameHookSection;
  CRITICAL_SECTION cLineHookSection;
  // CRITICAL_SECTION cFlushCacheSection;
  CRITICAL_SECTION cConsoleSection;
  CRITICAL_SECTION cGameLoopSection;
  // CRITICAL_SECTION cUnitListSection;
  CRITICAL_SECTION cFileSection;

  DWORD dwSelectedUnitId;
  DWORD dwSelectedUnitType;
  // POINT pMouseCoords;
  DWORD dwHirelingId;
};

extern Variables Vars;

// declare WINAPI for remotethread call
extern "C" BOOL DLLAPI APIENTRY Startup(void);
// void WINAPI DetachShutdown(void);
extern "C" void DLLAPI APIENTRY Shutdown(void);

#endif