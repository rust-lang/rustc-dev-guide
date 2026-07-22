# Sharing the trait solver with rust-analyzer

rust-analyzer can be viewed as a compiler frontend: it performs tasks similar to the parts of rustc
that run before code generation, such as parsing, lexing, AST construction and lowering, HIR
lowering, and even limited MIR building and const evaluation.

However, because rust-analyzer is primarily a language server, its architecture differs in several
important ways from that of rustc.
Despite these differences, a substantial portion of its responsibilities—most notably type
inference and trait solving—overlap with the compiler.

To avoid duplication and to maintain consistency between the two implementations, rust-analyzer
reuses several crates from rustc, relying on shared abstractions wherever possible.

## Shared Crates

Currently, rust-analyzer depends on several `rustc_*` crates from the compiler:

- `rustc_abi`
- `rustc_ast_ir`
- `rustc_index`
- `rustc_lexer`
- `rustc_next_trait_solver`
- `rustc_parse_format`
- `rustc_pattern_analysis`
- `rustc_type_ir`

Since these crates are not published on `crates.io` as part of the compiler's normal distribution
process, rust-analyzer maintains its own publishing pipeline.
It uses the [rustc-auto-publish script][rustc-auto-publish] to publish these crates to `crates.io`
with the prefix `ra-ap-rustc_*`
(for example: https://crates.io/crates/ra-ap-rustc_next_trait_solver).
rust-analyzer then depends on these re-published crates in its own build.

For trait solving specifically, the primary shared crates are `rustc_type_ir` and
`rustc_next_trait_solver`, which provide the core IR and solver logic used by both compiler
frontends.

## The Abstraction Layer

Because rust-analyzer is a language server, it must handle frequently changing source code and
partially invalid or incomplete source codes.
This requires an infrastructure quite different from rustc's, especially in the layers between
the source code and the HIR—for example, `Ty` and its backing interner.

To bridge these differences, the compiler provides `rustc_type_ir` as an abstraction layer shared
between rustc and rust-analyzer.
This crate defines the fundamental interfaces used to represent types, predicates, and the context
required by the trait solver.
Both rustc and rust-analyzer implement these traits for their own concrete type representations,
and `rustc_next_trait_solver` is written to be generic over these abstractions.

In addition to these interfaces, `rustc_type_ir` also includes several non-trivial components built
on top of the abstraction layer—such as elaboration logic and the search graph machinery used by the
solver.

## Design Concepts

`rustc_next_trait_solver` is intended to depend only on the abstract interfaces defined in
`rustc_type_ir`.
To support this, the type-system traits in `rustc_type_ir` must expose every interface the solver
requires—for example, [creating a new inference type variable][ir new_infer] 
([rustc][rustc new_infer], [rust-analyzer][r-a new_infer]).
For items that do not need compiler-specific representations, `rustc_type_ir` defines them directly
as structs or enums parameterized over these traits—for example, [`TraitRef`][ir tr].

The following are some notable items from the `rustc_type_ir` crate.

### `trait Interner`

The central trait in this design is [`Interner`][ir interner], which specifies all
implementation-specific details for both rustc and rust-analyzer.
Among its essential responsibilities:

- it **specifies** the concrete types used by the implementation via its
  [associated types][ir interner assocs]; these form the backbone of how each compiler frontend
  instantiates the shared IR,
- it provides the context required by the solver (e.g., querying [lang items][ir require_lang_item],
  enumerating [all blanket impls for a trait][ir for_each_blanket_impl]);
- and it must implement [`IrPrint`][ir irprint] for formatting and tracing.  
  In practice, these `IrPrint` impls simply route to existing formatting logic inside rustc or
  rust-analyzer.

In rustc, [`TyCtxt` implements `Interner`][rustc interner impl]: it exposes the rustc's query
methods, and the required `Interner` trait methods are implemented by invoking those queries.
In rust-analyzer, the implementing type is named [`DbInterner`][r-a interner impl] (as it performs
most interning through the [salsa] database), and most of its methods are backed by salsa queries
rather than rustc queries.

### `mod inherent`

Another notable item in `rustc_type_ir` is the [`inherent` module][ir inherent].
This module provides *forward definitions* of inherent methods—expressed as traits—corresponding to
methods that exist on compiler-specific types such as `Ty` or `GenericArg`.  
These definitions allow the generic crates (such as `rustc_next_trait_solver`) to call methods that
are implemented differently in rustc and rust-analyzer.

Code in generic crates should import these definitions with:

```rust
use inherent::*;
```

These forward definitions **must never be used inside the concrete implementations themselves**.
Crates that implement the traits from `mod inherent` should call the actual inherent methods on
their concrete types once those types are nameable.

You can find rustc’s implementations of these traits in the
[rustc_middle::ty::inherent][rustc inherent impl] module.
For rust-analyzer, the corresponding implementations are located across several modules under
`hir_ty::next_solver`, such as [hir_ty::next_solver::region][r-a inherent impl].

### `trait InferCtxtLike` and `trait SolverDelegate`

These two traits correspond to the role of [`InferCtxt`][rustc inferctxt] in rustc.

[`InferCtxtLike`][ir inferctxtlike] must be defined in `rustc_infer` due to coherence
constraints(orphan rules).
As a result, it cannot provide functionality that lives in `rustc_trait_selection`.
Instead, behavior that depends on trait-solving logic is abstracted into a separate trait,
[`SolverDelegate`][ir solverdelegate].
Its implementator in rustc is [simply a newtype struct over `InferCtxt`][rustc solverdelegate impl]
in `rustc_trait_selection`.

(In rust-analyzer, it is also implemented for a newtype wrapper over its own
[`InferCtxt`][r-a inferctxtlike impl], primarily to mirror rustc’s structure, although this is not
strictly necessary because all solver-related logic already resides in the `hir-ty` crate.)

In the long term, the ideal design is to move all of the logic currently expressed through
`SolverDelegate` into `rustc_next_trait_solver`, with any required core operations added directly to
`InferCtxtLike`.
This would allow more of the solver’s behavior to live entirely inside the shared solver crate.

### `rustc_type_ir::search_graph::{Cx, Delegate}`

The abstraction traits [`Cx`][ir searchgraph cx impl] and [`Delegate`][ir searchgraph delegate impl]
are already implemented within `rustc_next_trait_solver` itself.
Therefore, users of the shared crates—both rustc and rust-analyzer—do not need to provide their own
implementations.

These traits exist primarily to support fuzzing of the search graph independently of the full trait
solver.
This infrastructure is used by the external fuzzing project:
<https://github.com/lcnr/search_graph_fuzz>.


## `rustc_type_ir` Macros
`rustc_type_ir` makes _heavy_ use of a few macros, in particular
- [`TypeVisitable_Generic`][typevisitable_generic]
- [`TypeFoldable_Generic`][typefoldable_generic]
- [`Lift_Generic`][lift_generic]
- [`GenericTypeVisitable`][generictypevisitable]

of which are detailed below.


### `TypeVisitable_Generic`
[typevisitable_generic]: #typevisitable_generic

`TypeVisitable_Generic` derives `rustc_type_ir::TypeVisitable<I>` for a struct or enum.
Presently it cannot be derived for a union.

It visits the value's fields in declaration order, delegating each field to that field's own
`TypeVisitable<I>` implementation. The traversal can stop early if the visitor returns a residual
result.

The macro:
1. Uses an interner type parameter named `I`.
2. Adds `I` to the generated `impl` if the item does not already declare it.
3. Requires `I: Interner`.
4. Adds `TypeVisitable<I>` bounds for the visited field types.
5. Pattern-matches the struct or enum and visits each field.
6. Propagates a visitor residual immediately, stopping the traversal.
7. Returns `VisitorResult::output()` after every field has been visited successfully.

### How to use it

```rust
use rustc_type_ir::Interner;
use rustc_type_ir_macros::TypeVisitable_Generic;

#[derive(TypeVisitable_Generic)]
struct Example<I: Interner, T> {
    ty: I::Ty,
    value: T,
    #[type_visitable(ignore)]
    cached_hash: u64,
}
```

Use `#[type_visitable(ignore)]` to ignore a field; it will not be part of the traversal
and will not need to implement `TypeVisitable<I>`. This should only be used when the
field does not need to be traversed.

### What its expansion does

The expansion is approximately equivalent to:

```rust
impl<I, T> ::rustc_type_ir::TypeVisitable<I> for Example<I, T>
where
    I: Interner,
    I::Ty: ::rustc_type_ir::TypeVisitable<I>,
    T: ::rustc_type_ir::TypeVisitable<I>,
{
    fn visit_with<__V: ::rustc_type_ir::TypeVisitor<I>>(
        &self,
        __visitor: &mut __V,
    ) -> __V::Result {
        match *self {
            Example {
                ref ty,
                ref value,
                cached_hash: _,
            } => {
                match ::rustc_type_ir::VisitorResult::branch(
                    ::rustc_type_ir::TypeVisitable::visit_with(ty, __visitor),
                ) {
                    ::core::ops::ControlFlow::Continue(()) => {}
                    ::core::ops::ControlFlow::Break(result) => {
                        return ::rustc_type_ir::VisitorResult::from_residual(result);
                    }
                }

                match ::rustc_type_ir::VisitorResult::branch(
                    ::rustc_type_ir::TypeVisitable::visit_with(value, __visitor),
                ) {
                    ::core::ops::ControlFlow::Continue(()) => {}
                    ::core::ops::ControlFlow::Break(result) => {
                        return ::rustc_type_ir::VisitorResult::from_residual(result);
                    }
                }
            }
        }

        <__V::Result as ::rustc_type_ir::VisitorResult>::output()
    }
}
```

The exact pattern bindings are generated by `synstructure`, fields are visited
sequentially and the first residual result is returned immediately.

## `TypeFoldable_Generic`
[typefoldable_generic]: #typefoldable_generic

`TypeFoldable_Generic` derives `rustc_type_ir::TypeFoldable<I>` for a struct or enum.
Presently it cannot be derived for a union.

It consumes a value and reconstructs the same struct or enum variant after folding its fields. It
generates both fallible and infallible folding methods.

The macro:

1. Uses an interner type parameter named `I`.
2. Adds `I` to the generated `impl` if necessary.
3. Requires `I: Interner`.
4. Finds ordinary generic type parameters used by folded fields.
5. Adds the required `TypeFoldable<I>` bounds.
6. Generates `try_fold_with`, which uses `?` to propagate folder errors.
7. Generates `fold_with`, which performs the equivalent infallible fold.
8. Reconstructs the original struct or the same enum variant from the resulting fields.

Folding does not change the interner parameter or the type of the containing
value. Both methods return `Self`.

### How to use it

```rust
use rustc_type_ir::Interner;
use rustc_type_ir_macros::TypeFoldable_Generic;

#[derive(TypeFoldable_Generic)]
struct Example<I: Interner, T> {
    ty: I::Ty,
    value: T,
    #[type_foldable(identity)]
    cached_hash: u64,
}
```

Use `#[type_foldable(identity)]` for a field whose value must be preserved unchanged. The macro
moves that field directly into the reconstructed value instead of passing it to the folder. Its
type therefore does not need to implement `TypeFoldable<I>`.

### What its expansion does

The expansion is approximately equivalent to:

```rust
impl<I, T> ::rustc_type_ir::TypeFoldable<I> for Example<I, T>
where
    I: Interner,
    I::Ty: ::rustc_type_ir::TypeFoldable<I>,
    T: ::rustc_type_ir::TypeFoldable<I>,
{
    fn try_fold_with<__F: ::rustc_type_ir::FallibleTypeFolder<I>>(
        self,
        __folder: &mut __F,
    ) -> Result<Self, __F::Error> {
        Ok(match self {
            Example {
                ty,
                value,
                cached_hash,
            } => Example {
                ty: ::rustc_type_ir::TypeFoldable::try_fold_with(ty, __folder)?,
                value: ::rustc_type_ir::TypeFoldable::try_fold_with(value, __folder)?,
                cached_hash,
            },
        })
    }

    fn fold_with<__F: ::rustc_type_ir::TypeFolder<I>>(
        self,
        __folder: &mut __F,
    ) -> Self {
        match self {
            Example {
                ty,
                value,
                cached_hash,
            } => Example {
                ty: ::rustc_type_ir::TypeFoldable::fold_with(ty, __folder),
                value: ::rustc_type_ir::TypeFoldable::fold_with(value, __folder),
                cached_hash,
            },
        }
    }
}
```

For an enum, the generated match contains one reconstruction arm per variant.

## `Lift_Generic`
[lift_generic]: #lift_generic

`Lift_Generic` derives `rustc_type_ir::lift::Lift<J>` for a type parameterized by an interner `I`.
As before, it cannot be derived for a union.

It converts a value associated with interner `I` into the corresponding value associated with a
destination interner `J`. In addition to transforming the value's fields, it computes a different
associated output type named `Lifted`.

The macro adds a destination interner parameter `J` and generates an implementation with these
core requirements:

```rust
J: Interner,
I: ::rustc_type_ir::LiftInto<J>,
```

`I: LiftInto<J>` supplies the relationships needed to lift interner-associated types, such as an
`I::Ty` into the corresponding `J::Ty`.

`LiftInto` is generated in `rustc_type_ir::interner` by `declare_lift_into!`. The declaration lists
the `Interner` associated types that can be transferred between interners, including `Ty`, `Const`,
`RegionAssumptions`, `GenericArgs`, and the various ID types.

The `declare_lift_into` macro generates a trait shaped like this:

```rust
pub trait LiftInto<J>:
    Interner<
        Ty: Lift<J, Lifted = J::Ty>,
        Const: Lift<J, Lifted = J::Const>,
        DefId: Lift<J, Lifted = J::DefId>,
        // ...the remaining declared associated types...
    >
where
    J: Interner,
{
}
```

It also generates a blanket implementation for every source interner whose associated types
satisfy those bounds.

The bounds are deliberately written as associated type bounds on the `Interner` trait rather
than as `where` clauses on `LiftInto`. Given only `I: LiftInto<J>`, Rust can then treat
bounds such as the following as implied:

```rust
I::Ty: Lift<J, Lifted = J::Ty>
I::Const: Lift<J, Lifted = J::Const>
```

This allows `Lift_Generic` to emit the bound `I: LiftInto<J>` while still
calling `lift_to_interner` on fields of type `I::Ty`, `I::Const`, and the other declared associated
types. It also guarantees that each call produces the destination field type expected after
the derive rewrites `I::Assoc` to `J::Assoc`.

Without `declare_lift_into!`, the derive would need to generate a separate bound for every
interner-associated type used by every field. If a new `Interner` associated type is expected to
work with `Lift_Generic`, it needs an appropriate `Lift` implementation and normally needs to be
included in the `declare_lift_into!` invocation.

To calculate the associated `Lifted` type, the macro transforms type paths syntactically:

- A path beginning with `I` is rewritten to begin with `J`.
- A standalone ordinary generic type parameter such as `T` becomes
  `<T as ::rustc_type_ir::lift::Lift<J>>::Lifted`.
- The transformation recursively examines nested type arguments.
- Other paths are left unchanged.

For example:

```text
I::Ty                -> J::Ty
T                    -> <T as Lift<J>>::Lifted
Binder<I, T>         -> Binder<J, <T as Lift<J>>::Lifted>
Option<I::Const>     -> Option<J::Const>
```

Each normal field is then converted by calling:

```rust
field.lift_to_interner(interner)
```

Ordinary generic parameters encountered in lifted field types receive `Lift<J>` bounds.
Interner-associated-type requirements are supplied by `I: LiftInto<J>`.

### How to use it

```rust
use std::marker::PhantomData;

use rustc_type_ir::Interner;
use rustc_type_ir_macros::Lift_Generic;

#[derive(Lift_Generic)]
struct Example<I: Interner, T> {
    ty: I::Ty,
    value: T,
    marker: PhantomData<I>,
    #[lift(identity)]
    flags: u32,
}
```

Use `#[lift(identity)]` for an interner-independent field that should be moved into the lifted value
without conversion. No `Lift<J>` bound is added for that field.

The unchanged field type must still fit the corresponding field in the generated `Lifted` type. In
practice, `identity` is intended for types that do not mention `I` or ordinary generic parameters
whose lifted type could differ.

`PhantomData` is handled separately and constructs a new `PhantomData` instead of calling
`lift_to_interner` on the old marker. This is only recognised as `PhantomData` not
`std::marker::PhantomData` so it will need to be included in the file which it
usually is.

There are some limitations with this macro:

- The source interner must be named `I` for its paths to be recognized.
- The destination interner introduced by the macro is named `J`.
- Qualified-self paths are not rewritten by the type-parameter transformer.
- Only ordinary generic type parameters declared directly by the item are replaced with their
  `Lifted` associated type.
- A field not marked `identity` must support the generated `lift_to_interner` call and produce the
  field type expected by the transformed containing type.

### What its expansion does

The example expands approximately to:

```rust
impl<I, T, J> ::rustc_type_ir::lift::Lift<J> for Example<I, T>
where
    I: Interner,
    J: Interner,
    I: ::rustc_type_ir::LiftInto<J>,
    T: ::rustc_type_ir::lift::Lift<J>,
{
    type Lifted = Example<
        J,
        <T as ::rustc_type_ir::lift::Lift<J>>::Lifted,
    >;

    fn lift_to_interner(self, interner: J) -> Self::Lifted {
        match self {
            Example {
                ty,
                value,
                marker: _,
                flags,
            } => Example {
                ty: ty.lift_to_interner(interner),
                value: value.lift_to_interner(interner),
                marker: PhantomData,
                flags,
            },
        }
    }
}
```

For enums, every variant is reconstructed as the corresponding variant of the lifted enum.

## `GenericTypeVisitable`
[generictypevisitable]: #generictypevisitable

Derives `rustc_type_ir::GenericTypeVisitable<V>` for a struct or enum, but not a union.

This is the non-nightly, rust-analyzer-facing generic traversal. The visitor type is a parameter of
the trait rather than a parameter of the method, and visiting neither returns a result nor supports
short-circuiting.

When `rustc_type_ir_macros` is built without its `nightly` feature, the macro:

1. Introduces a visitor type parameter named `__V` in the generated implementation.
2. Adds `GenericTypeVisitable<__V>` bounds for every field type.
3. Pattern-matches the struct or enum.
4. Calls `GenericTypeVisitable::generic_visit_with` on every field in declaration order.
5. Returns `()` after all fields have been visited.

There is intentionally no ignore attribute. The traversal must visit every field. This is a
soundness requirement for rust-analyzer's use of the traversal when tracing and garbage-collecting
interned types.

### How to use it

```rust
use rustc_type_ir_macros::GenericTypeVisitable;

#[derive(GenericTypeVisitable)]
enum Example<T> {
    One(T),
    Two { left: T, right: T },
}
```

Every field type must implement `GenericTypeVisitable<V>` for the visitor being used.

### What its expansion does

The expansion is approximately equivalent to:

```rust
impl<T, __V> ::rustc_type_ir::GenericTypeVisitable<__V> for Example<T>
where
    T: ::rustc_type_ir::GenericTypeVisitable<__V>,
{
    fn generic_visit_with(&self, __visitor: &mut __V) {
        match *self {
            Example::One(ref value) => {
                ::rustc_type_ir::GenericTypeVisitable::<__V>::generic_visit_with(
                    value,
                    __visitor,
                );
            }
            Example::Two {
                ref left,
                ref right,
            } => {
                ::rustc_type_ir::GenericTypeVisitable::<__V>::generic_visit_with(
                    left,
                    __visitor,
                );
                ::rustc_type_ir::GenericTypeVisitable::<__V>::generic_visit_with(
                    right,
                    __visitor,
                );
            }
        }
    }
}
```

When the macro crate's `nightly` feature is enabled, the derive macro remains registered but emits
no tokens. The `GenericTypeVisitable` trait and its traversal module are also excluded from the
nightly configuration of `rustc_type_ir`; they exist only in its non-nightly configuration.

## Long-term plans for supporting rust-analyzer

In general, we aim to support rust-analyzer just as well as rustc in these shared crates—provided
doing so does not substantially harm rustc's performance or maintainability. 
(e.g., [#145377][pr 145377], [#146111][pr 146111], [#146182][pr 146182] and [#147723][pr 147723])

Shared crates that require nightly-only features must guard such code behind a `nightly` feature
flag, since rust-analyzer is built with the stable toolchain.

Looking forward, we plan to uplift more shared logic into `rustc_type_ir`.
There are still duplicated implementations between rustc and rust-analyzer—such as `ObligationCtxt` 
([rustc][rustc oblctxt], [rust-analyzer][r-a oblctxt]) and type coercion logic 
([rustc][rustc coerce], [rust-analyzer][r-a coerce])—that we would like to unify over time.

[rustc-auto-publish]: https://github.com/rust-analyzer/rustc-auto-publish
[ir new_infer]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/inherent/trait.Ty.html#tymethod.new_infer
[rustc new_infer]: https://github.com/rust-lang/rust/blob/63b1db05801271e400954e41b8600a3cf1482363/compiler/rustc_middle/src/ty/sty.rs#L413-L420
[r-a new_infer]: https://github.com/rust-lang/rust-analyzer/blob/34f47d9298c478c12c6c4c0348771d1b05706e09/crates/hir-ty/src/next_solver/ty.rs#L59-L92
[ir tr]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/struct.TraitRef.html
[ir interner]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/trait.Interner.html
[ir interner assocs]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/trait.Interner.html#required-associated-types
[ir require_lang_item]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/trait.Interner.html#tymethod.require_lang_item
[ir for_each_blanket_impl]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/trait.Interner.html#tymethod.for_each_blanket_impl
[ir irprint]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/ir_print/trait.IrPrint.html
[rustc interner impl]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_middle/ty/struct.TyCtxt.html#impl-Interner-for-TyCtxt%3C'tcx%3E
[r-a interner impl]: https://github.com/rust-lang/rust-analyzer/blob/a50c1ccc9cf3dab1afdc857a965a9992fbad7a53/crates/hir-ty/src/next_solver/interner.rs
[salsa]: https://github.com/salsa-rs/salsa
[ir inherent]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/inherent/index.html
[rustc inherent impl]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_middle/ty/inherent/index.html
[r-a inherent impl]: https://github.com/rust-lang/rust-analyzer/blob/a50c1ccc9cf3dab1afdc857a965a9992fbad7a53/crates/hir-ty/src/next_solver/region.rs
[ir inferctxtlike]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_type_ir/trait.InferCtxtLike.html
[rustc inferctxt]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_infer/infer/struct.InferCtxt.html
[rustc inferctxtlike impl]: https://doc.rust-lang.org/1.91.1/nightly-rustc/src/rustc_infer/infer/context.rs.html#14-332
[r-a inferctxtlike impl]: https://github.com/rust-lang/rust-analyzer/blob/a50c1ccc9cf3dab1afdc857a965a9992fbad7a53/crates/hir-ty/src/next_solver/infer/context.rs
[ir solverdelegate]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_next_trait_solver/delegate/trait.SolverDelegate.html
[rustc solverdelegate impl]: https://doc.rust-lang.org/1.91.1/nightly-rustc/rustc_trait_selection/solve/delegate/struct.SolverDelegate.html
[r-a solverdelegate impl]: https://github.com/rust-lang/rust-analyzer/blob/a50c1ccc9cf3dab1afdc857a965a9992fbad7a53/crates/hir-ty/src/next_solver/solver.rs#L27-L330
[ir searchgraph cx impl]: https://doc.rust-lang.org/1.91.1/nightly-rustc/src/rustc_type_ir/interner.rs.html#550-575
[ir searchgraph delegate impl]: https://doc.rust-lang.org/1.91.1/nightly-rustc/src/rustc_next_trait_solver/solve/search_graph.rs.html#20-123
[pr 145377]: https://github.com/rust-lang/rust/pull/145377
[pr 146111]: https://github.com/rust-lang/rust/pull/146111
[pr 146182]: https://github.com/rust-lang/rust/pull/146182
[pr 147723]: https://github.com/rust-lang/rust/pull/147723
[rustc oblctxt]: https://github.com/rust-lang/rust/blob/63b1db05801271e400954e41b8600a3cf1482363/compiler/rustc_trait_selection/src/traits/engine.rs#L48-L386
[r-a oblctxt]: https://github.com/rust-lang/rust-analyzer/blob/34f47d9298c478c12c6c4c0348771d1b05706e09/crates/hir-ty/src/next_solver/obligation_ctxt.rs
[rustc coerce]: https://github.com/rust-lang/rust/blob/63b1db05801271e400954e41b8600a3cf1482363/compiler/rustc_hir_typeck/src/coercion.rs
[r-a coerce]: https://github.com/rust-lang/rust-analyzer/blob/34f47d9298c478c12c6c4c0348771d1b05706e09/crates/hir-ty/src/infer/coerce.rs