#pragma once
#ifndef __JSBOOT_H__
#define __JSBOOT_H__

#include "JSHelpers.h"

JSModuleDef *js_init_module_boot(JSContext *ctx, const char *module_name);

#endif