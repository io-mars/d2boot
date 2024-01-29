#pragma once
#ifndef __MPQSTATS_H__
#define __MPQSTATS_H__

#include <windows.h>

// Information taken from
// http://phrozenkeep.planetdiablo.gamespy.com/forum/viewtopic.php?t=48175

static DWORD d2CommonOff = GetModuleHandle(L"D2Common.DLL") ? (DWORD)GetModuleHandle(L"D2Common.DLL") : (DWORD)LoadLibrary(L"D2Common.DLL");
enum fieldtype_id
{
	FIELDTYPE_END = 0,
	FIELDTYPE_DATA_ASCII = 1,
	FIELDTYPE_DATA_DWORD = 2,
	FIELDTYPE_DATA_WORD = 3,
	FIELDTYPE_DATA_BYTE = 4,
	FIELDTYPE_UNKNOWN_5 = 5,
	FIELDTYPE_DATA_BYTE_2 = 6,
	FIELDTYPE_DATA_DWORD_2 = 8,
	FIELDTYPE_DATA_RAW = 9,
	FIELDTYPE_ASCII_TO_CODE = 10,
	FIELDTYPE_UNKNOWN_11 = 11,
	FIELDTYPE_UNKNOWN_12 = 12,
	FIELDTYPE_CODE_TO_BYTE = 13,
	FIELDTYPE_UNKNOWN_14 = 14,
	FIELDTYPE_CODE_TO_WORD = 15,
	FIELDTYPE_UNKNOWN_16 = 16,
	FIELDTYPE_NAME_TO_INDEX = 17,
	FIELDTYPE_NAME_TO_INDEX_2 = 18,
	FIELDTYPE_NAME_TO_DWORD = 19,
	FIELDTYPE_NAME_TO_WORD = 20,
	FIELDTYPE_NAME_TO_WORD_2 = 21,
	FIELDTYPE_KEY_TO_WORD = 22,
	FIELDTYPE_MONSTER_COMPS = 23,
	FIELDTYPE_UNKNOWN_24 = 24,
	FIELDTYPE_CALC_TO_DWORD = 25,
	FIELDTYPE_DATA_BIT = 26,
};

struct BinField
{
	char szFieldName[64];
	DWORD eFieldType;
	DWORD dwFieldLength;
	DWORD dwFieldOffset;
};

struct MPQTable
{
	DWORD dwEntry;						// if > 0xFFFF it is not located in the exported mpq data..
	DWORD dwMaxEntriesOffset; // ""
	BinField *pTable;
	char szTableName[15];
	WORD wTableSize;
	WORD wUnknown;
};

DWORD GetBaseTable(int nBaseStat, int nClassId);
bool FillBaseStat(const char *szTable, int row, const char *szStat, void *result, size_t size);
bool FillBaseStat(const char *szTable, int row, int column, void *result, size_t size);
bool FillBaseStat(int table, int row, const char *szStat, void *result, size_t size);
bool FillBaseStat(int table, int row, int column, void *result, size_t size);

#endif