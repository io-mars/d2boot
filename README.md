# `D2Boot`

Bot system for Diablo II 1.13d, migrated [d2bs](https://github.com/noah-/d2bs) to [QuickJS](https://bellard.org/quickjs/) javascript engine.

scripts based on [kolbot](https://github.com/kolton/d2bot-with-kolbot);

> - **DON'T USED** `D2Boot` on battle.net!
> - the project is just for fun and try quickjs;

## Requirements

- `vscode` + `mysys2`(`MINGW32`) + `gcc`
- [`cv2pdb`](https://github.com/rainers/cv2pdb/releases) the PDB file converter

> the last version release.

## Build

### Step 1 - build `quickjs`

```sh
git clone https://github.com/io-mars/quickjs.git
./build.sh
```

> just export `JS_TriggerInterruptHandler` function, and modified Makefile for windows build;

after builded, copy requirement files from the zip file:

1. `liblibquickjs.a`/`libquickjs.d.a`/`libquickjs.lto.a` to `lib` directory;
2. `quickjs.h`/`quickjs-libc.h` to `include/quickjs/` directory;

### Step 2 - build `d2boot` and config

```sh
make PREFIX=release clean
make PREFIX=release
make PREFIX=release pdb
```

1. put the `D2Boot.dll` and `D2Boot.pdb` files at `publish/D2Boot/` directory;
2. put the `Scripts` directory at `publish/D2Boot/` directory;

> cancel version warning when building:
>
> ```sh
> # /d/msys64/mingw32/lib
> cp libwinpthread.a libwinpthread.a.org
> ar -d libwinpthread.a version.o
> ```

### Step 3 - run `d2bot#`

1. add new profile at `d2bot#`;
2. edit `Scripts\libs\config\_BaseConfigFile.js`/`_CustomConfig.js`/`_StarterConfig.js` for team play;
3. set the stash size at `Scripts\libs\common\Storage.js`;

   ```js
    init() {
      this.StashX = me.gametype === 0 ? 6 : 10;  //<------10x10
      this.StashY = me.gametype === 0 ? 4 : 10;  //<------10x10
      //....
      this.Stash = new Container("Stash", this.StashX, this.StashY, 7);
      //....
    },
   ```

4. exclude the `d2boot` directory at Microsoft Defender.

Good fun everyone!
