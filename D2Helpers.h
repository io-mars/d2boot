#pragma once

#ifndef __D2HELPERS_H__
#define __D2HELPERS_H__

#include <string>
#include <list>
#include <windows.h>
#include "D2Ptrs.h"
#include "Constants.h"

#ifdef DEBUG
#define DEBUG_LOG(FORMAT, ...)                                                                           \
  do                                                                                                     \
  {                                                                                                      \
    SYSTEMTIME time;                                                                                     \
    GetLocalTime(&time);                                                                                 \
    printf("[%5ld-%02d:%02d:%02d.%03d][DBG-%s:%s:%d]:" FORMAT "\n", GetCurrentThreadId(), time.wHour,    \
           time.wMinute, time.wSecond, time.wMilliseconds, __FILE__, __func__, __LINE__, ##__VA_ARGS__); \
  } while (0)
#else
#define DEBUG_LOG(FORMAT, ...)
#endif

enum DistanceType
{
  Euclidean,
  Chebyshev,
  Manhattan
};

enum ClientGameState
{
  ClientStateNull,
  ClientStateMenu,
  ClientStateInGame,
  ClientStateBusy
};

void Log(const wchar_t *szFormat, ...);
void LogNoFormat(const wchar_t *szString);

bool SplitLines(const std::wstring &str, size_t maxlen, const wchar_t delim, std::list<std::wstring> &lst);
void Print(const wchar_t *szFormat, ...);
void Say(const wchar_t *szMessage, ...);

bool ClickMap(DWORD dwClickType, int wX, int wY, bool bShift, UnitAny *pUnit);
void LoadMPQ(const char *mpq);
void LoadMPQ(const wchar_t *mpq);

ClientGameState ClientState(void);
bool GameReady(void);
bool WaitForGameReady(void);
DWORD GetPlayerArea(void);

void SendMouseClick(int x, int y, int clicktype);
void SendKeyPress(UINT type, UINT key, UINT ext);

void WorldToScreen(POINT *pPos);
void ScreenToWorld(POINT *ptPos);
POINT ScreenToAutomap(int x, int y);
void AutomapToScreen(POINT *pPos);

bool ClickNPCMenu(DWORD NPCClassId, DWORD MenuId);
int GetItemLocation(UnitAny *pItem);

int GetSkill(WORD wSkillId);
char *GetSkillByID(WORD id);
WORD GetSkillByName(const char *szSkillName);

const char *GetUnitName(UnitAny *pUnit, char *szBuf, size_t bufSize);
UnitAny *D2CLIENT_FindUnit(DWORD dwId, DWORD dwType);
void GetItemCode(UnitAny *pUnit, char *szBuf);

POINT GetScreenSize();
int D2GetScreenSizeX();
int D2GetScreenSizeY();

CellFile *LoadCellFile(const wchar_t *lpszPath, DWORD bMPQ = 3);
CellFile *LoadBmpCellFile(const wchar_t *filename);
void deleteCellFiles();
void myDrawAutomapCell(CellFile *cellfile, int xpos, int ypos, BYTE col);

AutomapLayer *InitAutomapLayer(DWORD levelno);
DWORD __fastcall D2CLIENT_InitAutomapLayer_STUB(DWORD nLayerNo);

void myDrawText(const wchar_t *szwText, int x, int y, int color, int font);
POINT CalculateTextLen(const char *szwText, int Font);
POINT CalculateTextLen(const wchar_t *szwText, int Font);

DWORD GetTileLevelNo(Room2 *lpRoom2, DWORD dwTileNo);
UnitAny *GetMercUnit(UnitAny *pUnit);

static inline UnitAny *GetPlayerUnit()
{
  return D2CLIENT_GetPlayerUnit();
}
static inline void AddRoomData(Room2 *room)
{
  D2COMMON_AddRoomData(room->pLevel->pMisc->pAct, room->pLevel->dwLevelNo, room->dwPosX, room->dwPosY, room->pRoom1);
}
static inline void RemoveRoomData(Room2 *room)
{
  D2COMMON_RemoveRoomData(room->pLevel->pMisc->pAct, room->pLevel->dwLevelNo, room->dwPosX, room->dwPosY, room->pRoom1);
}
static inline char *__stdcall GetLevelName(const Level *level)
{
  return D2COMMON_GetLevelText(level->dwLevelNo)->szName;
}
static inline char *__stdcall GetLevelIdName(DWORD level)
{
  return D2COMMON_GetLevelText(level)->szName;
}

double GetDistance(long x1, long y1, long x2, long y2, DistanceType type = ::Euclidean);
Level *GetLevel(DWORD dwLevelNo);

DWORD __fastcall D2CLIENT_GetUnitName_STUB(DWORD UnitAny);
DWORD __fastcall D2CLIENT_GetUIVar_STUB(DWORD varno);
void __fastcall D2CLIENT_SetSelectedUnit_STUB(DWORD UnitAny);

DWORD __fastcall D2CLIENT_ClickParty_ASM(DWORD RosterUnit, DWORD Mode);

void __fastcall D2CLIENT_ClickItemRight_ASM(DWORD x, DWORD y, DWORD Location, DWORD pItem, DWORD pItemPath);

void __fastcall D2CLIENT_ClickBelt(DWORD x, DWORD y, Inventory *pInventoryData);
void __fastcall D2CLIENT_ClickBeltRight_ASM(DWORD pInventory, DWORD pPlayer, DWORD HoldShift, DWORD dwPotPos);

void __fastcall D2CLIENT_GetItemDesc_ASM(DWORD pUnit, wchar_t *pBuffer);
void __fastcall D2COMMON_DisplayOverheadMsg_ASM(DWORD pUnit);
void __fastcall D2CLIENT_MercItemAction_ASM(DWORD bPacketType, DWORD dwSlot);

DWORD __fastcall D2CLIENT_TestPvpFlag_STUB(DWORD planum1, DWORD planum2, DWORD flagmask);
void __fastcall D2GFX_DrawRectFrame_STUB(RECT *rect);
DWORD __cdecl D2CLIENT_GetMinionCount(UnitAny *pUnit, DWORD dwType);
void __fastcall D2CLIENT_HostilePartyUnit(RosterUnit *pUnit, DWORD dwButton);

void __stdcall D2CLIENT_TakeWaypoint(DWORD dwWaypointId, DWORD dwArea);
DWORD __fastcall D2CLIENT_SendGamePacket_ASM(DWORD dwLen, BYTE *bPacket);

bool IsScrollingText();
void ReadProcessBYTES(HANDLE hProcess, DWORD lpAddress, void *buf, int len);

void SendGold(int nGold, int nMode);
void __fastcall UseStatPoint(WORD stat, int count = 1);
void __fastcall UseSkillPoint(WORD skill, int count = 1);

#endif