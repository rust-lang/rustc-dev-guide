# Lang items


The `rustc` compiler has certain pluggable operations, that is,
functionality that isn't hard-coded into the language, but is
implemented in libraries, with a special marker to tell the compiler
it exists. The marker is the attribute `#[lang = "..."]` and there are
various different values of `...`, i.e. various different 'lang
items'.

Many such lang items can be implemented only in one sensible way, such as
`add` (`trait core::ops::Add`) or `future_trait`
(`trait core::future::Future`). 

Others can be overriden to achieve some
specific goals.

For example, later sections describe how to control
your binary startup or override panic implementation.

Features provided by lang items include:

- overloadable operators via traits: the traits corresponding to the
  `==`, `<`, dereferencing (`*`) and `+` (etc.) operators are all
  marked with lang items; those specific four are `eq`, `ord`,
  `deref`, and `add` respectively.
- stack unwinding and general failure; the `eh_personality`,
  `panic` and `panic_bounds_checks` lang items.
- the traits in `std::marker` used to indicate types of
  various kinds; lang items `send`, `sync` and `copy`.
- the special marker types used for variance indicators found in
  `core::marker`; lang item `phantom_data`.

Lang items are loaded lazily by the compiler; e.g. if one never uses
`Box` then there is no need to define functions for `exchange_malloc`
and `box_free`. `rustc` will emit an error when an item is needed
but not found in the current crate or any that it depends on.

Most lang items are defined by `libcore`, but if you're trying to build
an executable without the standard library, you'll run into the need
for lang items. The rest of this page focuses on this use-case, even though
lang items are a bit broader than that.

### Using libc

In order to build a `#[no_std]` executable we will need libc as a dependency.
We can specify this using our `Cargo.toml` file:

```toml
[dependencies]
libc = { version = "0.2.14", default-features = false }
```

Note that the default features have been disabled. This is a critical step -
**the default features of libc include the standard library and so must be
disabled.**

### Writing an executable without stdlib

Controlling the entry point is possible in two ways: the `#[start]` attribute,
or overriding the default shim for the C `main` function with your own.

The function marked `#[start]` is passed the command line parameters
in the same format as C:

```rust,ignore
#![feature(lang_items, core_intrinsics)]
#![feature(start)]
#![no_std]
use core::intrinsics;
use core::panic::PanicInfo;

// Pull in the system libc library for what crt0.o likely requires.
extern crate libc;

// Entry point for this program.
#[start]
fn start(_argc: isize, _argv: *const *const u8) -> isize {
    0
}

// These functions are used by the compiler, but not
// for a bare-bones hello world. These are normally
// provided by libstd.
#[lang = "eh_personality"]
#[no_mangle]
pub extern fn rust_eh_personality() {
}

#[lang = "panic_impl"]
#[no_mangle]
pub extern fn rust_begin_panic(info: &PanicInfo) -> ! {
    unsafe { intrinsics::abort() }
}
```

To override the compiler-inserted `main` shim, one has to disable it
with `#![no_main]` and then create the appropriate symbol with the
correct ABI and the correct name, which requires overriding the
compiler's name mangling too:

```rust,ignore
#![feature(lang_items, core_intrinsics)]
#![feature(start)]
#![no_std]
#![no_main]
use core::intrinsics;
use core::panic::PanicInfo;

// Pull in the system libc library for what crt0.o likely requires.
extern crate libc;

// Entry point for this program.
#[no_mangle] // ensure that this symbol is called `main` in the output
pub extern fn main(_argc: i32, _argv: *const *const u8) -> i32 {
    0
}

// These functions are used by the compiler, but not
// for a bare-bones hello world. These are normally
// provided by libstd.
#[lang = "eh_personality"]
#[no_mangle]
pub extern fn rust_eh_personality() {
}

#[lang = "panic_impl"]
#[no_mangle]
pub extern fn rust_begin_panic(info: &PanicInfo) -> ! {
    unsafe { intrinsics::abort() }
}
```

In many cases, you may need to manually link to the `compiler_builtins` crate
when building a `no_std` binary. You may observe this via linker error messages
such as "```undefined reference to `__rust_probestack'```".

## More about the language items

The compiler currently makes a few assumptions about symbols which are
available in the executable to call. Normally these functions are provided by
the standard library, but without it you must define your own. These symbols
are called "language items", and they each have an internal name, and then a
signature that an implementation must conform to.

The first of these functions, `rust_eh_personality`, is used by the failure
mechanisms of the compiler. This is often mapped to GCC's personality function
(see the [libstd implementation][unwind] for more information), but crates
which do not trigger a panic can be assured that this function is never
called. The language item's name is `eh_personality`.

[unwind]: https://github.com/rust-lang/rust/blob/master/src/libpanic_unwind/gcc.rs

The second function, `rust_begin_panic`, is also used by the failure mechanisms of the
compiler. When a panic happens, this controls the message that's displayed on
the screen. While the language item's name is `panic_impl`, the symbol name is
`rust_begin_panic`.

Finally, a `eh_catch_typeinfo` static is needed for certain targets which
implement Rust panics on top of C++ exceptions.

## Well-known paths

In several cases compiler finds specific item not by `lang` attribute. Instead
item path is hardcored. For example compiler assumes `Iterator` trait to be
available as `core::iter::Iterator`. This only happens when item is required
on early compilation stages (for example `Iterator` is used in for loops
desugaring).

## List of all language items

This is a list of all language items in Rust along with where they are located in
the source code.

- Primitives
  - `i8`: `library/core/src/num/mod.rs`
  - `i16`: `library/core/src/num/mod.rs`
  - `i32`: `library/core/src/num/mod.rs`
  - `i64`: `library/core/src/num/mod.rs`
  - `i128`: `library/core/src/num/mod.rs`
  - `isize`: `library/core/src/num/mod.rs`
  - `u8`: `library/core/src/num/mod.rs`
  - `u16`: `library/core/src/num/mod.rs`
  - `u32`: `library/core/src/num/mod.rs`
  - `u64`: `library/core/src/num/mod.rs`
  - `u128`: `library/core/src/num/mod.rs`
  - `usize`: `library/core/src/num/mod.rs`
  - `f32`: `library/std/src/f32.rs`
  - `f64`: `library/std/src/f64.rs`
  - `char`: `library/core/src/char.rs`
  - `slice`: `library/alloc/src/slice.rs`
  - `str`: `library/alloc/src/str.rs`
  - `const_ptr`: `library/core/src/ptr.rs`
  - `mut_ptr`: `library/core/src/ptr.rs`
- Runtime
  - `start`: `library/std/src/rt.rs`
  - `eh_personality`: `library/panic_unwind/src/emcc.rs` (EMCC)
  - `eh_personality`: `library/panic_unwind/src/gcc.rs` (GNU)
  - `eh_personality`: `library/panic_unwind/src/seh.rs` (SEH)
  - `eh_catch_typeinfo`: `library/panic_unwind/src/emcc.rs` (EMCC)
  - `panic`: `library/core/src/panicking.rs`
  - `panic_bounds_check`: `library/core/src/panicking.rs`
  - `panic_impl`: `library/core/src/panicking.rs`
  - `panic_impl`: `library/std/src/panicking.rs`
- Allocations
  - `owned_box`: `library/alloc/src/boxed.rs`
  - `exchange_malloc`: `library/alloc/src/heap.rs`
  - `box_free`: `library/alloc/src/heap.rs`
- Operands
  - `not`: `library/core/src/ops/bit.rs`
  - `bitand`: `library/core/src/ops/bit.rs`
  - `bitor`: `library/core/src/ops/bit.rs`
  - `bitxor`: `library/core/src/ops/bit.rs`
  - `shl`: `library/core/src/ops/bit.rs`
  - `shr`: `library/core/src/ops/bit.rs`
  - `bitand_assign`: `library/core/src/ops/bit.rs`
  - `bitor_assign`: `library/core/src/ops/bit.rs`
  - `bitxor_assign`: `library/core/src/ops/bit.rs`
  - `shl_assign`: `library/core/src/ops/bit.rs`
  - `shr_assign`: `library/core/src/ops/bit.rs`
  - `deref`: `library/core/src/ops/deref.rs`
  - `deref_mut`: `library/core/src/ops/deref.rs`
  - `index`: `library/core/src/ops/index.rs`
  - `index_mut`: `library/core/src/ops/index.rs`
  - `add`: `library/core/src/ops/arith.rs`
  - `sub`: `library/core/src/ops/arith.rs`
  - `mul`: `library/core/src/ops/arith.rs`
  - `div`: `library/core/src/ops/arith.rs`
  - `rem`: `library/core/src/ops/arith.rs`
  - `neg`: `library/core/src/ops/arith.rs`
  - `add_assign`: `library/core/src/ops/arith.rs`
  - `sub_assign`: `library/core/src/ops/arith.rs`
  - `mul_assign`: `library/core/src/ops/arith.rs`
  - `div_assign`: `library/core/src/ops/arith.rs`
  - `rem_assign`: `library/core/src/ops/arith.rs`
  - `eq`: `library/core/src/cmp.rs`
  - `ord`: `library/core/src/cmp.rs`
- Functions
  - `fn`: `library/core/src/ops/function.rs`
  - `fn_mut`: `library/core/src/ops/function.rs`
  - `fn_once`: `library/core/src/ops/function.rs`
  - `generator_state`: `library/core/src/ops/generator.rs`
  - `generator`: `library/core/src/ops/generator.rs`
- Opting out
  - `unsafe_cell` (relaxes pointer provenance rules, allowing const-to-mut casts): `library/core/src/cell.rs`
  - `manually_drop` (opts out of implicit destructor call): `library/core/src/mem/manually_drop.rs`
- Other
  - `coerce_unsized`: `library/core/src/ops/unsize.rs`
  - `drop`: `library/core/src/ops/drop.rs`
  - `drop_in_place`: `library/core/src/ptr.rs`
  - `clone`: `library/core/src/clone.rs`
  - `copy`: `library/core/src/marker.rs`
  - `send`: `library/core/src/marker.rs`
  - `sized`: `libcrary/ore/msrc/arker.rs`
  - `unsize`: `library/core/src/marker.rs`
  - `sync`: `library/core/src/marker.rs`
  - `phantom_data`: `libcore/marker.rs`
  - `discriminant_kind`: `library/core/src/marker.rs`
  - `freeze`: `library/core/src/marker.rs`
