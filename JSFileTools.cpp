#include <stdio.h>
#include <assert.h>
#include "JSFileTools.h"
#include "D2Boot.h"

struct DirectoryData
{
  wchar_t name[_MAX_PATH];
};

/** Get the full path relative to the script path. Does the validation check.
 *
 * \param filename Name of the file to open relative to the script folder.
 * \param bufLen Length of the output buffer.
 * \param fullPath Buffer where the full path will be stored. Empty string if
 *    location is invalid.
 * \return fullPath on success or NULL on failure.
 */
static wchar_t *getPathRelScript(const wchar_t *filename, int bufLen, wchar_t *fullPath)
{
  wchar_t fullScriptPath[_MAX_PATH + _MAX_FNAME];
  wchar_t *relPath;
  int strLenScript;
  DWORD scrPathLen;

  strLenScript = wcslen(Vars.szScriptPath);

  // Make the filename relative to the script path
  // Allocates memory on the stack.
  relPath = (wchar_t *)_alloca((strLenScript + wcslen(filename) + 2) * 2); // *2 for wide chars

  wcscpy_s(relPath, strLenScript + wcslen(filename) + 2, Vars.szScriptPath);
  relPath[strLenScript] = L'\\';
  wcscpy_s(relPath + strLenScript + 1, wcslen(filename) + 1, filename);

  // Transform to the full pathname
  GetFullPathName(relPath, bufLen, fullPath, NULL);

  // Get the full path of the script path, check it is the prefix of fullPath
  scrPathLen = GetFullPathName(Vars.szScriptPath, _MAX_PATH + _MAX_FNAME, fullScriptPath, NULL);

  // Check that fullScriptPath is the prefix of fullPath
  // As GetFullPathName seems to not add a trailing \, if there is not a
  // trailing \ in fullScriptPath check for it in fullPath
  if (wcsncmp(fullPath, fullScriptPath, scrPathLen) != 0 || (fullScriptPath[scrPathLen - 1] != '\\' && fullPath[scrPathLen] != '\\'))
  {
    fullPath[0] = '\0';
    return nullptr;
  }

  return fullPath;
}

/** Safely open a file relative to the script dir.
 *
 * In theory this is the only function used to open files that is exposed to
 * javascript.
 *
 * \param filename Name of the file to open relative to the script folder
 * \param mode Mode to open in. See fopen_s.
 * \param cx JSContext that is running. Used to throw errors.
 * \return The file pointer.
 */
static FILE *fileOpenRelScript(const wchar_t *filename, const wchar_t *mode, JSContext *ctx)
{
  FILE *f;
  wchar_t fullPath[_MAX_PATH + _MAX_FNAME];

  // Get the relative path
  if (getPathRelScript(filename, _MAX_PATH + _MAX_FNAME, fullPath) == NULL)
  {
    JS_ReportError(ctx, "Invalid file name");
    return nullptr;
  }

  // Open the file
  if (_wfopen_s(&f, fullPath, mode) != 0 || f == NULL)
  {
    char message[128];
    _strerror_s(message, 128, NULL);
    JS_ReportError(ctx, "Couldn't open file %ls: %s", filename, message);
    return nullptr;
  }

  return f;
}

/** Check that the full path of the script path is the prefix of the fullpath
 * of name. Also checks that there is no ..\ or ../ sequences or ":?*<>| chars.
 *
 * \param name The file/path to validate.
 * \return true if path is valid, false otherwise.
 */
bool isValidPath(const wchar_t *name)
{
  wchar_t fullPath[_MAX_PATH + _MAX_FNAME];

  // Use getPathRelScript to validate based on full paths
  if (getPathRelScript(name, _MAX_PATH + _MAX_FNAME, fullPath) == NULL)
    return false;

  return (!wcsstr(name, L"..\\") && !wcsstr(name, L"../") && (wcscspn(name, L"\":?*<>|") == wcslen(name)));
}

static int readLine(FILE *fptr, char *buffer)
{
  if (feof(fptr))
    return 0;

  int pos = 0;
  char c = 0;
  // grab all the characters in this line
  do
  {
    c = (char)fgetc(fptr);
    // append the new character unless it's a carriage return
    if (c != '\r' && c != '\n' && !feof(fptr))
    {
      buffer[pos] = c;
      pos++;
    }

  } while (!feof(fptr) && c != '\n');

  buffer[pos] = '\0';
  return pos;
}

static bool writeValue(FILE *fptr, JSContext *ctx, JSValue value, bool isBinary, bool locking)
{
  char *str;
  int len = 0, result;
  uint32_t ival = 0;
  double dval = 0;
  bool bval;

  switch (JS_VALUE_GET_TAG(value))
  {
  case JS_TAG_NULL:
  case JS_TAG_UNDEFINED:
    // if (locking)
    result = fwrite(&ival, sizeof(int), 1, fptr);
    // else
    // result = _fwrite_nolock(&ival, sizeof(int), 1, fptr);
    if (result == 1)
      return true;
    break;
  case JS_TAG_STRING:
  {
    str = (char *)JS_ToCString(ctx, value);
    // if (locking)
    result = fwrite(str, sizeof(char), strlen(str), fptr);
    // else
    // result = _fwrite_nolock(str, sizeof(char), strlen(str), fptr);
    JS_FreeCString(ctx, str);
    return (int)strlen(str) == result;
  }
  break;
  case JS_TAG_INT:
    // MTODO BUG?
    JS_ToUint32(ctx, &ival, value);
    if (isBinary)
    {
      // if (locking)
      result = fwrite(&ival, sizeof(uint32_t), 1, fptr);
      // else
      // result = _fwrite_nolock(&dval, sizeof(uint32_t), 1, fptr);
      return result == 1;
    }
    else
    {
      // MTODO BUG?
      str = (char *)malloc(16 * sizeof(char));
      _itoa_s(ival, str, 16, 10);
      len = strlen(str);
      // if (locking)
      result = fwrite(str, sizeof(char), len, fptr);
      // else
      // result = _fwrite_nolock(str, sizeof(char), len, fptr);
      free(str);
      if (result == len)
        return true;
    }
    break;
  case JS_TAG_FLOAT64:
    JS_ToFloat64(ctx, &dval, value);
    if (isBinary)
    {
      // if (locking)
      result = fwrite(&dval, sizeof(double), 1, fptr);
      // else
      // result = _fwrite_nolock(&dval, sizeof(double), 1, fptr);
      return result == 1;
    }
    else
    {
      // jsdouble will never be a 64-char string, but I'd rather be safe than sorry
      str = (char *)malloc(64 * sizeof(char));
      sprintf_s(str, 64, "%.16f", dval);
      len = strlen(str);
      // if (locking)
      result = fwrite(str, sizeof(char), len, fptr);
      // else
      // result = _fwrite_nolock(str, sizeof(char), len, fptr);
      free(str);
      if (result == len)
        return true;
    }
    break;
  case JS_TAG_BOOL:
    if (!isBinary)
    {
      bval = !!JS_ToBool(ctx, value);
      const char *str = bval ? "true" : "false";
      // if (locking)
      result = fwrite(str, sizeof(char), strlen(str), fptr);
      // else
      // result = _fwrite_nolock(str, sizeof(char), strlen(str), fptr);
      return (int)strlen(str) == result;
    }
    else
    {
      bval = !!JS_ToBool(ctx, value);
      // if (locking)
      result = fwrite(&bval, sizeof(bool), 1, fptr);
      // else
      // result = _fwrite_nolock(&bval, sizeof(bool), 1, fptr);
      return result == 1;
    }
    break;
    /*		case JSTYPE_OBJECT:
                            JSObject *arr = JSVAL_TO_OBJECT(value);
                            if(JS_IsArrayObject(cx, arr)) {
                                    JS_GetArrayLength(cx, arr, &uival);
                                    for(jsuint i = 0; i < uival; i++)
                                    {
                                            jsval val;
                                            JS_GetElement(cx, arr, i, &val);
                                            if(!writeValue(fptr, cx, val, isBinary))
                                                    return false;
                                    }
                                    return true;
                            }
                            else
                            {
                                    JSString* jsstr = JS_ValueToString(cx, value);
                                    str = JS_EncodeString(cx,jsstr);
                                    if(locking)
                                            result = fwrite(str, sizeof(char), strlen(str), fptr);
                                    else
                                            result = _fwrite_nolock(str, sizeof(char), strlen(str), fptr);
                                    return strlen(str) == result;
                            }
                            break;
    */
  }
  return false;
}

static JSClassID filetools_class_id;

static JSClassDef js_filetools_class = {
    "FileTools",
};

static JSValue js_filetools_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_FUNC(filetools_remove)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply a file name");

  wchar_t *file = nullptr;
  JS_ToUnicodeString(ctx, &file, argv[0]);

  wchar_t fullpath[_MAX_PATH + _MAX_FNAME];
  if (getPathRelScript(file, _MAX_PATH + _MAX_FNAME, fullpath) == NULL)
  {
    free(file);
    JS_THROW_ERROR(ctx, "Invalid file name");
  }

  free(file);
  JSValue res = JS_NewBool(ctx, _wremove(fullpath) == 0);
  return res;
}

JSAPI_FUNC(filetools_rename)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply an original file name");

  if (argc < 2 || !JS_IsString(argv[1]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply a new file name");

  wchar_t *orig = nullptr;
  JS_ToUnicodeString(ctx, &orig, argv[0]);

  wchar_t porig[_MAX_PATH + _MAX_FNAME];

  if (getPathRelScript(orig, _MAX_PATH + _MAX_FNAME, porig) == NULL)
  {
    free(orig);
    JS_THROW_ERROR(ctx, "Invalid original file name");
  }
  free(orig);

  wchar_t *newName = nullptr;
  JS_ToUnicodeString(ctx, &newName, argv[1]);

  wchar_t pnewName[_MAX_PATH + _MAX_FNAME];
  if (getPathRelScript(newName, _MAX_PATH + _MAX_FNAME, pnewName) == NULL)
  {
    free(newName);
    JS_THROW_ERROR(ctx, "Invalid new file name");
  }
  free(newName);

  JSValue res = JS_NewBool(ctx, _wrename(porig, pnewName) == 0);
  return res;
}

JSAPI_FUNC(filetools_copy)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply an original file name");

  if (argc < 2 || !JS_IsString(argv[1]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply a new file name");

  wchar_t *orig = nullptr;
  JS_ToUnicodeString(ctx, &orig, argv[0]);

  wchar_t *newName = nullptr;
  JS_ToUnicodeString(ctx, &newName, argv[1]);

  wchar_t pnewName[_MAX_PATH + _MAX_FNAME];
  if (getPathRelScript(newName, _MAX_PATH + _MAX_FNAME, pnewName) == NULL)
  {
    free(orig);
    free(newName);
    JS_THROW_ERROR(ctx, "Invalid new file name");
  }

  bool overwrite = false;

  if (argc > 2 && JS_IsBool(argv[2]))
    overwrite = !!JS_ToBool(ctx, argv[2]);

  if (overwrite && _waccess(pnewName, 0) == 0)
    return JS_FALSE;

  FILE *fptr1 = fileOpenRelScript(orig, L"r", ctx);
  FILE *fptr2 = fileOpenRelScript(newName, L"w", ctx);

  // If fileOpenRelScript failed, it already reported the error
  if (fptr1 == nullptr || fptr2 == nullptr)
    return JS_FALSE;

  while (!feof(fptr1))
  {
    int ch = fgetc(fptr1);
    if (ferror(fptr1))
    {
      free(orig);
      free(newName);
      JS_THROW_ERROR(ctx, _strerror("Read Error"));
      break;
    }
    else
    {
      if (!feof(fptr1))
        fputc(ch, fptr2);

      if (ferror(fptr2))
      {
        free(orig);
        free(newName);
        JS_THROW_ERROR(ctx, _strerror("Write Error"));
        break;
      }
    }
  }
  if (ferror(fptr1) || ferror(fptr2))
  {
    clearerr(fptr1);
    clearerr(fptr2);
    fflush(fptr2);
    fclose(fptr2);
    fclose(fptr1);
    _wremove(pnewName); // delete the partial file so it doesnt look like we succeeded
    free(orig);
    free(newName);
    JS_THROW_ERROR(ctx, _strerror("File copy failed"));
  }

  free(orig);
  free(newName);
  fflush(fptr2);
  fclose(fptr2);
  fclose(fptr1);
  return JS_TRUE;
}

JSAPI_FUNC(filetools_exists)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "Invalid file name");

  wchar_t *file = nullptr;
  JS_ToUnicodeString(ctx, &file, argv[0]);

  wchar_t fullpath[_MAX_PATH + _MAX_FNAME];
  if (getPathRelScript(file, _MAX_PATH + _MAX_FNAME, fullpath) == NULL)
  {
    free(file);
    JS_THROW_ERROR(ctx, "Invalid file name");
  }
  free(file);

  JSValue res = JS_NewBool(ctx, !(_waccess(fullpath, 0) != 0 && errno == ENOENT));
  return res;
}

JSAPI_FUNC(filetools_readText)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply a file name");

  wchar_t *fname = nullptr;
  JS_ToUnicodeString(ctx, &fname, argv[0]);

  FILE *fptr = fileOpenRelScript(fname, L"r", ctx);
  free(fname);

  // If fileOpenRelScript failed, it already reported the error
  if (fptr == nullptr)
    return JS_FALSE;

  unsigned int size, readCount;
  char *contents;

  // Determine file size
  fseek(fptr, 0, SEEK_END);
  size = ftell(fptr);
  rewind(fptr);

  // Allocate and read the string. Need to set last char to \0 since fread
  // doesn't.
  contents = (char *)malloc((size + 1) * sizeof(char));
  readCount = fread(contents, sizeof(char), size, fptr);
  assert(readCount <= size); // Avoid SEGFAULT
  contents[readCount] = 0;
  fclose(fptr);

  // Check to see if we had an error
  if (ferror(fptr))
  {
    free(contents);
    JS_THROW_ERROR(ctx, _strerror("Read failed"));
  }

  int offset = 0;
  if (readCount > 2 && contents[0] == (char)0xEF && contents[1] == (char)0xBB && contents[2] == (char)0xBF)
  { // skip BOM
    offset = 3;
  }

  // return UTF-8 char
  JSValue val = JS_NewString(ctx, contents + offset);
  free(contents);

  return val;
}

JSAPI_FUNC(filetools_readAllLines)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply a file name");

  wchar_t *fname = nullptr;
  JS_ToUnicodeString(ctx, &fname, argv[0]);

  FILE *fptr = fileOpenRelScript(fname, L"r", ctx);
  free(fname);

  // If fileOpenRelScript failed, it already reported the error
  if (fptr == nullptr)
    return JS_FALSE;

  char buffer[1024] = {0};
  int i = 0;
  JSValue arr = JS_NewArray(ctx);

  while (!feof(fptr))
  {
    readLine(fptr, buffer);
    JSValue jsLine = JS_NewString(ctx, buffer);
    JS_DefinePropertyValueUint32(ctx, arr, i, jsLine, JS_PROP_C_W_E);
    i++;
  }
  fclose(fptr);

  // Check to see if we had an error
  if (ferror(fptr))
  {
    JS_THROW_ERROR(ctx, _strerror("Read failed"));
  }

  return arr;
}

JSAPI_FUNC(filetools_writeText)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply a file name");

  EnterCriticalSection(&Vars.cFileSection);

  wchar_t *fname;
  JS_ToUnicodeString(ctx, &fname, argv[0]);

  FILE *fptr = fileOpenRelScript(fname, L"w", ctx);
  free(fname);

  bool result = true;

  // If fileOpenRelScript failed, it already reported the error
  if (fptr == nullptr)
  {
    LeaveCriticalSection(&Vars.cFileSection);
    return JS_FALSE;
  }

  for (int i = 1; i < argc; i++)
    if (!writeValue(fptr, ctx, argv[i], false, true))
      result = false;

  fflush(fptr);
  fclose(fptr);

  LeaveCriticalSection(&Vars.cFileSection);

  return JS_NewBool(ctx, result);
}

JSAPI_FUNC(filetools_appendText)
{
  if (argc < 1 || !JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "You must supply a file name");

  EnterCriticalSection(&Vars.cFileSection);

  wchar_t *fname = nullptr;
  JS_ToUnicodeString(ctx, &fname, argv[0]);

  FILE *fptr = fileOpenRelScript(fname, L"a+", ctx);
  free(fname);

  bool result = true;

  // If fileOpenRelScript failed, it already reported the error
  if (fptr == nullptr)
  {
    LeaveCriticalSection(&Vars.cFileSection);
    return JS_FALSE;
  }

  for (int i = 1; i < argc; i++)
    if (!writeValue(fptr, ctx, argv[i], false, true))
      result = false;

  fflush(fptr);
  fclose(fptr);

  LeaveCriticalSection(&Vars.cFileSection);

  return JS_NewBool(ctx, result);
}

static JSClassID directory_class_id;

static void js_directory_finalizer(JSRuntime *rt, JSValue val)
{
  DirectoryData *pDirectory = (DirectoryData *)JS_GetOpaque(val, directory_class_id);
  if (pDirectory)
  {
    js_free_rt(rt, pDirectory);
  }
}

static JSClassDef js_directory_class = {
    "Directory",
    .finalizer = js_directory_finalizer,

};

static JSValue js_directory_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv)
{
  return JS_EXCEPTION;
}

JSAPI_FUNC(directory_open)
{
  if (argc != 1)
    JS_THROW_SINGLE_LINE(ctx, "Invalid path name");

  wchar_t *name = nullptr;
  JS_ToUnicodeString(ctx, &name, argv[0]);

  if (!isValidPath(name))
  {
    free(name);
    JS_THROW_ERROR(ctx, "The following path was deemed invalid: %ls.", name);
  }

  wchar_t path[_MAX_PATH];
  swprintf_s(path, _MAX_PATH, L"%ls\\%ls", Vars.szScriptPath, name);
  free(name);

  if ((_wmkdir(path) == -1) && (errno == ENOENT))
  {
    JS_THROW_ERROR(ctx, "Couldn't make directory %ls.", path);
  }
  else
  {
    DirectoryData *pDirectory = (DirectoryData *)js_mallocz(ctx, sizeof(*pDirectory));
    wcscpy_s(pDirectory->name, _MAX_PATH, path);

    JSValue val = BuildObject(ctx, directory_class_id, pDirectory);
    if (JS_IsException(val))
    {
      js_free(ctx, pDirectory);
      pDirectory = nullptr;
      JS_THROW_ERROR(ctx, "Failed to build Directory object!");
    }

    return val;
  }

  return JS_FALSE;
}

JSAPI_FUNC(directory_create)
{
  if (!JS_IsString(argv[0]))
    JS_THROW_SINGLE_LINE(ctx, "No path passed to dir.create()");

  wchar_t *name = nullptr;
  JS_ToUnicodeString(ctx, &name, argv[0]);

  if (!isValidPath(name))
  {
    free(name);
    JS_THROW_ERROR(ctx, "The following path was deemed invalid: %ls.", name);
  }

  DirectoryData *pDirectory = (DirectoryData *)JS_GetOpaque(this_val, directory_class_id);

  wchar_t path[_MAX_PATH];
  swprintf_s(path, _MAX_PATH, L"%ls\\%ls", pDirectory->name, name);
  free(name);

  if (_wmkdir(path) == -1 && (errno == ENOENT))
  {
    JS_THROW_ERROR(ctx, "Couldn't create directory %ls", path);
  }
  else
  {
    DirectoryData *pDirectory = (DirectoryData *)js_mallocz(ctx, sizeof(*pDirectory));
    wcscpy_s(pDirectory->name, _MAX_PATH, path);

    JSValue val = BuildObject(ctx, directory_class_id, pDirectory);
    if (JS_IsException(val))
    {
      js_free(ctx, pDirectory);
      pDirectory = nullptr;
      JS_THROW_ERROR(ctx, "Failed to build Directory object!");
    }

    return val;
  }

  return JS_FALSE;
}

JSAPI_PGM(directory_propert_name)
{
  DirectoryData *pData = (DirectoryData *)JS_GetOpaque(this_val, directory_class_id);
  if (!pData)
    return JS_FALSE;
  return JS_NewUTF8String(ctx, pData->name);
}

static const JSCFunctionListEntry js_directory_funcs[] = {
    JS_CFUNC_DEF("open", 1, directory_open),
};

static const JSCFunctionListEntry js_directory_proto_funcs[] = {
    JS_CGETSET_MAGIC_DEF("name", directory_propert_name, NULL, 0),
    JS_CFUNC_DEF("create", 1, directory_create),
};

static const JSCFunctionListEntry js_filetools_funcs[] = {
    JS_CFUNC_DEF("remove", 1, filetools_remove),
    JS_CFUNC_DEF("rename", 2, filetools_rename),
    JS_CFUNC_DEF("copy", 2, filetools_copy),
    JS_CFUNC_DEF("exists", 1, filetools_exists),
    JS_CFUNC_DEF("readText", 1, filetools_readText),
    JS_CFUNC_DEF("writeText", 2, filetools_writeText),
    JS_CFUNC_DEF("appendText", 2, filetools_appendText),
    JS_CFUNC_DEF("readAllLines", 1, filetools_readAllLines),
    JS_OBJECT_DEF("Directory", js_directory_funcs, ARRAYSIZE(js_directory_funcs), JS_PROP_CONFIGURABLE),
};

// static const JSCFunctionListEntry js_filetools_proto_funcs[] = {};

int js_module_filetools_init(JSContext *ctx, JSModuleDef *m)
{
  // for directory class
  JS_NewClassID(&directory_class_id);
  JS_NewClass(JS_GetRuntime(ctx), directory_class_id, &js_directory_class);

  JSValue directory_proto, directory_class;
  directory_class = JS_NewCFunction2(ctx, js_directory_ctor, "Directory", 0, JS_CFUNC_constructor, 0);
  directory_proto = JS_NewObject(ctx);

  JS_SetConstructor(ctx, directory_class, directory_proto);
  JS_SetClassProto(ctx, directory_class_id, directory_proto);

  // set proto function
  JS_SetPropertyFunctionList(ctx, directory_proto, js_directory_proto_funcs, ARRAYSIZE(js_directory_proto_funcs));

  /* create the party class */
  JS_NewClassID(&filetools_class_id);
  JS_NewClass(JS_GetRuntime(ctx), filetools_class_id, &js_filetools_class);

  JSValue filetools_proto, filetools_class;
  filetools_proto = JS_NewObject(ctx);
  filetools_class = JS_NewCFunction2(ctx, js_filetools_ctor, "FileTools", 0, JS_CFUNC_constructor, 0);
  // only set class function
  JS_SetPropertyFunctionList(ctx, filetools_class, js_filetools_funcs, ARRAYSIZE(js_filetools_funcs));

  JS_SetConstructor(ctx, filetools_class, filetools_proto);
  JS_SetClassProto(ctx, filetools_class_id, filetools_proto);

  JS_SetModuleExport(ctx, m, "FileTools", filetools_class);

  // export here for free directory_proto
  JS_SetModuleExport(ctx, m, "Directory", directory_class);

  return TRUE;
}

int js_module_filetools_export(JSContext *ctx, JSModuleDef *m)
{
  JS_AddModuleExport(ctx, m, "FileTools");

  return TRUE;
}
