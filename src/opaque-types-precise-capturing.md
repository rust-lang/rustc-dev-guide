# Precise capturing with `use<..>` for opaque types

<!-- date-check --> Sep 2026

Precise capturing lets you specify exactly which generic parameters an opaque type captures.
Without it, an opaque captures parameters according to rules that depend on its origin and edition.
Understanding these rules and how `use<..>` changes them is essential to predict an opaque's final parameter list.

## Running example: a type parameter in function scope

Start with this function and its opaque type:

```rust
fn type_param<T>() -> impl Sized + use<T> {}
```

The function declares `T` and the `use<T>` list captures it, so this opaque's generic list contains `T` and calling the function with a concrete type like `u32` means the returned opaque carries `T = u32` in its signature.

Now remove `T` from the list:

```rust
fn type_param_empty<T>() -> impl Sized + use<> {}
//~^ ERROR `impl Trait` must mention all type parameters in scope in `use<...>`
```

The opaque tries to capture no parameters even though `T` is in scope, but the compiler rejects this because every type parameter must be named when you write a `use<..>` bound.

An opaque's captured parameters form its final generic list.
Parameters you do not name are absent from generics, not present-but-unused.
They are gone entirely.

## The capture-all default

An opaque's default is to capture all in-scope lifetimes, but this rule has exceptions.
Read the function [`opaque_captures_all_in_scope_lifetimes`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/collect/resolve_bound_vars.rs#L322) in the compiler source to understand the four cases.

If the opaque carries a `use<..>` bound, capture-all is immediately false and the default capture logic is disabled entirely.

Async functions and type aliases (TAITs) always capture all in-scope lifetimes by default.
Edition 2024 and later make all opaques capture everything by default.
Before edition 2024, return-position impl Trait outside of a trait or impl captures only the lifetimes mentioned in the bounds.
Return-position impl Trait inside a trait or impl captures all in-scope lifetimes.

## What `use<..>` actually does

`use<..>` does not filter a complete set of lifetimes down to a smaller set.
Instead, it changes the source of the set entirely.

When capture-all is true, the compiler walks outward through the scope hierarchy via `visit_opaque_ty` at [`rustc_hir_analysis/src/collect/resolve_bound_vars.rs:527`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/collect/resolve_bound_vars.rs#L527), finding every lifetime in the parent context and remapping it into the opaque's parameter list while respecting scope boundaries and shadowing.
It then reverses the map so the order matches the opaque's final generics.

When `use<..>` is present, that walk never happens.
Instead, only the lifetimes you name in the list get resolved into the opaque's parameter map.
The resolution is in `visit_precise_capturing_arg` at [`rustc_hir_analysis/src/collect/resolve_bound_vars.rs:659`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/collect/resolve_bound_vars.rs#L659).
The result lands in the `opaque_captured_lifetimes` query at [`rustc_hir_analysis/src/collect/resolve_bound_vars.rs:617`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/collect/resolve_bound_vars.rs#L617).

Parameters you do not capture are absent from the opaque's generics entirely, not appearing in the final type and not lurking as unused generics.
This is the trap that burned development on PR #162575.

The query `rendered_precise_capturing_args` at [`rustc_hir_analysis/src/collect.rs:1747`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/collect.rs#L1747) turns a capture list back into printable symbols.
Rustdoc and borrow checker diagnostics use it to show what an opaque captured.
For return-position impl Trait in a trait (RPITIT), this query forwards the def id to the underlying opaque.

## The compilation pipeline

Parsing happens in [`rustc_parse/src/parser/ty.rs`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_parse/src/parser/ty.rs).
The AST node is [`GenericBound::Use`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_ast/ast/enum.GenericBound.html) in [`rustc_ast/src/ast.rs:403`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_ast/src/ast.rs#L403).
The argument variants are at [`rustc_ast/src/ast.rs:2698`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_ast/src/ast.rs#L2698).

Resolution is the heaviest stage.
[`rustc_resolve/src/late.rs`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_resolve/src/late.rs) introduces `PathSource::PreciseCapturingArg(Namespace)` at [`line 467`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_resolve/src/late.rs#L467).
Each argument is resolved at [`line 1245`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_resolve/src/late.rs#L1245), trying both `ValueNS` and `TypeNS` because an entry may name a type parameter or a const parameter.
This ambiguity is why the feature owns two error codes: E0799 and E0800, defined at [`line 684`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_resolve/src/late.rs#L684).

Rejection happens in two places.
[`NoPreciseCapturesOnApit`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_ast_lowering/src/lib.rs#L1647) in [`rustc_ast_lowering/src/lib.rs:1647`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_ast_lowering/src/lib.rs#L1647) refuses `use<..>` on argument-position impl Trait.
[`rustc_ast_passes/src/ast_validation.rs:253`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_ast_passes/src/ast_validation.rs#L253) refuses two `use<..>` bounds on one opaque.
That file also carries a FIXME noting that other positions such as associated type position (GATs) would need their own validation.

Lowering proper is `lower_precise_capturing_args` at [`rustc_ast_lowering/src/lib.rs:1860`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_ast_lowering/src/lib.rs#L1860), which produces [`hir::GenericBound::Use`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/hir/enum.GenericBound.html) at [`rustc_hir/src/hir.rs:789`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir/src/hir.rs#L789) over [`PreciseCapturingArgKind`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/hir/enum.PreciseCapturingArgKind.html) at [`rustc_hir/src/hir.rs:3445`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir/src/hir.rs#L3445).

## Validation

All validation of a `use<..>` bound happens in `check_opaque_precise_captures` at [`rustc_hir_analysis/src/check/check.rs:573`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/check/check.rs#L573).
The function enforces three separate jobs: it checks that every type and const parameter is mentioned, that every implicitly or explicitly captured lifetime is mentioned, and it asserts that each captured parameter is invariant in variances.

Every error the validator can emit is defined in [`rustc_hir_analysis/src/diagnostics/precise_captures.rs`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/diagnostics/precise_captures.rs).

Every type parameter must be captured when you write a `use<..>` bound, or you get `ParamNotCaptured` from the compiler.

Every const parameter must be captured.

Every implicitly captured lifetime must be listed when the opaque is inside a trait, where lifetimes from the parent context are implicitly available for capture.
If a lifetime is implicitly capturable, `LifetimeImplicitlyCaptured` fires if you do not name it, which catches accidental narrowing of the capture set.

Every other captured lifetime must be listed, and lifetimes that are not implicitly capturable fire `LifetimeNotCaptured` if you do not name them.
Both `LifetimeImplicitlyCaptured` and `LifetimeNotCaptured` print the same error line; only the label on the span differs.

`Self` on a trait's opaque must be captured because when an opaque appears in a trait method, `Self` is in scope as an implicit parameter, and `SelfTyNotCaptured` fires if you omit it from `use<..>`.

```rust
trait Trait {
    fn method(&self) -> impl Sized + use<> {}
    //~^ ERROR `impl Trait` must mention the `Self` type of the trait
}
```

`Self` as an alias cannot be captured because when `Self` refers to a concrete type in an inherent impl, it is not a parameter but a type alias, and `PreciseCaptureSelfAlias` fires (error E0799) if you try.

```rust
struct Wrapper;

impl Wrapper {
    fn method() -> impl Sized + use<Self> {}
    //~^ ERROR `Self` can't be captured in `use<...>` precise captures list, since it is an alias
}
```

In a trait, you must capture `Self`; in an impl for a concrete type, you cannot.

Lifetimes must precede type and const parameters, enforced by `LifetimesMustBeFirst` which requires all lifetime captures before type captures before const captures.

No parameter may appear twice, refused by `DuplicatePreciseCapture` when the same parameter is listed more than once.

Restricted lifetime forms are not allowed, refused by `BadPreciseCapture` which rejects `'static`, `'_`, and inferred lifetimes.

## The invariance consequence

Every captured parameter lands in the opaque's generic list and the validator asserts that each is invariant, as reported by the query `variances_of` at [`rustc_hir_analysis/src/variance/mod.rs:37`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/variance/mod.rs#L37).

Variance cannot distinguish "the opaque captures all in-scope lifetimes" from "the opaque captures these specific lifetimes."
Both result in the same set of parameters, all invariant, which is why variance alone cannot tell you the capture story.
You must read the HIR bound.

## Shadowed lifetimes in validation

An opaque gets its own fresh lifetime parameters that shadow the parent's.
When you name a parent lifetime in `use<..>`, the compiler must map it back to the parent's scope to report the right span in error messages via `map_opaque_lifetime_to_parent_lifetime` at [`rustc_middle/src/ty/context.rs:2727`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_middle/src/ty/context.rs#L2727), which loops through the parent's `opaque_captured_lifetimes` to find the mapping.

The `shadowed_captures` set in [`rustc_hir_analysis/src/check/check.rs`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_hir_analysis/src/check/check.rs) exists because a lifetime can arrive through projection syntax like `Self::Assoc` or `T::Assoc` instead of being named directly.
Validation must track which spans refer to the same lifetime to avoid duplicate errors.
See PR #115659 for that history.

## RPITIT before edition 2024

Return-position impl Trait in a trait (RPITIT) before edition 2024 has special rules.
It captures all in-scope lifetimes by default.
Its trait lifetimes are implicitly available, in scope without you having to name the parent.

But "implicitly available" does not mean "you can omit them from `use<..>`."
When you write a `use<..>` bound on an RPITIT, you must still list the trait lifetimes.
The implicit part refers to scope, not to the capture list.

RPITIT HIR nodes are synthetic, appearing as [`hir::Node::Synthetic`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/hir/enum.Node.html) or [`hir::OwnerNode::Synthetic`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/hir/enum.OwnerNode.html) in the tree rather than as standalone opaques.
`check_opaque_precise_captures` handles RPITITs directly during validation, as its own doc comment states.
The compiler does not need `rendered_precise_capturing_args` to reach an RPITIT's validation rules.

## Hidden type region inference errors

Precise capturing rules are also enforced by region inference in the borrow checker, which requires that a hidden type's captured lifetimes appear in the opaque's bounds.

This produces error E0700: "hidden type for `impl Trait` captures lifetime that does not appear in bounds."

```rust
fn b<'a>(x: &'a ()) -> impl Sized + use<> { x }
//~^ ERROR hidden type for `impl Sized` captures lifetime that does not appear in bounds
```

The hidden type `&'a ()` captures `'a`, but `'a` does not appear in the bound.
This differs from the validation error "captures lifetime parameter but it is not mentioned in use<...> precise captures list" because region inference discovers the hidden type after type checking the function body, while the validator fires during HIR analysis and region inference fires during borrow checking.

These errors often appear together, with the validator telling you which parameters must be listed and the region inference error telling you that your hidden type violates those constraints.

See [Opaque types region inference restrictions](./borrow-check/opaque-types-region-inference-restrictions.md) for the full set of region inference rules on opaques.

## Edition 2024 and the migration lint

Edition 2024 changes the default by making all opaques capture all in-scope lifetimes, which breaks code written for earlier editions that relied on narrower capture.

The transition is a future-compat warning in [`rustc_lint/src/impl_trait_overcaptures.rs:32`](https://github.com/rust-lang/rust/blob/master/compiler/rustc_lint/src/impl_trait_overcaptures.rs#L32), with a worked borrow-checker example in its documentation.
Test files `overcaptures-2024*.rs` and `migration-note.rs` show the lint in action, and the `.fixed` files show the recommended fix: add an explicit `use<..>` bound to preserve the old behavior.

## Examples from the test suite

For a type parameter that is not captured, the error names the missing parameter:

```rust
fn type_param<T>() -> impl Sized + use<> {}
//~^ ERROR `impl Trait` must mention all type parameters in scope
```

For a trait's opaque that does not capture `Self`:

```rust
trait Foo {
    fn bar() -> impl Sized + use<>;
    //~^ ERROR `impl Trait` must mention the `Self` type of the trait
}
```

For a lifetime that appears in the bounds but is not captured:

```rust
fn lifetime_in_bounds<'a>(x: &'a ()) -> impl Into<&'a ()> + use<> { x }
//~^ ERROR `impl Trait` captures lifetime parameter, but it is not mentioned in `use<...>` precise captures list
```

For a lifetime that appears in the hidden type but not in the bounds:

```rust
fn lifetime_in_hidden<'a>(x: &'a ()) -> impl Sized + use<> { x }
//~^ ERROR hidden type for `impl Sized` captures lifetime that does not appear in bounds
```

For an opaque in inherent impl that tries to capture `Self`:

```rust
struct Wrapper;

impl Wrapper {
    fn method() -> impl Sized + use<Self> {}
    //~^ ERROR `Self` can't be captured in `use<...>` precise captures list, since it is an alias
}
```

For lifetime ordering violations:

```rust
fn method<'a, T>() -> impl Sized + use<T, 'a> {}
//~^ ERROR lifetime parameter `'a` must be listed before non-lifetime parameters
```

See `tests/ui/impl-trait/precise-capturing/` for the full test suite.
