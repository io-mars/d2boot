#pragma once

#include "Offset.h"
#include "D2Intercepts.h"
#include "D2Handlers.h"
#include "D2Boot.h"

PatchHook Patches[] = {
    {PatchCall, GetDllOffset(L"D2Client.dll", 0xB2342), (DWORD)GameInput_Intercept, 5}, // 1.13d
    {PatchJmp, GetDllOffset(L"D2Client.dll", 0x1D7B4), (DWORD)GameDraw_Intercept, 6},   // 1.13d

    {PatchCall, GetDllOffset(L"D2Client.dll", 0x83301), (DWORD)GamePacketReceived_Intercept, 5}, // 1.13d
    {PatchJmp, GetDllOffset(L"D2Client.dll", 0xD13C), (DWORD)GamePacketSent_Interception, 6},

    {PatchCall, GetDllOffset(L"D2Client.dll", 0x2B494), (DWORD)GetSelectedUnit_Intercept, 5}, // 1.13d
    {PatchJmp, GetDllOffset(L"D2Client.dll", 0x84417), (DWORD)PlayerAssignment_Intercept, 5}, // 1.13d

    {PatchBytes, GetDllOffset(L"D2Client.dll", 0x14630), (DWORD)0xc3, 1},                   // Chapter of ACT Screen? 1.13d
    {PatchCall, GetDllOffset(L"D2Client.dll", 0x1B047), (DWORD)GameActChange_Intercept, 5}, // 1.13d
    {PatchJmp, GetDllOffset(L"D2Client.dll", 0x1B474), (DWORD)GameActChange2_Intercept, 5}, // 1.13d

    // {PatchBytes, GetDllOffset(L"D2CLIENT.DLL", 0x4EBFB), (BYTE)0x75, 1},  // Congrats Screen 1.14d
    // {PatchCall, GetDllOffset(L"D2Client.dll", 0x4EBEF), (DWORD)CongratsScreen_Intercept, 5}, // Updated 1.14d //0044EBEF-BASE

    {PatchCall, GetDllOffset(L"D2Client.dll", 0x461AD), (DWORD)GameLeave_Intercept, 5},  // 1.13d
    {PatchCall, GetDllOffset(L"D2Client.dll", 0x29560), (DWORD)GameAttack_Intercept, 5}, // 1.13d

    //	{PatchCall,	GetDllOffset("D2Client.dll", 0xA7364),	(DWORD)AddUnit_Intercept,				5},
    //	{PatchCall,	GetDllOffset("D2Client.dll", 0xA6F25),	(DWORD)RemoveUnit_Intercept,			9},

    // this patch needs a constant in ChatPacketRecv_Interception updated also
    {PatchCall, GetDllOffset(L"BNCLIENT.DLL", 0xCEB9), (DWORD)ChatPacketRecv_Interception, 5},

    {PatchCall, GetDllOffset(L"D2Multi.dll", 0x142FC), (DWORD)Whisper_Intercept, 7},      // 1.13d
    {PatchCall, GetDllOffset(L"D2Multi.dll", 0x11D63), (DWORD)ChannelInput_Intercept, 5}, // 1.13d

    {PatchCall, GetDllOffset(L"D2Win.dll", 0xEC68), (DWORD)GameDrawOOG_Intercept, 5}, // 1.13d

    {PatchCall, GetDllOffset(L"D2CMP.dll", 0x14CD5), (DWORD)GameCrashFix_Intercept, 10}, // 1.13d
    {PatchCall, GetDllOffset(L"Fog.dll", 0xDE51), (DWORD)LogMessageBoxA_Intercept, 6},
};

PatchHook Conditional[] = {
    {PatchJmp, GetDllOffset(L"BNCLIENT.DLL", 0x15EB3), (DWORD)ClassicSTUB, 5, &Vars.bUseRawCDKey},
    {PatchJmp, GetDllOffset(L"BNCLIENT.DLL", 0x161B8), (DWORD)LodSTUB, 5, &Vars.bUseRawCDKey},

    // 1.13d the game.exe dont load d2gfx.dll when create process, so have to use d2m.dll for multi
    // {PatchCall, GetDllOffset(L"D2CLIENT.dll", 0x443FE), (DWORD)FailToJoin_Interception, 6, &Vars.bReduceFTJ}, // FTJ Reducer  1.13d
    // {PatchCall, GetDllOffset(L"D2Gfx.DLL", 0xB6A8), (DWORD)Multi, 6, &Vars.bMulti},                           // 1.13d
    // {PatchCall, GetDllOffset(L"D2Gfx.DLL", 0xB8D9), (DWORD)Windowname, 6, &Vars.bMulti},                      // 1.13d
    // // {PatchJmp, GetDllOffset(L"D2Launch.dll", 0x10B03), (DWORD)InitMainMenu, 5},                               // 1.13d
    // //
    // {PatchCall, GetDllOffset(L"BNCLIENT.dll", 0xF494), (DWORD)CacheFix, 6, &Vars.bCacheFix}, // 1.13d
    // {PatchCall, GetDllOffset(L"BNCLIENT.dll", 0xF7E4), (DWORD)CacheFix, 6, &Vars.bCacheFix}, // 1.13d

    {PatchBytes, GetDllOffset(L"D2CLIENT.dll", 0x27713), (WORD)0x9090, 2, &Vars.bSleepy}, // Sleep // 1.13d
    {PatchBytes, GetDllOffset(L"D2Win.DLL", 0xEDAF), (BYTE)0xEB, 1, &Vars.bSleepy},       // OOG Sleep // 1.13d

    {PatchBytes, GetDllOffset(L"D2MCPCLIENT.dll", 0x61E0), (DWORD)0xc3, 1}, // RD Blocker  1.13d
};