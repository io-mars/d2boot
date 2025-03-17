#include <ctime>
#include <cmath>
#include <sstream>
#include <list>
#include <share.h>

#include "D2Helpers.h"
#include "D2Handlers.h"
#include "Helpers.h"
#include "Console.h"
#include "CriticalSections.h"
#include "D2Skills.h"
#include "D2Boot.h"
#include "Control.h"

int MeasureText(const std::wstring &str, int index)
{
  return CalculateTextLen(str.substr(0, index).c_str(), Vars.dwConsoleFont).x;
}

int MaxLineFit(const std::wstring &str, int start_idx, int end_idx, int maxWidth)
{
  if (start_idx == end_idx)
    return MeasureText(str, start_idx) <= maxWidth ? start_idx : -1;

  int mid_idx = start_idx + (end_idx - start_idx) / 2;

  if (maxWidth < MeasureText(str, mid_idx))
    return MaxLineFit(str, start_idx, mid_idx, maxWidth);

  int ret = MaxLineFit(str, mid_idx + 1, end_idx, maxWidth);
  return ret == -1 ? mid_idx : ret;
}

bool SplitLines(const std::wstring &str, size_t maxWidth, const wchar_t delim, std::list<std::wstring> &lst)
{
  // using namespace std;
  std::wstring tmp(str);

  if (str.length() < 1 || maxWidth < 40)
    return false;

  // base case
  if (CalculateTextLen(str.c_str(), Vars.dwConsoleFont).x < (LONG)maxWidth)
  {
    lst.push_back(tmp);
    return true;
  }

  int byteIdx = MaxLineFit(str, 0, str.length() + 1, maxWidth);
  std::wstring ts = str.substr(0, byteIdx);
  // unsigned int cmdsize = CalculateTextLen(ts.c_str(), Vars.dwConsoleFont).x;
  // int numchars = ts.length();
  // int sizechar = (cmdsize + numchars - 1) / numchars;
  // int maxLength = (maxWidth + sizechar - 1) / sizechar - 1;

  // byteIdx-1 since std::string::npos indexes from 0
  unsigned int pos = tmp.find_last_of(delim, byteIdx - 1);
  if (!pos || pos == std::string::npos)
  {
    // Target delimiter was not found, breaking at byteIdx
    std::wstring ts = tmp.substr(0, byteIdx);
    lst.push_back(ts);
    tmp.erase(0, byteIdx);
  }
  else
  {
    // We found the last delimiter before byteIdx
    std::wstring ts = tmp.substr(0, pos);
    lst.push_back(ts);
    tmp.erase(0, pos);
  }

  return SplitLines(tmp, maxWidth, delim, lst);
}

void Print(const wchar_t *szFormat, ...)
{
  wchar_t *wsString;

  va_list vaArgs;

  va_start(vaArgs, szFormat);
  FormatString(&wsString, szFormat, vaArgs);
  va_end(vaArgs);

  // Break into lines through \n.
  std::wstring line;
  std::wstringstream ss(wsString);

  while (std::getline(ss, line))
    Console::AddLine(line);

  free(wsString);
}

void Log(const wchar_t *szFormat, ...)
{
  wchar_t *wsString;

  va_list vaArgs;

  va_start(vaArgs, szFormat);
  int len = FormatString(&wsString, szFormat, vaArgs);
  va_end(vaArgs);

  if (len > 0 && wsString[len - 1] == L'\n')
    wsString[len - 1] = 0;

  LogNoFormat(wsString);

  free(wsString);
}

void LogNoFormat(const wchar_t *szString)
{
  SYSTEMTIME time;
  GetLocalTime(&time);
  char szTime[13] = "";
  sprintf(szTime, "%d%02d%02d", time.wYear, time.wMonth, time.wDay);
#ifdef DEBUG
  FILE *log = stderr;
#else
  wchar_t path[_MAX_PATH + _MAX_FNAME] = L"";
  swprintf(path, _countof(path), L"%lsd2boot-%ls-%s.log", Vars.szPath, Vars.szProfile, szTime);
  FILE *log = _wfsopen(path, L"a+", _SH_DENYNO);
#endif
  static DWORD id = GetProcessId(GetCurrentProcess());
  sprintf(szTime, "%02d:%02d:%02d.%03d", time.wHour, time.wMinute, time.wSecond, time.wMilliseconds);
  fwprintf(log, L"[%s] D2Boot %ld: %ls\n", szTime, id, szString);
#ifndef DEBUG
  fflush(log);
  fclose(log);
#endif
}

ClientGameState ClientState(void)
{
  ClientGameState state = ClientStateNull;
  UnitAny *player = D2CLIENT_GetPlayerUnit();
  Control *firstControl = *p_D2WIN_FirstControl;

  if (player && !firstControl)
  {
    if (player && player->pUpdateUnit)
    {
      state = ClientStateBusy;
      return state;
    }

    if (player->pInventory &&
        player->pPath &&
        // player->pPath->xPos &&
        player->pPath->pRoom1 &&
        player->pPath->pRoom1->pRoom2 &&
        player->pPath->pRoom1->pRoom2->pLevel &&
        player->pPath->pRoom1->pRoom2->pLevel->dwLevelNo)
      state = ClientStateInGame;
    else
      state = ClientStateBusy;
  }
  else if (!player && firstControl)
    state = ClientStateMenu;
  else if (!player && !firstControl)
    state = ClientStateNull;

  return state;
}

bool GameReady(void)
{
  return (ClientState() == ClientStateInGame ? true : false);
}

bool WaitForGameReady(void)
{
  DWORD start = GetTickCount();
  do
  {
    switch (ClientState())
    {
    case ClientStateNull:
    case ClientStateMenu:
      return false;
    case ClientStateInGame:
      return true;
    case ClientStateBusy:
      break;
    }
    Sleep(10);
  } while ((Vars.dwGameTimeout == 0) || (Vars.dwGameTimeout > 0 && (GetTickCount() - start) < Vars.dwGameTimeout));
  return false;
}

DWORD GetPlayerArea(void)
{
  return (ClientState() == ClientStateInGame ? D2CLIENT_GetPlayerUnit()->pPath->pRoom1->pRoom2->pLevel->dwLevelNo : 0);
}

void *memcpy2(void *dest, const void *src, size_t count)
{
  return (char *)memcpy(dest, src, count) + count;
}

HANDLE OpenFileRead(const wchar_t *filename)
{
  return CreateFile(filename, GENERIC_READ, FILE_SHARE_READ, NULL, OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
}

DWORD ReadFile(HANDLE hFile, void *buf, DWORD len)
// NOTE :- validates len bytes of buf
{
  DWORD numdone = 0;
  return ::ReadFile(hFile, buf, len, &numdone, NULL) != 0 ? numdone : -1;
}

BYTE *AllocReadFile(const wchar_t *filename)
{
  HANDLE hFile = OpenFileRead(filename);
  int filesize = GetFileSize(hFile, 0);
  if (filesize <= 0)
    return 0;
  BYTE *buf = new BYTE[filesize];
  ReadFile(hFile, buf, filesize);
  CloseHandle(hFile);
  return buf;
}

CellFile *LoadBmpCellFile(BYTE *buf1, int width, int height)
{
  BYTE *buf2 = new BYTE[(width * height * 2) + height], *dest = buf2;

  for (int i = 0; i < height; i++)
  {
    BYTE *src = buf1 + (i * ((width + 3) & -4)), *limit = src + width;
    while (src < limit)
    {
      BYTE *start = src, *limit2 = std::min(limit, src + 0x7f), trans = !*src;
      do
        src++;
      while ((trans == (BYTE) !*src) && (src < limit2));
      if (!trans || (src < limit))
        *dest++ = (BYTE)((trans ? 0x80 : 0) + (src - start));
      if (!trans)
        while (start < src)
          *dest++ = *start++;
    }
    *dest++ = 0x80;
  }

  static DWORD dc6head[] = {6, 1, 0, 0xeeeeeeee, 1, 1, 0x1c, 0, (DWORD)-1, (DWORD)-1, 0, 0, 0, (DWORD)-1, (DWORD)-1};
  dc6head[8] = width;
  dc6head[9] = height;
  dc6head[14] = dest - buf2;
  dc6head[13] = sizeof(dc6head) + (dc6head[14]) + 3;
  BYTE *ret = new BYTE[dc6head[13]];
  memset(memcpy2(memcpy2(ret, dc6head, sizeof(dc6head)), buf2, dc6head[14]), 0xee, 3);
  delete[] buf2;

  return (CellFile *)ret;
}

CellFile *LoadBmpCellFile(const wchar_t *filename)
{
  BYTE *ret = 0;

  BYTE *buf1 = AllocReadFile(filename);
  BITMAPFILEHEADER *bmphead1 = (BITMAPFILEHEADER *)buf1;
  BITMAPINFOHEADER *bmphead2 = (BITMAPINFOHEADER *)(buf1 + sizeof(BITMAPFILEHEADER));
  // BM 0x4d42 19778
  if (buf1 && (bmphead1->bfType == 0x4d42) && (bmphead2->biBitCount == 8) && (bmphead2->biCompression == BI_RGB))
  {
    ret = (BYTE *)LoadBmpCellFile(buf1 + bmphead1->bfOffBits, bmphead2->biWidth, bmphead2->biHeight);
  }
  delete[] buf1;

  return (CellFile *)ret;
}

CellFile *myInitCellFile(CellFile *cf)
{
  if (cf)
    D2CMP_InitCellFile(cf, &cf, (char *)"?", 0, (DWORD)-1, (char *)"?");
  return cf;
}

CellFile *LoadCellFile(const wchar_t *lpszPath, DWORD bMPQ)
{
  if (bMPQ == true)
  {
    Log(L"Cannot specify wide character path for MPQ: %ls", lpszPath);
    return nullptr;
  }

  // AutoDetect the Cell File
  if (bMPQ == 3)
  {
    // Check in our directory first
    wchar_t path[_MAX_FNAME + _MAX_PATH];
    swprintf_s(path, _countof(path), L"%s\\%s", Vars.szScriptPath, lpszPath);

    HANDLE hFile = OpenFileRead(path);

    if (hFile != INVALID_HANDLE_VALUE)
    {
      CloseHandle(hFile);
      return LoadCellFile(path, FALSE);
    }
    else
    {
      return LoadCellFile(lpszPath, TRUE);
    }
  }

  // MTODO if want cache cellfile, need handle ImageHook deconstructor
  //  unsigned __int32 hash = sfh((char *)lpszPath, (int)strlen((char *)lpszPath));
  //  if (Vars.mCachedCellFiles.count(lpszPath) > 0)
  //    return Vars.mCachedCellFiles[lpszPath];

  // see if the file exists first
  if (!(_waccess(lpszPath, 0) != 0 && errno == ENOENT))
  {
    CellFile *result = myInitCellFile((CellFile *)LoadBmpCellFile(lpszPath));
    // Vars.mCachedCellFiles[lpszPath] = result;
    return result;
  }

  return nullptr;
}

void deleteCellFiles()
{
  // for (const auto &item : Vars.mCachedCellFiles)
  // {
  //   if (item.second)
  //   {
  //     // MTODO crash!
  //     //  D2CMP_DeleteCellFile(item.second);
  //     delete[] item.second;
  //   }
  // }
  // Vars.mCachedCellFiles.clear();
}

POINT GetScreenSize()
{
  // HACK: p_D2CLIENT_ScreenSize is wrong for out of game, which is hardcoded to 800x600
  POINT ingame = {(LONG)*p_D2CLIENT_ScreenSizeX, (LONG)*p_D2CLIENT_ScreenSizeY},
        oog = {800, 600},
        p = {0};
  if (ClientState() == ClientStateMenu)
    p = oog;
  else
    p = ingame;
  return p;
}

int D2GetScreenSizeX()
{
  return GetScreenSize().x;
}

int D2GetScreenSizeY()
{
  return GetScreenSize().y;
}

void myDrawAutomapCell(CellFile *cellfile, int xpos, int ypos, BYTE col)
{
  if (!cellfile)
    return;
  CellContext ct;
  memset(&ct, 0, sizeof(ct));
  ct.pCellFile = cellfile;

  xpos -= (cellfile->cells[0]->width / 2);
  ypos += (cellfile->cells[0]->height / 2);

  int xpos2 = xpos - cellfile->cells[0]->xoffs, ypos2 = ypos - cellfile->cells[0]->yoffs;
  if ((xpos2 >= D2GetScreenSizeX()) || ((xpos2 + (int)cellfile->cells[0]->width) <= 0) || (ypos2 >= D2GetScreenSizeY()) ||
      ((ypos2 + (int)cellfile->cells[0]->height) <= 0))
    return;

  static BYTE coltab[2][256]; //, tabno = 0, lastcol = 0;
  if (!coltab[0][1])
    for (int k = 0; k < 255; k++)
      coltab[0][k] = coltab[1][k] = (BYTE)k;
  cellfile->mylastcol = coltab[cellfile->mytabno ^= (col != cellfile->mylastcol)][255] = col;

  D2GFX_DrawAutomapCell2(&ct, xpos, ypos, (DWORD)-1, 5, coltab[cellfile->mytabno]);
}

// NOTE TO CALLERS: szTmp must be a PRE-INITIALIZED string.
const char *GetUnitName(UnitAny *pUnit, char *szTmp, size_t bufSize)
{
  if (!pUnit)
  {
    strcpy_s(szTmp, bufSize, "Unknown");
    return szTmp;
  }
  if (pUnit->dwType == UNIT_MONSTER)
  {
    wchar_t *wName = D2CLIENT_GetUnitName(pUnit);
    WideCharToMultiByte(CP_UTF8, 0, wName, -1, szTmp, bufSize, 0, 0);
    return szTmp;
  }
  if (pUnit->dwType == UNIT_PLAYER && pUnit->pPlayerData)
  {
    //	return pUnit->pPlayerData->szName;
    strcpy_s(szTmp, bufSize, pUnit->pPlayerData->szName);
    return szTmp;
  }
  if (pUnit->dwType == UNIT_ITEM)
  {
    wchar_t wBuffer[256] = L"";
    D2CLIENT_GetItemName(pUnit, wBuffer, _countof(wBuffer));

    char *szBuffer = UnicodeToAnsi(wBuffer);
    if (strchr(szBuffer, '\n'))
      *strchr(szBuffer, '\n') = 0x00;

    strcpy_s(szTmp, bufSize, szBuffer);
    free(szBuffer);

    return szTmp;
  }
  if (pUnit->dwType == UNIT_OBJECT || pUnit->dwType == UNIT_TILE)
  {
    if (pUnit->pObjectData && pUnit->pObjectData->pTxt)
    {
      strcpy_s(szTmp, bufSize, pUnit->pObjectData->pTxt->szName);
      return szTmp;
    }
  }
  strcpy_s(szTmp, bufSize, "Unknown");
  return szTmp;
}

// szBuf must be a 4-character string
void GetItemCode(UnitAny *pUnit, char *szBuf)
{
  if (pUnit->dwType == UNIT_ITEM)
  {
    ItemTxt *pTxt = D2COMMON_GetItemText(pUnit->dwTxtFileNo);
    if (pTxt)
    {
      memcpy(szBuf, pTxt->szCode, 3);
      szBuf[3] = 0x00;
    }
  }
}

typedef void (*fnClickEntry)(void);

bool ClickNPCMenu(DWORD NPCClassId, DWORD MenuId)
{
  NPCMenu *pMenu = (NPCMenu *)p_D2CLIENT_NPCMenu;
  fnClickEntry pClick = (fnClickEntry)NULL;

  for (UINT i = 0; i < *p_D2CLIENT_NPCMenuAmount; i++)
  {
    if (pMenu->dwNPCClassId == NPCClassId)
    {
      if (pMenu->wEntryId1 == MenuId)
      {
        pClick = (fnClickEntry)pMenu->dwEntryFunc1;
        if (pClick)
          pClick();
        else
          return false;
        return true;
      }
      else if (pMenu->wEntryId2 == MenuId)
      {
        pClick = (fnClickEntry)pMenu->dwEntryFunc2;
        if (pClick)
          pClick();
        else
          return false;
        return true;
      }
      else if (pMenu->wEntryId3 == MenuId)
      {
        pClick = (fnClickEntry)pMenu->dwEntryFunc3;
        if (pClick)
          pClick();
        else
          return false;
        return true;
      }
      else if (pMenu->wEntryId4 == MenuId)
      {
        pClick = (fnClickEntry)pMenu->dwEntryFunc4;
        if (pClick)
          pClick();
        else
          return false;
        return true;
      }
    }
    pMenu = (NPCMenu *)((DWORD)pMenu + sizeof(NPCMenu));
  }

  return false;
}

int GetItemLocation(UnitAny *pItem)
{
  if (!pItem || !pItem->pItemData)
    return -1;

  return (pItem->pItemData->GameLocation);
}

void __declspec(naked) __fastcall Say_ASM(DWORD dwPtr)
{
  __asm__ __volatile__(
      "pop eax\n\t"
      "push ecx\n\t"
      "push eax\n\t"
      "sub esp,0x110\n\t"
      "push ebx\n\t"
      "push ebp\n\t"
      "mov ebp, %0\n\t"
      "push esi\n\t"
      "push edi\n\t"
      "jmp %1\n\t" ::"m"(D2LANG_Say_II),
      "m"(D2CLIENT_Say_I));
}

void Say(const wchar_t *szFormat, ...)
{
  wchar_t *wsString;

  va_list vaArgs;

  va_start(vaArgs, szFormat);
  int len = FormatString(&wsString, szFormat, vaArgs);
  va_end(vaArgs);

  Vars.bDontCatchNextMsg = TRUE;

  if (*p_D2CLIENT_PlayerUnit)
  {
    memcpy((wchar_t *)p_D2CLIENT_ChatMsg, wsString, (len + 1) * sizeof(wchar_t));

    MSG *aMsg = new MSG;
    aMsg->hwnd = D2GFX_GetHwnd();
    aMsg->message = WM_CHAR;
    aMsg->wParam = VK_RETURN;
    aMsg->lParam = 0x11C0001;
    aMsg->time = 0;
    aMsg->pt.x = 0x79;
    aMsg->pt.y = 0x1;

    // bug fix not &(DWORD)aMsg
    Say_ASM((DWORD)aMsg);

    delete aMsg;
    aMsg = NULL;

    /*
    Vars.bDontCatchNextMsg = FALSE;
    int len = 6+strlen(szMessage);
    BYTE* pPacket = new BYTE[6+strlen(szMessage)];
    memset(pPacket, 0, len);
    pPacket[0] = 0x15;
    pPacket[1] = 0x01;
    memcpy(pPacket+3, szMessage, len-6);
    D2CLIENT_SendGamePacket(len, pPacket);
    delete [] pPacket;
    */
  }
  // help button and ! ok msg for disconnected
  else if (findControl(CONTROL_BUTTON, 5308, -1, 187, 470, 80, 20) && (!findControl(CONTROL_BUTTON, 5102, -1, 351, 337, 96, 32)))
  {
    char *lBuffer = UnicodeToAnsi(wsString, CP_ACP);
    memcpy((char *)p_D2MULTI_ChatBoxMsg, lBuffer, strlen(lBuffer) + 1);
    D2MULTI_DoChat();
    free(lBuffer);
  }

  free(wsString);
}

bool ClickMap(DWORD dwClickType, int wX, int wY, bool bShift, UnitAny *pUnit)
{
  if (ClientState() != ClientStateInGame)
    return false;

  POINT Click = {wX, wY};
  if (pUnit)
  {
    Click.x = D2CLIENT_GetUnitX(pUnit);
    Click.y = D2CLIENT_GetUnitY(pUnit);
  }

  D2COMMON_MapToAbsScreen(&Click.x, &Click.y);

  Click.x -= *p_D2CLIENT_ViewportX;
  Click.y -= *p_D2CLIENT_ViewportY;

  POINT OldMouse = {0, 0};
  OldMouse.x = *p_D2CLIENT_MouseX;
  OldMouse.y = *p_D2CLIENT_MouseY;
  *p_D2CLIENT_MouseX = 0;
  *p_D2CLIENT_MouseY = 0;

  if (pUnit && pUnit != D2CLIENT_GetPlayerUnit() /* && D2CLIENT_UnitTestSelect(pUnit, 0, 0, 0)*/)
  {
    Vars.dwSelectedUnitId = pUnit->dwUnitId;
    Vars.dwSelectedUnitType = pUnit->dwType;

    Vars.bClickAction = TRUE;

    D2CLIENT_ClickMap(dwClickType, Click.x, Click.y, bShift ? 0x0C : (*p_D2CLIENT_AlwaysRun ? 0x08 : 0));
    D2CLIENT_SetSelectedUnit(NULL);

    Vars.bClickAction = FALSE;
    Vars.dwSelectedUnitId = 0;
    Vars.dwSelectedUnitType = 0;
  }
  else
  {
    Vars.dwSelectedUnitId = 0;
    Vars.dwSelectedUnitType = 0;

    Vars.bClickAction = TRUE;
    D2CLIENT_ClickMap(dwClickType, Click.x, Click.y, bShift ? 0x0C : (*p_D2CLIENT_AlwaysRun ? 0x08 : 0));
    Vars.bClickAction = FALSE;
  }

  *p_D2CLIENT_MouseX = OldMouse.x;
  *p_D2CLIENT_MouseY = OldMouse.y;
  return true;
}

void LoadMPQ(const char *mpq)
{
  D2WIN_InitMPQ("D2Win.DLL", mpq, NULL, 0, 0);
  *p_BNCLIENT_XPacKey = *p_BNCLIENT_ClassicKey = *p_BNCLIENT_KeyOwner = NULL;
  BNCLIENT_DecodeAndLoadKeys();
}

void LoadMPQ(const wchar_t *mpq)
{
  char *path = UnicodeToAnsi(mpq);
  LoadMPQ(path);
  free(path);
  // BNCLIENT_DecodeAndLoadKeys();
}

UnitAny *D2CLIENT_FindUnit(DWORD dwId, DWORD dwType)
{
  if (dwId == (DWORD)-1)
    return NULL;
  UnitAny *pUnit = D2CLIENT_FindServerSideUnit(dwId, dwType);
  return pUnit ? pUnit : D2CLIENT_FindClientSideUnit(dwId, dwType);
}

void myDrawText(const wchar_t *szwText, int x, int y, int color, int font)
{
  DWORD dwOld = D2WIN_SetTextSize(font);
  D2WIN_DrawText(szwText, x, y, color, 0);
  D2WIN_SetTextSize(dwOld);
}

// TODO: make this use SIZE for clarity
POINT CalculateTextLen(const char *szwText, int Font)
{
  POINT ret = {0, 0};

  if (!szwText)
    return ret;

  wchar_t *buf = AnsiToUnicode(szwText);
  ret = CalculateTextLen(buf, Font);
  free(buf);
  return ret;
}

POINT CalculateTextLen(const wchar_t *szwText, int Font)
{
  POINT ret = {0, 0};

  if (!szwText)
    return ret;

  DWORD dwWidth, dwFileNo;
  DWORD dwOldSize = D2WIN_SetTextSize(Font);
  ret.y = D2WIN_GetTextSize((wchar_t *)szwText, &dwWidth, &dwFileNo);
  ret.x = dwWidth;
  D2WIN_SetTextSize(dwOldSize);

  return ret;
}

DWORD GetTileLevelNo(Room2 *lpRoom2, DWORD dwTileNo)
{
  for (RoomTile *pRoomTile = lpRoom2->pRoomTiles; pRoomTile; pRoomTile = pRoomTile->pNext)
  {
    if (*(pRoomTile->nNum) == dwTileNo)
      return pRoomTile->pRoom2->pLevel->dwLevelNo;
  }

  return 0;
}

UnitAny *GetMercUnit(UnitAny *pUnit)
{
  for (Room1 *pRoom = pUnit->pAct->pRoom1; pRoom; pRoom = pRoom->pRoomNext)
    for (UnitAny *pMerc = pRoom->pUnitFirst; pMerc; pMerc = pMerc->pRoomNext)
      if (pMerc->dwType == UNIT_MONSTER &&
          (pMerc->dwTxtFileNo == MERC_A1 || pMerc->dwTxtFileNo == MERC_A2 || pMerc->dwTxtFileNo == MERC_A3 || pMerc->dwTxtFileNo == MERC_A5) &&
          D2CLIENT_GetMonsterOwner(pMerc->dwUnitId) == pUnit->dwUnitId)
        return pMerc;
  return NULL;

#if 0
	// Wanted way of doing things, but D2CLIENT_GetMercUnit does some wierd internal things (drawing, causing screen flicker)
	for(UnitAny* pMerc = D2CLIENT_GetMercUnit(); pMerc; pMerc = pMerc->pRoomNext)
		if (D2CLIENT_GetMonsterOwner(pMerc->dwUnitId) == pUnit->dwUnitId)
			return pMerc;
	return NULL;
#endif
}

double GetDistance(long x1, long y1, long x2, long y2, DistanceType type)
{
  double dist = 0;
  switch (type)
  {
  case Euclidean:
  {
    double dx = (double)(x2 - x1);
    double dy = (double)(y2 - y1);
    dx = pow(dx, 2);
    dy = pow(dy, 2);
    dist = sqrt(dx + dy);
  }
  break;
  case Chebyshev:
  {
    long dx = (x2 - x1);
    long dy = (y2 - y1);
    dx = abs(dx);
    dy = abs(dy);
    dist = std::max(dx, dy);
  }
  break;
  case Manhattan:
  {
    long dx = (x2 - x1);
    long dy = (y2 - y1);
    dx = abs(dx);
    dy = abs(dy);
    dist = (dx + dy);
  }
  break;
  default:
    dist = -1;
    break;
  }
  return dist;
}

bool IsScrollingText()
{
  if (!WaitForGameReady())
    return false;

  HWND d2Hwnd = D2GFX_GetHwnd();
  WindowHandlerList *whl = p_STORM_WindowHandlers->table[(0x534D5347 ^ (DWORD)d2Hwnd) % p_STORM_WindowHandlers->length];
  MessageHandlerHashTable *mhht;
  MessageHandlerList *mhl;

  while (whl)
  {
    if (whl->unk_0 == 0x534D5347 && whl->hWnd == d2Hwnd)
    {
      mhht = whl->msgHandlers;
      if (mhht != NULL && mhht->table != NULL && mhht->length != 0)
      {
        // 0x201 - WM_something click
        mhl = mhht->table[0x201 % mhht->length];

        if (mhl != NULL)
        {
          while (mhl)
          {
            if (mhl->message && mhl->unk_4 < 0xffffffff && mhl->handler == D2CLIENT_CloseNPCTalk)
            {
              return true;
            }
            mhl = mhl->next;
          }
        }
      }
    }
    whl = whl->next;
  }

  return false;
}

Level *GetLevel(DWORD dwLevelNo)
{
  AutoCriticalRoom *cRoom = new AutoCriticalRoom;

  if (!GameReady())
    return nullptr;

  Level *pLevel = D2CLIENT_GetPlayerUnit()->pAct->pMisc->pLevelFirst;

  while (pLevel)
  {
    if (pLevel->dwLevelNo == dwLevelNo)
    {
      if (!pLevel->pRoom2First)
        D2COMMON_InitLevel(pLevel);

      if (!pLevel->pRoom2First)
        break;
      delete cRoom;
      return pLevel;
    }
    pLevel = pLevel->pNextLevel;
  }

  // this crashes pretty much every time it's called
  // pLevel = D2COMMON_GetLevel(D2CLIENT_GetPlayerUnit()->pAct->pMisc, dwLevelNo);
  delete cRoom;
  return pLevel;
}

DWORD __declspec(naked) __fastcall D2CLIENT_InitAutomapLayer_STUB(DWORD nLayerNo)
{
  __asm__ __volatile__(
      "push eax\n\t"
      "mov eax, ecx\n\t"
      "call %0\n\t"
      "pop eax\n\t"
      "ret\n\t" ::"m"(D2CLIENT_InitAutomapLayer_I));
}

AutomapLayer *InitAutomapLayer(DWORD levelno)
{
  AutomapLayer2 *pLayer = D2COMMON_GetLayer(levelno);
  return D2CLIENT_InitAutomapLayer(pLayer->nLayerNo);
}

void WorldToScreen(POINT *pPos)
{
  D2COMMON_MapToAbsScreen(&pPos->x, &pPos->y);
  pPos->x -= D2CLIENT_GetMouseXOffset();
  pPos->y -= D2CLIENT_GetMouseYOffset();
}

void ScreenToWorld(POINT *pPos)
{
  D2COMMON_AbsScreenToMap(&pPos->x, &pPos->y);
  pPos->x += D2CLIENT_GetMouseXOffset();
  pPos->y += D2CLIENT_GetMouseYOffset();
}

POINT ScreenToAutomap(int x, int y)
{
  POINT result = {0, 0};
  x *= 32;
  y *= 32;
  result.x = ((x - y) / 2 / (*p_D2CLIENT_Divisor)) - (*p_D2CLIENT_Offset).x + 8;
  result.y = ((x + y) / 4 / (*p_D2CLIENT_Divisor)) - (*p_D2CLIENT_Offset).y - 8;

  if (D2CLIENT_GetAutomapSize())
  {
    --result.x;
    result.y += 5;
  }
  return result;
}

void AutomapToScreen(POINT *pPos)
{
  pPos->x = 8 - p_D2CLIENT_Offset->x + (pPos->x * (*p_D2CLIENT_AutomapMode));
  pPos->y = 8 + p_D2CLIENT_Offset->y + (pPos->y * (*p_D2CLIENT_AutomapMode));
}

int GetSkill(WORD wSkillId)
{
  if (!D2CLIENT_GetPlayerUnit())
    return 0;

  for (Skill *pSkill = D2CLIENT_GetPlayerUnit()->pInfo->pFirstSkill; pSkill; pSkill = pSkill->pNextSkill)
    if (pSkill->pSkillInfo->wSkillId == wSkillId)
      return D2COMMON_GetSkillLevel(D2CLIENT_GetPlayerUnit(), pSkill, TRUE);

  return 0;
}

// Compare the skillname to the Game_Skills struct to find the right skill ID to return
WORD GetSkillByName(const char *skillname)
{
  for (int i = 0; i < 216; i++)
    if (_stricmp(Game_Skills[i].name, skillname) == 0)
      return Game_Skills[i].skillID;
  return (WORD)-1;
}

char *GetSkillByID(WORD id)
{
  for (int i = 0; i < 216; i++)
    if (id == Game_Skills[i].skillID)
      return Game_Skills[i].name;
  return NULL;
}

void SendMouseClick(int x, int y, int clicktype)
{
  // HACK: Using PostMessage instead of SendMessage--need to fix this ASAP!
  LPARAM lp = x + (y << 16);
  switch (clicktype)
  {
  case 0:
    PostMessage(D2GFX_GetHwnd(), WM_LBUTTONDOWN, 0, lp);
    break;
  case 1:
    PostMessage(D2GFX_GetHwnd(), WM_LBUTTONUP, 0, lp);
    break;
  case 2:
    PostMessage(D2GFX_GetHwnd(), WM_RBUTTONDOWN, 0, lp);
    break;
  case 3:
    PostMessage(D2GFX_GetHwnd(), WM_RBUTTONUP, 0, lp);
    break;
  }
}

void SendKeyPress(UINT type, UINT key, UINT ext)
{
  LPARAM lp = 1;
  lp |= ext << 24;
  lp |= (MapVirtualKey(key, MAPVK_VK_TO_VSC) << 16);

  if (type == WM_KEYUP)
  {
    lp |= 0xC0000000;
  }

  PostMessage(D2GFX_GetHwnd(), type, key, lp);
}

void ReadProcessBYTES(HANDLE hProcess, DWORD lpAddress, void *buf, int len)
{
  DWORD oldprot, dummy = 0;
  VirtualProtectEx(hProcess, (void *)lpAddress, len, PAGE_READWRITE, &oldprot);
  ReadProcessMemory(hProcess, (void *)lpAddress, buf, len, 0);
  VirtualProtectEx(hProcess, (void *)lpAddress, len, oldprot, &dummy);
}

__declspec(naked) void __stdcall D2CLIENT_TakeWaypoint(DWORD dwWaypointId, DWORD dwArea)
{
  __asm__ __volatile__(
      "push ebp\n\t"
      "mov ebp, esp\n\t"
      "sub esp, 0x20\n\t"
      "push ebx\n\t"
      "push esi\n\t"
      "push edi\n\t"
      "and dword ptr ss:[ebp-0x20],0\n\t"
      "push 0\n\t"
      "call _TakeWaypoint\n\t"
      "jmp _Exit\n\t"

      "_TakeWaypoint:\n\t"
      "push ebp\n\t"
      "push esi\n\t"
      "push edi\n\t"
      "push ebx\n\t"
      "xor edi, edi\n\t"
      "mov ebx, 1\n\t"
      "mov ecx,dword ptr ss:[ebp+8]\n\t"
      "mov edx,dword ptr ss:[ebp+0xc]\n\t"
      "lea ebp,dword ptr [ebp-0x20]\n\t"
      "jmp %0\n\t"

      "_Exit:\n\t"
      "pop edi\n\t"
      "pop esi\n\t"
      "pop ebx\n\t"
      "leave\n\t"
      "ret 8\n\t" ::"m"(D2CLIENT_TakeWaypoint_I));
}

DWORD __declspec(naked) __fastcall D2CLIENT_GetUnitName_STUB(DWORD UnitAny)
{
  __asm__ __volatile__(
      "mov eax, ecx\n\t"
      "jmp %0\n\t" ::"m"(D2CLIENT_GetUnitName_I));
}

DWORD __declspec(naked) __fastcall D2CLIENT_GetUnitFromId_STUB(DWORD dwUnitId, DWORD dwType)
{
  __asm__ __volatile__(
      "pop eax\n\t"
      "push edx\n\t" // dwType
      "push eax\n\t" // return address

      "shl edx, 9\n\t"
      "mov eax, %0\n\t"
      "add edx, eax\n\t"
      "mov eax, ecx\n\t" // dwUnitId
      "and eax, 0x7F\n\t"
      "jmp %1\n\t" ::"m"(p_D2CLIENT_pUnitTable),
      "m"(D2CLIENT_GetUnitFromId_I));
}

void __declspec(naked) __fastcall D2CLIENT_SetSelectedUnit_STUB(DWORD UnitAny)
{
  __asm__ __volatile__(
      "mov eax, ecx\n\t"
      "jmp %0\n\t" ::"m"(D2CLIENT_SetSelectedUnit_I));
}

DWORD __declspec(naked) __fastcall D2CLIENT_ClickParty_ASM(DWORD RosterUnit, DWORD Mode)
{
  __asm__ __volatile__(
      "mov eax, ecx\n\t"
      "jmp %0\n\t" ::"m"(D2CLIENT_ClickParty_I));
}

void __declspec(naked) __fastcall D2CLIENT_MercItemAction_ASM(DWORD bPacketType, DWORD dwSlot)
{
  __asm__ __volatile__(
      "mov eax, ecx\n\t"
      "mov ecx, edx\n\t"
      "jmp %0\n\t" ::"m"(D2CLIENT_MercItemAction_I));
}

void __declspec(naked) __fastcall D2CLIENT_ClickBelt(DWORD x, DWORD y, Inventory *pInventoryData)
{
  __asm__ __volatile__(
      "mov eax, edx\n\t"
      "jmp %0\n\t" ::"m"(D2CLIENT_ClickBelt_I));
}

void __declspec(naked) __fastcall D2CLIENT_ClickItemRight_ASM(DWORD x, DWORD y, DWORD Location, DWORD Player, DWORD pUnitInventory)
{
  __asm__ __volatile__(
      // ECX = y, EDX = x - Blizzard is weird :D
      // exception: Invalid address specified to RtlValidateHeap
      // "mov eax, ecx\n\t"
      // "mov ecx, edx\n\t"
      // "mov edx, eax\n\t"
      // "pop eax\n\t"
      // "mov ebx,eax\n\t"
      // "pop eax\n\t"
      // "push ebx\n\t"
      // "jmp %0\n\t" ::"m"(D2CLIENT_ClickItemRight_I)

      "xchg edx, ecx\n\t"  // x, y -> y, x
      "pop eax\n\t"        // pop return address
      "xchg eax,[esp]\n\t" // return address to stack, location to eax
      "jmp %0\n\t" ::"m"(D2CLIENT_ClickItemRight_I));
}

void __declspec(naked) __fastcall D2CLIENT_ClickBeltRight_ASM(DWORD pInventory, DWORD pPlayer, DWORD HoldShift, DWORD dwPotPos)
{
  __asm__ __volatile__(
      // "pop eax\n\t"
      // "mov ebx,eax\n\t"
      // "pop eax\n\t"
      // "push ebx\n\t"

      "pop eax\n\t"        // pop return address
      "xchg eax,[esp]\n\t" // return address to stack, location to eax
      "jmp %0\n\t" ::"m"(D2CLIENT_ClickBeltRight_I));
}

void __declspec(naked) __fastcall D2CLIENT_GetItemDesc_ASM(DWORD pUnit, wchar_t *pBuffer)
{
  __asm__ __volatile__(
      "push edi\n\t"
      "mov edi, edx\n\t"
      "push 0\n\t"
      "push 1\n\t" // TRUE = New lines, FALSE = Comma between each stat value
      "push ecx\n\t"
      "call %0\n\t"
      "pop edi\n\t"
      "ret\n\t" ::"m"(D2CLIENT_GetItemDesc_I));
}

void __declspec(naked) __fastcall D2COMMON_DisplayOverheadMsg_ASM(DWORD pUnit)
{
  __asm__ __volatile__(

      "lea esi, [ecx+0xA4]\n\t"
      "mov eax, [ecx+0xA4]\n\t"

      "push eax\n\t"
      "push 0\n\t"
      "call %0\n\t"
      "ret\n\t" ::"m"(D2COMMON_DisplayOverheadMsg_I));
}

DWORD __declspec(naked) __fastcall D2CLIENT_TestPvpFlag_STUB(DWORD planum1, DWORD planum2, DWORD flagmask)
{
  __asm__ __volatile__(
      "push esi\n\t"
      "push [esp+8]\n\t"
      "mov esi, edx\n\t"
      "mov edx, ecx\n\t"
      "call %0\n\t"
      "pop esi\n\t"
      "ret 4\n\t" ::"m"(D2CLIENT_TestPvpFlag_I));
}

void __declspec(naked) __fastcall D2GFX_DrawRectFrame_STUB(RECT *rect)
{
  __asm__ __volatile__(
      "mov eax, ecx\n\t"
      "jmp %0\n\t" ::"m"(D2CLIENT_DrawRectFrame));
}

#pragma GCC push_options
#pragma GCC optimize("O0")
DWORD __cdecl D2CLIENT_GetMinionCount(UnitAny *pUnit, DWORD dwType)
{
  DWORD dwResult = 0;
  __asm__ __volatile__(
      "push eax\n\t"
      "push esi\n\t"
      "mov eax, %1\n\t"
      "mov esi, %2\n\t"
      "call %3\n\t"
      "mov %0, eax\n\t"
      "pop esi\n\t"
      "pop eax\n\t"
      : "=m"(dwResult)
      : "m"(pUnit), "m"(dwType), "m"(D2CLIENT_GetMinionCount_I));

  return dwResult;
}
#pragma GCC pop_options

__declspec(naked) void __fastcall D2CLIENT_HostilePartyUnit(RosterUnit *pUnit, DWORD dwButton)
{
  __asm__ __volatile__(
      "mov eax, edx\n\t"
      "jmp %0\n\t" ::"m"(D2CLIENT_ClickParty_II));
}

DWORD __declspec(naked) __fastcall D2CLIENT_GetUIVar_STUB(DWORD varno)
{
  __asm__ __volatile__(
      "mov eax, ecx\n\t"
      "jmp %0\n\t" ::"m"(D2CLIENT_GetUiVar_I));
}

__declspec(naked) DWORD __fastcall D2CLIENT_SendGamePacket_ASM(DWORD dwLen, BYTE *bPacket)
{
  __asm__ __volatile__(
      "push ebx\n\t"
      "mov ebx, ecx\n\t"
      "push edx\n\t"
      "call %0\n\t"
      "pop ebx\n\t"
      "ret\n\t" ::"m"(D2CLIENT_SendGamePacket_I));
}

void SendGold(int nGold, int nMode)
{
  *p_D2CLIENT_GoldDialogAmount = nGold;
  *p_D2CLIENT_GoldDialogAction = nMode;
  D2CLIENT_PerformGoldDialogAction();
}

void __fastcall UseStatPoint(WORD stat, int count)
{
  if (D2COMMON_GetUnitStat(D2CLIENT_GetPlayerUnit(), STAT_STATPOINTSLEFT, 0) < count)
    return;

  BYTE packet[3] = {0x3A};
  *(WORD *)&packet[1] = stat;

  for (int i = 0; i < count; i++)
  {
    D2CLIENT_SendGamePacket(3, packet);
    if (i != count - 1)
      Sleep(500);
  }
}

void __fastcall UseSkillPoint(WORD skill, int count)
{
  if (D2COMMON_GetUnitStat(D2CLIENT_GetPlayerUnit(), STAT_SKILLPOINTSLEFT, 0) < count)
    return;

  BYTE packet[3] = {0x3B};
  *(WORD *)&packet[1] = skill;

  for (int i = 0; i < count; i++)
  {
    D2CLIENT_SendGamePacket(3, packet);
    if (i != count - 1)
      Sleep(500);
  }
}
