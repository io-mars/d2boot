#define _DEFINE_VARS

#include "Offset.h"
#include "Patch.h"

// #ifndef ArraySize
// #define ArraySize(x) (sizeof((x)) / sizeof((x)[0]))
// #endif

DWORD GetDllOffset(const wchar_t *DllName, int Offset)
{
  HMODULE hMod = GetModuleHandle(DllName);
  if (!hMod)
    hMod = LoadLibrary(DllName);

  if (!hMod)
    return 0;

  if (Offset < 0)
    return (DWORD)GetProcAddress(hMod, (LPCSTR)(-Offset));

  return ((DWORD)hMod) + Offset;
}

DWORD GetDllOffset(const int no)
{
  static const wchar_t *dlls[] = {L"D2Client.DLL", L"D2Common.DLL", L"D2Gfx.DLL", L"D2Lang.DLL",
                                  L"D2Win.DLL", L"D2Net.DLL", L"D2Game.DLL", L"D2Launch.DLL", L"Fog.DLL", L"BNClient.DLL",
                                  L"Storm.DLL", L"D2Cmp.DLL", L"D2Multi.DLL"};
  // low 8bit >12
  if ((no & 0xff) > 12)
    return 0;

  return GetDllOffset(dlls[no & 0xff], no >> 8);
}

void DefineOffsets()
{
  DWORD *p = (DWORD *)&_D2PTRS_START;
  do
  {
    *p = GetDllOffset(*p);

  } while (++p <= (DWORD *)&_D2PTRS_END);
}

BOOL WriteBytes(void *pAddr, void *pData, DWORD dwLen)
{
  DWORD dwOld;
  if (!VirtualProtect(pAddr, dwLen, PAGE_READWRITE, &dwOld))
    return FALSE;

  ::memcpy(pAddr, pData, dwLen);
  return VirtualProtect(pAddr, dwLen, dwOld, &dwOld);
}

void InterceptLocalCode(BYTE bInst, DWORD pAddr, DWORD pFunc, DWORD dwLen)
{
  BYTE *bCode = new BYTE[dwLen];
  ::memset(bCode, 0x90, dwLen);
  DWORD dwFunc = pFunc - (pAddr + 5);

  bCode[0] = bInst;
  *(DWORD *)&bCode[1] = dwFunc;
  WriteBytes((void *)pAddr, bCode, dwLen);

  delete[] bCode;
}

void PatchCall(DWORD dwAddr, DWORD dwFunc, DWORD dwLen)
{
  InterceptLocalCode(INST_CALL, dwAddr, dwFunc, dwLen);
}

void PatchJmp(DWORD dwAddr, DWORD dwFunc, DWORD dwLen)
{
  InterceptLocalCode(INST_JMP, dwAddr, dwFunc, dwLen);
}

void PatchBytes(DWORD dwAddr, DWORD dwValue, DWORD dwLen)
{
  BYTE *bCode = new BYTE[dwLen];
  ::memset(bCode, (BYTE)dwValue, dwLen);

  WriteBytes((LPVOID)dwAddr, bCode, dwLen);

  delete[] bCode;
}

void InstallPatches()
{
  for (unsigned int x = 0; x < ARRAYSIZE(Patches); x++)
  {
    Patches[x].bOldCode = new BYTE[Patches[x].dwLen];
    ::ReadProcessMemory(GetCurrentProcess(), (void *)Patches[x].dwAddr, Patches[x].bOldCode, Patches[x].dwLen, NULL);
    Patches[x].pFunc(Patches[x].dwAddr, Patches[x].dwFunc, Patches[x].dwLen);
  }
}

void InstallConditional()
{
  for (unsigned int x = 0; x < ARRAYSIZE(Conditional); x++)
  {
    if (Conditional[x].enabled == NULL || *Conditional[x].enabled != TRUE)
      continue;

    Conditional[x].bOldCode = new BYTE[Conditional[x].dwLen];
    ::ReadProcessMemory(GetCurrentProcess(), (void *)Conditional[x].dwAddr, Conditional[x].bOldCode, Conditional[x].dwLen, NULL);
    Conditional[x].pFunc(Conditional[x].dwAddr, Conditional[x].dwFunc, Conditional[x].dwLen);
  }
}

void RemovePatches()
{
  for (unsigned int x = 0; x < ARRAYSIZE(Patches); x++)
  {
    WriteBytes((void *)Patches[x].dwAddr, Patches[x].bOldCode, Patches[x].dwLen);
    delete[] Patches[x].bOldCode;
  }
}

void RemoveConditional()
{
  for (unsigned int x = 0; x < ARRAYSIZE(Conditional); x++)
  {
    if (Conditional[x].enabled == NULL || *Conditional[x].enabled != TRUE)
      continue;
    WriteBytes((void *)Conditional[x].dwAddr, Conditional[x].bOldCode, Conditional[x].dwLen);
    delete[] Conditional[x].bOldCode;
  }
}