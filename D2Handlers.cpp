#include "D2Handlers.h"
#include "Console.h"
#include "Helpers.h"
#include "D2Helpers.h"
#include "JSHelpers.h"
#include "D2Boot.h"
#include "ScreenHook.h"
#include "Unit.h"
#include "ScriptEngine.h"
#include "Events.h"
#include "D2NetHandlers.h"
#include "MapHeader.h"
#include "CommandLine.h"

bool __fastcall UpdatePlayerGid(Script *script, void *, unsigned int)
{
  script->UpdatePlayerGid();
  return true;
}

DWORD WINAPI D2Thread(LPVOID lpParam)
{
  sLine *command;
  bool beginStarter = true;
  bool bInGame = false;

  if (!InitHooks())
  {
    wcscpy_s(Vars.szPath, MAX_PATH, L"common");
    Log(L"D2Boot Engine startup failed. %ls", Vars.szCommandLine);
    Print(L"\u00FFc2D2Boot\u00FFc0 :: Engine startup failed!");
    return FALSE;
  }

  ParseCommandLine(Vars.szCommandLine);
  if ((command = GetCommand(L"-handle")))
  {
    Vars.hHandle = (HWND)_wtoi(command->szText);
  }

  if ((command = GetCommand(L"-mpq")))
  {
    char *mpq = UnicodeToAnsi(command->szText);
    LoadMPQ(mpq);
    free(mpq);
  }

  if ((command = GetCommand(L"-profile")))
  {
    const wchar_t *profile = command->szText;

    if (SwitchToProfile(profile))
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Switched to profile %ls", profile);
    else
      Print(L"\u00FFc2D2Boot\u00FFc0 :: Profile %ls not found", profile);
  }

  FreeCommandLine();

  Log(L"D2Boot Engine startup complete. %ls", D2BOOT_VERSION);
  Print(L"\u00FFc2D2Boot\u00FFc0 :: Engine startup complete!");

  while (Vars.bActive)
  {
    switch (ClientState())
    {
    case ClientStateInGame:
      if (bInGame)
      {
        if ((Vars.dwMaxGameTime && Vars.dwGameTime && (GetTickCount() - Vars.dwGameTime) > Vars.dwMaxGameTime) ||
            ((!D2COMMON_IsTownByLevelNo(GetPlayerArea()) && (Vars.nChickenHP && Vars.nChickenHP >= GetUnitHP(D2CLIENT_GetPlayerUnit()))) ||
             (Vars.nChickenMP && Vars.nChickenMP >= GetUnitMP(D2CLIENT_GetPlayerUnit()))))
          D2CLIENT_ExitGame();
      }
      else // bInGame==false
      {
        Vars.dwGameTime = GetTickCount();
        Sleep(500);

        D2CLIENT_InitInventory();
        // ScriptEngine::ForEachScript(UpdatePlayerGid, nullptr, 0);
        // ScriptEngine::UpdateConsole();
        Vars.bQuitting = false;

        GameJoined();

        // set true, only run GameJoined one time.
        bInGame = true;
      }
      break;
    case ClientStateMenu:
      // NOTE: added Vars.bActive for shutdown where no profile parameter
      while (Vars.bActive && Vars.bUseProfileScript)
      {
        Sleep(100);
      }
      MenuEntered(beginStarter);
      beginStarter = false;
      if (bInGame)
      {
        Vars.dwGameTime = 0;
        bInGame = false;
      }
      break;

    case ClientStateBusy:
    case ClientStateNull:
      break;
    }
    Sleep(50);
  }

  ScriptEngine::Shutdown();
  return TRUE;
}

LRESULT CALLBACK KeyPressHook(int code, WPARAM wParam, LPARAM lParam)
{
  if (code >= HC_ACTION)
  {
    WORD repeatCount = LOWORD(lParam);
    bool altState = !!(HIWORD(lParam) & KF_ALTDOWN);
    bool previousState = !!(HIWORD(lParam) & KF_REPEAT);
    bool transitionState = !!(HIWORD(lParam) & KF_UP);
    bool isRepeat = !transitionState && repeatCount != 1;
    bool isUp = previousState && transitionState;
    bool isDown = !isUp;

    bool gameState = ClientState() == ClientStateInGame;
    bool chatBoxOpen = gameState ? !!D2CLIENT_GetUIState(UI_CHAT_CONSOLE) : false;
    bool escMenuOpen = gameState ? !!D2CLIENT_GetUIState(UI_ESCMENU_MAIN) : false;

    // if (altState && wParam == VK_F4)
    //   return CallNextHookEx(NULL, code, wParam, lParam);

    if (wParam == VK_PAUSE)
    {
      if (isUp && !isRepeat && code == HC_ACTION)
      {
        if (ToggleScript())
          return 1;
      }
    }

    if (wParam == VK_HOME && !(chatBoxOpen || escMenuOpen))
    {
      if (isDown && !isRepeat && code == HC_ACTION)
      {
        if (!altState)
          Console::ToggleBuffer();
        else
          Console::TogglePrompt();

        return CallNextHookEx(NULL, code, wParam, lParam);
      }
    }
    else if (wParam == VK_ESCAPE && Console::IsVisible())
    {
      if (isDown && !isRepeat && code == HC_ACTION)
      {
        Console::Hide();
        return 1;
      }
      return CallNextHookEx(NULL, code, wParam, lParam);
    }
    else if (wParam == VK_END)
    {
      if (isDown && !isRepeat && code == HC_ACTION)
      {
        GameTools();
      }
      return CallNextHookEx(NULL, code, wParam, lParam);
    }
    else if (Console::IsEnabled())
    {
      // BYTE layout[256] = {0};
      // WORD out[2] = {0};
      switch (wParam)
      {
      // case VK_TAB:
      //   if (isUp)
      //     for (int i = 0; i < 5; i++)
      //       Console::AddKey(' ');
      //   break;
      // case VK_RETURN:
      //   if (isUp && !isRepeat && !escMenuOpen)
      //     Console::ExecuteCommand();
      //   break;
      // case VK_BACK:
      //   if (isDown)
      //     Console::RemoveLastKey();
      //   break;
      // case VK_UP:
      //   if (isUp && !isRepeat)
      //     Console::PrevCommand();
      //   break;
      // case VK_DOWN:
      //   if (isUp && !isRepeat)
      //     Console::NextCommand();
      //   break;
      case VK_NEXT:
        if (isDown)
          Console::ScrollDown();
        break;
      case VK_PRIOR:
        if (isDown)
          Console::ScrollUp();
        break;
      case VK_MENU: // alt
        // Send the alt to the scripts to fix sticky alt. There may be a better way.
        KeyDownUpEvent(wParam, isUp);
        return CallNextHookEx(NULL, code, wParam, lParam);
        break;
      default:
        // if (isDown)
        // {
        //   if (GetKeyboardState(layout) && ToAscii(wParam, (lParam & 0xFF0000), layout, out, 0) != 0)
        //   {
        //     for (int i = 0; i < repeatCount; i++)
        //       Console::AddKey(out[0]);
        //   }
        // }
        break;
      }
      return 1;
    }
    else if (code == HC_ACTION && !isRepeat && !(chatBoxOpen || escMenuOpen))
      if (KeyDownUpEvent(wParam, isUp))
        return 1;
  }

  return CallNextHookEx(NULL, code, wParam, lParam);
}

LONG WINAPI GameEventHandler(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
  COPYDATASTRUCT *pCopy;
  switch (uMsg)
  {
  case WM_COPYDATA:
    pCopy = (COPYDATASTRUCT *)lParam;

    if (pCopy)
    {
      wchar_t *lpwData = AnsiToUnicode((const char *)pCopy->lpData);
      if (pCopy->dwData == 0x1337) // 0x1337 = Execute Script
      {
        while (!Vars.bActive || (ScriptEngine::GetState() != Running))
        {
          Sleep(100);
        }
        ScriptEngine::RunCommand(lpwData);
      }
      else if (pCopy->dwData == 0x31337) // 0x31337 = Set Profile
        if (SwitchToProfile(lpwData))
          Print(L"\u00FFc2D2Boot\u00FFc0 :: Switched to profile %ls", lpwData);
        else
          Print(L"\u00FFc2D2Boot\u00FFc0 :: Profile %ls not found", lpwData);
      else
        CopyDataEvent(pCopy->dwData, lpwData);

      // FREE in Here!
      free(lpwData);
    }

    return TRUE;
  }

  return (LONG)CallWindowProc(Vars.oldWNDPROC, hWnd, uMsg, wParam, lParam);
}

DWORD __fastcall GamePacketReceived(BYTE *pPacket, DWORD dwSize)
{
  switch (pPacket[0])
  {
  case 0xAE:
    printf("Warden activity detected! Terminating Diablo to ensure your safety:)");
    TerminateProcess(GetCurrentProcess(), 0);

    break;
  case 0x15:
    return !GamePacketEvent(pPacket, dwSize) && ReassignPlayerHandler(pPacket, dwSize);
  case 0x26:
    return !GamePacketEvent(pPacket, dwSize) && ChatEventHandler(pPacket, dwSize);
  case 0x2A:
    return !GamePacketEvent(pPacket, dwSize) && NPCTransactionHandler(pPacket, dwSize);
  case 0x5A:
    return !GamePacketEvent(pPacket, dwSize) && EventMessagesHandler(pPacket, dwSize);
  case 0x18:
  case 0x95:
    return !GamePacketEvent(pPacket, dwSize) && HPMPUpdateHandler(pPacket, dwSize);
  case 0x9C:
  case 0x9D:
    return !GamePacketEvent(pPacket, dwSize) && ItemActionHandler(pPacket, dwSize);
  case 0xA7:
    return !GamePacketEvent(pPacket, dwSize) && DelayedStateHandler(pPacket, dwSize);
  }

  return !GamePacketEvent(pPacket, dwSize);
}

DWORD __fastcall GamePacketSent(BYTE *pPacket, DWORD dwSize)
{
  return !GamePacketSentEvent(pPacket, dwSize);
}

DWORD __fastcall GameInput(const wchar_t *wMsg)
{
  bool send = true;

  if (Vars.bDontCatchNextMsg)
    Vars.bDontCatchNextMsg = false;
  else
  {
    send = !((wMsg[0] == L'.' && ProcessCommand(wMsg + 1, false)) || ChatInputEvent(wMsg));
  }

  return send ? 0 : -1; // -1 means block, 0 means send
}

DWORD __fastcall ChannelInput(wchar_t *wMsg)
{
  bool send = true;

  if (Vars.bDontCatchNextMsg)
    Vars.bDontCatchNextMsg = false;
  else
  {
    send = !((wMsg[0] == L'.' && ProcessCommand(wMsg + 1, false)) || ChatInputEvent(wMsg));
  }

  return send; // false means ignore, true means send
}

void GameDraw(void)
{
  if (Vars.bActive && ClientState() == ClientStateInGame)
  {
    Genhook::DrawAll(IG);
    DrawLogo();
    Console::Draw();
  }
  if (Vars.bTakeScreenshot)
  {
    Vars.bTakeScreenshot = false;
    D2WIN_TakeScreenshot();
  }
  if (Vars.SectionCount)
  {
    if (Vars.bGameLoopEntered)
      LeaveCriticalSection(&Vars.cGameLoopSection);
    else
      Vars.bGameLoopEntered = true;
    Sleep(0);
    EnterCriticalSection(&Vars.cGameLoopSection);
  }
  else
    Sleep(10);
}

void GameDrawOOG(void)
{
  D2WIN_DrawSprites();
  if (Vars.bActive && ClientState() == ClientStateMenu)
  {
    Genhook::DrawAll(OOG);
    DrawLogo();
    Console::Draw();
  }
  Sleep(10);
}

void SetMaxDiff(void)
{
  if (D2CLIENT_GetDifficulty() == 1 && *p_D2CLIENT_ExpCharFlag)
  {
    BnetData *pData = *p_D2LAUNCH_BnData;
    if (pData)
      pData->nMaxDiff = 10;
  }
}

void __fastcall WhisperHandler(char *szAcc, char *szText)
{
  if (!Vars.bDontCatchNextMsg)
  {
    wchar_t *szwText = AnsiToUnicode(szText, CP_ACP);
    WhisperEvent(szAcc, szwText);
    free(szwText);
  }
  else
    Vars.bDontCatchNextMsg = FALSE;
}

DWORD __fastcall GameAttack(UnitInteraction *pAttack)
{
  if (!pAttack || !pAttack->lpTargetUnit || pAttack->lpTargetUnit->dwType != UNIT_MONSTER)
    return (DWORD)-1;

  if (pAttack->dwMoveType == ATTACKTYPE_UNITLEFT)
    pAttack->dwMoveType = ATTACKTYPE_SHIFTLEFT;

  if (pAttack->dwMoveType == ATTACKTYPE_RIGHT)
    pAttack->dwMoveType = ATTACKTYPE_SHIFTRIGHT;

  return 0;
}

void __fastcall GamePlayerAssignment(UnitAny *pPlayer)
{
  if (!pPlayer)
    return;

  PlayerAssignEvent(pPlayer->dwUnitId);
}

void CALLBACK TimerProc(HWND hwnd, UINT uMsg, UINT_PTR idEvent, DWORD dwTime)
{
  if (Vars.bGameLoopEntered)
    LeaveCriticalSection(&Vars.cGameLoopSection);
  else
  {
    Vars.bGameLoopEntered = true;
    Vars.dwGameThreadId = GetCurrentThreadId();
  }

  if (Vars.SectionCount)
    Sleep(5);

  EnterCriticalSection(&Vars.cGameLoopSection);
}

void GameLeave(void)
{
  //	if(Vars.bGameLoopEntered)
  //	LeaveCriticalSection(&Vars.cGameLoopSection);
  //	else
  //		Vars.bGameLoopEntered = true;

  /*EnterCriticalSection(&ScriptEngine::lock);
  std::vector<Script*> list;
  for(ScriptMap::iterator it = ScriptEngine::scripts.begin(); it != ScriptEngine::scripts.end(); it++)
          if(it->second->GetState() == InGame)
                  it->second->Stop(true);

  LeaveCriticalSection(&ScriptEngine::lock); */
  Vars.bQuitting = false;
  ScriptEngine::ForEachScript(StopIngameScript, nullptr, 0);
  ActMap::ClearCache();

  //	EnterCriticalSection(&Vars.cGameLoopSection);
}

BOOL __fastcall RealmPacketRecv(BYTE *pPacket, DWORD dwSize)
{
  return !RealmPacketEvent(pPacket, dwSize);
}

BOOL __fastcall ChatPacketRecv(BYTE *pPacket, int len)
{
  bool blockPacket = false;

  if (pPacket[1] == 0xF)
  {
    // DWORD mode = pPacket[4];
    char *who = (char *)pPacket + 28;
    char *said = (char *)pPacket + 29 + strlen(who);
    wchar_t *wsaid = AnsiToUnicode(said, CP_ACP);

    switch (pPacket[4])
    {
    case 0x02: // channel join
      ChatEvent(who, L"joined the channel");
      break;
    case 0x03: // channel leave
      ChatEvent(who, L"left the channel");
      break;
    case 0x04: // whispers
    case 0x0A:
      WhisperEvent(who, wsaid);
      break;
    case 0x05: // normal text
    case 0x12: // info blue text
    case 0x13: // error message
    case 0x17: // emoted text
      ChatEvent(who, wsaid);
      break;
    default:
      break;
    }
    free(wsaid);
    // ChannelEvent(mode,who,said);
  }

  return !blockPacket;
}
