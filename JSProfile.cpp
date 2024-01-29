#include "JSProfile.h"

#include "Profile.h"
#include "Helpers.h"

enum profile_id
{
  PROFILE_TYPE,
  PROFILE_IP,
  PROFILE_USERNAME,
  PROFILE_GATEWAY,
  PROFILE_CHARACTER,
  PROFILE_DIFFICULTY,
  PROFILE_MAXLOGINTIME,
  PROFILE_MAXCHARSELTIME
};

static JSClassID profile_class_id;

static void js_profile_finalizer(JSRuntime *rt, JSValue val)
{
  Profile *profile = (Profile *)JS_GetOpaque(val, profile_class_id);
  if (profile)
  {
    delete profile;
  }
}

static JSClassDef js_profile_class = {
    "Profile",
    .finalizer = js_profile_finalizer,
};

static JSValue js_profile_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  Profile *prof = nullptr;
  // ProfileType pt;
  wchar_t *str1;
  wchar_t *str2;
  wchar_t *str3;
  wchar_t *str4;
  uint32_t uType = -1;
  uint32_t uDiff = -1;
  // unsigned int i;

  str1 = str2 = str3 = str4 = nullptr;
  // pt = PROFILETYPE_INVALID;

  try
  {
    // Profile()
    if (argc == 0)
    {
      if (wcslen(Vars.szProfile) > 0)
        prof = new Profile();
      else
        JS_THROW_SINGLE_LINE(ctx, "No active profile!");
    }
    // Profile(name) - get the named profile
    else if (argc == 1 && JS_IsString(argv[0]))
    {
      JS_ToUnicodeString(ctx, &str1, argv[0]);
      prof = new Profile(str1);
      free(str1);
    }
    // Profile(ProfileType.singlePlayer, charname, diff)
    else if (argc == 3 && JS_IsNumber(argv[0]))
    {
      JS_ToUint32(ctx, &uType, argv[0]);
      JS_ToUnicodeString(ctx, &str1, argv[1]);
      switch (uType)
      {
      case PROFILETYPE_SINGLEPLAYER:
        JS_ToUint32(ctx, &uDiff, argv[2]);
        prof = new Profile(PROFILETYPE_SINGLEPLAYER, str1, uDiff);
        break;

      case PROFILETYPE_TCPIP_HOST:
        JS_ToUint32(ctx, &uDiff, argv[2]);
        prof = new Profile(PROFILETYPE_TCPIP_HOST, str1, uDiff);
        break;
      case PROFILETYPE_TCPIP_JOIN:
      {
        // Profile(ProfileType.tcpIpJoin, charname, ip)
        JS_ToUnicodeString(ctx, &str2, argv[2]);
        prof = new Profile(PROFILETYPE_TCPIP_JOIN, str1, str2);
        free(str2);
      }
      break;
      }
      free(str1);
    }
    // Profile(ProfileType.battleNet, account, pass, charname, gateway)
    else if (argc == 5 && JS_IsNumber(argv[0]))
    {
      JS_ToUint32(ctx, &uType, argv[0]);
      JS_ToUnicodeString(ctx, &str1, argv[1]);
      JS_ToUnicodeString(ctx, &str2, argv[2]);
      JS_ToUnicodeString(ctx, &str3, argv[3]);
      JS_ToUnicodeString(ctx, &str4, argv[4]);

      switch (uType)
      {
      case PROFILETYPE_BATTLENET:
        prof = new Profile(PROFILETYPE_BATTLENET, str1, str2, str3, str4);
        break;

      case PROFILETYPE_OPEN_BATTLENET:
        prof = new Profile(PROFILETYPE_OPEN_BATTLENET, str1, str2, str3, str4);
        break;
      }

      free(str1);
      free(str2);
      free(str3);
      free(str4);
    }
    else
      JS_THROW_SINGLE_LINE(ctx, "Invalid parameters.");
  }
  catch (char *ex)
  {
    JS_THROW_ERROR(ctx, ex);
  }

  JSValue obj = BuildObject(ctx, profile_class_id, prof);
  if (JS_IsException(obj))
  {
    delete prof;
    prof = nullptr;
    JS_THROW_ERROR(ctx, "Failed to create profile object");
  }

  return obj;
}

JSAPI_FUNC(profile_login)
{
  char *error;
  Profile *prof;

  prof = (Profile *)JS_GetOpaque(this_val, profile_class_id);

  if (prof->login(&error) != 0)
    JS_THROW_SINGLE_LINE(ctx, error);

  return JS_TRUE;
}

JSAPI_PGM(profile_getProperty)
{
  Profile *prof;

  prof = (Profile *)JS_GetOpaque(this_val, profile_class_id);

  switch (magic)
  {
  case PROFILE_TYPE:
    return JS_NewUint32(ctx, prof->type);
    break;
  case PROFILE_IP:
    return JS_NewUTF8String(ctx, prof->ip);
    break;
  case PROFILE_USERNAME:
    return JS_NewUTF8String(ctx, prof->username);
    break;
  case PROFILE_GATEWAY:
    return JS_NewUTF8String(ctx, prof->gateway);
    break;
  case PROFILE_CHARACTER:
    return JS_NewUTF8String(ctx, prof->charname);
    break;
  case PROFILE_DIFFICULTY:
    return JS_NewUint32(ctx, prof->diff);
    break;
  case PROFILE_MAXLOGINTIME:
    return JS_NewUint32(ctx, prof->maxLoginTime);
    break;
  case PROFILE_MAXCHARSELTIME:
    return JS_NewUint32(ctx, prof->maxCharTime);
    break;
  }

  return JS_TRUE;
}

static const JSCFunctionListEntry js_profile_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("type", profile_getProperty, NULL, PROFILE_TYPE),
    JS_CGETSET_MAGIC_DEF("ip", profile_getProperty, NULL, PROFILE_IP),
    JS_CGETSET_MAGIC_DEF("username", profile_getProperty, NULL, PROFILE_USERNAME),
    JS_CGETSET_MAGIC_DEF("gateway", profile_getProperty, NULL, PROFILE_GATEWAY),
    JS_CGETSET_MAGIC_DEF("character", profile_getProperty, NULL, PROFILE_CHARACTER),
    JS_CGETSET_MAGIC_DEF("difficulty", profile_getProperty, NULL, PROFILE_DIFFICULTY),
    JS_CGETSET_MAGIC_DEF("maxLoginTime", profile_getProperty, NULL, PROFILE_MAXLOGINTIME),
    JS_CGETSET_MAGIC_DEF("maxCharacterSelectTime", profile_getProperty, NULL, PROFILE_MAXCHARSELTIME),
    JS_CFUNC_DEF("login", 0, profile_login),
};

int js_module_profile_init(JSContext *ctx, JSModuleDef *m)
{
  JSValue profile_proto, profile_class;

  /* create the Room class */
  JS_NewClassID(&profile_class_id);
  JS_NewClass(JS_GetRuntime(ctx), profile_class_id, &js_profile_class);

  profile_proto = JS_NewObject(ctx);
  profile_class = JS_NewCFunction2(ctx, js_profile_ctor, "Profile", 0, JS_CFUNC_constructor, 0);
  JS_SetPropertyFunctionList(ctx, profile_proto, js_profile_proto_funcs, ARRAYSIZE(js_profile_proto_funcs));

  JS_SetConstructor(ctx, profile_class, profile_proto);
  JS_SetClassProto(ctx, profile_class_id, profile_proto);

  JS_SetModuleExport(ctx, m, "Profile", profile_class);

  return TRUE;
}

int js_module_profile_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExport(ctx, m, "Profile");

  return TRUE;
}
