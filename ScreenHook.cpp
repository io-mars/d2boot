#include "algorithm"
#include "vector"

#include "ScreenHook.h"
#include "D2Ptrs.h"
#include "D2Boot.h"

// using namespace std;
bool Genhook::init = false;
HookList Genhook::visible = HookList();
HookList Genhook::invisible = HookList();
CRITICAL_SECTION Genhook::globalSection = {0};

void DrawLogo(void)
{
  static wchar_t version[] = L"D2Boot " D2BOOT_VERSION;
  static int len = CalculateTextLen(version, 0).x;
  int dx = GetScreenSize().x - len - 1;
  int dy = GetScreenSize().y - 1;
  myDrawText(version, dx, dy, 4, 0);
}

bool __fastcall DrawHook(Genhook *hook, void *argv, UINT argc)
{
  if ((hook->GetGameState() == (ScreenhookState)(int)argv || hook->GetGameState() == Perm) &&
      (!hook->GetIsAutomap() || (hook->GetIsAutomap() && *p_D2CLIENT_AutomapOn)))
    hook->Draw();
  return true;
}

bool zOrderSort(Genhook *first, Genhook *second)
{
  return first->GetZOrder() < second->GetZOrder();
}

Genhook::Genhook(UINT x, UINT y, USHORT nopacity, bool nisAutomap, Align nalign, ScreenhookState ngameState)
    : opacity(nopacity), isAutomap(nisAutomap), alignment(nalign), gameState(ngameState), isVisible(true), zorder(1)
{
  location.x = x;
  location.y = y;

  EnterCriticalSection(&globalSection);
  visible.push_back(this);
  LeaveCriticalSection(&globalSection);
}

Genhook::~Genhook(void)
{
  EnterCriticalSection(&globalSection);

  location.x = -1;
  location.x = -1;
  if (isVisible)
    visible.remove(this);
  else
    invisible.remove(this);

  LeaveCriticalSection(&globalSection);
}

void Genhook::Clean()
{
  if (!init)
    return;

  // ForEachHook(CleanHook, owner, 1);
  EnterCriticalSection(&globalSection);
  visible.clear();
  invisible.clear();

  // HookIterator it = visible.begin();
  // while (it != visible.end())
  // {
  //   if ((*it)->owner->IsAborted())
  //   {
  //     Genhook *i = *it;
  //     it = invisible.erase(it);
  //     //	delete(i);
  //   }
  //   else
  //     it++;
  // }

  // it = invisible.begin();
  // while (it != invisible.end())
  // {
  //   if ((*it)->owner == owner)
  //   {
  //     Genhook *i = *it;
  //     it = invisible.erase(it);
  //     // delete(i);
  //   }
  //   else
  //     it++;
  // }
  LeaveCriticalSection(&globalSection);
}

void LineHook::Draw(void)
{

  if (GetIsVisible() && GetX() != (UINT)-1 && GetY() != (UINT)-1)
  {
    UINT x = GetX(), y = GetY(), x2 = GetX2(), y2 = GetY2();

    POINT loc = {(LONG)x, (LONG)y};
    POINT sz = {(LONG)x2, (LONG)y2};
    if (GetIsAutomap())
    {
      loc = ScreenToAutomap(x, y);
      sz = ScreenToAutomap(x2, y2);
    }
    EnterCriticalSection(&Vars.cLineHookSection);
    D2GFX_DrawLine(loc.x, loc.y, sz.x, sz.y, color, 0xFF);
    LeaveCriticalSection(&Vars.cLineHookSection);
  }
}

bool Genhook::ForEachVisibleHook(HookCallback proc, void *argv, UINT argc)
{
  // iterate the visible hooks
  EnterCriticalSection(&globalSection);

  bool result = false;
  std::vector<Genhook *> list;

  for (const auto &item : visible)
    list.push_back(item);

  std::sort(list.begin(), list.end(), zOrderSort);

  for (const auto &item : list)
    if (proc(item, argv, argc))
      result = true;

  LeaveCriticalSection(&globalSection);
  return result;
}

void Genhook::DrawAll(ScreenhookState type)
{
  if (!init)
    return;
  ForEachVisibleHook(DrawHook, (void *)type, 1);
}

void TextHook::Draw(void)
{

  if (GetIsVisible() && GetX() != (UINT)-1 && GetY() != (UINT)-1 && text)
  {
    UINT x = GetX(), y = GetY(), w = CalculateTextLen(text, font).x;
    x -= (alignment != Center ? (alignment != Right ? 0 : w) : w / 2);
    POINT loc = {(LONG)x, (LONG)y};
    if (GetIsAutomap())
    {
      loc = ScreenToAutomap(x, y);
    }
    EnterCriticalSection(&Vars.cTextHookSection);
    myDrawText((const wchar_t *)text, loc.x, loc.y, color, font);
    LeaveCriticalSection(&Vars.cTextHookSection);
  }
}

bool TextHook::IsInRange(int dx, int dy)
{

  POINT size = CalculateTextLen(text, font);
  int x = GetX(), y = GetY(), w = size.x, h = size.y, xp = x - (alignment != Center ? (alignment != Right ? 0 : w) : w / 2);

  return (xp < dx && y > dy && (xp + w) > dx && (y - h) < dy);
}

void TextHook::SetText(const wchar_t *ntext)
{
  EnterGlobalSection();
  free(text);
  text = nullptr;

  if (ntext)
    text = _wcsdup(ntext);
  LeaveGlobalSection();
}

void BoxHook::Draw(void)
{

  if (GetIsVisible() && GetX() != (UINT)-1 && GetY() != (UINT)-1)
  {
    UINT x = GetX(), y = GetY(), x2 = GetXSize(), y2 = GetYSize();
    if (alignment == Center)
    {
      x -= x2 / 2;
    }
    else if (alignment == Right)
    {
      x += x2 / 2;
    }
    POINT loc = {(LONG)x, (LONG)y};
    POINT sz = {(LONG)(x + x2), (LONG)(y + y2)};
    if (GetIsAutomap())
    {
      loc = ScreenToAutomap(x, y);
      sz = ScreenToAutomap(x + x2, y + y2);
    }
    EnterCriticalSection(&Vars.cBoxHookSection);
    D2GFX_DrawRectangle(loc.x, loc.y, sz.x, sz.y, color, opacity);
    LeaveCriticalSection(&Vars.cBoxHookSection);
  }
}

bool BoxHook::IsInRange(int dx, int dy)
{

  int x = GetX(), y = GetY(), x2 = GetXSize(), y2 = GetYSize();

  return (x < dx && y < dy && (x + x2) > dx && (y + y2) > dy);
}

void FrameHook::Draw(void)
{

  if (GetIsVisible() && GetX() != (UINT)-1 && GetY() != (UINT)-1)
  {
    UINT x = GetX(), y = GetY(), x2 = GetXSize(), y2 = GetYSize();
    if (alignment == Center)
    {
      x -= x2 / 2;
    }
    else if (alignment == Right)
    {
      x += x2 / 2;
    }
    RECT rect = {(LONG)x, (LONG)y, (LONG)(x + x2), (LONG)(y + y2)};
    EnterCriticalSection(&Vars.cFrameHookSection);
    D2GFX_DrawFrame(&rect);
    LeaveCriticalSection(&Vars.cFrameHookSection);
  }
}

bool FrameHook::IsInRange(int dx, int dy)
{

  int x = GetX(), y = GetY(), x2 = GetXSize(), y2 = GetYSize();

  return (x < dx && y < dy && (x + x2) > dx && (y + y2) > dy);
}

void ImageHook::Draw(void)
{
  if (GetIsVisible() && GetX() != (UINT)-1 && GetY() != (UINT)-1 && GetImage() != nullptr && image != nullptr)
  {
    UINT x = GetX(), y = GetY(), w = image->cells[0]->width;
    x += (alignment != Left ? (alignment != Right ? 0 : -1 * (w / 2)) : w / 2);
    POINT loc = {(LONG)x, (LONG)y};
    if (GetIsAutomap())
    {
      loc = ScreenToAutomap(x, y);
    }
    EnterCriticalSection(&Vars.cImageHookSection);
    myDrawAutomapCell(image, loc.x, loc.y, (BYTE)color);
    LeaveCriticalSection(&Vars.cImageHookSection);
  }
}

bool ImageHook::IsInRange(int dx, int dy)
{
  if (image)
  {
    int x = GetX();
    int y = GetY();
    int w = image->cells[0]->width;
    int h = image->cells[0]->height;
    int xp = x - (alignment != Left ? (alignment != Right ? w / 2 : w) : -1 * w);
    int yp = y - (h / 2);
    return (xp < dx && yp < dy && (xp + w) > dx && (yp + h) > dy);
  }

  return false;
}

void ImageHook::SetImage(const wchar_t *nimage)
{
  free(location);
  delete[] image;

  location = _wcsdup(nimage);
  image = LoadCellFile(location);
}
