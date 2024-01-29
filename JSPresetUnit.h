#pragma once
#ifndef __JSPRESETUNIT_H__
#define __JSPRESETUNIT_H__

#include "JSHelpers.h"

int js_module_presetunit_init(JSContext *ctx, JSModuleDef *m);
int js_module_presetunit_export(JSContext *ctx, JSModuleDef *m);

#endif