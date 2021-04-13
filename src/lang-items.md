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
for lang items.

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
