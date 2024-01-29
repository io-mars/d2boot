#pragma once
#ifndef __JSROOM_H__
#define __JSROOM_H__

#include "JSHelpers.h"

int js_module_room_init(JSContext *ctx, JSModuleDef *m);
int js_module_room_export(JSContext *ctx, JSModuleDef *m);

#endif