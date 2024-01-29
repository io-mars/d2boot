#ifndef _COMMANDLINE_H
#define _COMMANDLINE_H

#include <windows.h>

#define PARAM_SIZE 20
#define VALUE_SIZE 60

struct sLine
{
	WCHAR Param[PARAM_SIZE];
	BOOL isBool;
	WCHAR szText[VALUE_SIZE];
};

void ParseCommandLine(LPCWSTR Command);
sLine *GetCommand(LPCWSTR Param);
void FreeCommandLine();

#endif