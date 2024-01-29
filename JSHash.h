#pragma once
#ifndef __JSHASH_H__
#define __JSHASH_H__

#include "JSHelpers.h"

int js_module_hash_init(JSContext *ctx, JSModuleDef *m);
int js_module_hash_export(JSContext *ctx, JSModuleDef *m);

#endif