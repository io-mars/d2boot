#pragma once
#ifndef __EVENTS_H__
#define __EVENTS_H__

#include <windows.h>

enum event_meta_id
{
  EM_FIRST,
  EM_ITEMACTION,
  EM_SCRIPTMSG,
  EM_GAMEEVENT,
  EM_COPYDATA,
  EM_MOUSEMOVE,
  EM_MOUSECLICK,
  EM_CHATMSG,
  EM_CHATMSGBLOCKER,
  EM_CHATINPUT,
  EM_CHATINPUTBLOCKER,
  EM_WHISPERMSG,
  EM_WHISPERMSGBLOCKER,
  EM_KEYUP,
  EM_KEYDOWN,
  EM_KEYDOWNBLOCKER,
  EM_MEMANA,
  EM_MELIFE,
  EM_PLAYERASSIGN,
  EM_GAMEPACKET,
  EM_GAMEPACKETSENT,
  EM_REALMPACKET,
  EM_LAST
};

enum event_arg_mode
{
  EAM_CHAR = 0,
  EAM_BYTE
};

struct EventMeta
{
  const unsigned int id;
  const char *name;
  const bool blocked;
  const bool every;
  // event_arg_mode
  const unsigned int mode;
};

class Script;
struct Event
{
  Script *owner;
  const EventMeta *meta;
  unsigned int argc;
  void *argv;
  unsigned long size;
  void *result;
  Event();
  ~Event();
};
const EventMeta *GetEventMeta(const char *name);

bool KeyDownUpEvent(const WPARAM bByte, const BYTE bUp);
void MouseMoveEvent(const POINT pt);
void MouseClickEvent(const int button, const POINT pt, const bool bUp);

void CopyDataEvent(const DWORD dwMode, const wchar_t *lpszMsg);
void GameActionEvent(const BYTE mode, const DWORD param1, const DWORD param2, const char *name1, const wchar_t *name2);
void PlayerAssignEvent(const DWORD dwUnitId);
// void GameMsgEvent(const char *lpszMsg);

bool ChatEvent(const char *lpszNick, const wchar_t *lpszMsg);
bool ChatInputEvent(const wchar_t *lpszMsg);
bool WhisperEvent(const char *lpszNick, const wchar_t *lpszMsg);
void LifeEvent(const DWORD dwLife);
void ManaEvent(const DWORD dwMana);
void ItemActionEvent(const DWORD GID, const char *Code, const BYTE Mode, const bool Global);
// void GoldDropEvent(const DWORD GID, const BYTE Mode);

bool GamePacketEvent(const BYTE *pPacket, const DWORD dwSize);
bool GamePacketSentEvent(const BYTE *pPacket, const DWORD dwSize);
bool RealmPacketEvent(const BYTE *pPacket, const DWORD dwSize);

void ScriptBroadcastEvent(const unsigned int argc, const char *argv);

struct EachHelper
{
  const EventMeta *meta;
};

struct StopEventHelper : EachHelper
{
  const bool force;
};

#endif