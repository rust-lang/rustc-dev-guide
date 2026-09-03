# Profiling with heaptrack

This is a guide for how to profile rustc memory allocations
with [heaptrack](https://invent.kde.org/sdk/heaptrack) on linux.

## Installing heaptrack

While heaptrack has support for demangling rust symbols,
the last full release is older than this support.

That means either you have to compile heaptrack from
its [git repo](https://invent.kde.org/sdk/heaptrack/),
your distro package maintainers applied the correct patches,
or you deal with mangled symbol names.

When you have the correct version, it looks for the `rustc_demangle.so` C-abi library using
the system dynamic linker at runtime. To check that `rustc_demangle` is visible,
you can use `ldconfig -p | grep rustc_demangle`.

<details> <summary>`rustc_demangle` installation example</summary> 


Note: This may not apply to all systems.
```sh
git clone https://github.com/rust-lang/rustc-demangle
cd rustc-demangle
cargo build --release --frozen --package rustc-demangle-capi
# install built library files
sudo install -Dm755 "target/release/librustc_demangle."{a,so} --target-directory "/usr/lib/"
# optional, heaptrack doesn't need this
sudo install -Dm644 "crates/capi/include/rustc_demangle.h" --target-directory "/usr/include/"
# refresh linker cache
sudo ldconfig
```

</details>

## Initial steps

- Set the following settings in your `bootstrap.toml`:
  - `rust.debuginfo-level = 1` - enables line debuginfo
  - leave `build.allocator` unset - heaptrack doesn't track jemalloc
- Run `./x build library` to get a full build
- Make a rustup toolchain pointing to that result
  - see [the "build and run" section for instructions][b-a-r]

[b-a-r]: ../building/how-to-build-and-run.md#toolchain


## Usage

### Bare rustc
Heaptrack can be used with rustc calls directly:

```sh
heaptrack rustc foo.rs
```

### Cargo

When invoked naively, heaptrack will only collect data about
the cargo invocation itself, not rustc.
 
To use it to profile a specific crates compilation,
the RUSTC_WRAPPER script from below can be used (make sure its executable).

<details> <summary><b>RUSTC_WRAPPER bash script</b></summary> 

```sh
#!/usr/bin/env bash

set -euo pipefail

OUTDIR="${HEAPTRACK_OUT_DIR:-/tmp/heaptrack}"
TARGET_PKG="${HEAPTRACK_PKG_NAME:?set HEAPTRACK_PKG_NAME to the package you want profiled}"

if [[ -z "${RUSTC_WRAPPER}" ]]; then
    echo "this script is intended as a RUSTC_WRAPPER" >&2
    exit 1
fi

if ! command -v heaptrack >/dev/null 2>&1; then
    echo "command heaptrack not found, ensure it's in PATH" >&2
    exit 1
fi

REAL_RUSTC="$1"
shift

# anything thats not the target package is executed normally 
if [[ "${CARGO_PKG_NAME:-}" != "$TARGET_PKG" ]]; then
    exec "$REAL_RUSTC" "$@"
fi

mkdir -p "$OUTDIR"

# heaptrack complains if DEBUGINFOD_URLS is set
unset DEBUGINFOD_URLS

exec heaptrack \
    --record-only \
    -o "$OUTDIR/heaptrack.rustc-${CARGO_PKG_NAME}-v${CARGO_PKG_VERSION}-$$" \
    "$REAL_RUSTC" "$@"


```

</details>

Usage, assuming you want to profile `hashbrown` which is in your projects dependency tree
```sh
cargo clean -p hashbrown
HEAPTRACK_PKG_NAME="hashbrown" RUSTC_WRAPPER=./heaptrack_wrapper.sh cargo build -p hashbrown
```

The script is configured through env vars.
- `HEAPTRACK_PKG_NAME` can be any crate from the dependency tree compiled by your cargo command
- `HEAPTRACK_OUT_DIR` optionally changes the output directory, which defaults to `/tmp/heaptrack`

## Analyzing in the GUI

Heaptrack has a GUI to analyze profiles.
You can open it multiple ways:
- calling `heaptrack <command>` will open it after the command is finished
- `heaptrack --analyze <saved_profile>` will directly open a saved profile file
- `heaptrack` will open the GUI prompt you to open a file, and optionally a second one to compare

Note that comparing 2 large profiles can take a very long time to load or even hang.



