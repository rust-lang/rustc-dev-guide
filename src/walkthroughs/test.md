# Walkthrough: adding a new test

This chapter gives an example of a small change that you could make as your first contribution to Rust,
using [rust#67064] and [rust#165729] as an example.

[rust#67064]: https://github.com/rust-lang/rust/issues/67064
[rust#165729]: https://github.com/rust-lang/rust/issues/165729

## Find an `E-needs-test` issue to work on

See ["What should I work on?"](../getting-started.md#What-should-I-work-on) for a list of possible tasks you could try out.
Here, we've chosen an `E-needs-test` issue: 
[rust#67064](https://github.com/rust-lang/rust/issues/67064).
This is an especially good fit because it has an example
[directly in the issue](https://github.com/rust-lang/rust/issues/67064#issue-533535274),
without needing additional work from you to minimize the bug.
Of course, it's always very helpful for you to take `E-needs-test` that *doesn't* have a minimal example and create one.

## Reproduce the issue

The example here was posted in 2019, fully 7 years ago (at time of writing).
Quite a lot of things change in the compiler in that period of time.
To make sure the test is still accurate, *reproduce it with the most recent compiler*.
An easy way to do this is with [play.rust-lang.org](https://play.rust-lang.org/?version=nightly) on the `nightly` branch,
or [rust.godbolt.org](https://rust.godbolt.org/) with `rustc nightly`.
You can also use `rustc +nightly` locally if you need complicated setup that isn't possible on Playground.

## Convert the issue to a test

Check out and set up the `rust-lang/rust` repo, as documented in [Quickstart](../building/quickstart.md):

```console
$ git clone https://github.com/rust-lang/rust
$ cd rust
$ ./x setup compiler
$ ./x build library
```

Here, we use `compiler` as the default profile, since the bug we're fixing is related to the compiler.
If you're adding a unit test to the standard library, you'd use `./x setup library`.

This will also suggest setting up a [`.git/hooks/pre-push` check][pre-push].
This is optional, but recommended.

[pre-push]: ../building/suggested.md#installing-a-pre-push-hook

We also started a build in the background with `./x build library`.
Rust unfortunately takes quite a while to build,
so starting a build early lets it run in the background while you're working on other things.

See [UI tests](../tests/ui.md) for a guide on adding new tests.
In rare cases, you may need a [run-make](../tests/compiletest.md#run-make-tests) or even more specialized kind of test.
See [Compiletest](../tests/compiletest.md) for more information.

In our case, our test is fairly simple:

```rust
// Save this file to `tests/ui/recursion/infinite-dereference-recursion-issue-67064.rs`.

//@ compile-flags: -Zwrite-long-types-to-disk=yes

// Regression test for: https://github.com/rust-lang/rust/issues/67064
// This used to take a long time to compile because dereferencing led to
// recursive expansion of the type of the struct.

struct S<T>(T);

impl<T> std::ops::Deref for S<T> {
    type Target = S<(T, T)>;
    fn deref(&self) -> &Self::Target {
        self.thing()
    }
}

fn main() {}
```

Most of the details here don't matter too much, but note the 
`//@ compile-flags: -Zwrite-long-types-to-disk=yes` at the top. It is used for
adding the respective compiler flag when compiling the test.

There exist other common compiletest directives such as `//@ check-pass`,
`//@ check-fail` and `#![deny(dead_code)]` which ensure that the compiler
compiles the file successfully, fails with some errors, doesn't emit a
`dead_code` lint when compiling this file, respectively.

Also note the "Regression test for ..." comment.
This is *very* helpful for your reviewer, since it helps them understand what the test is doing and whether there's a simpler way to test the behavior.
Please do your best to write a complete description for the test.

Run your test.
[rust#161442] named its test `tests/ui/recursion/infinite-dereference-recursion-issue-67064.rs`,
so you could run:

```
./x test tests/ui/recursion/infinite-dereference-recursion-issue-67064.rs
```

If that passes, your test is ready.

## The `stderr` file and `--bless` flag

In case your test failed with some errors, it expects a `.stderr` file which is
needed to match the output of your test to verify if the test behaves as
expected.

The `.stderr` file is something that can automatically be generated. In
this example you simply need to run
`./x test tests/ui/recursion/infinite-dereference-recursion-issue-67064.rs --bless `.

Which generates the file `infinite-dereference-recursion-issue-67064.stderr`,
present in the same directory as the original test.

In our example the `infinite-dereference-recursion-issue-67064.stderr` file will look like

```rust
error[E0055]: reached the recursion limit while auto-dereferencing `S<(((((((((((((_, _), _), _), _), _), _), _), _), _), _), _), _), _)>`
  --> $DIR/test.rs:14:14
   |
LL |         self.thing()
   |              ^^^^^ deref recursion limit reached
   |
   = help: consider increasing the recursion limit by adding a `#![recursion_limit = "256"]` attribute to your crate (`test`)
   = note: the full name for the type has been written to '$TEST_BUILD_DIR/test.long-type-$LONG_TYPE_HASH.txt'
   = note: consider using `--verbose` to print the full type name to the console

error[E0599]: no method named `thing` found for reference `&S<T>` in the current scope
  --> $DIR/test.rs:14:14
   |
LL |         self.thing()
   |              ^^^^^ method not found in `&S<T>`

error: aborting due to 2 previous errors

Some errors have detailed explanations: E0055, E0599.
For more information about an error, try `rustc --explain E0055`.
```

Take a moment to look at this file and you will see some diagnostic hints given
by the compiler about the errors and the location where they occurred. You will
need to copy these diagnostics and add them to your original test file at the
same sites where the errors occurred in the `.stderr` file.

Here you can see two errors were generated by the test file. After adding them
to the test file it should look something like this

```rust
// Save this file to `tests/ui/recursion/infinite-dereference-recursion-issue-67064.rs`.

//@ compile-flags: -Zwrite-long-types-to-disk=yes

// Regression test for: https://github.com/rust-lang/rust/issues/67064
// This used to take a long time to compile because dereferencing led to
// recursive expansion of the type of the struct.

struct S<T>(T);

impl<T> std::ops::Deref for S<T> {
    type Target = S<(T, T)>;
    fn deref(&self) -> &Self::Target {
        self.thing()
        //~^ ERROR: reached the recursion limit while auto-dereferencing
        //~| ERROR: no method named `thing` found for reference
    }
}

fn main() {}
```

Run the test again using `./x test tests/ui/recursion/infinite-dereference-recursion-issue-67064.rs`.
Now it should pass cleanly.

A general workflow would be:
- Run your test with the `--bless` flag.
- Check the errors written in the `.stderr` file.
- Copy paste the errors at the error sites in the original test file.
- Run the test again to check if it passes.

The `--bless` flag is responsible for helping to generate the `.stderr` files.
This writes the emitted lint suggestions and fixes to the `.stderr` file, with
the reason for the lint, suggested fixes, line numbers, etc.
When you commit your test, you need to commit the generated `.stderr` files too.

In the future if you work on a rustfix test the `--bless` flag will instead
generate a `.fixed` file. In general if you are running your test for the first
time consider using the `--bless` flag to generate the required files.

> [!NOTE]
> If you change anything in your test file (even comments) it will
> result in your `.stderr` file becoming stale and would require you to generate
> it again before committing your changes.
>
> If the generated `.stderr`, and/or `.fixed` files are empty,
> they should be removed.

## Open a PR

Follow the instructions in [PR lifecycle](../pr-lifecycle.md).

First, run the pre-push check if you didn't set it up earlier:

```sh
./x test tidy
```

Then, [open the PR](https://guides.github.com/activities/forking/#making-a-pull-request):

```
git switch --create tests/infinite-comp
git add tests/ui/recursion/infinite-dereference-recursion-issue-67064.rs
git commit
git remote add personal https://github.com/YOUR_USERNAME_HERE/rust.git
git push --set-upstream personal tests/infinite-comp
```

## Review and feedback

See [PR lifecycle](../pr-lifecycle.md) for information about review and merging.
