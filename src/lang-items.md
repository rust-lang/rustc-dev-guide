# Lang items

The compiler has certain pluggable operations; that is, functionality that isn't hard-coded into
the language, but is implemented in libraries, with a special marker to tell the compiler it
exists. The marker is the attribute `#[lang = "..."]`, and there are various different values of
`...`, i.e. various different 'lang items'.

Many such lang items can be implemented only in one sensible way, such as `add` (`trait
core::ops::Add`) or `future_trait` (`trait core::future::Future`). Others can be overriden to
achieve some specific goals; for example, you can control your binary's entrypoint.

Features provided by lang items include:

- overloadable operators via traits: the traits corresponding to the
  `==`, `<`, dereference (`*`), `+`, etc. operators are all
  marked with lang items; those specific four are `eq`, `ord`,
  `deref`, and `add` respectively.
- panicking and stack unwinding; the `eh_personality`, `panic` and
  `panic_bounds_checks` lang items.
- the traits in `std::marker` used to indicate properties of types used by the compiler;
  lang items `send`, `sync` and `copy`.
- the special marker types used for variance indicators found in
  `core::marker`; lang item `phantom_data`.

Lang items are loaded lazily by the compiler; e.g. if one never uses `Box`
then there is no need to define functions for `exchange_malloc` and
`box_free`. `rustc` will emit an error when an item is needed but not found
in the current crate or any that it depends on.

Most lang items are defined by the `core` library, but if you're trying to build an
executable with `#![no_std]`, you'll still need to define a few lang items that are
usually provided by `std`.

## List of all language items

You can find language items in the following places:
- An exhaustive reference in the compiler documentation: [`rustc_hir::LangItem`]
- An auto-generated list with source locations by using ripgrep: `rg '#\[.*lang =' library/`

Note that language items are explicitly unstable and may change in any new release.

[`rustc_hir::LangItem`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/lang_items/enum.LangItem.html
