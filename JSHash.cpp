#include <stdio.h>
#include "JSHash.h"
#include "Hash.h"

enum HashId
{
  MD5,
  SHA1,
  SHA256,
  SHA384,
  SHA512
};

static JSClassID hash_class_id;

static JSClassDef js_hash_class = {
    "Hash",
};

static JSValue js_hash_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_FUNCM(hash_string)
{
  if (argc != 1)
    JS_THROW_SINGLE_LINE(ctx, "Invalid arguments");

  const char *input = JS_ToCString(ctx, argv[0]);
  char *result = nullptr;

  switch (magic)
  {
  case MD5:
    result = md5(input);
    break;
  case SHA1:
    result = sha1(input);
    break;
  case SHA256:
    result = sha256(input);
    break;
  case SHA384:
    result = sha384(input);
    break;
  case SHA512:
    result = sha512(input);
    break;
  default:
    JS_THROW_SINGLE_LINE(ctx, "Invalid algorithm id");
    break;
  }

  JS_FreeCString(ctx, input);

  JSValue val = JS_FALSE;

  if (result && result[0])
    val = JS_NewString(ctx, result);

  delete[] result;

  return val;
}

static const JSCFunctionListEntry js_hash_funcs[] = {
    JS_CFUNC_MAGIC_DEF("md5", 1, hash_string, MD5),
    JS_CFUNC_MAGIC_DEF("sha1", 1, hash_string, SHA1),
    JS_CFUNC_MAGIC_DEF("sha256", 1, hash_string, SHA256),
    JS_CFUNC_MAGIC_DEF("sha384", 1, hash_string, SHA384),
    JS_CFUNC_MAGIC_DEF("sha512", 1, hash_string, SHA512),
};

int js_module_hash_init(JSContext *ctx, JSModuleDef *m)
{
  /* create the party class */
  JS_NewClassID(&hash_class_id);
  JS_NewClass(JS_GetRuntime(ctx), hash_class_id, &js_hash_class);

  JSValue hash_proto, hash_class;
  hash_proto = JS_NewObject(ctx);
  hash_class = JS_NewCFunction2(ctx, js_hash_ctor, "Hash", 0, JS_CFUNC_constructor, 0);
  // only set class function
  JS_SetPropertyFunctionList(ctx, hash_class, js_hash_funcs, ARRAYSIZE(js_hash_funcs));

  JS_SetConstructor(ctx, hash_class, hash_proto);
  JS_SetClassProto(ctx, hash_class_id, hash_proto);

  JS_SetModuleExport(ctx, m, "Hash", hash_class);
  return TRUE;
}

int js_module_hash_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExport(ctx, m, "Hash");

  return TRUE;
}
