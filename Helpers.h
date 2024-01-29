#pragma once

#ifndef __HELPERS_H__
#define __HELPERS_H__

#include <windows.h>

wchar_t *AnsiToUnicode(const char *str, UINT codepage = CP_UTF8);
char *UnicodeToAnsi(const wchar_t *str, UINT codepage = CP_UTF8);

void HexDump(const unsigned char *pData, const unsigned long dwSize);
char *ByteToArray(const unsigned char *pData, const unsigned long dwSize);

void StringToLower(char *p);
void StringToLower(wchar_t *p);
void StringReplaceChar(char *str, const char find, const char replace, size_t buflen);
void StringReplaceChar(wchar_t *str, const wchar_t find, const wchar_t replace, size_t buflen);
char *StringReplace(const char *str, const char *sub, const char *rep);
wchar_t *StringReplace(const wchar_t *str, const wchar_t *sub, const wchar_t *rep);

int FormatString(char **szString, const char *szFormat, va_list argptr);
int FormatString(wchar_t **wsString, const wchar_t *szFormat, va_list argptr);

void ToColorString(char *p);

bool SwitchToProfile(const wchar_t *profile);

void InitSettings(void);
bool InitHooks(void);

void Reload(void);
bool ProcessCommand(const wchar_t *command, bool unprocessedIsCommand);
void InitCommandLine();

void GameJoined(void);
void MenuEntered(bool beginStarter);

void GameTools(void);
bool ToggleScript(const bool isPause = false);

// unsigned __int32 __fastcall sfh(const char *data, int len);

bool GetStackWalk();
bool PrintStack(CONTEXT *context, HANDLE hProcess, HANDLE hThread);
char *DllLoadAddrStrs();
LONG WINAPI ExceptionHandler(EXCEPTION_POINTERS *ptrs);

#endif