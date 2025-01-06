#include "D2Handlers.h"
#include "D2Helpers.h"
#include "D2Boot.h"
#include "Helpers.h"
#include "Shlwapi.h"

void __declspec(naked) GameDraw_Intercept()
{
  __asm__ __volatile__(
      "call %0\n\t"
      "pop esi\n\t"
      "pop ebx\n\t"
      "pop ecx\n\t"
      "ret 4\n\t" ::"p"(GameDraw));
}

void __declspec(naked) GameInput_Intercept()
{
  __asm__ __volatile__(
      "pushad\n\t"
      "mov ecx,ebx\n\t"
      "call %0\n\t"
      "cmp eax,-1\n\t"
      "popad\n\t"
      "je BlockIt\n\t"
      "call %1\n\t"
      "ret\n\t"

      "BlockIt:\n\t"
      "xor eax,eax\n\t"
      "ret\n\t" ::"p"(GameInput),
      "m"(D2CLIENT_InputCall_I));
}

void __declspec(naked) GamePacketReceived_Intercept()
{
  __asm__ __volatile__(
      "pop ebp\n\t"
      "pushad\n\t"
      "call %0\n\t"
      "test eax,eax\n\t"
      "popad\n\t"
      "jnz OldCode\n\t"
      "mov edx, 0\n\t"

      "OldCode:\n\t"
      "call %1\n\t"
      "push ebp\n\t"
      "ret\n\t" ::"p"(GamePacketReceived),
      "m"(D2NET_ReceivePacket_I));
}

void __declspec(naked) GamePacketSent_Interception()
{
  __asm__ __volatile__(
      "pushad\n\t"
      "mov ecx, [esp + 0x2C]\n\t"
      "mov edx, [esp + 0x24]\n\t"
      "call %0\n\t"
      "test eax, eax\n\t"
      "popad\n\t"
      "jnz SendCode\n\t"
      "mov dword ptr [esp + 0x4], 0\n\t"

      "SendCode:\n\t"
      "jmp %1\n\t" ::"p"(GamePacketSent),
      "m"(D2NET_SendPacket));
}

UnitAny *GetSelectedUnit_Intercept(void)
{
  if (Vars.bClickAction)
  {
    if (Vars.dwSelectedUnitId)
    {
      UnitAny *pUnit = D2CLIENT_FindUnit(Vars.dwSelectedUnitId, Vars.dwSelectedUnitType);
      return pUnit;
    }

    return NULL;
  }

  return D2CLIENT_GetSelectedUnit();
}

void __declspec(naked) Whisper_Intercept()
{
  __asm__ __volatile__(
      "mov ebp,dword ptr ss:[esp+0x1fc+4]\n\t"
      "pushad\n\t"
      "mov ecx, edx\n\t"
      "mov edx, ebx\n\t"
      "call %0\n\t"
      "popad\n\t"
      // "jmp D2MULTI_WhisperIntercept_Jump\n\t"
      "ret\n\t" ::"p"(WhisperHandler));
}

void __declspec(naked) GameAttack_Intercept()
{
  __asm__ __volatile__(
      "push ecx\n\t"
      "mov ecx, [esp+0xC]\n\t"
      "call %0\n\t"
      "pop ecx\n\t"

      "cmp eax, -1\n\t"
      "je OldAttackCode\n\t"

      "call %1\n\t"
      "cmp eax, 0\n\t"
      "je OldAttackCode\n\t"

      "mov dword ptr [esp+0x0C], 1\n\t"

      "OldAttackCode:\n\t"
      "mov eax, %2\n\t"
      "mov eax, [eax]\n\t"
      "ret\n\t" ::"p"(GameAttack),
      "m"(D2CLIENT_GetSelectedUnit), "m"(p_D2CLIENT_ScreenSizeY));
}

void __declspec(naked) PlayerAssignment_Intercept()
{
  __asm__ __volatile__(
      "fnop\n\t"
      "call %0\n\t"
      "mov ecx, eax\n\t"
      "call %1\n\t"
      "ret\n\t" ::"m"(D2CLIENT_AssignPlayer_I),
      "p"(GamePlayerAssignment));
}

void __declspec(naked) GameCrashFix_Intercept()
{
  __asm__ __volatile__(
      "cmp ecx, 0\n\t"
      "je Skip\n\t"
      "mov dword ptr ds:[ecx+0x10],edx\n\t"
      "Skip:\n\t"
      "mov dword ptr ds:[eax+0xc],0\n\t"
      "ret\n\t");
}

void GameDrawOOG_Intercept(void)
{
  GameDrawOOG();
}

// void __declspec(naked) CongratsScreen_Intercept(void)
// {
//   __asm__ __volatile__(
//       "call %0\n\t"
//       "pushad\n\t"
//       "call %1\n\t"
//       "popad\n\t"
//       "ret\n\t" ::"m"(D2CLIENT_CongratsScreen_I),
//       "p"(SetMaxDiff));
// }

void __declspec(naked) GameActChange_Intercept(void)
{
  __asm__ __volatile__(
      "pop eax\n\t"
      "push edi\n\t"
      "xor edi, edi\n\t"
      "cmp %0, 0\n\t"
      "mov %0, 0\n\t"
      "jmp eax\n\t"
      : "=m"(Vars.bChangedAct)
      :);
}

void __declspec(naked) GameActChange2_Intercept(void)
{
  __asm__ __volatile__(
      "mov %0, 1\n\t"
      "ret 4\n\t"
      : "+m"(Vars.bChangedAct)
      :);
}

void __declspec(naked) GameLeave_Intercept(void)
{
  __asm__ __volatile__(
      "call %0\n\t"
      "jmp %1\n\t" ::"p"(GameLeave),
      "m"(D2CLIENT_GameLeave_I));
}

VOID __declspec(naked) __fastcall ClassicSTUB()
{
  *p_BNCLIENT_ClassicKey = Vars.szClassic;
  __asm__ __volatile__(
      "jmp %0\n\t" ::"m"(BNCLIENT_DClass));
}

VOID __declspec(naked) __fastcall LodSTUB()
{
  *p_BNCLIENT_XPacKey = Vars.szLod;
  __asm__ __volatile__(
      "jmp %0\n\t" ::"m"(BNCLIENT_DLod));
}

void __declspec(naked) FailToJoin_Interception()
{
  __asm__ __volatile__(
      "cmp esi, 4000\n\t"
      "ret\n\t");
}

void __declspec(naked) ChannelInput_Intercept(void)
{
  __asm__ __volatile__(
      "push ecx\n\t"
      "mov ecx, esi\n\t"
      "call %0\n\t"
      "test eax, eax\n\t"
      "pop ecx\n\t"
      "jz SkipInput\n\t"
      "mov eax, dword ptr[esp+4]\n\t"
      "push eax\n\t"
      "call %1\n\t"

      "SkipInput:\n\t"
      "ret 4\n\t" ::"p"(ChannelInput),
      "m"(D2MULTI_ChannelInput_I));
}

VOID __declspec(naked) ChatPacketRecv_Interception()
{
  __asm__ __volatile__(
      "lea ecx, [esi+4]\n\t"
      "pushad\n\t"
      "mov edx, ebp\n\t"
      "mov ecx, esi\n\t"

      "call %0\n\t"
      "test eax, eax\n\t"
      "popad\n\t"

      "je Block\n\t"
      "call eax\n\t"
      "Block:\n\t"
      "ret\n\t" ::"p"(ChatPacketRecv));
}

WINUSERAPI int WINAPI MessageBoxA(_In_opt_ HWND hWnd, _In_opt_ LPCSTR lpText, _In_opt_ LPCSTR lpCaption, _In_ UINT uType);

int WINAPI LogMessageBoxA_Intercept(HWND hWnd, LPCSTR lpText, LPCSTR lpCaption, UINT uType)
{
  GetStackWalk();

  char *dllAddrs;
  Log(L"Error message box, caption: \"%s\", message:\n%s\n%s", lpCaption, lpText, dllAddrs = DllLoadAddrStrs());
  free(dllAddrs);
  return MessageBoxA(hWnd, lpText, lpCaption, uType);
}

HMODULE __stdcall Multi(LPSTR Class, LPSTR Window)
{
  return 0;
}

// DWORD MainMenuAddress() { return GetDllOffset(L"D2Launch.dll", 0x10B08); } // Backjmp.
// VOID __declspec(naked) __fastcall InitMainMenu()
// {
//   __asm__ __volatile__(
//       "call Shutdown\n\t"
//       "pop esi\n\t"
//       "pop ebp\n\t"
//       "add esp,0x20\n\t"
//       "jmp [MainMenuAddress]\n\t");
// }

HANDLE __stdcall Windowname(DWORD dwExStyle, LPCSTR lpClassName, LPCSTR lpWindowName, DWORD dwStyle, int x, int y, int nWidth, int nHeight, HWND hWndParent, HMENU hMenu,
                            HINSTANCE hInstance, LPVOID lpParam)
{
  WCHAR szWindowName[200] = L"D2";
  WCHAR szClassName[200] = L"CNAME";

  if (wcslen(Vars.szTitle) > 1)
    wcscpy_s(szWindowName, _countof(szWindowName), Vars.szTitle);

  WCHAR *wClassName = AnsiToUnicode(lpClassName);
  wcscpy_s(szClassName, _countof(szClassName), wClassName);
  free(wClassName);

  return CreateWindowEx(dwExStyle, szClassName, szWindowName, dwStyle, x, y, nWidth, nHeight, hWndParent, hMenu, hInstance, lpParam);
}

int EraseCacheFiles()
{
  WCHAR path[MAX_PATH];
  GetCurrentDirectory(MAX_PATH, path);

  WCHAR szSearch[MAX_PATH];
  memset(szSearch, 0x00, MAX_PATH * sizeof(szSearch[0]));

  wcscpy_s(szSearch, path);
  PathAppend(szSearch, L"\\*.dat");

  WIN32_FIND_DATA FindFileData;
  HANDLE hFind = FindFirstFile(szSearch, &FindFileData);
  if (hFind != INVALID_HANDLE_VALUE)
  {
    do
    {
      WCHAR FilePath[MAX_PATH];
      memset(FilePath, 0x00, MAX_PATH * sizeof(FilePath[0]));

      wcscpy_s(FilePath, path);
      PathAppend(FilePath, FindFileData.cFileName);
      DeleteFile(FilePath);

    } while (FindNextFile(hFind, &FindFileData));

    FindClose(hFind);
  }

  return 0;
}

HANDLE __stdcall CacheFix(LPCSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPSECURITY_ATTRIBUTES lpSecurityAttributes, DWORD dwCreationDisposition,
                          DWORD dwFlagsAndAttributes, HANDLE hTemplateFile)
{
  EraseCacheFiles();
  WCHAR path[MAX_PATH];
  GetCurrentDirectory(MAX_PATH, path);

  if (Vars.bCacheFix)
  {
    WCHAR szTitle[128];
    GetWindowText(D2GFX_GetHwnd(), szTitle, 128);
    WCHAR Def[100] = L"";

    if (wcslen(szTitle) > 1)
    {
      wprintf_s(Def, L"\\bncache%d.dat", szTitle);
      wcscat_s(path, Def);
    }
    else
    {
      srand(GetTickCount());
      wprintf_s(Def, L"\\bncache%d.dat", rand() % 0x2000);

      wcscat_s(path, Def);
    }
  }
  else
    wcscat_s(path, L"\\bncache.dat");

  return CreateFile(path, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile);
}
