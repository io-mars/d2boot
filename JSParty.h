#pragma once
#ifndef __JSPARTY_H__
#define __JSPARTY_H__

#include "JSHelpers.h"

int js_module_party_init(JSContext *ctx, JSModuleDef *m);
int js_module_party_export(JSContext *ctx, JSModuleDef *m);

#endif