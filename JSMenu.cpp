#include "JSMenu.h"
#include "Control.h"
#include "D2Boot.h"
#include "Profile.h"
#include "Helpers.h"
#include "JSFileTools.h"

// enum menu_id
// {
//   MENU_AREA,
//   MENU_X,
//   MENU_Y,
//   MENU_GID,
//   MENU_LIFE,
//   MENU_NAME,
//   MENU_FLAG,
//   MENU_ID,
//   MENU_CLASSID,
//   MENU_LEVEL
// };

// static JSClassID menu_class_id;

// static void js_menu_finalizer(JSRuntime *rt, JSValue val)
// {
//   JS_SetOpaque(val, nullptr);
//   // RosterUnit *unit = (RosterUnit *)JS_GetOpaque(val, menu_class_id);
//   // js_free_rt(rt, unit);
// }

// static JSClassDef js_menu_class = {
//     "Menu",
//     .finalizer = js_menu_finalizer,
// };

// static JSValue js_menu_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
// {
//   return JS_EXCEPTION;
// }

JSAPI_FUNC(my_login)
{

  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  wchar_t *profile = nullptr;
  char *error;

  if (!JS_IsString(argv[0]))
  {
    if (wcslen(Vars.szProfile) > 0)
    {
      profile = _wcsdup(Vars.szProfile);
    }
    else
      JS_THROW_SINGLE_LINE(ctx, "Invalid profile specified!");
  }
  else
  {
    JS_ToUnicodeString(ctx, &profile, argv[0]);
    wcscpy_s(Vars.szProfile, 256, profile);
  }

  if (!profile)
    JS_THROW_SINGLE_LINE(ctx, "Could not get profile!");

  if (!Profile::ProfileExists(profile))
  {
    free(profile);
    JS_THROW_ERROR(ctx, "Profile does not exist!");
  }

  Profile *prof = new Profile(profile);
  if (prof->login(&error) != 0)
  {
    free(profile);
    delete prof;
    JS_THROW_ERROR(ctx, error);
  }

  free(profile);
  delete prof;

  return JS_TRUE;
}

JSAPI_FUNC(my_selectChar)
{
  if (argc != 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "Invalid parameters specified to selectCharacter");

  wchar_t *profile = nullptr;
  JS_ToUnicodeString(ctx, &profile, argv[0]);

  if (!profile)
    JS_THROW_SINGLE_LINE(ctx, "Could not get profile!");

  if (!Profile::ProfileExists(profile))
  {
    free(profile);
    JS_THROW_ERROR(ctx, "Invalid profile specified");
  }

  wchar_t charname[24], file[_MAX_FNAME + MAX_PATH];
  swprintf_s(file, _countof(file), L"%sD2Boot.ini", Vars.szPath);
  GetPrivateProfileString(profile, L"character", L"ERROR", charname, _countof(file), file);

  free(profile);

  return JS_NewBool(ctx, OOG_SelectCharacter(charname));
}

JSAPI_FUNC(my_createGame)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  if (argc < 3)
    JS_THROW_SINGLE_LINE(ctx, "Invalid arguments specified to createGame");

  wchar_t *name = nullptr, *pass = nullptr;
  uint32_t diff = 0;
  JS_ToUnicodeString(ctx, &name, argv[0]);
  JS_ToUnicodeString(ctx, &pass, argv[1]);
  JS_ToUint32(ctx, &diff, argv[2]);

  if (!pass)
    pass = _wcsdup(L"");

  if (wcslen(name) > 15 || wcslen(pass) > 15)
  {
    free(name);
    free(pass);
    JS_THROW_ERROR(ctx, "Invalid game name or password length");
  }

  if (!OOG_CreateGame(name, pass, diff))
  {
    free(name);
    free(pass);
    JS_THROW_ERROR(ctx, "createGame failed");
  }

  free(name);
  free(pass);
  return JS_TRUE;
}

JSAPI_FUNC(my_joinGame)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  if (argc < 2)
    JS_THROW_SINGLE_LINE(ctx, "Invalid arguments specified to createGame");

  wchar_t *name = nullptr, *pass = nullptr;
  JS_ToUnicodeString(ctx, &name, argv[0]);
  JS_ToUnicodeString(ctx, &pass, argv[1]);

  if (!pass)
    pass = _wcsdup(L"");

  if (wcslen(name) > 15 || wcslen(pass) > 15)
  {
    free(name);
    free(pass);
    JS_THROW_ERROR(ctx, "Invalid game name or password length");
  }

  if (!OOG_JoinGame(name, pass))
  {
    free(name);
    free(pass);
    JS_THROW_ERROR(ctx, "joinGame failed");
  }

  free(name);
  free(pass);
  return JS_TRUE;
}

JSAPI_FUNC(my_addProfile)
{
  if (argc < 6 || argc > 7)
    JS_THROW_SINGLE_LINE(ctx, "Invalid arguments passed to addProfile");

  // validate the args...
  // wchar_t *profile, *mode, *gateway, *username, *password, *charname;
  wchar_t *args[6] = {nullptr};
  for (int i = 0; i < 6; i++)
  {
    if (!JS_IsString(argv[i]))
    {
      JS_THROW_ERROR(ctx, "Invalid argument passed to addProfile");
    }
    else
    {
      JS_ToUnicodeString(ctx, &args[i], argv[i]);
      if (!args[i])
      {
        for (int j = 0; j < i; j++)
        {
          free(args[j]);
          args[j] = nullptr;
        }

        JS_THROW_ERROR(ctx, "Failed to convert string");
      }
    }
  }

  uint32_t spdifficulty = 3;
  if (argc == 7)
    JS_ToUint32(ctx, &spdifficulty, argv[6]);

  if (spdifficulty > 3 || spdifficulty < 0)
  {
    for (int i = 0; i < 6; i++)
    {
      free(args[i]);
      args[i] = nullptr;
    }
    JS_THROW_ERROR(ctx, "Invalid argument passed to addProfile");
  }

  wchar_t file[_MAX_FNAME + _MAX_PATH];
  swprintf_s(file, _countof(file), L"%sD2Boot.ini", Vars.szPath);

  if (!Profile::ProfileExists(args[0]))
  {
    wchar_t settings[600] = L"";
    swprintf_s(settings, _countof(settings), L"mode=%s\tgateway=%s\tusername=%s\tpassword=%s\tcharacter=%s\tspdifficulty=%d\t", args[1], args[2], args[3], args[4],
               args[5], spdifficulty);

    StringReplaceChar(settings, '\t', '\0', 600);
    WritePrivateProfileSection(args[0], settings, file);
  }

  for (int i = 0; i < 6; i++)
  {
    free(args[i]);
    args[i] = nullptr;
  }

  return JS_TRUE;
}

JSAPI_FUNC(my_getOOGLocation)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  return JS_NewUint32(ctx, OOG_GetLocation());
}

JSAPI_FUNC(my_createCharacter)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  if (argc < 4)
    JS_THROW_SINGLE_LINE(ctx, "Invalid arguments specified to createCharacter");

  uint32_t type = -1;
  int hc = -1, ladder = -1;
  wchar_t *name = nullptr;
  JS_ToUnicodeString(ctx, &name, argv[0]);

  JS_ToUint32(ctx, &type, argv[1]);
  hc = JS_ToBool(ctx, argv[2]);
  ladder = JS_ToBool(ctx, argv[3]);

  if (hc == -1 || ladder == -1)
  {
    free(name);
    JS_THROW_ERROR(ctx, "Failed to Convert Args createCharacter");
  }
  JSValue res = JS_NewBool(ctx, !!OOG_CreateCharacter(name, type, !!hc, !!ladder));
  free(name);
  return res;
}

JSAPI_FUNC(my_loadMpq)
{
  wchar_t *path = nullptr;
  JS_ToUnicodeString(ctx, &path, argv[0]);

  if (!isValidPath(path))
  {
    free(path);
    return JS_FALSE;
  }

  LoadMPQ(path);

  free(path);
  return JS_TRUE;
}

static const JSCFunctionListEntry js_menu_module_funcs[] = {
    JS_CFUNC_DEF("login", 1, my_login),
    // MTODO this function is not finished?
    JS_CFUNC_DEF("createCharacter", 4, my_createCharacter),
    JS_CFUNC_DEF("selectCharacter", 1, my_selectChar),
    JS_CFUNC_DEF("createGame", 3, my_createGame),
    JS_CFUNC_DEF("joinGame", 2, my_joinGame),
    JS_CFUNC_DEF("addProfile", 6, my_addProfile),
    JS_CFUNC_DEF("getLocation", 0, my_getOOGLocation),
    JS_CFUNC_DEF("loadMpq", 1, my_loadMpq),

};

int js_module_menu_init(JSContext *ctx, JSModuleDef *m)
{
  // /* create the menu class */
  // JS_NewClassID(&menu_class_id);
  // JS_NewClass(JS_GetRuntime(ctx), menu_class_id, &js_menu_class);

  // JSValue menu_proto, menu_class;
  // menu_proto = JS_NewObject(ctx);
  // menu_class = JS_NewCFunction2(ctx, js_menu_ctor, "Menu", 0, JS_CFUNC_constructor, 0);
  // JS_SetPropertyFunctionList(ctx, menu_proto, js_menu_proto_funcs, ARRAYSIZE(js_menu_proto_funcs));

  // JS_SetConstructor(ctx, menu_class, menu_proto);
  // JS_SetClassProto(ctx, menu_class_id, menu_proto);

  // JS_SetModuleExport(ctx, m, "Menu", menu_class);
  JS_SetModuleExportList(ctx, m, js_menu_module_funcs, ARRAYSIZE(js_menu_module_funcs));
  return TRUE;
}

int js_module_menu_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_menu_module_funcs, ARRAYSIZE(js_menu_module_funcs));
  // JS_AddModuleExport(ctx, m, "Menu");

  return TRUE;
}
