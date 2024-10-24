# `minicore` test auxiliary

[`tests/auxiliary/minicore.rs`][`minicore`] is a test auxiliary for
ui/codegen/assembly test suites. It provides `core` stubs for tests that need to
build for cross-compiled targets but do not need/want to run.

A test can use [`minicore`] by specifying the `//@ use-minicore` directive. Then,
mark the test with `#![feature(no_core)]` + `#![no_std]` + `#![no_core]`. Due to
Edition 2015 extern prelude rules, you will probably need to declare `minicore`
as an extern crate.

Due to the `no_std` + `no_core` nature of these tests, `//@ use-minicore`
implies and requires that the test will be built with `-C panic=abort`.
Unwinding panics are not supported.

If you find a `core` item to be missing from the [`minicore`] stub, consider
adding it to the test auxiliary. However, please note that [`minicore`] is only
intended for `core` items, and explicitly not `std` or `alloc` items because
`core` items are applicable to a wider range of tests.

## Example codegen test that uses `minicore`

```rust,no_run
//@ use-minicore
//@ revisions: meow
//@[meow] compile-flags: --target=x86_64-unknown-linux-gnu
//@[meow] needs-llvm-components: x86

#![crate_type = "lib"]
#![feature(no_core)]
#![no_std]
#![no_core]

extern crate minicore;
use minicore::*;

struct Meow;
impl Copy for Meow {} // `Copy` here is provided by `minicore`

// CHECK-LABEL: meow
#[no_mangle]
fn meow() {}
```

[minicore]: https://github.com/rust-lang/rust/tree/master/tests/auxiliary/minicore.rs
