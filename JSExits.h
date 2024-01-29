#pragma once
#ifndef __JSEXITS_H__
#define __JSEXITS_H__

#include "JSHelpers.h"

struct myExit
{
  DWORD x;
  DWORD y;
  DWORD id;
  DWORD type;
  DWORD tileid;
  DWORD level;
};

int js_module_exit_init(JSContext *ctx, JSModuleDef *m);
int js_module_exit_export(JSContext *ctx, JSModuleDef *m);

#endif