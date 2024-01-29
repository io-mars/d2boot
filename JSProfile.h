#pragma once
#ifndef __JSPROFILE_H__
#define __JSPROFILE_H__

#include "JSHelpers.h"

int js_module_profile_init(JSContext *ctx, JSModuleDef *m);
int js_module_profile_export(JSContext *ctx, JSModuleDef *m);

#endif