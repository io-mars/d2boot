#include "CommandLine.h"
#include <list>

std::list<sLine *> aCommand;

// Commands.
sLine CLine[] = {{L"-d2c", 0}, {L"-d2x", 0}, {L"-title", 0}, {L"-mpq", 0}, {L"-profile", 0}, {L"-handle", 0}, {L"-multi", 0}, {L"-sleepy", 0}, {L"-cachefix", 0}};

DWORD ParseStringForText(LPCWSTR Source, LPCWSTR text)
{
  WCHAR BUF[PARAM_SIZE];
  memset(BUF, 0x00, PARAM_SIZE * sizeof(BUF[0]));

  for (unsigned int x = 0; x < wcslen(Source); x++)
  {
    if (wcslen(text) + x > wcslen(Source))
      break;

    for (unsigned int y = 0; y < wcslen(text); y++)
    {
      INT cC = Source[x + y];
      memcpy(BUF + wcslen(BUF), (LPWSTR)&cC, sizeof(cC));
    }
    if (!_wcsicmp(BUF, text))
      return x;

    memset(BUF, 0x00, PARAM_SIZE * sizeof(BUF[0]));
  }
  return -1;
}

void ParseCommandLine(LPCWSTR Command)
{
  if (wcslen(Command) <= 0)
    return;

  FreeCommandLine();

  for (unsigned int x = 0; x < ARRAYSIZE(CLine); x++)
  {
    DWORD id = ParseStringForText(Command, CLine[x].Param);
    if (id == (DWORD)-1)
      continue;

    WCHAR szText[VALUE_SIZE];
    BOOL bStart = false;

    memset(szText, 0x00, VALUE_SIZE * sizeof(szText[0]));

    if (!CLine[x].isBool)
    {
      for (unsigned int y = (id + (wcslen(CLine[x].Param))); y < wcslen(Command); y++)
      {
        if (Command[y] == L'"')
        {
          if (bStart)
          {
            bStart = false;
            break;
          }
          else
          {
            bStart = true;
            y++;
          }
        }

        int byt = Command[y];

        if (bStart)
          memcpy(szText + wcslen(szText), (LPWSTR)&byt, sizeof(byt));
      }
    }
    // invoke FreeCommand delete sl
    sLine *sl = new sLine;
    sl->isBool = CLine[x].isBool;
    wcscpy_s(sl->Param, _countof(sl->Param), CLine[x].Param);
    if (!sl->isBool)
      wcscpy_s(sl->szText, _countof(sl->szText), szText);

    aCommand.push_back(sl);
  }
}

sLine *GetCommand(LPCWSTR Param)
{
  for (const auto &item : aCommand)
  {
    if (!_wcsicmp(item->Param, Param))
      return item;
  }

  return nullptr;
}

void FreeCommandLine()
{
  for (sLine *item : aCommand)
  {
    delete item;
  }
  aCommand.clear();
}
