# Lints

This page documents some of the machinery around lint registration and how we
run lints in the compiler.

The [`LintStore`] is the central piece of infrastructure, around which everything rotates.
The `LintStore` is held as part of the [`Session`], and it
gets populated with the list of lints shortly after the `Session` is created.

## Lints vs. lint passes

There are two parts to the linting mechanism within the compiler: lints and lint passes.
Unfortunately, a lot of the documentation we have refers to both of these as just "lints."

First, we have the lint declarations themselves,
and this is where the name and default lint level and other metadata come from.
These are normally defined by way of the [`declare_lint!`] macro,
which boils down to a static with type [`&rustc_lint_defs::Lint`]
(although this may change in the future,
as the macro is somewhat unwieldy to add new fields to,
like all macros).

We lint against direct declarations without the use of the macro.

Lint declarations don't carry any "state" - they are merely global identifiers
and descriptions of lints.
We assert at runtime that they are not registered twice (by lint name).

Lint passes are the meat of any lint.
Notably, there is not a one-to-one
relationship between lints and lint passes; a lint might not have any lint pass
that emits it, it could have many, or just one -- the compiler doesn't track
whether a pass is in any way associated with a particular lint, and frequently
lints are emitted as part of other work (e.g., type checking, etc.).

## Registration

### High-level overview

In [`rustc_interface::run_compiler`],
the [`LintStore`] is created,
and all lints are registered.

There are three 'sources' of lints:

* internal lints: lints only used by the rustc codebase
* builtin lints: lints built into the compiler and not provided by some outside source
* `rustc_interface::Config`[`register_lints`]: lints passed into the compiler during construction

Lints are registered via the [`LintStore::register_lint`] function.
This should happen just once for any lint, or an ICE will occur.

Once the registration is complete, we "freeze" the lint store by placing it in an `Arc`.

Lint passes are registered separately into one of the categories
(pre-expansion, early, late, late module).
Passes are registered as a closure
-- i.e., `impl Fn() -> Box<dyn X>`, where `dyn X` is either an early or late
lint pass trait object.
When we run the lint passes, we run the closure and then invoke the lint pass methods.
The lint pass methods take `&mut self` so they can keep track of state internally.

#### Internal lints

These are lints used just by the compiler or drivers like `clippy`.
They can be found in [`rustc_lint::internal`].

An example of such a lint is the check that lint passes are implemented using
the `declare_lint_pass!` macro and not by hand.
This is accomplished with the `LINT_PASS_IMPL_WITHOUT_MACRO` lint.

Registration of these lints happens in the [`rustc_lint::register_internals`]
function which is called when constructing a new lint store inside [`rustc_lint::new_lint_store`].

#### Builtin Lints

These are primarily described in two places,
`rustc_lint_defs::builtin` and `rustc_lint::builtin`.
Often the first provides the definitions for the lints themselves,
and the latter provides the lint pass definitions (and implementations),
but this is not always true.

The builtin lint registration happens in the [`rustc_lint::register_builtins`] function.
Just like with internal lints,
this happens inside of [`rustc_lint::new_lint_store`].

#### Driver lints

These are the lints provided by drivers via the `rustc_interface::Config`
[`register_lints`] field, which is a callback.
Drivers should, if finding it
already set, call the function currently set within the callback they add.
The best way for drivers to get access to this is by overriding the
`Callbacks::config` function which gives them direct access to the `Config` structure.

## Compiler lint passes are combined into one pass

Within the compiler, for performance reasons, we usually do not register dozens
of lint passes. Instead, we have a single lint pass of each variety (e.g.,
`BuiltinCombinedLateLintModPass`) which will internally call all of the
individual lint passes; this is because then we get the benefits of static over
dynamic dispatch for each of the (often empty) trait methods.

Ideally, we'd not have to do this, since it adds to the complexity of understanding the code.
However, with the current type-erased lint store
approach, it is beneficial to do so for performance reasons.

## Deciding whether a lint is emitted

A lint pass decides *that* a lint applies; whether the user actually sees it is a
separate step, and it is where lint levels come in.

### Where the levels are recorded

[`LintLevelsBuilder`] walks the HIR and builds, for each HIR owner, a
[`ShallowLintLevelMap`]: a map from a node to the lint levels written *directly*
on that node with an attribute such as `#[allow(...)]`, `#[warn(...)]`,
`#[deny(...)]`, `#[forbid(...)]` or `#[expect(...)]`.
It is "shallow" because it records only what that node says, not what it
inherits.

The levels given on the command line (`-A`, `-W`, `-D`, `-F`, in the order they
appeared) go into the `COMMAND_LINE` entry of [`LintLevelSets`] instead.
[`get_cmd_lint_options`] sorts them by their position on the command line, so a
later flag wins over an earlier one.

### Resolving the level for a node

When a lint is about to be reported at some node, the level is resolved in two
steps.

[`ShallowLintLevelMap::lint_level_spec_at_node`] walks *up* the HIR parent chain
from that node and returns the first explicit setting it finds, so the innermost
attribute wins.
If nothing in the chain mentions the lint, `raw_lint_level_spec` falls back to
the command-line level, and if there is none either, the lint's own
[`default_level`] applies.
The result is a [`LevelSpec`], which is a level plus where it came from
(a [`LintLevelSource`]: `Default`, `Node` with the attribute's name and span, or
`CommandLine`).
That source is what lets rustc explain a lint with `#[allow]` versus `-A` in
later diagnostics.

### Applying the caps

The level is then finalized by [`reveal_actual_level_spec`], which applies three
things:

1. If the level is `warn`, and the `warnings` group has been configured in
   scope, the group's level takes over. This is what makes `-Awarnings` suppress
   warnings generally, and it is why some warnings cannot be denied through the
   group, only individually.
2. `--cap-lints` is applied by taking the *minimum* of the resolved level and
   the cap: `level = min(level, lint_cap.unwrap_or(Level::Forbid))`. [`Level`]
   is ordered `Allow < Expect < Warn < ForceWarn < Deny < Forbid`, so capping at
   `allow` turns every lint off, which is what Cargo passes when building
   dependencies. The default cap is `Forbid`, i.e. no cap at all. A
   `--force-warn` from the command line is exempt, since forcing a warning is
   meant to be the one thing that cannot be suppressed.
3. `Session::driver_lint_caps` is applied the same way, which lets a driver such
   as clippy cap lints without touching the command line.

Finally, the pass compares the resolved level: `Allow` and `Expect` do not
produce a message (an `Expect` instead records that the lint was expected, so
that `unfulfilled_lint_expectations` can fire if it never showed up), while
`Warn`, `ForceWarn`, `Deny` and `Forbid` emit one, with `Deny` and `Forbid`
additionally failing the compilation.

[`LintLevelsBuilder`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint/levels/struct.LintLevelsBuilder.html
[`ShallowLintLevelMap`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/lint/struct.ShallowLintLevelMap.html
[`ShallowLintLevelMap::lint_level_spec_at_node`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/lint/struct.ShallowLintLevelMap.html#method.lint_level_spec_at_node
[`LintLevelSets`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint/levels/struct.LintLevelSets.html
[`LevelSpec`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/lint/struct.LevelSpec.html
[`LintLevelSource`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/lint/enum.LintLevelSource.html
[`Level`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint_defs/enum.Level.html
[`default_level`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint_defs/struct.Lint.html#method.default_level
[`get_cmd_lint_options`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_session/src/config.rs
[`reveal_actual_level_spec`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_middle/src/lint.rs

[`LintStore`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint/struct.LintStore.html
[`LintStore::register_lint`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint/struct.LintStore.html#method.register_lints
[`rustc_lint::register_builtins`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint/fn.register_builtins.html
[`rustc_lint::register_internals`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint/fn.register_internals.html
[`rustc_lint::new_lint_store`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint/fn.new_lint_store.html
[`declare_lint!`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_session/macro.declare_lint.html
[`declare_tool_lint!`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_session/macro.declare_tool_lint.html
[`register_lints`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_interface/interface/struct.Config.html#structfield.register_lints
[`&rustc_lint_defs::Lint`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint_defs/struct.Lint.html
[`Session`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_session/struct.Session.html
[`rustc_interface::run_compiler`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_interface/index.html#reexport.run_compiler
[`rustc_lint::internal`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lint/internal/index.html
