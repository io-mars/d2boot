#include "Helpers.h"
#include <vector>
#include <tlhelp32.h>
#include <DbgHelp.h>

#include "D2Boot.h"
#include "D2Ptrs.h"
#include "D2Handlers.h"
#include "D2Helpers.h"
#include "ScriptEngine.h"
#include "Control.h"
#include "Script.h"
#include "Profile.h"
#include "CommandLine.h"

#define BUFFER_SIZE 128

Variables Vars = {};

wchar_t *AnsiToUnicode(const char *str, UINT codepage)
{
  wchar_t *buf = nullptr;
  // cbMultiByte -1，the length including the terminating null character
  int len = MultiByteToWideChar(codepage, 0, str, -1, buf, 0);
  buf = (wchar_t *)malloc(len * sizeof(wchar_t));
  MultiByteToWideChar(codepage, 0, str, -1, buf, len);
  return buf;
}

char *UnicodeToAnsi(const wchar_t *str, UINT codepage)
{
  char *buf = nullptr;
  // cchWideChar -1 including the terminating null character
  int len = WideCharToMultiByte(codepage, 0, str, -1, buf, 0, (codepage ? NULL : "?"), NULL);
  buf = (char *)malloc(len * sizeof(char));
  WideCharToMultiByte(codepage, 0, str, -1, buf, len, (codepage ? NULL : "?"), NULL);
  return buf;
}

void HexDump(const unsigned char *pData, const unsigned long dwSize)
{
  const unsigned char *c = pData;
  unsigned long dws = dwSize;

  printf("\nDumping %lu bytes from [%p]:\n", dwSize, pData);

  while (dws > 0)
  {
    unsigned long i;

    for (i = 0; i < 16; i++)
    {
      if (i < dws)
        if (c[i] == -1)
          printf("FF ");
        else
          printf("%02X ", c[i]);
      else
        printf("   ");
    }

    for (i = 0; i < 16; i++)
    {
      if (i < dws)
        printf("%c", c[i] >= 32 && c[i] < 127 ? c[i] : '.');
      else
        printf(" ");
    }

    printf("\n");

    c += 16;

    if (dws <= 16)
      break;

    dws -= 16;
  }
}

char *ByteToArray(const unsigned char *pData, const unsigned long dwSize)
{
  unsigned long size = dwSize * 2;
  char *res = nullptr;

  res = (char *)malloc(size * sizeof(char));
  memset(res, 0, size * sizeof(res[0]));

  for (unsigned long i = 0; i < dwSize; i++)
  {
    res[i * 2] = pData[i];
    res[i * 2 + 1] = ',';
  }

  res[size - 1] = '\0';
  return res;
}

void StringToLower(char *p)
{
  for (; *p; ++p)
    *p = tolower(*p);
}

void StringToLower(wchar_t *p)
{
  for (; *p; ++p)
    *p = towlower(*p);
}

void ToColorString(char *p)
{
  for (; *p; ++p)
  {
    // ?c->ÿc
    if (*p == 0x3F && *(p + 1) == 0x63)
    {
      *p = 0xFF;
      ++p;
    }
  }
}

bool StringToBool(const char *str)
{
  switch (tolower(str[0]))
  {
  case 't':
  case '1':
    return true;
  case 'f':
  case '0':
  default:
    return false;
  }
}

bool StringToBool(const wchar_t *str)
{
  switch (tolower(str[0]))
  {
  case 't':
  case '1':
    return true;
  case 'f':
  case '0':
  default:
    return false;
  }
}

void StringReplaceChar(char *str, const char find, const char replace, size_t buflen)
{
  for (size_t i = 0; i < buflen; i++)
  {
    if (str[i] == find)
      str[i] = replace;
  }
}

void StringReplaceChar(wchar_t *str, const wchar_t find, const wchar_t replace, size_t buflen)
{
  for (size_t i = 0; i < buflen; i++)
  {
    if (str[i] == find)
      str[i] = replace;
  }
}

char *StringReplace(const char *str, const char *sub, const char *rep)
{
  char *result;
  int i, cnt = 0;
  int repLen = strlen(rep);
  int subLen = strlen(sub);

  for (i = 0; str[i] != '\0'; i++)
  {
    if (strstr(&str[i], sub) == &str[i])
    {
      cnt++;
      i += subLen - 1;
    }
  }

  result = (char *)malloc((i + cnt * (repLen - subLen) + 1) * sizeof(result));

  i = 0;
  while (*str)
  {
    if (strstr(str, sub) == str)
    {
      strcpy(&result[i], rep);
      i += repLen;
      str += subLen;
    }
    else
      result[i++] = *str++;
  }

  result[i] = '\0';
  return result;
}

wchar_t *StringReplace(const wchar_t *str, const wchar_t *sub, const wchar_t *rep)
{
  wchar_t *result;
  int i, cnt = 0;
  int repLen = wcslen(rep);
  int subLen = wcslen(sub);

  for (i = 0; str[i] != '\0'; i++)
  {
    if (wcsstr(&str[i], sub) == &str[i])
    {
      cnt++;
      i += subLen - 1;
    }
  }

  // or new/delete result = new wchar_t[i + cnt * (repLen - subLen) + 1];
  result = (wchar_t *)malloc((i + cnt * (repLen - subLen) + 1) * sizeof(result));

  i = 0;
  while (*str)
  {
    if (wcsstr(str, sub) == str)
    {
      wcscpy(&result[i], rep);
      i += repLen;
      str += subLen;
    }
    else
      result[i++] = *str++;
  }

  result[i] = '\0';
  return result;
}

bool SwitchToProfile(const wchar_t *profile)
{
  if (!profile || Vars.bUseProfileScript != TRUE || !Profile::ProfileExists(profile))
    return false;

  wchar_t file[_MAX_FNAME + _MAX_PATH] = L"", defaultStarter[_MAX_FNAME] = L"", defaultConsole[_MAX_FNAME] = L"", defaultGame[_MAX_FNAME] = L"",
                            scriptPath[_MAX_PATH] = L"", scriptAtAlias[_MAX_PATH] = L"", testScript[_MAX_PATH] = L"";
  swprintf_s(file, _countof(file), L"%sD2Boot.ini", Vars.szPath);

  GetPrivateProfileString(profile, L"ScriptPath", L"scripts", scriptPath, _MAX_PATH, file);
  GetPrivateProfileString(profile, L"DefaultConsoleScript", L"", defaultConsole, _MAX_FNAME, file);
  GetPrivateProfileString(profile, L"DefaultGameScript", L"", defaultGame, _MAX_FNAME, file);
  GetPrivateProfileString(profile, L"DefaultStarterScript", L"", defaultStarter, _MAX_FNAME, file);
  GetPrivateProfileString(profile, L"DefaultScriptAtAlias", L"", scriptAtAlias, _MAX_FNAME, file);
  GetPrivateProfileString(profile, L"DefaultTestScript", L"", testScript, _MAX_FNAME, file);

  wcscpy_s(Vars.szProfile, 256, profile);
  swprintf_s(Vars.szScriptPath, _MAX_PATH, L"%s%s", Vars.szPath, scriptPath);
  if (wcslen(defaultConsole) > 0)
    wcscpy_s(Vars.szConsole, _MAX_FNAME, defaultConsole);
  if (wcslen(defaultGame) > 0)
    wcscpy_s(Vars.szDefault, _MAX_FNAME, defaultGame);
  if (wcslen(defaultStarter) > 0)
    wcscpy_s(Vars.szStarter, _MAX_FNAME, defaultStarter);
  if (wcslen(testScript) > 0)
    wcscpy_s(Vars.szTestScript, _MAX_FNAME, testScript);
  if (wcslen(scriptAtAlias) > 0)
    wcscpy_s(Vars.szScriptAtAlias, _MAX_FNAME, scriptAtAlias);

  Vars.bUseProfileScript = FALSE;
  // Reload();
  return true;
}

void InitSettings(void)
{
  // wchar_t fname[_MAX_FNAME + _MAX_PATH], scriptPath[_MAX_PATH], defaultStarter[_MAX_FNAME], defaultGame[_MAX_FNAME], defaultConsole[_MAX_FNAME], hosts[256],
  //     debug[6], quitOnHostile[6], quitOnError[6], maxGameTime[6], gameTimeout[6], startAtMenu[6], disableCache[6], memUsage[6], gamePrint[6], useProfilePath[6],
  //     logConsole[6], enableUnsupported[6], forwardMessageBox[6], consoleFont[6];

  wchar_t fname[_MAX_FNAME + _MAX_PATH], scriptPath[_MAX_PATH], defaultStarter[_MAX_FNAME], defaultGame[_MAX_FNAME], defaultConsole[_MAX_FNAME],
      quitOnError[6], maxGameTime[6], gameTimeout[6], startAtMenu[6], disableCache[6], quitOnHostile[6], useProfilePath[6],
      logConsole[6], enableUnsupported[6], consoleFont[6],
      defaultTestScript[_MAX_FNAME], defaultScriptAtAlias[_MAX_FNAME];

  swprintf_s(fname, _countof(fname), L"%sD2Boot.ini", Vars.szPath);

  GetPrivateProfileString(L"settings", L"ScriptPath", L"Scripts", scriptPath, _MAX_PATH, fname);
  GetPrivateProfileString(L"settings", L"DefaultConsoleScript", L"", defaultConsole, _MAX_FNAME, fname);
  GetPrivateProfileString(L"settings", L"DefaultGameScript", L"default.js", defaultGame, _MAX_FNAME, fname);
  GetPrivateProfileString(L"settings", L"DefaultStarterScript", L"starter.js", defaultStarter, _MAX_FNAME, fname);
  GetPrivateProfileString(L"settings", L"DefaultTestScript", L"tools.js", defaultTestScript, _MAX_FNAME, fname);
  GetPrivateProfileString(L"settings", L"DefaultScriptAtAlias", L"libs", defaultScriptAtAlias, _MAX_FNAME, fname);

  // GetPrivateProfileString(L"settings", L"Hosts", L"", hosts, 256, fname);
  GetPrivateProfileString(L"settings", L"MaxGameTime", L"0", maxGameTime, 6, fname);
  // GetPrivateProfileString(L"settings", L"Debug", L"false", debug, 6, fname);
  GetPrivateProfileString(L"settings", L"QuitOnHostile", L"false", quitOnHostile, 6, fname);
  GetPrivateProfileString(L"settings", L"QuitOnError", L"false", quitOnError, 6, fname);
  GetPrivateProfileString(L"settings", L"StartAtMenu", L"true", startAtMenu, 6, fname);
  GetPrivateProfileString(L"settings", L"DisableCache", L"true", disableCache, 6, fname);
  // GetPrivateProfileString(L"settings", L"MemoryLimit", L"100", memUsage, 6, fname);
  // GetPrivateProfileString(L"settings", L"UseGamePrint", L"false", gamePrint, 6, fname);
  GetPrivateProfileString(L"settings", L"GameReadyTimeout", L"5", gameTimeout, 6, fname);
  GetPrivateProfileString(L"settings", L"UseProfileScript", L"false", useProfilePath, 6, fname);
  GetPrivateProfileString(L"settings", L"LogConsoleOutput", L"false", logConsole, 6, fname);
  GetPrivateProfileString(L"settings", L"EnableUnsupported", L"false", enableUnsupported, 6, fname);
  // GetPrivateProfileString(L"settings", L"ForwardMessageBox", L"false", forwardMessageBox, 6, fname);
  GetPrivateProfileString(L"settings", L"ConsoleFont", L"0", consoleFont, 6, fname);

  swprintf_s(Vars.szScriptPath, _MAX_PATH, L"%s%s", Vars.szPath, scriptPath);
  wcscpy_s(Vars.szStarter, _MAX_FNAME, defaultStarter);
  wcscpy_s(Vars.szConsole, _MAX_FNAME, defaultConsole);
  wcscpy_s(Vars.szDefault, _MAX_FNAME, defaultGame);
  wcscpy_s(Vars.szTestScript, _MAX_FNAME, defaultTestScript);
  wcscpy_s(Vars.szScriptAtAlias, _MAX_FNAME, defaultScriptAtAlias);

  // char *szHosts = UnicodeToAnsi(hosts);
  // strcpy_s(Vars.szHosts, 256, szHosts);
  // free(szHosts);

  Vars.dwGameTime = GetTickCount();
  Vars.dwMaxGameTime = abs(_wtoi(maxGameTime) * 1000);
  Vars.dwGameTimeout = abs(_wtoi(gameTimeout) * 1000);

  Vars.bQuitOnHostile = StringToBool(quitOnHostile);
  Vars.bQuitOnError = StringToBool(quitOnError);
  Vars.bStartAtMenu = StringToBool(startAtMenu);
  Vars.bDisableCache = StringToBool(disableCache);
  // Vars.bUseGamePrint = StringToBool(gamePrint);
  Vars.bUseProfileScript = StringToBool(useProfilePath);
  Vars.bLogConsole = StringToBool(logConsole);
  Vars.bEnableUnsupported = StringToBool(enableUnsupported);
  // Vars.bForwardMessageBox = StringToBool(forwardMessageBox);
  Vars.eventSignal = CreateEvent(NULL, true, false, L"EventSignal");
  // Vars.dwMemUsage = abs(_wtoi(memUsage));
  Vars.dwConsoleFont = abs(_wtoi(consoleFont));
  // if (Vars.dwMemUsage < 1)
  //   Vars.dwMemUsage = 50;
  // Vars.dwMemUsage *= 1024 * 1024;
  Vars.oldWNDPROC = nullptr;
}

bool InitHooks(void)
{
  int i = 0;
  while (!Vars.bActive)
  {
    Sleep(50);
    if (i >= 300)
    {
      MessageBox(0, L"Failed to set hooks, exiting!", L"D2Boot", 0);
      return false;
    }

    if (D2GFX_GetHwnd() && (ClientState() == ClientStateMenu || ClientState() == ClientStateInGame))
    {
      if (!Vars.oldWNDPROC)
        Vars.oldWNDPROC = (WNDPROC)SetWindowLong(D2GFX_GetHwnd(), GWL_WNDPROC, (LONG)GameEventHandler);

      if (!Vars.oldWNDPROC)
        continue;

      Vars.uTimer = SetTimer(D2GFX_GetHwnd(), 1, 0, TimerProc);

      DWORD mainThread = GetWindowThreadProcessId(D2GFX_GetHwnd(), NULL);
      if (mainThread)
      {
        if (!Vars.hKeybHook)
          Vars.hKeybHook = SetWindowsHookEx(WH_KEYBOARD, KeyPressHook, NULL, mainThread);
      }
    }
    else
      continue;

    if (Vars.hKeybHook)
    {
      if (!ScriptEngine::Startup())
        return false;

      Vars.bActive = TRUE;

      if (ClientState() == ClientStateMenu && Vars.bStartAtMenu)
        clickControl(*p_D2WIN_FirstControl);
    }
    i++;
  }

  // *p_D2CLIENT_Lang = D2CLIENT_GetGameLanguageCode();
  // Vars.dwLocale = *p_D2CLIENT_Lang;
  return true;
}

const wchar_t *GetStarterScriptName(void)
{
  return (ClientState() == ClientStateInGame ? Vars.szDefault : ClientState() == ClientStateMenu ? Vars.szStarter
                                                                                                 : nullptr);
}

ScriptState GetStarterScriptState(void)
{
  // the default return is InGame because that's the least harmful of the options
  return (ClientState() == ClientStateInGame ? InGame : ClientState() == ClientStateMenu ? OutOfGame
                                                                                         : InGame);
}

bool StartScript(const wchar_t *scriptname, const ScriptState state)
{
  wchar_t file[_MAX_FNAME + _MAX_PATH];
  swprintf_s(file, _countof(file), L"%s/%s", Vars.szScriptPath, scriptname);
  Script *script = ScriptEngine::CompileFile(file, state);
  if (script)
    return ScriptEngine::EvalScript(script);
  else
    return false;
}

bool ProcessCommand(const wchar_t *command, bool unprocessedIsCommand)
{
  bool result = false;
  wchar_t *buf = _wcsdup(command);
  wchar_t *next_token1 = nullptr;
  wchar_t *argv = wcstok_s(buf, L" ", &next_token1);

  // no command?
  if (argv == nullptr)
    return false;

  if (_wcsicmp(argv, L"start") == 0)
  {
    const wchar_t *script = GetStarterScriptName();
    if (StartScript(script, GetStarterScriptState()))
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Started %ls", script);
    else
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Failed to start %ls", script);
    result = true;
  }
  else if (_wcsicmp(argv, L"stop") == 0)
  {
    if (ScriptEngine::GetCount() > 0)
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Stopping all scripts");
    ScriptEngine::StopAll();
    result = true;
  }
  // else if (_wcsicmp(argv, L"flush") == 0)
  // {
  //   if (Vars.bDisableCache != TRUE)
  //     Print(L"\u00FFc2D2Boot\u00FFc0 :: Flushing the script cache");
  //   ScriptEngine::FlushCache();
  //   result = true;
  // }
  else if (_wcsicmp(argv, L"load") == 0)
  {
    const wchar_t *script = command + 5;
    if (StartScript(script, GetStarterScriptState()))
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Started %ls", script);
    else
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Failed to start %ls", script);
    result = true;
  }
  else if (_wcsicmp(argv, L"reload") == 0)
  {
    Reload();
    result = true;
  }
  else if (_wcsicmp(argv, L"crash") == 0)
  {
    Log(L"crash now...");
    __asm__("int 3\n\t" ::);
  }
  else if (_wcsicmp(argv, L"stack") == 0)
  {
    Log(L"StackWalk now...");
    GetStackWalk();
  }
#if DEBUG
  else if (_wcsicmp(argv, L"profile") == 0)
  {
    const wchar_t *profile = command + 8;
    if (SwitchToProfile(profile))
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Switched to profile %ls", profile);
    else
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Profile %ls not found", profile);
    result = true;
  }
#endif
  // else if (_wcsicmp(argv, L"exec") == 0 && !unprocessedIsCommand)
  // {
  //   ExecCommand(command + 5);
  //   result = true;
  // }
  // else if (unprocessedIsCommand)
  // {
  //   ExecCommand(command);
  //   result = true;
  // }
  free(buf);
  return result;
}

void GameJoined(void)
{
  if (!Vars.bUseProfileScript)
  {
    const wchar_t *starter = GetStarterScriptName();
    if (starter != NULL)
    {
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Starting %ls", starter);
      if (StartScript(starter, GetStarterScriptState()))
        Print(L"\u00FFc2D2Boot\u00FFc0 :: %ls running.", starter);
      else
        Print(L"\u00FFc2D2Boot\u00FFc0 :: Failed to start %ls!", starter);
    }
  }
}

void MenuEntered(bool beginStarter)
{
  if (beginStarter && !Vars.bUseProfileScript)
  {
    const wchar_t *starter = GetStarterScriptName();
    if (starter != NULL)
    {
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Starting %ls", starter);
      if (StartScript(starter, GetStarterScriptState()))
        Print(L"\u00FFc2D2Boot\u00FFc0 :: %ls running.", starter);
      else
        Print(L"\u00FFc2D2Boot\u00FFc0 :: Failed to start %ls!", starter);
    }
  }
}

void Reload(void)
{
  if (ScriptEngine::GetCount() > 0)
    Print(L"\u00FFc2D2Boot\u00FFc0 :: Stopping all scripts");
  ScriptEngine::StopAll();

  // if (Vars.bDisableCache != TRUE)
  //   Print(L"\u00FFc2D2Boot\u00FFc0 :: Flushing the script cache");
  // ScriptEngine::FlushCache();

  // wait for things to catch up
  ScriptEngine::WaitForDisposed();

  if (!Vars.bUseProfileScript)
  {
    const wchar_t *script = GetStarterScriptName();
    if (StartScript(script, GetStarterScriptState()))
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Started %ls", script);
    else
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Failed to start %ls", script);
  }
}

void GameTools(void)
{
  if (wcslen(Vars.szTestScript) > 0)
  {
    Print(L"\u00FFc2D2Boot\u00FFc0 :: Starting %ls", Vars.szTestScript);
    if (StartScript(Vars.szTestScript, GetStarterScriptState()))
      Print(L"\u00FFc2D2Boot\u00FFc0 :: %ls running.", Vars.szTestScript);
    else
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Failed to start %ls!", Vars.szTestScript);
  }
}

bool ToggleScript(const bool isPause)
{
  if (ScriptEngine::ToggleScript(isPause))
  {
    Print(L"\u00FFc2Resuming.");
    return true;
  }
  return false;
}

char *DllLoadAddrStrs()
{
  const wchar_t *dlls[] = {L"D2Client.DLL", L"D2Common.DLL", L"D2Gfx.DLL", L"D2Lang.DLL", L"D2Win.DLL", L"D2Net.DLL", L"D2Game.DLL",
                           L"D2Launch.DLL", L"Fog.DLL", L"BNClient.DLL", L"Storm.DLL", L"D2Cmp.DLL", L"D2Multi.DLL"};
  size_t strMaxLen;
  char *result;
  char lineBuf[80];
  unsigned int i;

  strMaxLen = sizeof(lineBuf) * sizeof(dlls) / sizeof(dlls[0]);
  result = (char *)malloc(strMaxLen);

  result[0] = '\0';

  for (i = 0; i < sizeof(dlls) / sizeof(dlls[0]); ++i)
  {
    sprintf_s(lineBuf, sizeof(lineBuf), "%ls loaded at: 0x%08X.", dlls[i], GetModuleHandle(dlls[i]));
    strcat_s(result, strMaxLen, lineBuf);
    if (i != (sizeof(dlls) / sizeof(dlls[0]) - 1))
    {
      strcat_s(result, strMaxLen, "\n");
    }
  }

  return result;
}

#define MAX_STACK_FRAMES 20

bool PrintStack(CONTEXT *context, HANDLE hProcess, HANDLE hThread)
{
  if (context == nullptr)
  {
    Log(L"context NULL, halted print stack.");
    return false;
  }

  CONTEXT ctx;
  CopyMemory(&ctx, context, sizeof(CONTEXT));

  DWORD image;
  STACKFRAME64 frame;
  ZeroMemory(&frame, sizeof(STACKFRAME64));

  frame.AddrPC.Mode = AddrModeFlat;
  frame.AddrFrame.Mode = AddrModeFlat;
  frame.AddrStack.Mode = AddrModeFlat;

#ifdef _M_IX86
  image = IMAGE_FILE_MACHINE_I386;
  frame.AddrPC.Offset = ctx.Eip;
  frame.AddrFrame.Offset = ctx.Ebp;
  frame.AddrStack.Offset = ctx.Esp;
#elif _M_X64
  image = IMAGE_FILE_MACHINE_AMD64;
  frame.AddrPC.Offset = ctx.Rip;
  frame.AddrFrame.Offset = ctx.Rsp;
  frame.AddrStack.Offset = ctx.Rsp;
#elif _M_IA64
  image = IMAGE_FILE_MACHINE_IA64;
  frame.AddrPC.Offset = ctx.StIIP;
  frame.AddrFrame.Offset = ctx.IntSp;
  frame.AddrBStore.Offset = ctx.RsBSP;
  frame.AddrStack.Offset = ctx.IntSp;
#endif

  DWORD dwOptions = SymGetOptions();
  dwOptions |= SYMOPT_LOAD_LINES;
  dwOptions |= SYMOPT_DEFERRED_LOADS;
  dwOptions |= SYMOPT_DEBUG;
  // This option allows for undecorated names to be handled by the symbol engine.
  dwOptions |= SYMOPT_UNDNAME;
  SymSetOptions(dwOptions);

  // SymInitialize(hProcess, NULL, TRUE);
  SymInitializeW(hProcess, Vars.szPath, TRUE);

  Log(L"-----------------------------");
  char buffer[sizeof(SYMBOL_INFO) + MAX_SYM_NAME * sizeof(WCHAR)];
  PSYMBOL_INFO pSymbol = (PSYMBOL_INFO)buffer;
  ZeroMemory(pSymbol, sizeof(SYMBOL_INFO));
  pSymbol->SizeOfStruct = sizeof(SYMBOL_INFO);
  pSymbol->MaxNameLen = MAX_SYM_NAME;
  DWORD64 dwDisplacement = 0;

  IMAGEHLP_LINE64 line;
  ZeroMemory(&line, sizeof(IMAGEHLP_LINE64));
  line.SizeOfStruct = sizeof(IMAGEHLP_LINE64);
  DWORD dwDisp = 0;

  IMAGEHLP_MODULE64 moduleInfo;
  ZeroMemory(&moduleInfo, sizeof(IMAGEHLP_MODULE64));
  moduleInfo.SizeOfStruct = sizeof(IMAGEHLP_MODULE64);
  DWORD limited = 0;

  while (StackWalk64(image, hProcess, hThread, &frame, &ctx, NULL, SymFunctionTableAccess64, SymGetModuleBase64, NULL))
  {
    if (frame.AddrPC.Offset == 0 || limited > MAX_STACK_FRAMES)
      break;

    SymFromAddr(hProcess, (DWORD64)frame.AddrPC.Offset, &dwDisplacement, pSymbol);

    if (SymGetLineFromAddr64(hProcess, frame.AddrPC.Offset, &dwDisp, &line))
      Log(L"\tat %s in \"%s\", line: %lu, address: 0x%0llX", pSymbol->Name, line.FileName, line.LineNumber, pSymbol->Address);
    else
      // failed to get line
      Log(L"\tat %s, address 0x%0llX; more info: offset[0x%llX] error[%ld].", pSymbol->Name, pSymbol->Address, frame.AddrPC.Offset, GetLastError());

    SymGetModuleInfo64(hProcess, frame.AddrPC.Offset, &moduleInfo);
    Log(L"in \"%s\", loaded symbols from \"%s\".", moduleInfo.LoadedImageName, moduleInfo.LoadedPdbName);

    limited++;
    // more info:
    // Log("SymGetModuleInfo64 lasterror[%ld] 0x%0llX SymType:%d LoadedImageName:%s LoadedPdbName:%s NumSyms:%ld, LineNumbers:%d",
    //     GetLastError(), moduleInfo.BaseOfImage, moduleInfo.SymType, moduleInfo.LoadedImageName, moduleInfo.LoadedPdbName,
    //     moduleInfo.NumSyms, moduleInfo.LineNumbers);
  }
  Log(L"-----------------------------");

  SymCleanup(hProcess);
  return true;
}

LONG WINAPI ExceptionHandler(EXCEPTION_POINTERS *ptrs)
{
  EXCEPTION_RECORD *rec = ptrs->ExceptionRecord;
  CONTEXT *ctx = ptrs->ContextRecord;
  DWORD base = Vars.pModule ? Vars.pModule->dwBaseAddress : (DWORD)Vars.hModule;

  int len;
  char *szString;
  char *dllAddrs;
  char format[] = "EXCEPTION!\n*** 0x%08lX at 0x%p\n"
                  "D2Boot loaded at: 0x%08lX\n"
                  "Registers:\n"
                  "\tEIP: 0x%08lX, ESP: 0x%08lX\n"
                  "\tCS: 0x%04lX, DS: 0x%04lX, ES: 0x%04lX, SS: 0x%04lX, FS: 0x%04lX, GS: 0x%04lX\n"
                  "\tEAX: 0x%08lX, EBX: 0x%08lX, ECX: 0x%08lX, EDX: 0x%08lX, ESI: 0x%08lX, EDI: 0x%08lX, EBP: 0x%08lX, FLG: 0x%08lX\n";

  len = _scprintf(format,
                  rec->ExceptionCode, rec->ExceptionAddress, base, ctx->Eip, ctx->Esp, ctx->SegCs, ctx->SegDs, ctx->SegEs, ctx->SegSs, ctx->SegFs, ctx->SegGs, ctx->Eax,
                  ctx->Ebx, ctx->Ecx, ctx->Edx, ctx->Esi, ctx->Edi, ctx->Ebp, ctx->EFlags);

  szString = (char *)malloc((len + 1) * sizeof(char));
  sprintf_s(szString, len + 1,
            format,
            rec->ExceptionCode, rec->ExceptionAddress, base, ctx->Eip, ctx->Esp, ctx->SegCs, ctx->SegDs, ctx->SegEs, ctx->SegSs, ctx->SegFs, ctx->SegGs, ctx->Eax,
            ctx->Ebx, ctx->Ecx, ctx->Edx, ctx->Esi, ctx->Edi, ctx->Ebp, ctx->EFlags);

  dllAddrs = DllLoadAddrStrs();
  Log(L"%s\n%s", szString, dllAddrs);

  free(dllAddrs);
  free(szString);

  PrintStack(ctx, GetCurrentProcess(), GetCurrentThread());

  return EXCEPTION_EXECUTE_HANDLER;
}

std::vector<DWORD> GetThreadIds()
{
  std::vector<DWORD> threadIds;
  HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPTHREAD, GetCurrentProcessId());

  if (hSnapshot != INVALID_HANDLE_VALUE)
  {
    THREADENTRY32 threadEntry;
    threadEntry.dwSize = sizeof(THREADENTRY32);

    if (Thread32First(hSnapshot, &threadEntry))
    {
      do
      {
        if (threadEntry.th32OwnerProcessID == GetCurrentProcessId())
          threadIds.push_back(threadEntry.th32ThreadID);

      } while (Thread32Next(hSnapshot, &threadEntry));
    }
  }
  CloseHandle(hSnapshot);

  return threadIds;
}

#pragma GCC push_options
#pragma GCC optimize("O0")
bool ShowCallstack(HANDLE hThread)
{
  CONTEXT context;
  ZeroMemory(&context, sizeof(CONTEXT));
  context.ContextFlags = CONTEXT_FULL;

  HANDLE hProcess = GetCurrentProcess();

  if (hThread == GetCurrentThread())
  {
    // RtlCaptureContext crashed 0xC0000005 when build -O3
    RtlCaptureContext(&context);
    PrintStack(&context, hProcess, hThread);
    return true;
  }

  SuspendThread(hThread);

  if (GetThreadContext(hThread, &context) == FALSE)
  {
    ResumeThread(hThread);
    Log(L"GetThreadContext failed:%d, halted ShowCallstack.", GetLastError());
    return false;
  }

  PrintStack(&context, hProcess, hThread);

  ResumeThread(hThread);
  return true;
}
#pragma GCC pop_options

bool GetStackWalk()
{
  std::vector<DWORD> threadIds = GetThreadIds();
  DWORD current = GetCurrentThreadId();

  for (std::vector<DWORD>::iterator it = threadIds.begin(); it != threadIds.end(); ++it)
  {
    if (*it == current)
      continue;

    HANDLE hThread = OpenThread(THREAD_GET_CONTEXT, false, *it);

    if (hThread == INVALID_HANDLE_VALUE)
      return false;

    Log(L"Stack Walk Thread: %d", *it);
    ShowCallstack(hThread);
  }

  Log(L"Stack Walk Current Thread: %d", current);
  ShowCallstack(GetCurrentThread());
  return true;
}

void InitCommandLine()
{
  wchar_t *line = GetCommandLine();
  memcpy(Vars.szCommandLine, line, std::min(sizeof(Vars.szCommandLine), sizeof(wchar_t) * wcslen(line)));
  // LPWSTR cline = (WCHAR *)L"C:\\Program Files (x86)\\Diablo II\\Game.exe -w";
  // memcpy(line, cline, sizeof(LPWSTR) * wcslen(cline));

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
}

// MTODO
#undef get16bits
#if (defined(__GNUC__) && defined(__i386__)) || defined(__WATCOMC__) || defined(_MSC_VER) || defined(__BORLANDC__) || defined(__TURBOC__)
#define get16bits(d) (*((const unsigned __int16 *)(d)))
#endif

#if !defined(get16bits)
#define get16bits(d) ((((uint32_t)(((const uint8_t *)(d))[1])) << 8) + (uint32_t)(((const uint8_t *)(d))[0]))
#endif

unsigned __int32 __fastcall sfh(const char *data, int len)
{
  unsigned __int32 hash = len, tmp;
  int rem;

  if (len <= 0 || data == NULL)
    return 0;

  rem = len & 3;
  len >>= 2;

  /* Main loop */
  for (; len > 0; len--)
  {
    hash += get16bits(data);
    tmp = (get16bits(data + 2) << 11) ^ hash;
    hash = (hash << 16) ^ tmp;
    data += 2 * sizeof(unsigned __int16);
    hash += hash >> 11;
  }

  /* Handle end cases */
  switch (rem)
  {
  case 3:
    hash += get16bits(data);
    hash ^= hash << 16;
    hash ^= data[sizeof(unsigned __int16)] << 18;
    hash += hash >> 11;
    break;
  case 2:
    hash += get16bits(data);
    hash ^= hash << 11;
    hash += hash >> 17;
    break;
  case 1:
    hash += *data;
    hash ^= hash << 10;
    hash += hash >> 1;
  }

  /* Force "avalanching" of final 127 bits */
  hash ^= hash << 3;
  hash += hash >> 5;
  hash ^= hash << 4;
  hash += hash >> 17;
  hash ^= hash << 25;
  hash += hash >> 6;

  return hash;
}

int FormatString(char **szString, const char *szFormat, va_list argptr)
{
  // return right size
  // unsigned int len = vsnprintf(NULL, 0, szFormat, argptr);
  unsigned int len = _vscprintf(szFormat, argptr);

  // free by caller
  *szString = (char *)malloc((len + 1) * sizeof(char));
  vsnprintf(*szString, len + 1, szFormat, argptr);

  return len;
}

int FormatString(wchar_t **wsString, const wchar_t *szFormat, va_list argptr)
{
  // error! it's return -1
  // unsigned int len = vswprintf(NULL, 0, szFormat, argptr);

  unsigned int len = _vscwprintf(szFormat, argptr);

  // free by caller
  *wsString = (wchar_t *)malloc((len + 1) * sizeof(wchar_t));
  vswprintf(*wsString, len + 1, szFormat, argptr);

  return len;
}