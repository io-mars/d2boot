#pragma once
#ifndef __JSCONTROL_H__
#define __JSCONTROL_H__

#include "JSHelpers.h"

int js_module_control_init(JSContext *ctx, JSModuleDef *m);
int js_module_control_export(JSContext *ctx, JSModuleDef *m);

#endif