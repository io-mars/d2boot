#include "D2NetHandlers.h"
#include "Events.h"
#include "D2Boot.h"
#include "Helpers.h"
#include "D2Ptrs.h"
#include "Constants.h"
#include "MPQStats.h"

DWORD ReassignPlayerHandler(BYTE *pPacket, DWORD dwSize)
{
  if (*(LPDWORD)&pPacket[2] == D2CLIENT_GetPlayerUnit()->dwUnitId)
    pPacket[10] = 0;

  return TRUE;
}

DWORD HPMPUpdateHandler(BYTE *pPacket, DWORD dwSize)
{
  WORD Life = *(WORD *)&pPacket[1];
  WORD Mana = *(WORD *)&pPacket[3];

  if ((Life & 0x8000) == 0x8000)
  {
    Life ^= 0x8000;
  }
  if ((Mana & 0x8000) == 0x8000)
  {
    Mana ^= 0x8000;
  }
  if ((Mana & 0x4000) == 0x4000)
  {
    Mana ^= 0x4000;
  }
  Mana *= 2;

  static WORD SaveLife = 0;
  if (SaveLife != Life)
  {
    SaveLife = Life;
    LifeEvent(Life);
  }

  static WORD SaveMana = 0;
  if (SaveMana != Mana)
  {
    SaveMana = Mana;
    ManaEvent(Mana);
  }

  return TRUE;
}

DWORD ChatEventHandler(BYTE *pPacket, DWORD dwSize)
{
  char *pName = (char *)pPacket + 10;
  char *pMessage = (char *)pPacket + strlen(pName) + 11;

  ToColorString(pMessage);

  wchar_t *uc = AnsiToUnicode(pMessage, CP_ACP);

  if (Vars.bDontCatchNextMsg)
    Vars.bDontCatchNextMsg = FALSE;

  DWORD result = !(ChatEvent(pName, uc));

  free(uc);

  return result;
}

DWORD NPCTransactionHandler(BYTE *pPacket, DWORD dwSize)
{
  char code[5] = "";
  BYTE mode = pPacket[0x02]; // [BYTE Result - 0x00 =  Purchased || 0x01 = Sold || 0x0c = Insuffecient Gold]
  DWORD gid = *(DWORD *)(pPacket + 0x07);

  ItemActionEvent(gid, code, (100 + mode), false);

  return TRUE;
}

DWORD EventMessagesHandler(BYTE *pPacket, DWORD dwSize)
{
  // packet breakdown: http://www.edgeofnowhere.cc/viewtopic.php?t=392307
  BYTE mode = pPacket[1];
  DWORD param1 = *(DWORD *)(pPacket + 3);
  BYTE param2 = pPacket[7];
  char name1[16] = "", name2[28] = "";
  strcpy_s(name1, 16, (char *)pPacket + 8);
  strcpy_s(name2, 16, (char *)pPacket + 24);
  wchar_t *wname2 = NULL;

  const char *tables[3] = {"", "monstats", "objects"};
  const char *columns[3] = {"", "NameStr", "Name"};

  switch (mode)
  {
  case 0x06: // name1 slain by name2
    /*BYTE Param2 = Unit Type of Slayer (0x00 = Player, 0x01 = NPC)
      if Type = NPC, DWORD Param1 = Monster Id Code from MPQ (points to string for %Name2)*/
    if (param2 == UNIT_MONSTER || param2 == UNIT_OBJECT)
    {
      WORD localeId;
      FillBaseStat(tables[param2], param1, columns[param2], &localeId, sizeof(WORD));
      wname2 = D2LANG_GetLocaleText(localeId);
    }
    break;
  case 0x07: // player relation
    for (RosterUnit *player = *p_D2CLIENT_PlayerUnitList; player != NULL; player = player->pNext)
      if (player->dwUnitId == param1)
        strcpy_s(name1, 16, player->szName);
    switch (param2)
    {
    case 0x03: // hostile
      if (Vars.bQuitOnHostile)
        D2CLIENT_ExitGame();
      break;
    }
    break;
  case 0x11: // %Param1 Stones of Jordan Sold to Merchants
  case 0x12: // Diablo Walks the Earth
    wname2 = (wchar_t *)malloc(60);
    wcscpy(wname2, mode == 0x11 ? L"Stones of Jordan Sold to Merchants" : L"Diablo Walks the Earth");
    break;

  case 0x0a: // name1 has items in his box
    if (name1[0] == 0)
      strcpy_s(name1, 16, "You");
    break;
  }

  if (!wname2)
  {
    wname2 = AnsiToUnicode(name2, CP_ACP);
    GameActionEvent(mode, param1, param2, name1, wname2);
  }
  else
  {
    GameActionEvent(mode, param1, param2, name1, wname2);
  }

  free(wname2);

  return TRUE;
}

DWORD ItemActionHandler(BYTE *pPacket, DWORD dwSize)
{
  // HexDump(pPacket, dwSize);
  INT64 icode = 0;
  char code[5] = "";
  BYTE mode = pPacket[1];
  DWORD gid = *(DWORD *)&pPacket[4];
  BYTE dest = ((pPacket[13] & 0x1C) >> 2);

  switch (dest)
  {
  case 0:
  case 2:
    // TODO: fix this code later by changing the way it's parsed
    if (mode == 5)
      icode = *(INT64 *)(pPacket + 17) >> 0x1C;
    else
      icode = *(INT64 *)(pPacket + 15) >> 0x04;
    break;
  case 3:
  case 4:
  case 6:
    if (!((mode == 0 || mode == 2) && dest == 3))
    {
      if (mode != 0xD && mode != 0xF && mode != 1 && mode != 12)
        icode = *(INT64 *)(pPacket + 17) >> 0x1C;
      else
        icode = *(INT64 *)(pPacket + 15) >> 0x04;
    }
    else
      icode = *(INT64 *)(pPacket + 17) >> 0x05;
    break;
  default:
    break;
  }

  // Converting and Cleaning
  memcpy(code, &icode, 4);
  if (code[3] == ' ')
    code[3] = '\0';

  /*if(strcmp(code, "gld") == 0)
          GoldDropEvent(gid, mode);
  else*/
  ItemActionEvent(gid, code, mode, (pPacket[0] == 0x9d));

  return TRUE;
}

DWORD DelayedStateHandler(BYTE *pPacket, DWORD dwSize)
{
  if (pPacket[6] == AFFECT_JUST_PORTALED)
    return FALSE;

  return TRUE;
}

DWORD HirelingIdHandler(BYTE *pPacket, DWORD dwSize)
{
  // Assign Merc
  // 81 [BYTE Hireing type] [WORD Merc Kind] [DWORD Owner Id] [DWORD Merc Id] [DWORD nSeed] [DWORD wName]
  // 81          07               5201        01 00 00 00      01 00 00 00     83 95 76 20  0E 04 00 00

  BYTE nHirelingType = pPacket[1];

  if (nHirelingType != 7)
    return TRUE;

  if (*(DWORD *)&pPacket[4] != D2CLIENT_GetPlayerUnit()->dwUnitId)
    return TRUE;

  WORD nHirelingId = *(WORD *)&pPacket[18];

  // just handle the patch package
  if (Vars.dwHirelingId != nHirelingId)
    Vars.dwHirelingId = nHirelingId;

  if (nHirelingId)
  {
    pPacket[18] = 0;
    pPacket[19] = 0;
  }
  return TRUE;
}
