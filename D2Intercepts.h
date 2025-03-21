#pragma once

#ifndef D2INTERCEPTS_H
#define D2INTERCEPTS_H

#include "D2Structs.h"

void GameDraw_Intercept(void);
void GameInput_Intercept();

void GamePacketReceived_Intercept();
void GamePacketSent_Interception();

UnitAny *GetSelectedUnit_Intercept(void);

void Whisper_Intercept();
void GameAttack_Intercept();
void PlayerAssignment_Intercept();
void GameCrashFix_Intercept();

void GameDrawOOG_Intercept(void);
void CongratsScreen_Intercept(void);

void GameActChange_Intercept(void);
void GameActChange2_Intercept(void);
void GameLeave_Intercept(void);

void ChannelInput_Intercept(void);
void ChatPacketRecv_Interception();

int WINAPI LogMessageBoxA_Intercept(HWND hWnd, LPCSTR lpText, LPCSTR lpCaption, UINT uType);

VOID __fastcall ClassicSTUB();
VOID __fastcall LodSTUB();

// VOID __fastcall InitMainMenu();
HMODULE __stdcall Multi(LPSTR Class, LPSTR Window);
HANDLE __stdcall Windowname(DWORD dwExStyle, LPCSTR lpClassName, LPCSTR lpWindowName, DWORD dwStyle, int x, int y, int nWidth, int nHeight, HWND hWndParent, HMENU hMenu,
                            HINSTANCE hInstance, LPVOID lpParam);
HANDLE __stdcall CacheFix(LPCSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPSECURITY_ATTRIBUTES lpSecurityAttributes, DWORD dwCreationDisposition,
                          DWORD dwFlagsAndAttributes, HANDLE hTemplateFile);
void FailToJoin_Interception();

#endif