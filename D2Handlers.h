#pragma once

#include "D2Structs.h"

DWORD WINAPI D2Thread(LPVOID lpParam);
DWORD __fastcall GameInput(const wchar_t *wMsg);
LONG WINAPI GameEventHandler(HWND hWnd, UINT uMsg, WPARAM wParam, LPARAM lParam);

LRESULT CALLBACK MouseMoveHook(int code, WPARAM wParam, LPARAM lParam);
LRESULT CALLBACK KeyPressHook(int code, WPARAM wParam, LPARAM lParam);

void GameDraw(void);

DWORD __fastcall GamePacketReceived(BYTE *pPacket, DWORD dwSize);
DWORD __fastcall GamePacketSent(BYTE *pPacket, DWORD dwSize);

void GameDrawOOG(void);

void SetMaxDiff(void);

void __fastcall WhisperHandler(char *szAcc, char *szText);
DWORD __fastcall ChannelInput(wchar_t *wMsg);
DWORD __fastcall GameAttack(UnitInteraction *pAttack);
void __fastcall GamePlayerAssignment(UnitAny *pPlayer);

void GameLeave(void);
void CALLBACK TimerProc(HWND hwnd, UINT uMsg, UINT_PTR idEvent, DWORD dwTime);

BOOL __fastcall RealmPacketRecv(BYTE *pPacket, DWORD dwSize);
BOOL __fastcall ChatPacketRecv(BYTE *pPacket, int len);