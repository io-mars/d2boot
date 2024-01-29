#pragma once

#ifndef _OFFSET_H
#define _OFFSET_H

#include "D2Ptrs.h"

#define INST_INT3 0xCC
#define INST_CALL 0xE8
#define INST_NOP 0x90
#define INST_JMP 0xE9
#define INST_RET 0xC3

typedef struct PatchHook_t
{
  void (*pFunc)(DWORD, DWORD, DWORD);
  DWORD dwAddr;
  DWORD dwFunc;
  DWORD dwLen;
  BOOL *enabled;
  BYTE *bOldCode;
} PatchHook;

void DefineOffsets();
DWORD GetDllOffset(const int no);
DWORD GetDllOffset(const wchar_t *DllName, int Offset);

void PatchBytes(DWORD dwAddr, DWORD dwValue, DWORD dwLen);
void PatchJmp(DWORD dwAddr, DWORD dwFunc, DWORD dwLen);
void PatchCall(DWORD dwAddr, DWORD dwFunc, DWORD dwLen);

void DefineOffsets();
void InstallPatches();
void InstallConditional();
void RemovePatches();
void RemoveConditional();

#endif