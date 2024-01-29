#pragma once
#ifndef __JSSCREENHOOK_H__
#define __JSSCREENHOOK_H__

#include "JSHelpers.h"

int js_module_hook_init(JSContext *ctx, JSModuleDef *m);
int js_module_hook_export(JSContext *ctx, JSModuleDef *m);

#endif