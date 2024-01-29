#include "Events.h"
#include "ScriptEngine.h"
#include "D2Boot.h"

#define EVENT_TIMEOUT 500

static const EventMeta eMetas[]{
    {EM_ITEMACTION, "itemaction", false, false, EAM_CHAR},
    {EM_SCRIPTMSG, "scriptmsg", false, false, EAM_CHAR},
    {EM_GAMEEVENT, "gameevent", false, false, EAM_CHAR},
    {EM_COPYDATA, "copydata", false, false, EAM_CHAR},
    {EM_MOUSEMOVE, "mousemove", false, false, EAM_CHAR},
    {EM_MOUSECLICK, "mouseclick", false, false, EAM_CHAR},
    {EM_CHATMSG, "chatmsg", false, false, EAM_CHAR},
    {EM_CHATMSGBLOCKER, "chatmsgblocker", true, false, EAM_CHAR},
    {EM_CHATINPUT, "chatinput", false, false, EAM_CHAR},
    {EM_CHATINPUTBLOCKER, "chatinputblocker", true, false, EAM_CHAR},
    {EM_WHISPERMSG, "whispermsg", false, false, EAM_CHAR},
    {EM_WHISPERMSGBLOCKER, "whispermsgblocker", true, false, EAM_CHAR},
    {EM_KEYUP, "keyup", false, false, EAM_CHAR},
    {EM_KEYDOWN, "keydown", false, false, EAM_CHAR},
    {EM_KEYDOWNBLOCKER, "keydownblocker", true, false, EAM_CHAR},
    {EM_MEMANA, "memana", false, false, EAM_CHAR},
    {EM_MELIFE, "melife", false, false, EAM_CHAR},
    {EM_PLAYERASSIGN, "playerassign", false, false, EAM_CHAR},
    {EM_GAMEPACKET, "gamepacket", false, false, EAM_BYTE},
    {EM_GAMEPACKETSENT, "gamepacketsent", false, false, EAM_BYTE},
    {EM_REALMPACKET, "realmpacket", false, false, EAM_BYTE},
};

//
#define EM(id) (id > EM_FIRST && id < EM_LAST) ? &eMetas[id - 1] : nullptr

struct Eventer
{
  Script *script;
  const EventMeta *meta;
  const unsigned int argc;
  const char *format;
  unsigned int timeout;
  // dont need now. just left here
  const unsigned int mode;
};

struct SingleArgHelper : EachHelper
{
  const DWORD arg1;
};

struct DoubleArgHelper : EachHelper
{
  const DWORD arg1, arg2;
};

struct TripleArgHelper : EachHelper
{
  const DWORD arg1, arg2, arg3;
};
struct QuadArgHelper : EachHelper
{
  const DWORD arg1, arg2, arg3, arg4;
};

struct ChatEventHelper : EachHelper
{
  const char *nick;
  const wchar_t *msg;
};

struct KeyEventHelper : EachHelper
{
  const BOOL up;
  const WPARAM key;
};

struct PacketEventHelper : EachHelper
{
  const BYTE *pPacket;
  const DWORD dwSize;
};

struct BCastEventHelper : EachHelper
{
  const unsigned int argc;
  const char *argv;
};

struct CopyDataHelper : EachHelper
{
  const DWORD mode;
  const wchar_t *msg;
};

struct ItemEventHelper : EachHelper
{
  const DWORD id;
  const char *code;
  const WORD mode;
  const bool global;
};

struct GameActionEventHelper : EachHelper
{
  const BYTE mode;
  const DWORD param1, param2;
  const char *name1;
  const wchar_t *name2;
};

Event::Event() : meta(nullptr), argc(0), argv(nullptr), size(0), result(nullptr)
{
}

Event::~Event()
{
  meta = nullptr;
  delete (bool *)result;
  result = nullptr;
  free(argv);
  argv = nullptr;
}

const EventMeta *GetEventMeta(const char *name)
{
  for (EventMeta em : eMetas)
  {
    if (_stricmp(em.name, name) == 0)
      // NOTE:the EM_FIRST is zero, so index is:id -1,
      return &eMetas[em.id - 1];
  }
  return nullptr;
}

void ReleaseGameLock(void)
{
  if (Vars.bGameLoopEntered && Vars.dwGameThreadId == GetCurrentThreadId())
    LeaveCriticalSection(&Vars.cGameLoopSection);
}

void TakeGameLock(void)
{
  if (Vars.bGameLoopEntered && Vars.dwGameThreadId == GetCurrentThreadId())
    EnterCriticalSection(&Vars.cGameLoopSection);
}

// only eMetas's event Fire, find/stop/DisposeMe can't arrive here!
static bool FireMetaEventInner(Eventer *eventer, ...)
{
  bool result = false;

  if (!eventer || !eventer->script || !eventer->meta || !eventer->meta->name ||
      !eventer->script->IsRunning() ||
      !eventer->script->IsListenerRegistered(eventer->meta->name))
    return false;

  Event *evt = new Event;
  evt->owner = eventer->script;
  evt->meta = eventer->meta;
  evt->argc = eventer->argc;

  va_list vaArgs;
  va_start(vaArgs, eventer);

  switch (eventer->meta->mode)
  {
  case EAM_BYTE:
    evt->size = va_arg(vaArgs, long);
    // just evt->size, no need +1
    evt->argv = malloc((evt->size) * sizeof(char));
    memcpy(evt->argv, va_arg(vaArgs, BYTE *), evt->size);
    break;

  default:
    // !!need free argv!! after ExecScriptEvent, ~Event free argv again!
    evt->size = FormatString((char **)&evt->argv, eventer->format, vaArgs);
    break;
  }

  va_end(vaArgs);

  // DEBUG_LOG("--QQQ--FireMetaEvent--meta:id:[%d] name:[%s] blocked:[%d] --event mode:[%d] timeout:[%d] argv:[%s]",
  //           evt->meta->id, evt->meta->name, evt->meta->blocked, eventer->mode, eventer->timeout, (char *)evt->argv);

  if (GetCurrentThreadId() == evt->owner->threadId)
  {
    ExecScriptEvent(evt, false);

    if (eventer->meta->blocked)
    {
      // clear the signal first
      ResetEvent(Vars.eventSignal);
      result = *(DWORD *)evt->result;

      // delete here
      delete (DWORD *)evt->result;
      evt->result = nullptr;

      delete evt;
      evt = nullptr;

      return result;
    }

    // no blocked event just return false;
    return false;
  }

  if (eventer->meta->blocked)
  {
    // evt->result = new DWORD(false);
    ResetEvent(Vars.eventSignal);
  }

  // FIRE NOW!!
  eventer->script->FireEvent(evt);

  if (eventer->meta->blocked)
  {
    static DWORD dwResult;

    // MTODO for TimerProc??
    // ReleaseGameLock();

    dwResult = WaitForSingleObject(Vars.eventSignal, eventer->timeout);

    // TakeGameLock();

    // MTODO Leak evt??
    if (dwResult == WAIT_TIMEOUT)
      return false;

    result = *(DWORD *)evt->result;

    delete (DWORD *)evt->result;
    evt->result = nullptr;

    delete evt;
    evt = nullptr;
  }

  return result;
}

bool __fastcall LifeEventCallback(Script *script, void *helper, unsigned int argc)
{
  SingleArgHelper *argHelper = (SingleArgHelper *)helper;

  Eventer eventer = {script, argHelper->meta, argc, "%ld"};
  FireMetaEventInner(&eventer, argHelper->arg1);

  return true;
}

void LifeEvent(const DWORD dwLife)
{
  SingleArgHelper helper = {EM(EM_MELIFE), dwLife};
  ScriptEngine::ForEachScript(LifeEventCallback, &helper, 1);
}

bool __fastcall ManaEventCallback(Script *script, void *helper, unsigned int argc)
{
  SingleArgHelper *argHelper = (SingleArgHelper *)helper;

  Eventer eventer = {script, argHelper->meta, argc, "%ld"};
  FireMetaEventInner(&eventer, argHelper->arg1);

  return true;
}

void ManaEvent(const DWORD dwMana)
{
  SingleArgHelper helper = {EM(EM_MEMANA), dwMana};
  ScriptEngine::ForEachScript(ManaEventCallback, &helper, 1);
}

bool __fastcall ChatEventCallback(Script *script, void *helper, unsigned int argc)
{
  bool block = false;
  ChatEventHelper *chatHelper = (ChatEventHelper *)helper;

  Eventer eventer = {script, chatHelper->meta, argc};
  switch (chatHelper->meta->id)
  {
  case EM_CHATMSG:
    eventer.format = "{\"nick\":\"%s\",\"msg\":\"%s\"}";
    break;
  case EM_CHATINPUT:
    eventer.format = "{\"speaker\":\"%s\",\"msg\":\"%s\"}";
    break;
  case EM_WHISPERMSG:
    eventer.format = "{\"speaker\":\"%s\",\"msg\":\"%s\"}";
    break;
  }

  // for color 0xFF --> 0xbfc3  to UTF-8
  char *utf8String = UnicodeToAnsi(chatHelper->msg);
  StringReplaceChar(utf8String, '"', '\'', strlen(utf8String));

  FireMetaEventInner(&eventer, chatHelper->nick, utf8String);

  // call blocker now
  switch (chatHelper->meta->id)
  {
  case EM_CHATMSG:
    eventer.meta = EM(EM_CHATMSGBLOCKER);
    break;
  case EM_CHATINPUT:
    eventer.meta = EM(EM_CHATINPUTBLOCKER);
    break;
  case EM_WHISPERMSG:
    eventer.meta = EM(EM_WHISPERMSGBLOCKER);
    break;
  }
  eventer.timeout = EVENT_TIMEOUT;

  block = FireMetaEventInner(&eventer, chatHelper->nick, utf8String);
  free(utf8String);
  return block;
}

bool ChatEvent(const char *lpszNick, const wchar_t *lpszMsg)
{
  ChatEventHelper helper = {EM(EM_CHATMSG), lpszNick, lpszMsg};
  return ScriptEngine::ForEachScript(ChatEventCallback, &helper, 2, true);
}

bool ChatInputEvent(const wchar_t *lpszMsg)
{
  ChatEventHelper helper = {EM(EM_CHATINPUT), "me", lpszMsg};
  return ScriptEngine::ForEachScript(ChatEventCallback, &helper, 2, true);
}

bool WhisperEvent(const char *lpszNick, const wchar_t *lpszMsg)
{
  ChatEventHelper helper = {EM(EM_WHISPERMSG), lpszNick, lpszMsg};
  return ScriptEngine::ForEachScript(ChatEventCallback, &helper, 2, true);
}

bool __fastcall KeyEventCallback(Script *script, void *helper, unsigned int argc)
{
  bool block = false;
  KeyEventHelper *keyHelper = (KeyEventHelper *)helper;
  Eventer eventer = {script, keyHelper->meta, argc, "%ld"};
  FireMetaEventInner(&eventer, keyHelper->key);

  // call blocker now
  if (keyHelper->meta->id == EM_KEYDOWN)
  {
    eventer.meta = EM(EM_KEYDOWNBLOCKER);
    eventer.timeout = EVENT_TIMEOUT;
    block = FireMetaEventInner(&eventer, keyHelper->key);
  }

  return block;
}

bool KeyDownUpEvent(const WPARAM key, const BYTE bUp)
{
  KeyEventHelper helper = {bUp ? EM(EM_KEYUP) : EM(EM_KEYDOWN), bUp, key};
  return ScriptEngine::ForEachScript(KeyEventCallback, &helper, 2, true);
}

bool __fastcall CopyDataCallback(Script *script, void *helper, unsigned int argc)
{
  CopyDataHelper *copyHelper = (CopyDataHelper *)helper;

  Eventer eventer = {script, copyHelper->meta, argc};

  if (copyHelper->msg[0] == '{')
    eventer.format = "{\"mode\":%ld,\"msg\":%s}";
  else
    eventer.format = "{\"mode\":%ld,\"msg\":\"%s\"}";

  char *utf8String = UnicodeToAnsi(copyHelper->msg);
  FireMetaEventInner(&eventer, copyHelper->mode, utf8String);
  free(utf8String);

  return true;
}

void CopyDataEvent(const DWORD dwMode, const wchar_t *lpszMsg)
{
  CopyDataHelper helper = {EM(EM_COPYDATA), dwMode, lpszMsg};
  ScriptEngine::ForEachScript(CopyDataCallback, &helper, 2);
}

bool __fastcall MouseClickCallback(Script *script, void *helper, unsigned int argc)
{
  QuadArgHelper *clickHelper = (QuadArgHelper *)helper;

  Eventer eventer = {script, clickHelper->meta, argc};
  eventer.format = "{\"button\":%ld,\"x\":%ld,\"y\":%ld,\"bUp\":%ld}";
  FireMetaEventInner(&eventer, clickHelper->arg1, clickHelper->arg2, clickHelper->arg3, clickHelper->arg4);

  return true;
}

void MouseClickEvent(const int button, const POINT pt, const bool bUp)
{
  QuadArgHelper helper = {EM(EM_MOUSECLICK), (DWORD)button, (DWORD)pt.x, (DWORD)pt.y, bUp};
  ScriptEngine::ForEachScript(MouseClickCallback, &helper, 4);
}

bool __fastcall MouseMoveCallback(Script *script, void *helper, unsigned int argc)
{
  DoubleArgHelper *moveHelper = (DoubleArgHelper *)helper;

  Eventer eventer = {script, moveHelper->meta, argc, "{\"x\":%ld,\"y\":%ld}"};
  FireMetaEventInner(&eventer, moveHelper->arg1, moveHelper->arg2);

  return true;
}

void MouseMoveEvent(const POINT pt)
{
  if (pt.x < 1 || pt.y < 1)
    return;

  DoubleArgHelper helper = {EM(EM_MOUSEMOVE), (DWORD)pt.x, (DWORD)pt.y};
  ScriptEngine::ForEachScript(MouseMoveCallback, &helper, 2);
}

bool __fastcall PlayerAssignCallback(Script *script, void *helper, unsigned int argc)
{
  SingleArgHelper *assignHelper = (SingleArgHelper *)helper;
  Eventer eventer = {script, assignHelper->meta, false, "%ld"};
  FireMetaEventInner(&eventer, assignHelper->arg1);

  return true;
}

void PlayerAssignEvent(const DWORD dwUnitId)
{
  SingleArgHelper helper = {EM(EM_PLAYERASSIGN), dwUnitId};
  ScriptEngine::ForEachScript(PlayerAssignCallback, &helper, 1);
}

bool __fastcall ItemEventCallback(Script *script, void *helper, unsigned int argc)
{
  ItemEventHelper *itemHelper = (ItemEventHelper *)helper;

  Eventer eventer = {script, itemHelper->meta, argc};

  // gid, mode, code, global
  eventer.format = "{\"gid\":%ld,\"code\":\"%s\",\"mode\":%d,\"global\":%s}";
  FireMetaEventInner(&eventer, itemHelper->id, itemHelper->code, itemHelper->mode, itemHelper->global ? "true" : "false");

  return true;
}

void ItemActionEvent(const DWORD GID, const char *Code, const BYTE Mode, const bool Global)
{
  ItemEventHelper helper = {EM(EM_ITEMACTION), GID, Code, Mode, Global};
  ScriptEngine::ForEachScript(ItemEventCallback, &helper, 4);
}

bool __fastcall GameActionEventCallback(Script *script, void *helper, unsigned int argc)
{
  GameActionEventHelper *gameHelper = (GameActionEventHelper *)helper;

  Eventer eventer = {script, gameHelper->meta, argc};
  eventer.format = "{\"mode\":%d,\"param1\":%ld,\"param2\":%ld,\"name1\":\"%s\",\"name2\":\"%s\"}";

  char *utf8String = UnicodeToAnsi(gameHelper->name2);
  FireMetaEventInner(&eventer, gameHelper->mode, gameHelper->param1, gameHelper->param2, gameHelper->name1, utf8String);
  free(utf8String);

  return true;
}

void GameActionEvent(const BYTE mode, const DWORD param1, const DWORD param2, const char *name1, const wchar_t *name2)
{
  GameActionEventHelper helper = {EM(EM_GAMEEVENT), mode, param1, param2, name1, name2};
  ScriptEngine::ForEachScript(GameActionEventCallback, &helper, 5);
}

bool __fastcall PacketEventCallback(Script *script, void *helper, unsigned int argc)
{
  PacketEventHelper *packetHelper = (PacketEventHelper *)helper;

  // the mode set 1
  // Eventer eventer = {script, packetHelper->meta, argc, "{\"data\":[%s],\"size\":%ld}", 500, 1};
  Eventer eventer = {script, packetHelper->meta, argc, "bytes", EVENT_TIMEOUT, EAM_BYTE};

  // char *szArray = ByteToArray(packetHelper->pPacket, packetHelper->dwSize);
  bool result = FireMetaEventInner(&eventer, packetHelper->dwSize, packetHelper->pPacket);

  // free(szArray);
  return result;
}

bool GamePacketEvent(const BYTE *pPacket, const DWORD dwSize)
{
  PacketEventHelper helper = {EM(EM_GAMEPACKET), pPacket, dwSize};
  return ScriptEngine::ForEachScript(PacketEventCallback, &helper, 3);
}

bool GamePacketSentEvent(const BYTE *pPacket, const DWORD dwSize)
{
  PacketEventHelper helper = {EM(EM_GAMEPACKETSENT), pPacket, dwSize};
  return ScriptEngine::ForEachScript(PacketEventCallback, &helper, 3);
}

bool RealmPacketEvent(const BYTE *pPacket, const DWORD dwSize)
{
  PacketEventHelper helper = {EM(EM_REALMPACKET), pPacket, dwSize};
  return ScriptEngine::ForEachScript(PacketEventCallback, &helper, 3);
}

bool __fastcall BCastEventCallback(Script *script, void *helper, unsigned int argc)
{
  BCastEventHelper *castHelper = (BCastEventHelper *)helper;

  Eventer eventer = {script, castHelper->meta, argc, "%s"};
  FireMetaEventInner(&eventer, castHelper->argv);

  return true;
}

void ScriptBroadcastEvent(const unsigned int argc, const char *argv)
{
  BCastEventHelper helper = {EM(EM_SCRIPTMSG), argc, argv};
  ScriptEngine::ForEachScript(BCastEventCallback, &helper, argc);
}