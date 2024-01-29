#pragma once
#ifndef __JSUNIT_H__
#define __JSUNIT_H__

#include "JSHelpers.h"

struct Private
{
  DWORD dwPrivateType;
};

struct myUnit : Private
{
  DWORD dwUnitId;
  DWORD dwClassId;
  DWORD dwType;
  DWORD dwMode;
  char szName[128];
};

struct invUnit : myUnit
{
  DWORD dwOwnerId;
  DWORD dwOwnerType;
};

int js_module_unit_init(JSContext *ctx, JSModuleDef *m);
int js_module_unit_export(JSContext *ctx, JSModuleDef *m);

#endif