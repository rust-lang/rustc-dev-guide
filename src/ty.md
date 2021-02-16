# The `ty` module: representing types

<!-- toc -->

The [`ty`][ty] module defines how the Rust compiler represents types internally.
It also defines the [`ty::TyCtxt`][ty_tyctxt] or *typing context* which is _the_
central data structure in the compiler.

While Rust language currently lacks a formal specification of a specific memory
layout for each type. There is ongoing discussion about memory validity
guarantees in Rust's [unsafe code guidelines workgroup][wgucg] and other related
projects.

## `ty::Ty`

When referring to how `rustc` represents types, we usually mean [`ty::Ty`] and
not the [`rustc_hir::Ty`][hir_ty]. Since the distinction is important we will
discuss it further before going into the details of [`ty::Ty`].

## `rustc_hir::Ty` vs `rustc_middle::ty::Ty`

In `rustc` the High-Level Intermediate Representation ([HIR](hir.md)) is the
[AST](syntax-intro.md) representing user written syntax, and is obtained after
parsing and some desugaring. A [HIR](hir.md) contains a representation of types,
but in reality it reflects *what* the user wrote to represent a type.

In contrast, [`ty::Ty`] represents the semantics of a type, that is, the
*meaning* of what the user wrote. For example, [`rustc_hir::Ty`][hir_ty] would
record use of the name [`u32`][u32] twice in a program, but [`ty::Ty`] would
record the fact that both usages refer to the same type.

**Example: `fn foo(x: u32) → u32 { x }`** 

Above we see [`u32`][u32] appears twice. The function takes and returns an
argument of the same type. In the [HIR](hir.md) there are now two distinct type
instances which have two different [`Span`][span]s (locations).

**Example: `fn foo(x: &u32) -> &u32`** 

A [HIR](hir.md) may also have certain information left out. The above type
[`&u32`][u32] is incomplete since in the full `rustc` type there's actually a
[lifetime][lifetime] but we don’t always need to write them due to [elision
rules][lifetime-elision] which inserts the omitted information. Here the result
is actually:

```rust 
fn foo<'a>(x: &'a u32) -> &'a u32
```

In [HIR](hir.md) the description of [lifetime][lifetime]s is rather incomplete.
However, at the [`ty::Ty`] level, [lifetime][lifetime] details are added.
Moreover, we will have exactly one [`ty::Ty`] for a given type, like
[`u32`][u32], and that [`ty::Ty`] is used for all [`u32`][u32]s in the whole
program, unlike [`rustc_hir::Ty`][hir_ty] which logs each and every usage.

| [`rustc_hir::Ty`][hir_ty] | [`rustc_middle::ty::Ty`][ty_Ty] |
- | - |
| Describe the *syntax* of a type (what the user wrote with some desugaring). | Describe the *semantics* of a type (the meaning of what the user wrote).
| Each [`rustc_hir::Ty`][hir_ty] has appropriate [span][span]s corresponding to places in the program. | Doesn’t correspond to a single place in the user’s program. 
| [`rustc_hir::Ty`][hir_ty] has generics and lifetimes; however, some of those lifetimes are special markers like [`LifetimeName::Implicit`][implicit]. | A [`ty::Ty`] has the full type, including elided generics and lifetimes. 
| `fn foo(x: u32) → u32 { }` - Two [`rustc_hir::Ty`][hir_ty] representing each usage of [`u32`][u32]. Each has its own [`Span`][span]s, etc.- [`rustc_hir::Ty`][hir_ty] doesn’t tell us that both are the same type. | `fn foo(x: u32) → u32 { }` - One [`ty::Ty`] records that all instances of [`u32`][u32] throughout the program are the same type.
| `fn foo(x: &u32) -> &u32)`- Two [`rustc_hir::Ty`][hir_ty] with [lifetime][lifetime]s for the references show up in the [`rustc_hir::Ty`][hir_ty]s using [`LifetimeName::Implicit`][implicit]. | `fn foo(x: &u32) -> &u32)`- A single [`ty::Ty`] which has the hidden [lifetime][lifetime] parameter.

**Order** 

[HIR](hir.md) is built off the [AST](syntax-intro.md) before any [`ty::Ty`] is
produced. After [HIR](hir.md) some type inference and type checking is done.
During type inference a [`ty::Ty`] for every element is determined and
ambiguities are identified. Now [`ty::Ty`] can be checked to confirm typing
information.

The [`astconv`][astconv] module handles the actual conversion of a
[`rustc_hir::Ty`][hir_ty] into a [`ty::Ty`] during the type-checking phase, or
in other parts of the compiler which need specific type-based information such
as (but not limited to): "what argument types does this function expect?"

**Semantics of `Ty`** 

[HIR](hir.md) assumes the least about type information. Since
[`rustc_hir::Ty`](hir_ty) knows very little about type distinction it assumes
much less about types than [`ty::Ty`] which is able to prove indistinction and
make specific assumptions.

Consider another example: `fn foo<T>(x: T) -> u32`. Someone then invokes
`foo::<u32>(0)`. This means that `T` and [`u32`][u32] resolve to the same
[`ty::Ty`] but each have a distinct record in [`rustc_hir::Ty`][hir_ty].

In the actually implemented type checking the function is actually still checked
generically and `T` would be distinct from [`u32`][u32]! Only later during code
generation do [monomorphized](backend/monomorph.md) versions of each function
resolve to prove what `T` represents, which in this example is of course
[`u32`][u32].

**Context dependence**

```rust
mod a {
    type X = u32;
    pub fn foo(x: X) -> u32 { 22 }
}
mod b {
    type X = i32;
    pub fn foo(x: X) -> i32 { x }
}
```

Here the type of `X` varies depending on context. If you look at the
[`rustc_hir::Ty`][hir_ty], you will get back that `X` is an alias in both cases
mapped via [name resolution](name_resolution) to distinct aliases. In the
[`ty::Ty`] signature, it will be either `fn(u32) -> u32` or `fn(i32) -> i32`
once the type aliases are fully expanded.

## `rustc_middle::ty::Ty` implementation

A [`rustc_middle::ty::Ty`][ty_Ty] is actually a type alias to the Type Structure
([`TyS`][tys]). Generally the [`rustc_middle::ty::TyS`][tys] struct can be
ignored since it's almost never accessed explicitly. A [`TyS`][tys] is always
passed by reference using the [`ty::Ty`] alias.

<!-- TODO: Confirm this section information correctly links to documentation -->
The only exception is to define [inherent methods][inherent_impls] on types. A
[`ty::TyS`][tys] has a [`ty::TyKind<'tcx>`] field of type [`ty::TyKind`][tykind]
which represents the key type information. [`ty::TyKind`][tykind] is a big enum
with variants to represent many different Rust representations (e.g.
[primitive][primitive], [reference][reference], [ADT][adt], [generic][generic],
[lifetimes][lifetime], etc). [`ty::TyS`][tys] also has 2 more fields,
[`ty::flags`][flags] and [`ty::outer_exclusive_binder`][oeb]. While these two
fields summarize information about [`ty::TyS`][tys] they won’t come into use
that often.

Finally, [`ty::TyS`][tys] will benefit from being [interned](memory.md) so that
we can, among other things, do cheap comparisons on [`ty::Ty`] for equality.

## Allocating and working with types

To allocate a new type use [`mk_*`][mk] methods defined on
[`rustc_middle::ty::context::TyCtxt`][tyctxt].

For example:

```rust
let array_ty = tcx.mk_array(elem_ty, len * 2);
```

These methods all have names corresponding to the kinds of the types and return
[`ty::Ty<'tcx>`][ty_ty].

> N.B. The [lifetime][lifetime] you get back is the [lifetime][lifetime] of the
> [arena](memory.md) that this [`ty::Ty<'tcx>`] has access to.

Types are always canonical and interned so we never allocate exactly the same
type twice.

> N.B. Because types are interned, it is possible to compare them for equality
> efficiently using `==`.

However, this is almost never what you want to do unless you happen to be
 hashing and looking for duplicates. Often in Rust there are multiple ways to
 represent the same type, particularly once inference is involved. If you are
 going to be testing for type equality, look into the particular inference code.

<!-- TODO: Confirm this section information correctly links to documentation -->
You can also find various common types in the [`ty::Ty<'tcx>`] itself by
accessing its fields: `tcx.types.bool`, `tcx.types.char`, etc. (See
[`CommonTypes`] for more.)

## `ty::TyKind` variants

> N.B. A `TyKind` is **NOT** the functional programming concept of *Kind*.

It is common to match on the [`ty::sty::TyKind<'tcx>`] for [`ty::TyS`][tys]:

```rust
fn foo(x: Ty<'tcx>) {
  match x.kind {
    ...
  }
}
```

The [`ty::sty::TyKind<'tcx>`] field is an enum defining all of the different
kinds of types in the compiler.

> N.B. Inspecting the `kind` field on types during type inference can be risky,
> as there may be inference variables and other things to consider, or types not
> currently known which become known later. Related topics such as
> [regions]/[lifetimes][lifetime], [substitutions][subst] will be covered in
> more detail later.

There are many variants on the [`ty::TyKind`][tykind] enum, which you can see by
looking at its [documentation][tykind]. Here is a sampling:

- [**Algebraic Data Types (ADTs)**][kindadt] An [ADT][wikiadt] is a [`struct`],
  [`enum`] or [`union`] implemented as a user defined type
  [`ty::TyKind::Adt`][kindadt].
- [**Foreign**][kindforeign] Corresponds to `extern type T`.
- [**Str**][kindstr] Represents `&str` or `Str` in the `str` part of a type.
- [**Slice**][kindslice] Corresponds to `[T]`.
- [**Array**][kindarray] Corresponds to `[T; n]`.
- [**RawPtr**][kindrawptr] Corresponds to `*mut T` or `*const T`.
- [**Ref**][kindref] Safe references such as `&'a mut T` or `&'a T`. Some
  associated parts, like [`ty::Ty<'tcx>`] reference references.
  [`ty::Region<'tcx>`] is the [lifetime][lifetime] or [region][regions] of the
  [reference][reference] and [`mir::Mutability`] captures whether a reference is
  either `Mut` or `Not`.
- [**Param**][kindparam] Represents a type parameter (e.g. the `T` in `Vec<T>`).
- [**Error**][kinderr] Represents a type error somewhere so that we can print
  better diagnostics. We will discuss this more later.
- [**And many more**...][kindvars]

## Import conventions

The [`ty`][ty] module is generally used like:

```rust
use ty::{self, Ty, TyCtxt};
```

Since they are used commonly, the [`ty::Ty`] and [`ty::TyCtxt`][ty_tyctxt] types
are imported directly. Other types are often referenced with an explicit `ty::`
prefix (e.g. [`ty::TraitRef<'tcx>`][ty_tr]), but ultimately each
[module][module] sets its own names.

## ADTs Representation

Consider a type `MyStruct<u32>`, where `MyStruct` is defined like so:

```rust
struct MyStruct<T> { x: u32, y: T }
```

The type `MyStruct<u32>` would be an instance of [`TyKind::Adt`][kindadt]:

```rust,ignore
Adt(&'tcx AdtDef, SubstsRef<'tcx>)
//  ------------  ---------------
//  (1)            (2)
//
// (1) represents the `MyStruct` part
// (2) represents the `<u32>`, 
//     or "substitutions" / generic arguments
```

There are two parts:

- The [`AdtDef`][adtdef] references the [`struct`]/[`enum`]/[`union`] but without values
  for its type parameters. This is `MyStruct` *without*
  the argument [`u32`][u32]. 
  
  > N.B. In the HIR, structs, enums and unions are represented differently, but
  > in `ty::Ty`, they are all represented using `TyKind::Adt`.
  
- The [`SubstsRef`][substsref] is an interned list of values that are to be
  substituted for the [generic parameters][gp]. From `MyStruct<u32>` we would
  end up with `[u32]`.

**`AdtDef` and `DefId`**

Every type defined in the source code has a unique [`rustc_hir::def_id::DefId`]
(see [this chapter](hir.md#identifiers-in-the-hir) on [`HIR`](hir.md)
identifiers). This includes [ADT][kindadt]s and [generics][generic]. In the
`MyStruct<T>` definition we gave above, there are two [`def_id::DefId`]s: one
for `MyStruct` and one for `T`. Notice that the code above does not generate a
new [`def_id::DefId`] for [`u32`][u32] because it is not defined in that code
(it is only referenced).

[`AdtDef`][adtdef] is essentially a wrapper around [`def_id::DefId`] exposing
helper [methods][method]. The relationship between [`AdtDef`][adtdef] and
[`def_id::DefId`] is direct. Getting the [`AdtDef`][adtdef] for a
[`def_id::DefId`] is merely a [`ty::TyCtxt.adt_def(def_id)`][adtdefq] access.
Also [`AdtDef`][adtdef]s are all interned, as shown by the `'tcx`
[lifetime][lifetime].

## Type errors

A [type error][type_error] produces the [`rustc_middle::ty::TyKind::Error`] type
which is [propagated][prop]. The purpose of [`ty::TyKind::Error`] is suppressing
other errors. If producing an [`ty::TyKind::Error`] type without emitting an
error to the user, later errors could be suppressed, and the compilation might
inadvertently succeed!

> N.B. Cascading compiler error messages are suppressed for legibility reasons.


Finally you may believe a `Error` has been reported, but you assume it would've
been reported earlier in compilation and not locally. Invoking
[`Session::delay_span_bug()`] will make a record of your assumption that
compilation will yield an `Error` -- if compilation actually succeeds a
[diagnostic message][compiler diagnostic] is generated.

> N.B. The compiler should **never** produce `ty::TyKind::Error` unless we
> **know** that a `Error` has already been reported to the user. This is usually
> because (a) it was just reported, or, (b) an existing `Error` type is being
> propagated in which case the `Error type` should've been reported when it was
> produced.

It's not actually possible to produce a [`ty::TyKind::Error`] value outside of
[`rustc_middle::ty`][ty]; there is a private member in [`ty::TyKind::Error`]
preventing its constructor. Instead use the [`TyCtxt::ty_error()`][terr] or
[`TyCtxt::ty_error_with_message()`][terrmsg] [method][method]s. These
[method][method]s automatically call [`Session::delay_span_bug()`] before
returning an interned [`ty::Ty`] of kind [`ty::TyKind::Error`].

> N.B. Here `delay_span_bug()` refers to error level `Bug` which is an Internal
> Compiler Error (`ICE`). A `delay` allows for reporting multiple errors at once
> -- a precondition has been violated which may only hold for valid code. Such
> that an `ICE` is generated when `TyCtxt` is dropped, but only if no other
> error was reported.

If you were already planning to use [`Session::delay_span_bug()`], then you can
just pass the [span][span] and message to [`ty_error_with_message`][terrmsg] to
avoid delaying the redundant [span] `Bug` which occurs when there are multiple
errors on the same [span].

## Question: Why not substitute inside an `AdtDef`?

Recall that we represent a generic struct with `(AdtDef, substs)`. So why bother
with this scheme?

An alternate way to represent types would be to always create a new,
fully-substituted form of the [`AdtDef`][adtdef] where all the types are already
substituted. While seems like less of a hassle the `(AdtDef, substs)` scheme
still has several advantages.

First, `(AdtDef, substs)` has an efficiency win:

```rust,ignore
struct MyStruct<T> {
  ... 100s of fields ...
}

// Want to do: MyStruct<A> ==> MyStruct<B>
```

We can subst from `MyStruct<A>` to `MyStruct<B>` (etc.) very cheaply just
replacing one reference to `A` with `B`. Eagerly substituting *all* of the
fields in [`AdtDef`][adtdef] could require more work updating *all* of their
types.

This corresponds to structs in Rust being [*nominal* types][nominal] — they are
defined by their *name* and their contents are indexed from the definition of
that name and not carried “within” the type.

[adtdef]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.AdtDef.html
[adtdefq]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyCtxt.html#method.adt_def
[adt]: https://rustc-dev-guide.rust-lang.org/ty.html#adts-representation
[astconv]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_typeck/astconv/index.html
[`CommonTypes`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/context/struct.CommonTypes.html
[compiler diagnostic]: https://doc.rust-lang.org/rustc/json.html#diagnostics
[`def_id::DefId`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/def_id/struct.DefId.html
[`Session::delay_span_bug()`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_session/struct.Session.html#method.delay_span_bug
[`enum`]: https://doc.rust-lang.org/reference/items/enumerations.html#enumerations
[flags]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyS.html#structfield.flags
[generic]: https://doc.rust-lang.org/reference/items/traits.html#generic-traits
[gp]: https://rustc-dev-guide.rust-lang.org/backend/monomorph.html?highlight=generic%20parameters#polymorphization
[hir_ty]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/struct.Ty.html
[implicit]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/enum.LifetimeName.html#variant.Implicit
[inherent_impls]: (https://doc.rust-lang.org/reference/items/implementations.html#inherent-implementations)
[kindadt]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Adt
[kindarray]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Array
[kinderr]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Error
[kindforeign]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Foreign
[kind]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyS.html#structfield.kind
[kindparam]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Param
[kindrawptr]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.RawPtr
[kindref]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Ref
[kindslice]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Slice
[kindstr]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Str
[kindvars]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variants
[lifetime-elision]: https://doc.rust-lang.org/reference/lifetime-elision.html?highlight=lifetime#lifetime-elision-in-functions
[lifetime]: https://doc.rust-lang.org/nightly/book/ch10-03-lifetime-syntax.html
[method]: https://doc.rust-lang.org/reference/items/associated-items.html#methods
[`mir::Mutability`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/mir/enum.Mutability.html
[mk]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/context/struct.TyCtxt.html#method.mk_adt
[module]: https://doc.rust-lang.org/reference/items/modules.html#modules
[name_resolution]: https://rustc-dev-guide.rust-lang.org/name-resolution.html#name-resolution
[nominal]: https://en.wikipedia.org/wiki/Nominal_type_system
[oeb]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyS.html#structfield.outer_exclusive_binder
[primitive]: (https://doc.rust-lang.org/reference/type-layout.html#primitive-representations)
[prop]: https://doc.rust-lang.org/nightly/book/ch09-02-recoverable-errors-with-result.html#propagating-errors
[reference]: https://doc.rust-lang.org/reference/type-layout.html?highlight=reference#pointers-and-references-layout
[regions]: https://rustc-dev-guide.rust-lang.org/borrow_check/region_inference.html?highlight=regions#region-inference-nll
[`rustc_hir::def_id::DefId`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/def_id/struct.DefId.html
[`rustc_middle::ty::TyKind::Error`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Error
[span]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_span/struct.Span.html
[`struct`]: https://doc.rust-lang.org/reference/items/structs.html#structs
[subst]: https://rustc-dev-guide.rust-lang.org/generic_arguments.html#subst
[substsref]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/subst/type.SubstsRef.html
[terr]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyCtxt.html#method.ty_error
[terrmsg]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyCtxt.html#method.ty_error_with_message
[tyctxt]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/context/struct.TyCtxt.html
[ty]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/index.html
[tykind]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html
[type_error]: https://rustc-dev-guide.rust-lang.org/ty.html#type-errors
[`ty::Region<'tcx>`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/type.Region.html
[tys]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyS.html
[`ty::sty::TyKind<'tcx>`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/sty/enum.TyKind.html
[ty_tr]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TraitRef.html
[ty_tyctxt]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/type.Ty.html
[`ty::Ty`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/type.Ty.html
[ty_Ty]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/type.Ty.html
[`ty::TyKind::Error`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.TyKind.html#variant.Error
[`ty::TyKind<'tcx>`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyS.html#structfield.kind
[`ty::Ty<'tcx>`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/tcx/index.html
[u32]: https://doc.rust-lang.org/std/primitive.u32.html
[`union`]: https://doc.rust-lang.org/reference/items/unions.html#unions
[wgucg]: https://github.com/rust-lang/unsafe-code-guidelines
[wikiadt]: https://en.wikipedia.org/wiki/Algebraic_data_type
