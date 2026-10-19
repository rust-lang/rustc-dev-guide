# Profiling with Valgrind

[Valgrind] is an instrumentation framework that runs on Linux and other Unix-like systems, but not on Windows.
Two of its tools are useful when working on the compiler:

- [Callgrind] (`--tool=callgrind`) records a call graph, so that you can see which functions called which, and how much work each of them did.
- [Cachegrind] (`--tool=cachegrind`) simulates the cache hierarchy and the branch predictor, so that you can see cache misses and mispredicted branches attributed to individual source lines.

Callgrind writes a `callgrind.out.<pid>` file, which `callgrind_annotate` summarizes as a function-by-function list.
For browsing the data, [KCachegrind] is recommended by the Callgrind manual.
Cachegrind writes a `cachegrind.out.<pid>` file, which `cg_annotate` (shipped with Valgrind) uses to annotate source files.

Unlike [perf](with-perf.md), which samples a process as it runs, Valgrind instruments it.
That makes the measurements exact rather than statistical, but the instrumented program runs much more slowly, and what is measured is work done by the program rather than wall-clock time, so time spent blocked or in the kernel is not attributed to anything.

[Valgrind]: https://valgrind.org/
[Callgrind]: https://valgrind.org/docs/manual/cl-manual.html
[Cachegrind]: https://valgrind.org/docs/manual/cg-manual.html
[KCachegrind]: https://kcachegrind.github.io/

## Making sure `rustc` is the profiled process

`cargo` runs `rustc` as a subprocess, so `valgrind cargo build` profiles `cargo` rather than the compiler.
Valgrind has to be the parent of `rustc`, not the other way around.

There is a second trap: the `rustc` in your `PATH` is usually the rustup shim rather than the compiler itself.
Use `rustup which rustc` to get the path of the real binary, or you will end up profiling the shim.

### With a wrapper script

`RUSTC` is the path of a program, not a command line, so `RUSTC="valgrind /path/to/rustc"` does not work: `cargo` tries to execute a program whose name is that entire string.
Use a wrapper script instead.

```bash
#!/bin/sh
# Save as ~/bin/valgrind-rustc, and mark it executable.
exec valgrind --tool=callgrind "$(rustup which rustc)" "$@"
```

```bash
chmod +x ~/bin/valgrind-rustc
RUSTC=$HOME/bin/valgrind-rustc cargo build
```

If you built your own compiler with `./x`, point the wrapper at that toolchain by using `rustup which --toolchain <toolchain> rustc` instead.

### With `RUSTC_WRAPPER`

`RUSTC_WRAPPER` is the variable `cargo` provides for wrapping the compiler.
`cargo` runs the wrapper with the path to `rustc` as its first argument, and Valgrind takes the program to run as its first non-option argument, so Valgrind can be used as the wrapper directly.

```bash
RUSTC_WRAPPER=valgrind cargo build
```

This runs Valgrind's default tool, memcheck.
To select Callgrind or Cachegrind, or to pass any other Valgrind option, use the wrapper script above, since `RUSTC_WRAPPER` is also a program path and cannot carry arguments.
