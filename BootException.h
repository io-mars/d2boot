#include <stdio.h>
#include <stdarg.h>
#include <stdlib.h>
#include <string.h>
#include <exception>
#include "Helpers.h"

class BootException : public std::exception
{
private:
  char *text_;

public:
  BootException(const char *format, ...)
  {
    va_list vaArgs;

    va_start(vaArgs, format);
    FormatString(&text_, format, vaArgs);
    va_end(vaArgs);
  }

  ~BootException()
  {
    free(text_);
  }

  const char *what() const noexcept
  {
    return text_;
  }
};
