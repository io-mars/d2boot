#pragma once
#ifndef __JSMENU_H__
#define __JSMENU_H__

#include "JSHelpers.h"

int js_module_menu_init(JSContext *ctx, JSModuleDef *m);
int js_module_menu_export(JSContext *ctx, JSModuleDef *m);

#endif