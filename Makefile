ECHO := printf
ECHO_END:= \e[0m\n"
ECHO_GREEN:= $(ECHO) "\e[1;32m
ECHO_RED:= $(ECHO) "\e[1;31m
ECHO_YELLOW:= $(ECHO) "\e[1;33m
ECHO_BLUE:= $(ECHO) "\e[1;34m
ECHO_GREEN_YELLOW:= $(ECHO) "\e[42;30m

TARGET 		:= D2Boot.dll
CC     		:= gcc
LIBS   		:= -L./lib
# LDFLAGS		:= -m32 -pthread -fPIC -shared 
LDFLAGS		:= -m32 -static-libstdc++ -static-libgcc -Wl,-Bstatic,--whole-archive -lwinpthread -Wl,--no-whole-archive -pthread -lShlwapi -ldbghelp -fPIC -shared
# LDFLAGS		:= -m32 -static-libgcc -static-libstdc++ -Wl,-Bstatic -lstdc++ -pthread -fPIC -shared -Wl,--enable-stdcall-fixup
DEFINES		:= -DUNICODE
INCLUDE		:= -I. -I./include
ifeq ($(PREFIX),)
	PREFIX		:=debug
endif

CFLAGS		:= -Wall -m32 -masm=intel $(DEFINES) $(INCLUDE) 

BUILD_DIR			:= $(PREFIX)
TARGET 				:= $(BUILD_DIR)/$(TARGET)
TARGET_VERSION:= $(shell grep "#define D2BOOT_MAJOR L" D2Boot.h | awk -F'"' '{print $$2}')
VERSION_COMMA	:=,
TARGET_FVERSION:= $(subst .,$(VERSION_COMMA),$(TARGET_VERSION))

ifeq ($(PREFIX), debug)
CFLAGS				+= -g -O0 -DDEBUG
LIBS					+= -lquickjs.d
TARGET_FINAL	:= $(TARGET)
else
CFLAGS				+= -g -O3 -DNDEBUG
LIBS					+= -lquickjs.lto
TARGET_FINAL	:= $(TARGET)
TARGET 				:= $(subst .dll,.$(PREFIX).dll,$(TARGET))
endif
CXX				:= g++
# CXXFLAGS	:= $(CFLAGS) -DHAVE_CONFIG_H -D_MSC_VER=1700
CXXFLAGS	:= $(CFLAGS) -DHAVE_CONFIG_H

RESOURCE_DIR	:= resource
IMPLIB				:= -Wl,--out-implib,$(BUILD_DIR)/libD2Boot.a

SOURCE		:= $(wildcard *.c) $(wildcard *.cpp) $(wildcard Map/Diablo_II/*.cpp) $(wildcard $(RESOURCE_DIR)/*.rc)
OBJS			:= $(patsubst %.c, %.o, $(patsubst %.cpp, $(BUILD_DIR)/%.o, $(SOURCE)))
OBJS			:= $(patsubst %.rc, $(BUILD_DIR)/%.res, $(OBJS))

.PHONY: all mkdir publish clean

all: mkdir $(TARGET)
# all: clean $(TARGET)

$(TARGET) : $(OBJS)
	@$(ECHO_BLUE)linking target: $(TARGET)$(ECHO_END)
	$(CXX) $^ $(LDFLAGS) $(LIBS) -o $@ $(IMPLIB)
	@$(ECHO_GREEN)prefix:[$(PREFIX)] build over!$(ECHO_END)

$(BUILD_DIR)/%.o : %.c
	$(CC) $(CFLAGS) -c $< -o $@

$(BUILD_DIR)/%.o : %.cpp
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -c $< -o $@

$(BUILD_DIR)/%.res : %.rc
	@$(ECHO_RED)build resource, version:${TARGET_VERSION}$(ECHO_END)
	@$(shell sed 's/#VERSION/${TARGET_VERSION}/g;s/#FVERSION/${TARGET_FVERSION}/g' $< > $(BUILD_DIR)/$<)
	@windres --input-format=rc -O coff -F pe-i386 -i $(BUILD_DIR)/$< -o $@

mkdir:
	@$(ECHO_YELLOW)make build dir...$(ECHO_END)
	@if [ ! -e "$(BUILD_DIR)/$(RESOURCE_DIR)" ]; then mkdir -p $(BUILD_DIR)/$(RESOURCE_DIR); fi
	@if [ ! -e "$(BUILD_DIR)/Map/Diablo_II" ]; then mkdir -p $(BUILD_DIR)/Map/Diablo_II; fi
#	@if [ ! -e "$(BUILD_DIR)/Scripts" ]; then cd $(BUILD_DIR);ln -s ../Scripts Scripts; fi

package: all
	@$(ECHO_GREEN)packaging $(TARGET_FINAL)$(ECHO_END)
	@strip -s $(TARGET) -o $(TARGET_FINAL)

pdb:
	@$(ECHO_GREEN)generating symbol file: $(subst .dll,.pdb,$(TARGET_FINAL))$(ECHO_END)
	@cv2pdb $(TARGET) $(TARGET_FINAL) $(subst .dll,.pdb,$(TARGET_FINAL))
#	@cv2pdb -p$(subst $(BUILD_DIR)/,,$(subst .dll,.pdb,$(TARGET_FINAL))) $(TARGET) $(TARGET_FINAL) $(subst .dll,.pdb,$(TARGET_FINAL))

clean:
	@$(ECHO_BLUE)cleaning$(ECHO_END)
	-rm -rf $(OBJS) $(TARGET) ${TARGET_FINAL}

publish:
	cd publish && cmd //C mklink D2Boot.ini D:\D2Boot\D2Boot.ini
	# cd publish && cmd //C dir
	# cd publish && cmd //C "mklink /D Scripts D:\D2Boot\Scripts"
	# cd publish && cmd //C mklink D2Boot.ini D:\D2Boot\D2Boot.ini
	# cd publish && cmd //C mklink D2Boot.dll D:\D2Boot\release\D2Boot.dll
