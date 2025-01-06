#include "JSScreenHook.h"
#include "ScreenHook.h"
#include "Script.h"

enum hook_id
{
  TEXT_X,
  TEXT_Y,
  TEXT_COLOR,
  TEXT_FONT,
  TEXT_TEXT,
  TEXT_ALIGN,
  TEXT_VISIBLE,
  TEXT_ONCLICK,
  TEXT_ONHOVER,
  TEXT_ZORDER,

  LINE_X,
  LINE_Y,
  LINE_XSIZE,
  LINE_YSIZE,
  LINE_COLOR,
  LINE_VISIBLE,
  LINE_ONCLICK,
  LINE_ONHOVER,
  LINE_ZORDER,

  BOX_X,
  BOX_Y,
  BOX_XSIZE,
  BOX_YSIZE,
  BOX_COLOR,
  BOX_OPACITY,
  BOX_VISIBLE,
  BOX_ALIGN,
  BOX_ONCLICK,
  BOX_ONHOVER,
  BOX_ZORDER,

  FRAME_X,
  FRAME_Y,
  FRAME_XSIZE,
  FRAME_YSIZE,
  FRAME_VISIBLE,
  FRAME_ALIGN,
  FRAME_ONCLICK,
  FRAME_ONHOVER,
  FRAME_ZORDER,

  IMAGE_X,
  IMAGE_Y,
  IMAGE_COLOR,
  IMAGE_LOCATION,
  IMAGE_ALIGN,
  IMAGE_VISIBLE,
  IMAGE_ONCLICK,
  IMAGE_ONHOVER,
  IMAGE_ZORDER,
};

// MTODO  clickHandler hoverHandler
struct JSHookData
{
  Genhook *hook;
  const Script *script;
  JSValueConst clickHandler;
  JSValueConst hoverHandler;
};

enum HookId
{
  TEXT,
  LINE,
  BOX,
  FRAME,
  IMAGE
};

enum MapAndScreenId
{
  MI_STAM,
  MI_AMTS,
  MI_STW,
  MI_WTS
};

struct JSHookClassDefine
{
  const HookId magic;
  const JSClassDef classDef;
  const JSCFunction *ctor;
  const int length;
  const JSCFunctionListEntry *functionList;
  const int size;
};

// static const char *class_name[] = {"Text", "Line", "Box", "Frame","Image"};
static JSClassID hook_class_id[sizeof(HookId) + 1];

static void js_hook_finalizer(JSRuntime *rt, JSValue val, int magic)
{
  JSHookData *data = (JSHookData *)JS_GetOpaque(val, hook_class_id[magic]);

  Genhook::EnterGlobalSection();
  if (data)
  {
    data->script = nullptr;

    // delete call destructor, no delete image
    // if (magic != IMAGE && data->hook)
    if (data->hook)
      delete data->hook;
  }
  Genhook::LeaveGlobalSection();

  // JSHookData by malloc
  js_free_rt(rt, data);
}

static void js_text_finalizer(JSRuntime *rt, JSValue val)
{
  js_hook_finalizer(rt, val, TEXT);
}

static void js_line_finalizer(JSRuntime *rt, JSValue val)
{
  js_hook_finalizer(rt, val, LINE);
}

static void js_box_finalizer(JSRuntime *rt, JSValue val)
{
  js_hook_finalizer(rt, val, BOX);
}

static void js_fram_finalizer(JSRuntime *rt, JSValue val)
{
  js_hook_finalizer(rt, val, FRAME);
}

static void js_image_finalizer(JSRuntime *rt, JSValue val)
{
  js_hook_finalizer(rt, val, IMAGE);
}

static JSValue buildHook(JSContext *ctx, JSValueConst new_target, JSClassID class_id, Genhook *genhook,
                         const Script *script, JSValueConst click = JS_UNDEFINED, JSValueConst hover = JS_UNDEFINED)
{
  JSValue hook = JS_UNDEFINED, proto;
  /* create the object */
  if (JS_IsUndefined(new_target))
  {
    proto = JS_GetClassProto(ctx, class_id);
  }
  else
  {
    proto = JS_GetPropertyStr(ctx, new_target, "prototype");
    if (JS_IsException(proto))
    {
      JS_FreeValue(ctx, hook);
      return JS_FALSE;
    }
  }

  hook = JS_NewObjectProtoClass(ctx, proto, class_id);
  JS_FreeValue(ctx, proto);

  if (JS_IsException(hook))
  {
    JS_FreeValue(ctx, hook);
    return JS_FALSE;
  }

  JSHookData *data = (JSHookData *)js_mallocz(ctx, sizeof(*data));
  if (!data)
  {
    JS_FreeValue(ctx, hook);
    return JS_FALSE;
  }

  data->hook = genhook;
  data->script = script;
  data->clickHandler = click;
  data->hoverHandler = hover;

  JS_SetOpaque(hook, data);

  return hook;
}

// Line functions
// Parameters: x, y, x2, y2, color, automap, click, hover
static JSValue js_line_hook_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  Script *script = (Script *)JS_GetContextOpaque(ctx);

  uint32_t x = 0, y = 0, x2 = 0, y2 = 0, color = 0;
  int automap = 0;
  JSValue click = JS_UNDEFINED, hover = JS_UNDEFINED;

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &x, argv[0]);

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &y, argv[1]);

  if (argc > 2 && JS_IsNumber(argv[2]))
    JS_ToUint32(ctx, &x2, argv[2]);

  if (argc > 3 && JS_IsNumber(argv[3]))
    JS_ToUint32(ctx, &y2, argv[3]);

  if (argc > 4 && JS_IsNumber(argv[4]))
    JS_ToUint32(ctx, &color, argv[4]);

  if (argc > 5 && JS_IsBool(argv[5]))
  {
    automap = JS_ToBool(ctx, argv[5]);
    if (automap == -1)
      return JS_FALSE;
  }

  if (argc > 6 && JS_IsFunction(ctx, argv[6]))
    click = argv[6];

  if (argc > 7 && JS_IsFunction(ctx, argv[7]))
    hover = argv[7];

  LineHook *pLineHook = new LineHook(x, y, x2, y2, color, !!automap);
  if (!pLineHook)
    JS_THROW_SINGLE_LINE(ctx, "Failed to create linehook");

  return buildHook(ctx, new_target, hook_class_id[LINE], pLineHook, script, click, hover);
}

// Function to create a text which gets called on a "new text ()"
// Parameters: text, x, y, color, font, align, automap, click, hover
static JSValue js_text_hook_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  Script *script = (Script *)JS_GetContextOpaque(ctx);

  ScreenhookState state = (script->GetState() == OutOfGame) ? OOG : IG;
  uint32_t x = 0, y = 0, color = 0, font = 0, align = Left;
  bool automap = false;
  JSValue click = JS_UNDEFINED, hover = JS_UNDEFINED;
  wchar_t *szText = nullptr;

  if (argc > 0 && JS_IsString(argv[0]))
    JS_ToUnicodeString(ctx, &szText, argv[0]);
  if (!szText)
    return JS_FALSE;

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &x, argv[1]);

  if (argc > 2 && JS_IsNumber(argv[2]))
    JS_ToUint32(ctx, &y, argv[2]);

  if (argc > 3 && JS_IsNumber(argv[3]))
    JS_ToUint32(ctx, &font, argv[3]);

  if (argc > 4 && JS_IsNumber(argv[4]))
    JS_ToUint32(ctx, &color, argv[4]);

  if (argc > 5 && JS_IsNumber(argv[5]))
    JS_ToUint32(ctx, &align, argv[5]);

  if (argc > 6 && JS_IsBool(argv[6]))
    automap = !!JS_ToBool(ctx, argv[6]);

  if (argc > 7 && JS_IsFunction(ctx, argv[7]))
    click = argv[7];

  if (argc > 8 && JS_IsFunction(ctx, argv[8]))
    hover = argv[8];

  TextHook *pTextHook = new TextHook(szText, x, y, (USHORT)font, (USHORT)color, automap, (Align)align, state);
  free(szText);

  if (!pTextHook)
    JS_THROW_SINGLE_LINE(ctx, "Failed to create texthook");

  return buildHook(ctx, new_target, hook_class_id[TEXT], pTextHook, script, click, hover);
}

// Box functions
// Parameters: x, y, xsize, ysize, color, opacity, alignment, automap, onClick, onHover
static JSValue js_box_hook_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  Script *script = (Script *)JS_GetContextOpaque(ctx);

  ScreenhookState state = (script->GetState() == OutOfGame) ? OOG : IG;
  uint32_t x = 0, y = 0, x2 = 0, y2 = 0, color = 0, opacity = 0, align = Left;
  // Align = Left;
  bool automap = false;
  JSValue click = JS_UNDEFINED, hover = JS_UNDEFINED;

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &x, argv[0]);

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &y, argv[1]);

  if (argc > 2 && JS_IsNumber(argv[2]))
    JS_ToUint32(ctx, &x2, argv[2]);

  if (argc > 3 && JS_IsNumber(argv[3]))
    JS_ToUint32(ctx, &y2, argv[3]);

  if (argc > 4 && JS_IsNumber(argv[4]))
    JS_ToUint32(ctx, &color, argv[4]);

  if (argc > 5 && JS_IsNumber(argv[5]))
    JS_ToUint32(ctx, &opacity, argv[5]);

  if (argc > 6 && JS_IsNumber(argv[6]))
    JS_ToUint32(ctx, &align, argv[6]);

  if (argc > 7 && JS_IsBool(argv[7]))
    automap = !!JS_ToBool(ctx, argv[7]);

  if (argc > 8 && JS_IsFunction(ctx, argv[8]))
    click = argv[8];

  if (argc > 9 && JS_IsFunction(ctx, argv[9]))
    hover = argv[9];

  BoxHook *pBoxHook = new BoxHook(x, y, x2, y2, (USHORT)color, (USHORT)opacity, automap, (Align)align, state);
  if (!pBoxHook)
    JS_THROW_SINGLE_LINE(ctx, "Unable to initalize a box class.");

  return buildHook(ctx, new_target, hook_class_id[BOX], pBoxHook, script, click, hover);
}

// Function to create a frame which gets called on a "new Frame ()"
// Parameters: x, y, xsize, ysize, alignment, automap, onClick, onHover
static JSValue js_frame_hook_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  Script *script = (Script *)JS_GetContextOpaque(ctx);

  uint32_t x = 0, y = 0, x2 = 0, y2 = 0, align = Left;
  bool automap = false;
  JSValue click = JS_UNDEFINED, hover = JS_UNDEFINED;

  if (argc > 0 && JS_IsNumber(argv[0]))
    JS_ToUint32(ctx, &x, argv[0]);

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &y, argv[1]);

  if (argc > 2 && JS_IsNumber(argv[2]))
    JS_ToUint32(ctx, &x2, argv[2]);

  if (argc > 3 && JS_IsNumber(argv[3]))
    JS_ToUint32(ctx, &y2, argv[3]);

  if (argc > 4 && JS_IsNumber(argv[4]))
    JS_ToUint32(ctx, &align, argv[4]);

  if (argc > 5 && JS_IsBool(argv[5]))
    automap = !!JS_ToBool(ctx, argv[5]);

  if (argc > 6 && JS_IsFunction(ctx, argv[6]))
    click = argv[6];

  if (argc > 7 && JS_IsFunction(ctx, argv[7]))
    hover = argv[7];

  // framehooks don't work out of game -- they just crash
  FrameHook *pFrameHook = new FrameHook(x, y, x2, y2, automap, (Align)align, IG);

  if (!pFrameHook)
    JS_THROW_SINGLE_LINE(ctx, "Failed to create framehook");

  return buildHook(ctx, new_target, hook_class_id[FRAME], pFrameHook, script, click, hover);
}

// Function to create a image which gets called on a "new Image ()"
// Parameters: location, x, y, color, alignment, automap, onClick, onHover
static JSValue js_image_hook_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  Script *script = (Script *)JS_GetContextOpaque(ctx);

  wchar_t *szLocation;
  uint32_t x = 0, y = 0, color = 0, align = Left;
  bool automap = false;
  JSValue click = JS_UNDEFINED, hover = JS_UNDEFINED;

  if (argc > 0 && JS_IsString(argv[0]))
    JS_ToUnicodeString(ctx, &szLocation, argv[0]);
  if (!szLocation)
    return JS_FALSE;

  if (argc > 1 && JS_IsNumber(argv[1]))
    JS_ToUint32(ctx, &x, argv[1]);

  if (argc > 2 && JS_IsNumber(argv[2]))
    JS_ToUint32(ctx, &y, argv[2]);

  if (argc > 3 && JS_IsNumber(argv[3]))
    JS_ToUint32(ctx, &color, argv[3]);

  if (argc > 4 && JS_IsNumber(argv[4]))
    JS_ToUint32(ctx, &align, argv[4]);

  if (argc > 5 && JS_IsBool(argv[5]))
    automap = !!JS_ToBool(ctx, argv[5]);

  if (argc > 6 && JS_IsFunction(ctx, argv[6]))
    click = argv[6];

  if (argc > 7 && JS_IsFunction(ctx, argv[7]))
    hover = argv[7];

  // framehooks don't work out of game -- they just crash
  ImageHook *pImageHook = new ImageHook(szLocation, x, y, (USHORT)color, automap, (Align)align, IG);
  free(szLocation);

  if (!pImageHook)
    JS_THROW_SINGLE_LINE(ctx, "Failed to create imagehook");

  return buildHook(ctx, new_target, hook_class_id[IMAGE], pImageHook, script, click, hover);
}

JSAPI_PGM(get_line_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[LINE]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  LineHook *pLineHook = (LineHook *)pData->hook;

  switch (magic)
  {
  case LINE_X:
    return JS_NewUint32(ctx, pLineHook->GetX());
  case LINE_Y:
    return JS_NewUint32(ctx, pLineHook->GetY());
  case LINE_XSIZE:
    return JS_NewUint32(ctx, pLineHook->GetX2());
  case LINE_YSIZE:
    return JS_NewUint32(ctx, pLineHook->GetY2());
  case LINE_COLOR:
    return JS_NewUint32(ctx, pLineHook->GetColor());
  case LINE_VISIBLE:
    return JS_NewBool(ctx, pLineHook->GetIsVisible());
  case LINE_ZORDER:
    return JS_NewUint32(ctx, pLineHook->GetZOrder());
  case LINE_ONCLICK:
    return pData->clickHandler;
  case LINE_ONHOVER:
    return pData->hoverHandler;
  }
  return JS_FALSE;
}

JSAPI_PSM(set_line_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[LINE]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  LineHook *pLineHook = (LineHook *)pData->hook;

  uint32_t iv = 0;
  bool bv = false;
  if (JS_IsNumber(val))
    JS_ToUint32(ctx, &iv, val);

  if (JS_IsBool(val))
    bv = !!(JS_ToBool(ctx, val) >= 0);

  switch (magic)
  {
  case LINE_X:
    if (JS_IsNumber(val))
      pLineHook->SetX(iv);
    break;
  case LINE_Y:
    if (JS_IsNumber(val))
      pLineHook->SetY(iv);
    break;
  case LINE_XSIZE:
    if (JS_IsNumber(val))
      pLineHook->SetX2(iv);
    break;
  case LINE_YSIZE:
    if (JS_IsNumber(val))
      pLineHook->SetY2(iv);
    break;
  case LINE_COLOR:
    if (JS_IsNumber(val))
      pLineHook->SetColor((USHORT)iv);
    break;
  case LINE_VISIBLE:
    if (JS_IsBool(val))
      pLineHook->SetIsVisible(bv);
    break;
  case LINE_ZORDER:
    if (JS_IsNumber(val))
      pLineHook->SetZOrder((USHORT)iv);
    break;
  case LINE_ONCLICK:
    pData->clickHandler = val;
    break;
  case LINE_ONHOVER:
    pData->hoverHandler = val;
    break;
  }
  return JS_FALSE;
}

JSAPI_PGM(get_text_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[TEXT]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  TextHook *pTextHook = (TextHook *)pData->hook;

  switch (magic)
  {
  case TEXT_X:
    return JS_NewUint32(ctx, pTextHook->GetX());
  case TEXT_Y:
    return JS_NewUint32(ctx, pTextHook->GetY());
  case TEXT_COLOR:
    return JS_NewUint32(ctx, pTextHook->GetColor());
  case TEXT_FONT:
    return JS_NewUint32(ctx, pTextHook->GetFont());
  case TEXT_TEXT:
    return JS_NewUTF8String(ctx, pTextHook->GetText());
  case TEXT_ALIGN:
    return JS_NewUint32(ctx, pTextHook->GetAlign());
  case TEXT_VISIBLE:
    return JS_NewBool(ctx, pTextHook->GetIsVisible());
  case TEXT_ZORDER:
    return JS_NewUint32(ctx, pTextHook->GetZOrder());
  case TEXT_ONCLICK:
    return pData->clickHandler;
    break;
  case TEXT_ONHOVER:
    return pData->hoverHandler;
  }
  return JS_FALSE;
}

JSAPI_PSM(set_text_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[TEXT]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  TextHook *pTextHook = (TextHook *)pData->hook;

  uint32_t iv = 0;
  bool bv = false;
  if (JS_IsNumber(val))
    JS_ToUint32(ctx, &iv, val);

  if (JS_IsBool(val))
    bv = !!(JS_ToBool(ctx, val) >= 0);

  switch (magic)
  {
  case TEXT_X:
    if (JS_IsNumber(val))
      pTextHook->SetX(iv);
    break;
  case TEXT_Y:
    if (JS_IsNumber(val))
      pTextHook->SetY(iv);
    break;
  case TEXT_COLOR:
    if (JS_IsNumber(val))
      pTextHook->SetColor((USHORT)iv);
    break;
  case TEXT_FONT:
    if (JS_IsNumber(val))
      pTextHook->SetFont((USHORT)iv);
    break;
  case TEXT_TEXT:
    if (JS_IsString(val))
    {
      wchar_t *pText = nullptr;
      JS_ToUnicodeString(ctx, &pText, val);
      if (!pText)
        return JS_FALSE;

      pTextHook->SetText(pText);
      free(pText);
    }
    break;
  case TEXT_ALIGN:
    if (JS_IsNumber(val))
      pTextHook->SetAlign((Align)iv);
    break;
  case TEXT_VISIBLE:
    if (JS_IsBool(val))
      pTextHook->SetIsVisible(bv);
    break;
  case TEXT_ZORDER:
    if (JS_IsNumber(val))
      pTextHook->SetZOrder((USHORT)iv);
    break;
  case TEXT_ONCLICK:
    pData->clickHandler = val;
    break;
  case TEXT_ONHOVER:
    pData->hoverHandler = val;
    break;
  }
  return JS_FALSE;
}

JSAPI_PGM(get_box_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[BOX]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  BoxHook *pBoxHook = (BoxHook *)pData->hook;

  switch (magic)
  {
  case BOX_X:
    return JS_NewUint32(ctx, pBoxHook->GetX());
  case BOX_Y:
    return JS_NewUint32(ctx, pBoxHook->GetY());
  case BOX_XSIZE:
    return JS_NewUint32(ctx, pBoxHook->GetXSize());
  case BOX_YSIZE:
    return JS_NewUint32(ctx, pBoxHook->GetYSize());
  case BOX_ALIGN:
    return JS_NewUint32(ctx, pBoxHook->GetAlign());
  case BOX_COLOR:
    return JS_NewUint32(ctx, pBoxHook->GetColor());
  case BOX_OPACITY:
    return JS_NewUint32(ctx, pBoxHook->GetOpacity());
  case BOX_VISIBLE:
    return JS_NewBool(ctx, pBoxHook->GetIsVisible());
  case BOX_ZORDER:
    return JS_NewUint32(ctx, pBoxHook->GetZOrder());
  case BOX_ONCLICK:
    return pData->clickHandler;
  case BOX_ONHOVER:
    return pData->hoverHandler;
  }
  return JS_FALSE;
}

JSAPI_PSM(set_box_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[BOX]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  BoxHook *pBoxHook = (BoxHook *)pData->hook;

  uint32_t iv = 0;
  bool bv = false;
  if (JS_IsNumber(val))
    JS_ToUint32(ctx, &iv, val);

  if (JS_IsBool(val))
    bv = !!(JS_ToBool(ctx, val) >= 0);

  switch (magic)
  {
  case BOX_X:
    if (JS_IsNumber(val))
      pBoxHook->SetX(iv);
    break;
  case BOX_Y:
    if (JS_IsNumber(val))
      pBoxHook->SetY(iv);
    break;
  case BOX_XSIZE:
    if (JS_IsNumber(val))
      pBoxHook->SetXSize(iv);
    break;
  case BOX_YSIZE:
    if (JS_IsNumber(val))
      pBoxHook->SetYSize(iv);
    break;
  case BOX_OPACITY:
    if (JS_IsNumber(val))
      pBoxHook->SetOpacity((USHORT)iv);
    break;
  case BOX_COLOR:
    if (JS_IsNumber(val))
      pBoxHook->SetColor((USHORT)iv);
    break;
  case BOX_ALIGN:
    if (JS_IsNumber(val))
      pBoxHook->SetAlign((Align)iv);
    break;
  case BOX_VISIBLE:
    if (JS_IsBool(val))
      pBoxHook->SetIsVisible(bv);
    break;
  case BOX_ZORDER:
    if (JS_IsNumber(val))
      pBoxHook->SetZOrder((USHORT)iv);
    break;
  case BOX_ONCLICK:
    pData->clickHandler = val;
    break;
  case BOX_ONHOVER:
    pData->hoverHandler = val;
    break;
  }
  return JS_FALSE;
}

JSAPI_PGM(get_frame_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[FRAME]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  FrameHook *pFramehook = (FrameHook *)pData->hook;

  switch (magic)
  {
  case FRAME_X:
    return JS_NewUint32(ctx, pFramehook->GetX());
  case FRAME_Y:
    return JS_NewUint32(ctx, pFramehook->GetY());
  case FRAME_XSIZE:
    return JS_NewUint32(ctx, pFramehook->GetXSize());
  case FRAME_YSIZE:
    return JS_NewUint32(ctx, pFramehook->GetYSize());
  case FRAME_ALIGN:
    return JS_NewUint32(ctx, pFramehook->GetAlign());
  case FRAME_VISIBLE:
    return JS_NewBool(ctx, pFramehook->GetIsVisible());
  case FRAME_ZORDER:
    return JS_NewUint32(ctx, pFramehook->GetZOrder());
  case FRAME_ONCLICK:
    return pData->clickHandler;
  case FRAME_ONHOVER:
    return pData->clickHandler;
  }
  return JS_FALSE;
}

JSAPI_PSM(set_frame_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[FRAME]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  FrameHook *pFramehook = (FrameHook *)pData->hook;

  uint32_t iv = 0;
  bool bv = false;
  if (JS_IsNumber(val))
    JS_ToUint32(ctx, &iv, val);

  if (JS_IsBool(val))
    bv = !!(JS_ToBool(ctx, val) >= 0);

  switch (magic)
  {
  case FRAME_X:
    if (JS_IsNumber(val))
      pFramehook->SetX(iv);
    break;
  case FRAME_Y:
    if (JS_IsNumber(val))
      pFramehook->SetY(iv);
    break;
  case FRAME_XSIZE:
    if (JS_IsNumber(val))
      pFramehook->SetXSize(iv);
    break;
  case FRAME_YSIZE:
    if (JS_IsNumber(val))
      pFramehook->SetYSize(iv);
    break;
  case FRAME_ALIGN:
    if (JS_IsNumber(val))
      pFramehook->SetAlign((Align)iv);
    break;
  case FRAME_VISIBLE:
    if (JS_IsBool(val))
      pFramehook->SetIsVisible(bv);
    break;
  case FRAME_ZORDER:
    if (JS_IsNumber(val))
      pFramehook->SetZOrder((USHORT)iv);
    break;
  case FRAME_ONCLICK:
    pData->clickHandler = val;
    break;
  case FRAME_ONHOVER:
    pData->hoverHandler = val;
    break;
  }
  return JS_FALSE;
}

JSAPI_PGM(get_image_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[IMAGE]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  ImageHook *pImagehook = (ImageHook *)pData->hook;

  switch (magic)
  {
  case IMAGE_X:
    return JS_NewUint32(ctx, pImagehook->GetX());
  case IMAGE_Y:
    return JS_NewUint32(ctx, pImagehook->GetY());
  case IMAGE_COLOR:
    return JS_NewUint32(ctx, pImagehook->GetColor());
  case IMAGE_LOCATION:
    return JS_NewUTF8String(ctx, pImagehook->GetImage());
  case IMAGE_ALIGN:
    return JS_NewUint32(ctx, pImagehook->GetAlign());
  case IMAGE_VISIBLE:
    return JS_NewBool(ctx, pImagehook->GetIsVisible());
  case IMAGE_ZORDER:
    return JS_NewUint32(ctx, pImagehook->GetZOrder());
  case IMAGE_ONCLICK:
    return pData->clickHandler;
  case IMAGE_ONHOVER:
    return pData->clickHandler;
  }
  return JS_FALSE;
}

JSAPI_PSM(set_image_property)
{
  JSHookData *pData = (JSHookData *)JS_GetOpaque(this_val, hook_class_id[IMAGE]);
  if (!pData || !pData->hook)
    return JS_FALSE;

  ImageHook *pImagehook = (ImageHook *)pData->hook;

  uint32_t iv = 0;
  bool bv = false;
  if (JS_IsNumber(val))
    JS_ToUint32(ctx, &iv, val);

  if (JS_IsBool(val))
    bv = !!(JS_ToBool(ctx, val) >= 0);

  switch (magic)
  {
  case IMAGE_X:
    if (JS_IsNumber(val))
      pImagehook->SetX(iv);
    break;
  case IMAGE_Y:
    if (JS_IsNumber(val))
      pImagehook->SetY(iv);
    break;
  case IMAGE_COLOR:
    if (JS_IsNumber(val))
      pImagehook->SetColor((USHORT)iv);
    break;
  case IMAGE_LOCATION:
    if (JS_IsString(val))
    {
      wchar_t *pImage = nullptr;
      JS_ToUnicodeString(ctx, &pImage, val);
      if (!pImage)
        return JS_FALSE;

      pImagehook->SetImage(pImage);
      free(pImage);
    }
    break;
  case IMAGE_ALIGN:
    if (JS_IsNumber(val))
      pImagehook->SetAlign((Align)iv);
    break;
  case IMAGE_VISIBLE:
    if (JS_IsBool(val))
      pImagehook->SetIsVisible(bv);
    break;
  case IMAGE_ZORDER:
    if (JS_IsNumber(val))
      pImagehook->SetZOrder((USHORT)iv);
    break;
  case IMAGE_ONCLICK:
    pData->clickHandler = val;
    break;
  case IMAGE_ONHOVER:
    pData->hoverHandler = val;
    break;
  }
  return JS_FALSE;
}

JSAPI_FUNCM(hook_remove)
{
  js_hook_finalizer(JS_GetRuntime(ctx), this_val, hook_class_id[magic]);
  return JS_TRUE;
}

JSAPI_FUNCM(mapAndScreen)
{
  JSValue x, y;
  int32_t ix, iy;

  if (argc == 1)
  {
    // the arg must be an object with an x and a y that we can convert
    if (JS_IsObject(argv[0]))
    {
      // get the params
      x = JS_GetPropertyStr(ctx, argv[0], "x");
      y = JS_GetPropertyStr(ctx, argv[0], "y");

      if (JS_IsException(x) || JS_IsException(y))
        JS_THROW_SINGLE_LINE(ctx, "Failed to get x and/or y values");

      if (!JS_IsNumber(x) || !JS_IsNumber(y))
        JS_THROW_SINGLE_LINE(ctx, "Input has an x or y, but they aren't the correct type!");

      if (JS_ToInt32(ctx, &ix, x) < 0 || JS_ToInt32(ctx, &iy, y) < 0)
        JS_THROW_SINGLE_LINE(ctx, "Failed to convert x and/or y values");
    }
    else
      JS_THROW_SINGLE_LINE(ctx, "Invalid object specified");
  }
  else if (argc == 2)
  {
    // the args must be ints
    if (JS_IsNumber(argv[0]) && JS_IsNumber(argv[1]))
    {
      if (JS_ToInt32(ctx, &ix, argv[0]) < 0 || JS_ToInt32(ctx, &iy, argv[1]) < 0)
        JS_THROW_SINGLE_LINE(ctx, "Failed to convert x and/or y values");
    }
    else
      JS_THROW_SINGLE_LINE(ctx, "expects two arguments to be two integers");
  }
  else
    JS_THROW_SINGLE_LINE(ctx, "Invalid arguments specified");

  POINT result = {(LONG)ix, (LONG)iy};
  // convert the values

  switch (magic)
  {
  case MI_STAM:
    result = ScreenToAutomap(ix, iy);
    break;
  case MI_AMTS:
    AutomapToScreen(&result);
    break;
  case MI_WTS:
    WorldToScreen(&result);
    break;
  case MI_STW:
    ScreenToWorld(&result);
    break;
  default:
    return JS_FALSE;
  }

  x = JS_NewInt32(ctx, result.x);
  y = JS_NewInt32(ctx, result.y);

  JSValue res = JS_NewObject(ctx);
  if (JS_SetPropertyStr(ctx, res, "x", x) < 0 || JS_SetPropertyStr(ctx, res, "y", y) < 0)
    JS_THROW_SINGLE_LINE(ctx, "Failed to set x and/or y values");

  return res;
}

static const JSCFunctionListEntry js_line_hook_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("x", get_line_property, set_line_property, LINE_X),
    JS_CGETSET_MAGIC_DEF("y", get_line_property, set_line_property, LINE_Y),
    JS_CGETSET_MAGIC_DEF("xsize", get_line_property, set_line_property, LINE_XSIZE),
    JS_CGETSET_MAGIC_DEF("ysize", get_line_property, set_line_property, LINE_YSIZE),
    JS_CGETSET_MAGIC_DEF("color", get_line_property, set_line_property, LINE_COLOR),
    JS_CGETSET_MAGIC_DEF("visible", get_line_property, set_line_property, LINE_VISIBLE),
    JS_CGETSET_MAGIC_DEF("zorder", get_line_property, set_line_property, LINE_ZORDER),
    JS_CGETSET_MAGIC_DEF("click", get_line_property, set_line_property, LINE_ONCLICK),
    JS_CGETSET_MAGIC_DEF("hover", get_line_property, set_line_property, LINE_ONHOVER),
    JS_CFUNC_MAGIC_DEF("remove", 0, hook_remove, LINE),
};

static const JSCFunctionListEntry js_text_hook_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("x", get_text_property, set_text_property, TEXT_X),
    JS_CGETSET_MAGIC_DEF("y", get_text_property, set_text_property, TEXT_Y),
    JS_CGETSET_MAGIC_DEF("color", get_text_property, set_text_property, TEXT_COLOR),
    JS_CGETSET_MAGIC_DEF("font", get_text_property, set_text_property, TEXT_FONT),
    JS_CGETSET_MAGIC_DEF("text", get_text_property, set_text_property, TEXT_TEXT),
    JS_CGETSET_MAGIC_DEF("align", get_text_property, set_text_property, TEXT_ALIGN),
    JS_CGETSET_MAGIC_DEF("visible", get_text_property, set_text_property, TEXT_VISIBLE),
    JS_CGETSET_MAGIC_DEF("zorder", get_text_property, set_text_property, TEXT_ZORDER),
    JS_CGETSET_MAGIC_DEF("click", get_text_property, set_text_property, TEXT_ONCLICK),
    JS_CGETSET_MAGIC_DEF("hover", get_text_property, set_text_property, TEXT_ONHOVER),
    JS_CFUNC_MAGIC_DEF("remove", 0, hook_remove, TEXT),
};

static const JSCFunctionListEntry js_box_hook_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("x", get_box_property, set_box_property, BOX_X),
    JS_CGETSET_MAGIC_DEF("y", get_box_property, set_box_property, BOX_Y),
    JS_CGETSET_MAGIC_DEF("xsize", get_box_property, set_box_property, BOX_XSIZE),
    JS_CGETSET_MAGIC_DEF("ysize", get_box_property, set_box_property, BOX_YSIZE),
    JS_CGETSET_MAGIC_DEF("opacity", get_box_property, set_box_property, BOX_OPACITY),
    JS_CGETSET_MAGIC_DEF("color", get_box_property, set_box_property, BOX_COLOR),
    JS_CGETSET_MAGIC_DEF("align", get_box_property, set_box_property, BOX_ALIGN),
    JS_CGETSET_MAGIC_DEF("visible", get_box_property, set_box_property, BOX_VISIBLE),
    JS_CGETSET_MAGIC_DEF("zorder", get_box_property, set_box_property, BOX_ZORDER),
    JS_CGETSET_MAGIC_DEF("click", get_box_property, set_box_property, BOX_ONCLICK),
    JS_CGETSET_MAGIC_DEF("hover", get_box_property, set_box_property, BOX_ONHOVER),
    JS_CFUNC_MAGIC_DEF("remove", 0, hook_remove, BOX),
};

static const JSCFunctionListEntry js_frame_hook_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("x", get_frame_property, set_frame_property, FRAME_X),
    JS_CGETSET_MAGIC_DEF("y", get_frame_property, set_frame_property, FRAME_Y),
    JS_CGETSET_MAGIC_DEF("xsize", get_frame_property, set_frame_property, FRAME_XSIZE),
    JS_CGETSET_MAGIC_DEF("ysize", get_frame_property, set_frame_property, FRAME_YSIZE),
    JS_CGETSET_MAGIC_DEF("align", get_frame_property, set_frame_property, FRAME_ALIGN),
    JS_CGETSET_MAGIC_DEF("visible", get_frame_property, set_frame_property, FRAME_VISIBLE),
    JS_CGETSET_MAGIC_DEF("zorder", get_frame_property, set_frame_property, FRAME_ZORDER),
    JS_CGETSET_MAGIC_DEF("click", get_frame_property, set_frame_property, FRAME_ONCLICK),
    JS_CGETSET_MAGIC_DEF("hover", get_frame_property, set_frame_property, FRAME_ONHOVER),
    JS_CFUNC_MAGIC_DEF("remove", 0, hook_remove, FRAME),
};

static const JSCFunctionListEntry js_image_hook_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("x", get_image_property, set_image_property, IMAGE_X),
    JS_CGETSET_MAGIC_DEF("y", get_image_property, set_image_property, IMAGE_Y),
    JS_CGETSET_MAGIC_DEF("color", get_image_property, set_image_property, IMAGE_COLOR),
    JS_CGETSET_MAGIC_DEF("location", get_image_property, set_image_property, IMAGE_LOCATION),
    JS_CGETSET_MAGIC_DEF("align", get_image_property, set_image_property, IMAGE_ALIGN),
    JS_CGETSET_MAGIC_DEF("visible", get_image_property, set_image_property, IMAGE_VISIBLE),
    JS_CGETSET_MAGIC_DEF("zorder", get_image_property, set_image_property, IMAGE_ZORDER),
    JS_CGETSET_MAGIC_DEF("click", get_image_property, set_image_property, IMAGE_ONCLICK),
    JS_CGETSET_MAGIC_DEF("hover", get_image_property, set_image_property, IMAGE_ONHOVER),
    JS_CFUNC_MAGIC_DEF("remove", 0, hook_remove, IMAGE),
};

static const JSCFunctionListEntry js_screen_module_funcs[] = {
    // drawing functions
    JS_CFUNC_MAGIC_DEF("screenToAutomap", 1, mapAndScreen, MI_STAM),
    JS_CFUNC_MAGIC_DEF("automapToScreen", 1, mapAndScreen, MI_AMTS),
    JS_CFUNC_MAGIC_DEF("screenToWorld", 1, mapAndScreen, MI_STW),
    JS_CFUNC_MAGIC_DEF("worldToScreen", 1, mapAndScreen, MI_WTS),
};

static const JSHookClassDefine hook_class_defs[] = {
    {TEXT, {"Text", .finalizer = js_text_finalizer}, js_text_hook_ctor, 9, js_text_hook_proto_funcs, ARRAYSIZE(js_text_hook_proto_funcs)},
    {LINE, {"Line", .finalizer = js_line_finalizer}, js_line_hook_ctor, 6, js_line_hook_proto_funcs, ARRAYSIZE(js_line_hook_proto_funcs)},
    {BOX, {"Box", .finalizer = js_box_finalizer}, js_box_hook_ctor, 10, js_box_hook_proto_funcs, ARRAYSIZE(js_box_hook_proto_funcs)},
    {FRAME, {"Frame", .finalizer = js_fram_finalizer}, js_frame_hook_ctor, 8, js_frame_hook_proto_funcs, ARRAYSIZE(js_frame_hook_proto_funcs)},
    {IMAGE, {"Image", .finalizer = js_image_finalizer}, js_image_hook_ctor, 8, js_image_hook_proto_funcs, ARRAYSIZE(js_image_hook_proto_funcs)},
};

int js_module_hook_init(JSContext *ctx, JSModuleDef *m)
{
  JSValue hook_proto, hook_class;

  for (JSHookClassDefine cd : hook_class_defs)
  {
    /* create the hook class */
    JS_NewClassID(&hook_class_id[cd.magic]);
    JS_NewClass(JS_GetRuntime(ctx), hook_class_id[cd.magic], &cd.classDef);

    hook_proto = JS_NewObject(ctx);
    JS_SetPropertyFunctionList(ctx, hook_proto, cd.functionList, cd.size);

    hook_class = JS_NewCFunction2(ctx, cd.ctor, cd.classDef.class_name, cd.length, JS_CFUNC_constructor, cd.magic);

    JS_SetConstructor(ctx, hook_class, hook_proto);
    JS_SetClassProto(ctx, hook_class_id[cd.magic], hook_proto);

    JS_SetModuleExport(ctx, m, cd.classDef.class_name, hook_class);
  }

  JS_SetModuleExportList(ctx, m, js_screen_module_funcs, ARRAYSIZE(js_screen_module_funcs));

  return TRUE;
}

int js_module_hook_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExportList(ctx, m, js_screen_module_funcs, ARRAYSIZE(js_screen_module_funcs));

  for (JSHookClassDefine cd : hook_class_defs)
  {
    JS_AddModuleExport(ctx, m, cd.classDef.class_name);
  }
  return TRUE;
}
