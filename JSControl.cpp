
#include "JSControl.h"
#include "Helpers.h"
#include "D2Helpers.h"
#include "Control.h"

struct ControlData
{
  DWORD dwPrivate;
  Control *pControl;
  DWORD dwType;
  DWORD dwX;
  DWORD dwY;
  DWORD dwSizeX;
  DWORD dwSizeY;
};

enum control_id
{
  CONTROL_TEXT,
  CONTROL_X,
  CONTROL_Y,
  CONTROL_XSIZE,
  CONTROL_YSIZE,
  CONTROL_STATE,
  CONTROL_MAXLENGTH,
  CONTROL_TYPE,
  CONTROL_VISIBLE,
  CONTROL_CURSORPOS,
  CONTROL_SELECTSTART,
  CONTROL_SELECTEND,
  CONTROL_PASSWORD,
  CONTROL_DISABLED
};

static JSClassID control_class_id;

static void js_control_finalizer(JSRuntime *rt, JSValue val)
{
  ControlData *pData = (ControlData *)JS_GetOpaque(val, control_class_id);
  if (pData)
  {
    js_free_rt(rt, pData);
  }
}

static JSClassDef js_control_class = {
    "Control",
    .finalizer = js_control_finalizer,
};

static JSValue js_control_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_PGM(control_getProperty)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  ControlData *pData = (ControlData *)JS_GetOpaque(this_val, control_class_id);
  if (!pData)
    return JS_FALSE;

  Control *ctrl = findControl(pData->dwType, (const wchar_t *)NULL, -1, pData->dwX, pData->dwY, pData->dwSizeX, pData->dwSizeY);
  if (!ctrl)
    return JS_FALSE;

  switch (magic)
  {
  case CONTROL_TEXT:
    if (ctrl->dwIsCloaked != 33)
    {
      return JS_NewUTF8String(ctx, ctrl->dwType == CONTROL_BUTTON ? ctrl->wText2 : ctrl->wText);
    }
    break;
  case CONTROL_X:
    return JS_NewUint32(ctx, ctrl->dwPosX);
    break;
  case CONTROL_Y:
    return JS_NewUint32(ctx, ctrl->dwPosY);
    break;
  case CONTROL_XSIZE:
    return JS_NewUint32(ctx, ctrl->dwSizeX);
    break;
  case CONTROL_YSIZE:
    return JS_NewUint32(ctx, ctrl->dwSizeY);
    break;
  case CONTROL_STATE:
    return JS_NewUint32(ctx, (ctrl->dwDisabled - 2));
    break;
  case CONTROL_MAXLENGTH:
    // JS_NewNumberValue(cx, ctrl->dwMaxLength, vp);
    break;
  case CONTROL_TYPE:
    return JS_NewUint32(ctx, ctrl->dwType);
    break;
  case CONTROL_VISIBLE:
    // nothing to do yet because we don't know what to do
    break;
  case CONTROL_CURSORPOS:
    return JS_NewUint32(ctx, ctrl->dwCursorPos);
    break;
  case CONTROL_SELECTSTART:
    return JS_NewUint32(ctx, ctrl->dwSelectStart);
    break;
  case CONTROL_SELECTEND:
    return JS_NewUint32(ctx, ctrl->dwSelectEnd);
    break;
  case CONTROL_PASSWORD:
    return JS_NewBool(ctx, !!(ctrl->dwIsCloaked == 33));
    break;
  case CONTROL_DISABLED:
    return JS_NewUint32(ctx, ctrl->dwDisabled);
    break;
  }
  return JS_FALSE;
}

JSAPI_PSM(control_setProperty)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  ControlData *pData = (ControlData *)JS_GetOpaque(this_val, control_class_id); // JS_THIS_OBJECT(cx, &vp.get())));
  if (!pData)
    return JS_FALSE;

  Control *ctrl = findControl(pData->dwType, (const wchar_t *)NULL, -1, pData->dwX, pData->dwY, pData->dwSizeX, pData->dwSizeY);
  if (!ctrl)
    return JS_FALSE;

  switch (magic)
  {
  case CONTROL_TEXT:
    if (ctrl->dwType == 1 && JS_IsString(val))
    {
      wchar_t *szwText = nullptr;
      JS_ToUnicodeString(ctx, &szwText, val);
      if (!szwText)
        return JS_FALSE;
      D2WIN_SetControlText(ctrl, szwText);
      free(szwText);
      return JS_TRUE;
    }
    break;
  case CONTROL_STATE:
    if (JS_IsNumber(val))
    {
      uint32_t nState;
      if (JS_ToUint32(ctx, &nState, val) < 0 || nState < 0 || nState > 3)
        JS_THROW_SINGLE_LINE(ctx, "Invalid state value");

      memset((void *)&ctrl->dwDisabled, (nState + 2), sizeof(DWORD));
      return JS_TRUE;
    }
    break;
  case CONTROL_CURSORPOS:
    if (JS_IsNumber(val))
    {
      uint32_t dwPos;
      if (JS_ToUint32(ctx, &dwPos, val) < 0)
        JS_THROW_SINGLE_LINE(ctx, "Invalid cursor position value");

      memset((void *)&ctrl->dwCursorPos, dwPos, sizeof(DWORD));
      return JS_TRUE;
    }
    break;
  case CONTROL_DISABLED:
    if (JS_IsNumber(val))
    {
      uint32_t dwDisabled;
      JS_ToUint32(ctx, &dwDisabled, val);
      memset((void *)&ctrl->dwDisabled, dwDisabled, sizeof(DWORD));
      return JS_TRUE;
    }
    break;
  }

  return JS_TRUE;
}

JSAPI_FUNC(control_getNext)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  ControlData *pData = (ControlData *)JS_GetOpaque(this_val, control_class_id);
  if (!pData)
    return JS_FALSE;

  Control *pControl = findControl(pData->dwType, (const wchar_t *)NULL, -1, pData->dwX, pData->dwY, pData->dwSizeX, pData->dwSizeY);
  if (pControl && pControl->pNext)
    pControl = pControl->pNext;
  else
    pControl = nullptr;

  if (pControl)
  {
    pData->pControl = pControl;
    pData->dwType = pData->pControl->dwType;
    pData->dwX = pData->pControl->dwPosX;
    pData->dwY = pData->pControl->dwPosY;
    pData->dwSizeX = pData->pControl->dwSizeX;
    pData->dwSizeY = pData->pControl->dwSizeY;

    JS_SetOpaque(this_val, pData);
    return JS_TRUE;
  }

  return JS_FALSE;
}

JSAPI_FUNC(control_click)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  ControlData *pData = (ControlData *)JS_GetOpaque(this_val, control_class_id);
  if (!pData)
    return JS_FALSE;

  Control *pControl = findControl(pData->dwType, (const wchar_t *)NULL, -1, pData->dwX, pData->dwY, pData->dwSizeX, pData->dwSizeY);
  if (!pControl)
    return JS_FALSE;

  uint32_t x = (uint32_t)-1, y = (uint32_t)-1;

  if (argc > 1 && JS_IsNumber(argv[0]) && JS_IsNumber(argv[1]))
  {
    JS_ToUint32(ctx, &x, argv[0]);
    JS_ToUint32(ctx, &y, argv[1]);
    clickControl(pControl, x, y);
    return JS_TRUE;
  }

  clickControl(pControl, x, y);
  return JS_TRUE;
}

JSAPI_FUNC(control_setText)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  ControlData *pData = (ControlData *)JS_GetOpaque(this_val, control_class_id);
  if (!pData)
    return JS_FALSE;

  Control *pControl = findControl(pData->dwType, (const wchar_t *)NULL, -1, pData->dwX, pData->dwY, pData->dwSizeX, pData->dwSizeY);
  if (!pControl)
    return JS_FALSE;

  if (argc < 0 || !JS_IsString(argv[0]))
    return JS_FALSE;

  wchar_t *szwText = nullptr;
  JS_ToUnicodeString(ctx, &szwText, argv[0]);
  if (!szwText)
    return JS_FALSE;

  D2WIN_SetControlText(pControl, szwText);
  free(szwText);
  return JS_TRUE;
}

JSAPI_FUNC(control_getText)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  ControlData *pData = (ControlData *)JS_GetOpaque(this_val, control_class_id);
  if (!pData)
    return JS_FALSE;

  Control *pControl = findControl(pData->dwType, (const wchar_t *)NULL, -1, pData->dwX, pData->dwY, pData->dwSizeX, pData->dwSizeY);
  if (!pControl)
    return JS_FALSE;

  if (pControl->dwType != 4 || !pControl->pFirstText)
    return JS_FALSE;

  JSValue returnArray = JS_NewArray(ctx);
  int nArrayCount = 0;

  for (ControlText *pText = pControl->pFirstText; pText; pText = pText->pNext)
  {
    if (!pText->wText[0])
      continue;

    if (pText->wText[1])
    {
      JSValue subArray = JS_NewArray(ctx);

      for (int i = 0; i < 5; i++)
      {
        if (pText->wText[i])
        {
          JSValue aString = JS_NewUTF8String(ctx, pText->wText[i]);
          JS_DefinePropertyValueUint32(ctx, subArray, i, aString, JS_PROP_C_W_E);
        }
      }

      JS_DefinePropertyValueUint32(ctx, returnArray, nArrayCount, subArray, JS_PROP_C_W_E);
    }
    else
    {
      JSValue aString = JS_NewUTF8String(ctx, pText->wText[0]);
      JS_DefinePropertyValueUint32(ctx, returnArray, nArrayCount, aString, JS_PROP_C_W_E);
    }

    nArrayCount++;
  }
  return returnArray;
}

JSAPI_FUNC(my_getControl)
{
  if (ClientState() != ClientStateMenu)
    return JS_FALSE;

  uint32_t nType = -1, nX = -1, nY = -1, nXSize = -1, nYSize = -1;
  uint32_t *args[] = {&nType, &nX, &nY, &nXSize, &nYSize};

  for (int i = 0; i < argc; i++)
    if (JS_IsNumber(argv[i]))
      JS_ToUint32(ctx, args[i], argv[i]);

  Control *pControl = findControl(nType, (const wchar_t *)NULL, -1, nX, nY, nXSize, nYSize);
  if (!pControl)
    return JS_FALSE;

  ControlData *data = (ControlData *)js_mallocz(ctx, sizeof(*data));
  data->dwType = pControl->dwType;
  data->dwX = pControl->dwPosX;
  data->dwY = pControl->dwPosY;
  data->dwSizeX = pControl->dwSizeX;
  data->dwSizeY = pControl->dwSizeY;
  data->pControl = pControl;

  JSValue control = BuildObject(ctx, control_class_id, data);
  if (JS_IsException(control))
  {
    js_free(ctx, data);
    data = nullptr;
    JS_THROW_ERROR(ctx, "Failed to build control!");
  }

  return control;
}

JSAPI_FUNC(my_getControls)
{
  if (ClientState() != ClientStateMenu)
    return JS_TRUE;

  DWORD dwArrayCount = 0;

  JSValue returnArray = JS_NewArray(ctx);

  for (Control *pControl = *p_D2WIN_FirstControl; pControl; pControl = pControl->pNext)
  {
    ControlData *data = nullptr;
    data = (ControlData *)js_mallocz(ctx, sizeof(*data));
    data->dwType = pControl->dwType;
    data->dwX = pControl->dwPosX;
    data->dwY = pControl->dwPosY;
    data->dwSizeX = pControl->dwSizeX;
    data->dwSizeY = pControl->dwSizeY;
    data->pControl = pControl;

    JSValue res = BuildObject(ctx, control_class_id, data);
    JS_DefinePropertyValueUint32(ctx, returnArray, dwArrayCount, res, JS_PROP_C_W_E);

    dwArrayCount++;
  }
  return returnArray;
}

static const JSCFunctionListEntry js_control_module_funcs[] = {
    JS_CFUNC_DEF("getControl", 0, my_getControl),
    JS_CFUNC_DEF("getControls", 0, my_getControls),
};

static const JSCFunctionListEntry js_control_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("text", control_getProperty, control_setProperty, CONTROL_TEXT),
    JS_CGETSET_MAGIC_DEF("x", control_getProperty, NULL, CONTROL_X),
    JS_CGETSET_MAGIC_DEF("y", control_getProperty, NULL, CONTROL_Y),
    JS_CGETSET_MAGIC_DEF("xsize", control_getProperty, NULL, CONTROL_XSIZE),
    JS_CGETSET_MAGIC_DEF("ysize", control_getProperty, NULL, CONTROL_YSIZE),
    JS_CGETSET_MAGIC_DEF("state", control_getProperty, control_setProperty, CONTROL_STATE),
    JS_CGETSET_MAGIC_DEF("password", control_getProperty, NULL, CONTROL_PASSWORD),
    JS_CGETSET_MAGIC_DEF("maxlength", control_getProperty, NULL, CONTROL_MAXLENGTH),
    JS_CGETSET_MAGIC_DEF("type", control_getProperty, NULL, CONTROL_TYPE),
    JS_CGETSET_MAGIC_DEF("visible", control_getProperty, NULL, CONTROL_VISIBLE),
    JS_CGETSET_MAGIC_DEF("cursorpos", control_getProperty, control_setProperty, CONTROL_CURSORPOS),
    JS_CGETSET_MAGIC_DEF("selectstart", control_getProperty, NULL, CONTROL_SELECTSTART),
    JS_CGETSET_MAGIC_DEF("selectend", control_getProperty, NULL, CONTROL_SELECTEND),
    JS_CGETSET_MAGIC_DEF("disabled", control_getProperty, control_setProperty, CONTROL_DISABLED),

    JS_CFUNC_DEF("getNext", 0, control_getNext),
    JS_CFUNC_DEF("click", 0, control_click),
    JS_CFUNC_DEF("setText", 1, control_setText),
    JS_CFUNC_DEF("getText", 0, control_getText),
};

int js_module_control_init(JSContext *ctx, JSModuleDef *m)
{
  JS_NewClassID(&control_class_id);
  JS_NewClass(JS_GetRuntime(ctx), control_class_id, &js_control_class);

  JSValue control_proto, control_class;
  control_proto = JS_NewObject(ctx);
  control_class = JS_NewCFunction2(ctx, js_control_ctor, "Control", 0, JS_CFUNC_constructor, 0);
  JS_SetPropertyFunctionList(ctx, control_proto, js_control_proto_funcs, ARRAYSIZE(js_control_proto_funcs));

  JS_SetConstructor(ctx, control_class, control_proto);
  JS_SetClassProto(ctx, control_class_id, control_proto);

  JS_SetModuleExport(ctx, m, "Control", control_class);
  JS_SetModuleExportList(ctx, m, js_control_module_funcs, ARRAYSIZE(js_control_module_funcs));
  return TRUE;
}

int js_module_control_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_control_module_funcs, ARRAYSIZE(js_control_module_funcs));
  JS_AddModuleExport(ctx, m, "Control");
  return TRUE;
}
