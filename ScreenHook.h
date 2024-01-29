#pragma once

#include "D2Helpers.h"

void DrawLogo(void);

class Genhook;
typedef std::list<Genhook *> HookList;
typedef HookList::iterator HookIterator;

typedef bool(__fastcall *HookCallback)(Genhook *, void *, UINT);

enum Align
{
  Left,
  Right,
  Center
};
enum ScreenhookState
{
  OOG,
  IG,
  Perm
};

class Genhook
{
private:
  static bool init;
  static HookList visible, invisible;
  static CRITICAL_SECTION globalSection;

protected:
  USHORT opacity;
  bool isAutomap;
  Align alignment;
  ScreenhookState gameState;
  bool isVisible;
  USHORT zorder;
  POINT location;

  Genhook(const Genhook &);
  Genhook &operator=(const Genhook &);

  virtual void Draw(void) = 0;

public:
  Genhook(UINT x, UINT y, USHORT nopacity, bool nisAutomap = false, Align nalign = Left, ScreenhookState ngameState = Perm);
  virtual ~Genhook(void);
  friend bool __fastcall DrawHook(Genhook *hook, void *argv, UINT argc);

  static void Clean();
  static void DrawAll(ScreenhookState type);
  static bool ForEachVisibleHook(HookCallback proc, void *argv, UINT argc);
  bool IsInRange(POINT *pt)
  {
    return IsInRange(pt->x, pt->y);
  }
  virtual bool IsInRange(int dx, int dy) = 0;

  void Move(POINT *dist)
  {
    Move(dist->x, dist->y);
  }

  void Move(UINT nx, UINT ny)
  {
    SetX(GetX() + nx);
    SetY(GetY() + ny);
  }

  static void Initialize(void)
  {
    InitializeCriticalSection(&globalSection);
    init = true;
  }
  static void Destroy(void)
  {
    init = false;
    DeleteCriticalSection(&globalSection);
  }

  POINT GetLocation(void) const
  {
    return location;
  }

  void SetX(UINT x)
  {
    location.x = x;
  }

  void SetY(UINT y)
  {
    location.y = y;
  }

  UINT GetX(void) const
  {
    return location.x;
  }

  UINT GetY(void) const
  {
    return location.y;
  }

  void SetAlign(Align nalign)
  {
    alignment = nalign;
  }

  Align GetAlign(void) const
  {
    return alignment;
  }

  USHORT GetOpacity(void) const
  {
    return opacity;
  }

  void SetOpacity(USHORT nopacity)
  {
    opacity = nopacity;
  }

  ScreenhookState GetGameState(void) const
  {
    return gameState;
  }

  USHORT GetZOrder(void) const
  {
    return zorder;
  }

  bool GetIsVisible(void) const
  {
    return isVisible;
  }

  bool GetIsAutomap(void) const
  {
    return isAutomap;
  }

  void SetIsVisible(bool nisVisible)
  {
    EnterCriticalSection(&globalSection);
    if (!nisVisible)
    {
      if (isVisible)
      {
        visible.remove(this);
        invisible.push_back(this);
      }
    }
    else
    {
      if (!isVisible)
      {
        invisible.remove(this);
        visible.push_back(this);
      }
    }
    isVisible = nisVisible;
    LeaveCriticalSection(&globalSection);
  }
  void SetZOrder(USHORT norder)
  {
    zorder = norder;
  }

  static void EnterGlobalSection()
  {
    EnterCriticalSection(&globalSection);
  }
  static void LeaveGlobalSection()
  {
    LeaveCriticalSection(&globalSection);
  }
};

class TextHook : public Genhook
{
private:
  wchar_t *text;
  USHORT font, color;

  TextHook(const TextHook &);
  TextHook &operator=(const TextHook &);

public:
  TextHook(const wchar_t *text, UINT x, UINT y, USHORT nfont, USHORT ncolor, bool automap = false, Align align = Left,
           ScreenhookState state = Perm)
      : Genhook(x, y, 0, automap, align, state), text(NULL), font(nfont), color(ncolor)
  {
    this->text = _wcsdup(text);
  }

  ~TextHook(void)
  {
    free(text);
  }

protected:
  void Draw(void);

public:
  bool IsInRange(int dx, int dy);

  void SetFont(USHORT nfont)
  {
    font = nfont;
  }
  void SetColor(USHORT ncolor)
  {
    color = ncolor;
  }
  void SetText(const wchar_t *ntext);

  USHORT GetFont(void) const
  {
    return font;
  }
  USHORT GetColor(void) const
  {
    return color;
  }
  const wchar_t *GetText(void) const
  {
    return text;
  }
};

class ImageHook : public Genhook
{
private:
  USHORT color;
  CellFile *image;
  wchar_t *location;

  ImageHook(const ImageHook &);
  ImageHook &operator=(const ImageHook &);

public:
  ImageHook(const wchar_t *nloc, UINT x, UINT y, USHORT ncolor, bool automap = false, Align align = Left, ScreenhookState state = Perm,
            bool fromFile = true)
      : Genhook(x, y, 0, automap, align, state), color(ncolor), image(nullptr), location(nullptr)
  {
    location = _wcsdup(nloc);
    image = LoadCellFile(location, 3);
  }

  ~ImageHook(void)
  {
    free(location);
    delete[] image;
  }

protected:
  void Draw(void);

public:
  bool IsInRange(int dx, int dy);

  void SetImage(const wchar_t *nimage);
  void SetColor(USHORT ncolor)
  {
    color = ncolor;
  }

  const wchar_t *GetImage(void) const
  {
    return location;
  }

  USHORT GetColor(void) const
  {
    return color;
  }
};

class LineHook : public Genhook
{
private:
  UINT x2, y2;
  USHORT color;

protected:
  void Draw(void);

public:
  LineHook(UINT x, UINT y, UINT nx2, UINT ny2, USHORT ncolor, bool automap = false, Align align = Left, ScreenhookState state = Perm)
      : Genhook(x, y, 0, automap, align, state), x2(nx2), y2(ny2), color(ncolor)
  {
  }
  ~LineHook(void) {}

  bool IsInRange(int dx, int dy)
  {
    return false;
  }

  void SetX2(UINT nx2)
  {
    x2 = nx2;
  }
  void SetY2(UINT ny2)
  {
    y2 = ny2;
  }
  void SetColor(USHORT ncolor)
  {
    color = ncolor;
  }

  UINT GetX2(void)
  {
    return x2;
  }
  UINT GetY2(void)
  {
    return y2;
  }
  UINT GetColor(void)
  {
    return color;
  }
};

class BoxHook : public Genhook
{
private:
  UINT xsize, ysize;
  USHORT color;

  BoxHook(const BoxHook &);
  BoxHook &operator=(const BoxHook &);

public:
  BoxHook(UINT x, UINT y, UINT nxsize, UINT nysize, USHORT ncolor, USHORT opacity, bool automap = false, Align align = Left,
          ScreenhookState state = Perm)
      : Genhook(x, y, opacity, automap, align, state), xsize(nxsize), ysize(nysize), color(ncolor)
  {
  }
  ~BoxHook(void)
  {
  }

protected:
  void Draw(void);

public:
  bool IsInRange(int dx, int dy);

  void SetXSize(UINT nxsize)
  {
    xsize = nxsize;
  }
  void SetYSize(UINT nysize)
  {
    ysize = nysize;
  }
  void SetColor(USHORT ncolor)
  {
    color = ncolor;
  }

  UINT GetXSize(void) const
  {
    return xsize;
  }
  UINT GetYSize(void) const
  {
    return ysize;
  }
  USHORT GetColor(void) const
  {
    return color;
  }
};

class FrameHook : public Genhook
{
private:
  UINT xsize, ysize;

  FrameHook(const FrameHook &);
  FrameHook &operator=(const FrameHook &);

public:
  FrameHook(UINT x, UINT y, UINT nxsize, UINT nysize, bool automap = false, Align align = Left, ScreenhookState state = Perm)
      : Genhook(x, y, 0, automap, align, state), xsize(nxsize), ysize(nysize)
  {
  }
  ~FrameHook(void)
  {
  }

protected:
  void Draw(void);

public:
  bool IsInRange(int dx, int dy);

  void SetXSize(UINT nxsize)
  {
    xsize = nxsize;
  }
  void SetYSize(UINT nysize)
  {
    ysize = nysize;
  }

  UINT GetXSize(void) const
  {
    return xsize;
  }
  UINT GetYSize(void) const
  {
    return ysize;
  }
};
