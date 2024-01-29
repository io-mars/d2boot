#pragma once
#ifndef __JSHELPER_H__
#define __JSHELPER_H__

#include "quickjs/quickjs.h"
#include "quickjs/quickjs-libc.h"
#include "D2Helpers.h"
#include "Helpers.h"

// #define ARRAYSIZE(x) (sizeof(x) / sizeof((x)[0]))

#define DPVIE(ctx, object, name, value) JS_DefinePropertyValueStr(ctx, object, name, JS_NewUint32(ctx, value), JS_PROP_ENUMERABLE)

#define JSAPI_FUNC(name) static JSValue name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv)
#define JSAPI_FUNCM(name) static JSValue name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv, int magic)
#define JSAPI_PGM(name) static JSValue name(JSContext *ctx, JSValueConst this_val, int magic)
#define JSAPI_PSM(name) static JSValue name(JSContext *ctx, JSValueConst this_val, JSValue val, int magic)

#define JS_THROW_ERROR(ctx, ...)             \
  JS_ThrowInternalError(ctx, ##__VA_ARGS__); \
  return JS_EXCEPTION

#define JS_THROW_SINGLE_LINE(ctx, ...)  \
  do                                    \
  {                                     \
    JS_THROW_ERROR(ctx, ##__VA_ARGS__); \
  } while (0)

#define GAME_READY()       \
  if (!WaitForGameReady()) \
  JS_THROW_SINGLE_LINE(ctx, "Game not ready")

JSValue BuildObject(JSContext *ctx, JSClassID classId, void *data = NULL);

void JS_ReportError(JSContext *ctx);
void JS_ReportError(JSContext *ctx, const char *szFormat, ...);
void JS_PromiseTracker(JSContext *ctx, JSValueConst promise, JSValueConst reason, BOOL is_handled, void *opaque);
JSModuleDef *JS_ModuleLoader(JSContext *ctx, const char *module_name, void *opaque);
char *JS_ModuleNormalizeName(JSContext *ctx, const char *base_name, const char *name, void *opaque);

DWORD JS_FillBaseStat(JSContext *ctx, JSValue *argv, int table, int row, int column, const char *szTable, const char *szStat);

int JS_ToUnicodeString(JSContext *ctx, wchar_t **target, JSValueConst val);
JSValue JS_NewUTF8String(JSContext *ctx, const wchar_t *wsVal);

#endif