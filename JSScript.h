#pragma once
#ifndef __JSSCRIPT_H__
#define __JSSCRIPT_H__

#include "JSHelpers.h"

int js_module_script_init(JSContext *ctx, JSModuleDef *m);
int js_module_script_export(JSContext *ctx, JSModuleDef *m);

#endif