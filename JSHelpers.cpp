#include "JSHelpers.h"
#include "D2Handlers.h"
#include "MPQStats.h"
#include "ScriptEngine.h"
#include "Events.h"
#include "D2Boot.h"

JSValue BuildObject(JSContext *ctx, JSClassID classId, void *data)
{
  JSValue object = JS_NewObjectClass(ctx, classId);
  if (JS_IsException(object))
    return JS_EXCEPTION;

  if (data)
    JS_SetOpaque(object, data);

  return object;
}

static void ConsolePrintError(const char *error, const char *stack)
{
  //!!NOTE!! must check first
  if (!error)
  {
    Log(L"[D2Boot :: exception] !!warning!! get error NULL here, error: %s stack:%s", error, stack);
    return;
  }

  if (strcmp("InternalError: interrupted", error) == 0)
  {
    // Log(L"[D2Boot :: exception] dump error: %s stack:%s", error, stack);
    return;
  }

  Print(L"[\u00FFc1D2Boot :: exception\u00FFc0] dump error: %s, stack:%s", error, stack);
#ifndef DEBUG
  Log(L"[D2Boot :: exception] dump error: %s, stack:%s", error, stack);
#endif
}

static void DumpError(JSContext *ctx, JSValueConst exception_val)
{
  const char *szVal = JS_ToCString(ctx, exception_val);

  if (JS_IsError(ctx, exception_val))
  {
    JSValue stack = JS_GetPropertyStr(ctx, exception_val, "stack");
    if (JS_IsUndefined(stack) || JS_IsException(stack))
    {
      ConsolePrintError(szVal, "get stack error!");

      JS_FreeValue(ctx, stack);
      JS_FreeCString(ctx, szVal);
      return;
    }

    const char *szStack = JS_ToCString(ctx, stack);
    char *stackString = strdup(szStack ? szStack : "nothing");
    StringReplaceChar(stackString, '\n', ' ', strlen(stackString));
    ConsolePrintError(szVal, stackString);

    JS_FreeCString(ctx, szStack);
    free(stackString);
  }
  else
  {
    ConsolePrintError(szVal, nullptr);
  }

  JS_FreeCString(ctx, szVal);
}

void JS_ReportError(JSContext *ctx)
{
  JSValue exception_val = JS_GetException(ctx);
  DumpError(ctx, exception_val);
  JS_FreeValue(ctx, exception_val);
}

void JS_ReportError(JSContext *ctx, const char *szFormat, ...)
{
  char *szError;

  va_list vaArgs;

  va_start(vaArgs, szFormat);
  FormatString(&szError, szFormat, vaArgs);
  va_end(vaArgs);

  JS_ThrowInternalError(ctx, szError);

  free(szError);

  JS_ReportError(ctx);
}

void JS_PromiseTracker(JSContext *ctx, JSValueConst promise, JSValueConst reason, BOOL is_handled, void *opaque)
{
  if (!is_handled)
  {
    DumpError(ctx, reason);
  }
}

// is a good idea handled by d2boot? or config in D2Boot.ini file?
static char *JS_ModuleNameAlias(JSContext *ctx, const char *base_name, const char *name)
{
  char *filename;

  if (name[1] == '/')
  {
    // !!should freed by quickjs!!
    filename = (char *)js_malloc(ctx, strlen(name) - 1 + wcslen(Vars.szScriptAtAlias));
    sprintf(filename, "%ls%s", Vars.szScriptAtAlias, name + 1);
  }
  // else if (name[2] == '/')
  // {
  //   switch (name[1])
  //   {
  //   case 'B':
  //     filename = (char *)js_malloc(ctx, strlen(name) - 2 + 9);
  //     sprintf(filename, "libs/bots%s", name + 2);
  //     break;
  //   case 'C':
  //     filename = (char *)js_malloc(ctx, strlen(name) - 2 + 11);
  //     sprintf(filename, "libs/common%s", name + 2);
  //     break;
  //   case 'M':
  //     filename = (char *)js_malloc(ctx, strlen(name) - 2 + 12);
  //     sprintf(filename, "libs/modules%s", name + 2);
  //     break;
  //   default:
  //     filename = js_strdup(ctx, name);
  //     break;
  //   }
  // }
  else
    filename = js_strdup(ctx, name);

  // DEBUG_LOG("normalize: base:[%s] name: [%s] -> [%s]", base_name, name, filename);

  return filename;
}

// same as quickjs's js_default_module_normalize_name, it's just debug filename, separator by '/'.
// JS_SetModuleLoaderFunc(rt, JS_ModuleNormalizeName, JS_ModuleLoader, NULL);
char *JS_ModuleNormalizeName(JSContext *ctx, const char *base_name, const char *name, void *opaque)
{
  char *filename, *p;
  const char *r;
  int len;

  // support @ alise
  if (name[0] == '@')
    return JS_ModuleNameAlias(ctx, base_name, name);

  if (name[0] != '.')
  {
    /* if no initial dot, the module name is not modified */
    return js_strdup(ctx, name);
  }

  p = strrchr(base_name, '/');
  if (p)
    len = p - base_name;
  else
    len = 0;

  filename = (char *)js_malloc(ctx, len + strlen(name) + 1 + 1);
  if (!filename)
    return nullptr;

  // filename is just the base path, not filename
  memcpy(filename, base_name, len);
  filename[len] = '\0';

  /* we only normalize the leading '..' or '.' */
  r = name;
  for (;;)
  {
    if (r[0] == '.' && r[1] == '/')
    {
      r += 2;
    }
    else if (r[0] == '.' && r[1] == '.' && r[2] == '/')
    {
      /* remove the last path element of filename, except if "."
         or ".." */
      if (filename[0] == '\0')
        break;
      p = strrchr(filename, '/');
      if (!p)
        p = filename;
      else
        p++;
      if (!strcmp(p, ".") || !strcmp(p, ".."))
        break;
      if (p > filename)
        p--;
      *p = '\0';
      r += 3;
    }
    else
    {
      break;
    }
  }

  if (filename[0] != '\0')
    strcat(filename, "/");

  strcat(filename, r);

  return filename;
}

JSModuleDef *JS_ModuleLoader(JSContext *ctx, const char *module_name, void *opaque)
{
  JSModuleDef *m;
  size_t buf_len;
  uint8_t *buf;
  JSValue func_val;
  char szModuleFile[_MAX_FNAME + _MAX_PATH] = "";

  // set module's windows filename, only for open file.
  sprintf_s(szModuleFile, _countof(szModuleFile), "%ls/%s", Vars.szScriptPath, module_name);
  // StringReplaceChar(szModuleFile, '/', '\\', strlen(szModuleFile));

  buf = js_load_file(ctx, &buf_len, szModuleFile);
  if (!buf)
  {
    JS_ThrowReferenceError(ctx, "could not load module filename '%s'", szModuleFile);
    return nullptr;
  }

  // must use module_name, the module name separator by '/'
  // and quickjs normalize module name by js_default_module_normalize_name function.
  func_val = JS_Eval(ctx, (char *)buf, buf_len, module_name, JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
  js_free(ctx, buf);

  if (JS_IsException(func_val))
    return nullptr;

  /* XXX: could propagate the exception */
  js_module_set_import_meta(ctx, func_val, TRUE, FALSE);

  /* the module is already referenced, so we must free it */
  m = (JSModuleDef *)JS_VALUE_GET_PTR(func_val);
  JS_FreeValue(ctx, func_val);

  return m;
}

DWORD JS_FillBaseStat(JSContext *ctx, JSValue *argv, int table, int row, int column, const char *szTable, const char *szStat)
{
  extern MPQTable BaseStatTable[];

  if (szTable)
  {
    table = -1;
    for (int i = 0; BaseStatTable[i].pTable != NULL; i++)
      if (!_strcmpi(szTable, BaseStatTable[i].szTableName))
      {
        table = i;
        break;
      }

    if (table == -1)
      return false;
  }

  BinField *pTable = BaseStatTable[table].pTable;

  if (szStat)
  {
    column = -1;
    for (int i = 0; i < BaseStatTable[table].wTableSize; i++)
      if (!_strcmpi(szStat, pTable[i].szFieldName))
      {
        column = i;
        break;
      }

    if (column == -1)
      return false;
  }

  if (column > BaseStatTable[table].wTableSize)
    return FALSE;

  DWORD dwBuffer = 0;
  WORD wBuffer = 0;
  char *szBuffer = nullptr;
  DWORD dwHelperSize = pTable[column + 1].dwFieldOffset - pTable[column].dwFieldOffset;
  if (dwHelperSize > 4)
    dwHelperSize = 4;

  switch (pTable[column].eFieldType)
  {
  case FIELDTYPE_DATA_ASCII:
    szBuffer = (char *)malloc((pTable[column].dwFieldLength + 1) * sizeof(char));
    memset(szBuffer, 0, pTable[column].dwFieldLength + 1);
    if (!FillBaseStat(table, row, column, szBuffer, pTable[column].dwFieldLength + 1))
      (*argv) = JS_UNDEFINED;
    else
      (*argv) = JS_NewString(ctx, szBuffer);

    free(szBuffer);
    return TRUE;

  case FIELDTYPE_DATA_DWORD:
    if (!FillBaseStat(table, row, column, &dwBuffer, sizeof(DWORD)))
      (*argv) = JS_UNDEFINED;
    else
      *argv = JS_NewFloat64(ctx, dwBuffer);
    return TRUE;

  case FIELDTYPE_CALC_TO_DWORD:
  case FIELDTYPE_NAME_TO_DWORD:
  case FIELDTYPE_DATA_DWORD_2:
  case FIELDTYPE_UNKNOWN_11:
    if (!FillBaseStat(table, row, column, &dwBuffer, sizeof(DWORD)))
      (*argv) = JS_UNDEFINED;
    else
      *argv = JS_NewInt64(ctx, dwBuffer);
    return TRUE;

  case FIELDTYPE_NAME_TO_INDEX_2:
  case FIELDTYPE_NAME_TO_WORD_2:
  case FIELDTYPE_NAME_TO_INDEX:
  case FIELDTYPE_NAME_TO_WORD:
  case FIELDTYPE_KEY_TO_WORD:
  case FIELDTYPE_DATA_WORD:
  case FIELDTYPE_CODE_TO_WORD:
    if (!FillBaseStat(table, row, column, &wBuffer, sizeof(WORD)))
      (*argv) = JS_UNDEFINED;
    else
      (*argv) = JS_NewUint32(ctx, wBuffer);
    return TRUE;

  case FIELDTYPE_CODE_TO_BYTE:
  case FIELDTYPE_DATA_BYTE_2:
  case FIELDTYPE_DATA_BYTE:
    if (!FillBaseStat(table, row, column, &dwBuffer, dwHelperSize))
      (*argv) = JS_UNDEFINED;
    else
      (*argv) = JS_NewInt32(ctx, dwBuffer);
    return TRUE;

  case FIELDTYPE_DATA_BIT:
    if (!FillBaseStat(table, row, column, &dwBuffer, sizeof(DWORD)))
      (*argv) = JS_UNDEFINED;
    else
      (*argv) = JS_NewInt32(ctx, dwBuffer);
    //(*argv) = (BOOLEAN_TO_JSVAL(!!dwBuffer) ? 1 : 0);
    return TRUE;

  case FIELDTYPE_ASCII_TO_CODE:
  case FIELDTYPE_DATA_RAW:
    szBuffer = (char *)malloc(5 * sizeof(char));
    memset(szBuffer, 0, 5);
    if (!FillBaseStat(table, row, column, szBuffer, 5))
      (*argv) = JS_UNDEFINED;
    else
      (*argv) = JS_NewString(ctx, szBuffer);

    free(szBuffer);
    return TRUE;

  case FIELDTYPE_MONSTER_COMPS:
    // ..? :E
    return FALSE;
  }
  return FALSE;
}

int JS_ToUnicodeString(JSContext *ctx, wchar_t **target, JSValueConst val)
{
  const char *szVal = JS_ToCString(ctx, val);
  *target = AnsiToUnicode(szVal);
  JS_FreeCString(ctx, szVal);
  return 0;
}

JSValue JS_NewUTF8String(JSContext *ctx, const wchar_t *wsVal)
{
  char *szVal = UnicodeToAnsi(wsVal);
  JSValue val = JS_NewString(ctx, szVal);
  free(szVal);
  return val;
}
