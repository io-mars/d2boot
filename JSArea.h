#pragma once
#ifndef __JSAREA_H__
#define __JSAREA_H__

#include "JSHelpers.h"

int js_module_area_init(JSContext *ctx, JSModuleDef *m);
int js_module_area_export(JSContext *ctx, JSModuleDef *m);

#endif