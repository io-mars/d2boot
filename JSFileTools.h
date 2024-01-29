#pragma once
#ifndef __JSFILETOOLS_H__
#define __JSFILETOOLS_H__

#include "JSHelpers.h"

int js_module_filetools_init(JSContext *ctx, JSModuleDef *m);
int js_module_filetools_export(JSContext *ctx, JSModuleDef *m);
bool isValidPath(const wchar_t *name);

#endif