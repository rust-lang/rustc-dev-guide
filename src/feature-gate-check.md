# Feature Gate Checking

For the how-to steps to add, remove, rename, or stabilize feature gates,
see [Feature gates][feature-gates].

Feature gates prevent usage of unstable language and library features without a
nightly-only `#![feature(...)]` opt-in.
This chapter documents the implementation
of feature gating: where gates are defined, how they are enabled, and how usage is verified.

<!-- date-check: Oct 2026 -->

## Feature Definitions

All feature gate definitions are located in the `rustc_feature` crate:

- **Unstable features** are declared in [`rustc_feature/src/unstable.rs`] via
  the `declare_features!` macro.
  This associates features with issue numbers and tracking metadata.
- **Accepted features** (stabilized) are listed in [`rustc_feature/src/accepted.rs`].
- **Removed features** (explicitly disallowed) are listed in [`rustc_feature/src/removed.rs`].
- **Gated cfgs** are declared in [`rustc_feature/src/builtin_attrs.rs`].

The [`rustc_feature::Features`] type represents the **active feature set** for a crate.
Helpers like `enabled`, `incomplete`, and `internal` are used during compilation to check status.

## Collecting Features

Before AST validation or expansion, `rustc` collects crate-level
`#![feature(...)]` attributes to build the active `Features` set.

- The collection happens in [`rustc_expand/src/config.rs`] in [`features`].
- Each `#![feature]` entry is classified against the `unstable`, `accepted`, and `removed` tables:
  - **Removed** features cause an immediate error.
  - **Accepted** features are recorded but do not require nightly.
    On stable/beta, `maybe_stage_features` in
    [`rustc_ast_passes/src/feature_gate.rs`] emits the non-nightly
    diagnostic and lists stable features, which is where the "already
    stabilized" messaging comes from.
  - **Unstable** features are recorded as enabled.
  - Unknown features are treated as **library features** and validated later.
- With `-Z allow-features=...`, any **unstable** or **unknown** feature
  not in the allowlist is rejected.
- [`RUSTC_BOOTSTRAP`] feeds into `UnstableFeatures::from_environment`.
  This variable controls whether the compiler is treated as "nightly", allowing
  feature gates to be bypassed during bootstrapping or explicitly disabled (`-1`).

## Parser Gating

Some syntax is detected and gated during parsing.
The parser records spans for
later checking to keep diagnostics consistent and deferred until after parsing.

- [`rustc_session/src/parse.rs`] defines [`GatedSpans`] and the `gate` method.
- The parser uses it in [`rustc_parse/src/parser/*`] when it encounters
  syntax that requires a gate (e.g., `async for`, `yield`, experimental patterns).

## Checking Pass

The central logic lives in [`rustc_ast_passes/src/feature_gate.rs`], primarily
in `check_crate` and its AST visitor.

### `check_crate`

`check_crate` performs high-level validation:

- `maybe_stage_features`: Rejects `#![feature]` on stable/beta.
- `check_incompatible_features`: Ensures incompatible feature combinations
  (declared in `rustc_feature::INCOMPATIBLE_FEATURES`) are not used together.
- `check_dependent_features`: Errors if a feature is enabled without the features it depends on
  (declared in `rustc_feature::DEPENDENT_FEATURES`).
- `warn_next_solver_and_gce` / `warn_next_solver_and_higher_ranked_assumptions`: Warns
  when `-Znext-solver=globally` falls back to coherence mode due to incompatible features.
- `check_features_requiring_new_solver`: Requires the new trait solver for
  features incompatible with the old solver.
- **Parser-gated spans**: Processes the `GatedSpans` recorded during parsing
  (see [Checking `GatedSpans`](#checking-gatedspans)).

### Checking `GatedSpans`

`check_crate` iterates over `sess.psess.gated_spans`:

- The `gate_all!` macro emits diagnostics for each gated span if the feature is not enabled.
- Some gates have extra logic (e.g., `yield` can be allowed by `coroutines` or
  `gen_blocks` or `yield_expr`).
- Legacy gates (e.g., `auto_traits`, `try_blocks`) may use a separate path that
  emits future-incompatibility warnings instead of hard errors.

### AST Visitor

A `PostExpansionVisitor` walks the expanded AST to check constructs that are
easier to validate after expansion.

- The visitor uses helper macros (`gate!`, `gate_alt!`, `gate_multi!`) to check:
  1. Is the feature enabled?
  2. Does `span.allows_unstable` permit it (for internal compiler macros)?
- Examples include `trait_alias`, `decl_macro`, `extern types`, and various `impl Trait` forms.

## Attributes and `cfg`

Beyond syntax, rustc also gates attributes and `cfg` options.

### Built-in attributes

- Built-in attributes declare an `AttributeStability` in `rustc_attr_parsing`
  (stable or unstable behind a feature gate).
- [`check_attribute_stability`] checks it during parsing and emits `feature_err` if the
  gate is disabled (unless allowed via `allows_unstable`).

### `cfg` options

- [`rustc_attr_parsing/src/attributes/cfg.rs`] defines `gate_cfg` and uses
  [`rustc_feature::find_gated_cfg`] to reject gated `cfg`s.
- `gate_cfg` respects `Span::allows_unstable`, allowing internal compiler
  macros to bypass `cfg` gates when marked with `#[allow_internal_unstable]`.
- The gated cfg list is defined in [`rustc_feature/src/builtin_attrs.rs`].

## Diagnostics

Diagnostic helpers are located in [`rustc_session/src/diagnostics.rs`].

- `feature_err` and `feature_warn` emit standardized diagnostics, attaching the
  tracking issue number where possible.
- `Span::allows_unstable` in [`rustc_span/src/lib.rs`] checks if a span originates
  from a macro marked with `#[allow_internal_unstable]`.
  This allows internal
  macros to use unstable features on stable channels while enforcing gates for user code.

[`rustc_feature/src/unstable.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_feature/src/unstable.rs
[`rustc_feature/src/removed.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_feature/src/removed.rs
[`rustc_feature/src/accepted.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_feature/src/accepted.rs
[`rustc_feature/src/builtin_attrs.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_feature/src/builtin_attrs.rs
[`rustc_feature::Features`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_feature/struct.Features.html
[`rustc_expand/src/config.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_expand/src/config.rs
[`features`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_expand/config/fn.features.html
[`RUSTC_BOOTSTRAP`]: https://doc.rust-lang.org/beta/unstable-book/compiler-environment-variables/RUSTC_BOOTSTRAP.html
[`rustc_session/src/diagnostics.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_session/src/diagnostics.rs
[`rustc_session/src/parse.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_session/src/parse.rs
[`GatedSpans`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_session/parse/struct.GatedSpans.html
[`rustc_ast_passes/src/feature_gate.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_ast_passes/src/feature_gate.rs
[`rustc_parse/src/parser/*`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_parse/parser/index.html
[`check_attribute_stability`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_attr_parsing/src/stability.rs
[`rustc_attr_parsing/src/attributes/cfg.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_attr_parsing/src/attributes/cfg.rs
[`rustc_feature::find_gated_cfg`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_feature/fn.find_gated_cfg.html
[`rustc_span/src/lib.rs`]: https://github.com/rust-lang/rust/blob/HEAD/compiler/rustc_span/src/lib.rs
[feature-gates]: ./feature-gates.md
