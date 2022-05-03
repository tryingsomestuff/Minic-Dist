# Web page to use WASM build of Minic

## Build

Use `EMBEDDEDNNUEPATH=none Tools/build/buildWASM.sh` to build Minic HCE (NNUE is not supported yet for WASM).
Make a symbolic link or a copy in order to have those files directly in `web` folder : `minic_wasm.js  minic_wasm.wasm  minic_wasm.worker.js`.
## Thanks

To Finn Eggers (Koivisto team) for support in building WASM version and providing base web html/css and js implementation.
See https://koivisto-chess.com/engine/

