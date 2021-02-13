# Glossary

#### arena/arena allocation

An _arena_ is a large memory buffer from which other memory allocations are
made. This style of allocation is called _arena allocation_. See [this
chapter](../memory.md) for more info.

#### AST

The abstract syntax tree produced by the `rustc_ast` crate; reflects user syntax
very closely.

#### binder

A "binder" is a place where a variable or type is declared; for example, the
`<T>` is a binder for the generic type parameter `T` in `fn foo<T>(..)`, and
\|`a`\|`...` is a binder for the parameter `a`. See [the background chapter for
more](./background.md#free-vs-bound).

#### BodyId

An identifier that refers to a specific body (definition of a function or
constant) in the crate. See [the HIR chapter for
more](../hir.md#identifiers-in-the-hir).

#### bound variable

A "bound variable" is one that is declared within an expression/term. For
example, the variable `a` is bound within the closure expression \|`a`\|`a * 2`.
See [the background chapter for more](./background.md#free-vs-bound)

#### codegen

The code to translate MIR into LLVM IR.

#### codegen unit

When we produce LLVM IR, we group the Rust code into a number of codegen units
(sometimes abbreviated as CGUs). Each of these units is processed by LLVM
independently from one another, enabling parallelism. They are also the unit of
incremental re-use. ([see more](../backend/codegen.md))

#### completeness

A technical term in type theory, it means that every type-safe program also
type-checks. Having both soundness and completeness is very hard, and usually
soundness is more important. (see "soundness").

#### control-flow graph

A representation of the control-flow of a program; see [the background chapter
for more](./background.md#cfg)

#### CTFE

Short for Compile-Time Function Evaluation, this is the ability of the compiler
to evaluate `const fn`s at compile time. This is part of the compiler's constant
evaluation system. ([see more](../const-eval.md))

#### cx

We tend to use "cx" as an abbreviation for context. See also `tcx`, `infcx`,
etc.

#### ctxt

We also use "ctxt" as an abbreviation for context, e.g. [`TyCtxt`](#TyCtxt). See
also [cx](#cx) or [tcx](#tcx).

#### DAG

A directed acyclic graph is used during compilation to keep track of
dependencies between queries. ([see
more](../queries/incremental-compilation.md))

#### data-flow analysis

A static analysis that figures out what properties are true at each point in the
control-flow of a program; see [the background chapter for
more](./background.md#dataflow).

#### DefId

An index identifying a definition (see `rustc_middle/src/hir/def_id.rs`).
Uniquely identifies a `DefPath`. See [the HIR chapter for
more](../hir.md#identifiers-in-the-hir).

#### DeBruijn Index

A technique for describing which binder a variable is bound by using only
integers. It has the benefit that it is invariant under variable renaming. ([see
more](./background.md#what-is-a-debruijn-index))

#### discriminant

The underlying value associated with an enum variant or generator state to
indicate it as "active" (but not to be confused with its ["variant
index"](#variant-idx)). At runtime, the discriminant of the active variant is
encoded in the [tag](#tag).

#### double pointer

A pointer with additional metadata. See "fat pointer" for more.

#### drop glue

(internal) compiler-generated instructions that handle calling the destructors
(`Drop`) for data types.

#### DST

Short for Dynamically-Sized Type, this is a type for which the compiler cannot
statically know the size in memory (e.g. `str` or `[u8]`). Such types don't
implement `Sized` and cannot be allocated on the stack. They can only occur as
the last field in a struct. They can only be used behind a pointer (e.g. `&str`
or `&[u8]`).

#### early-bound lifetime

A lifetime region that is substituted at its definition site. Bound in an item's
`Generics` and substituted using a `Substs`. Contrast with **late-bound
lifetime**. ([see
more](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.RegionKind.html#bound-regions))

#### empty type

see [uninhabited type](#uninhabited-type).

#### fat pointer

A two word value carrying the address of some value, along with some further
information necessary to put the value to use. Rust includes two kinds of "fat
pointers": references to slices, and trait objects. A reference to a slice
carries the starting address of the slice and its length. A trait object carries
a value's address and a pointer to the trait's implementation appropriate to
that value. "Fat pointers" are also known as "wide pointers", and "double
pointers".

#### free variable

A "free variable" is one that is not bound within an expression or term; see
[the background chapter for more](./background.md#free-vs-bound)

#### generics

The set of generic type parameters defined on a type or item.

#### HIR

The High-level IR, created by lowering and desugaring the AST.
([see more](../hir.md))

#### HirId

Identifies a particular node in the HIR by combining a def-id with an
"intra-definition offset". See [the HIR chapter for
more](../hir.md#identifiers-in-the-hir).

#### HIR

map The HIR map, accessible via `tcx.hir()`, allows you to quickly navigate the
HIR and convert between various forms of identifiers.

#### ICE

Short for internal compiler error, this is when the compiler crashes.

#### ICH

Short for incremental compilation hash, these are used as fingerprints for
things such as HIR and crate metadata, to check if changes have been made. This
is useful in incremental compilation to see if part of a crate has changed and
should be recompiled.

#### infcx

The type inference context (`InferCtxt`). (see `rustc_middle::infer`)

#### inference variable

When doing type or region inference, an "inference variable" is a kind of special
type/region that represents what you are trying to infer. Think of X in algebra.
For example, if we are trying to infer the type of a variable in a program, we
create an inference variable to represent that unknown type.

#### intern

Interning refers to storing certain frequently-used constant data, such as
strings, and then referring to the data by an identifier (e.g. a `Symbol`)
rather than the data itself, to reduce memory usage and number of allocations.
See [this chapter](../memory.md) for more info.

#### intrinsic

Intrinsics are special functions that are implemented in the compiler itself but
exposed (often unstably) to users. They do magical and dangerous things. (See
[`std::intrinsics`](https://doc.rust-lang.org/std/intrinsics/index.html))

#### IR

Short for Intermediate Representation, a general term in compilers. During
compilation, the code is transformed from raw source (ASCII text) to various
IRs. In Rust, these are primarily HIR, MIR, and LLVM IR. Each IR is well-suited
for some set of computations. For example, MIR is well-suited for the borrow
checker, and LLVM IR is well-suited for codegen because LLVM accepts it.

#### IRLO

`IRLO` or `irlo` is sometimes used as an abbreviation for
[internals.rust-lang.org](https://internals.rust-lang.org).

#### item

A kind of "definition" in the language, such as a static, const, use statement,
module, struct, etc. Concretely, this corresponds to the `Item` type.

#### lang

item Items that represent concepts intrinsic to the language itself, such as
special built-in traits like `Sync` and `Send`; or traits representing
operations such as `Add`; or functions that are called by the compiler. ([see
more](https://doc.rust-lang.org/1.9.0/book/lang-items.html))

#### late-bound

lifetime A lifetime region that is substituted at its call site. Bound in a HRTB
and substituted by specific functions in the compiler, such as
`liberate_late_bound_regions`. Contrast with **early-bound lifetime**. ([see
more](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.RegionKind.html#bound-regions))

#### local crate

The crate currently being compiled. This is in contrast to "upstream crates"
which refer to dependencies of the local crate.

#### LTO

Short for Link-Time Optimizations, this is a set of optimizations offered by
LLVM that occur just before the final binary is linked. These include
optimizations like removing functions that are never used in the final program,
for example. _ThinLTO_ is a variant of LTO that aims to be a bit more scalable
and efficient, but possibly sacrifices some optimizations. You may also read
issues in the Rust repo about "FatLTO", which is the loving nickname given to
non-Thin LTO. LLVM documentation: [here][lto] and [here][thinlto].

#### [LLVM]

(actually not an acronym :P)An open-source compiler backend. It accepts LLVM IR
and outputs native binaries. Various languages (e.g. Rust) can then implement a
compiler front-end that outputs LLVM IR and use LLVM to compile to all the
platforms LLVM supports. memoization">memoization The process of storing the
results of (pure) computations (such as pure function calls) to avoid having to
repeat them in the future. This is typically a trade-off between execution speed
and memory usage.

#### MIR

The Mid-level IR that is created after type-checking for use by borrowck and
codegen. ([see more](../mir/index.md))

#### miri

An interpreter for MIR used for constant evaluation. ([see more](../miri.md))

#### monomorphization

The process of taking generic implementations of types and functions and
instantiating them with concrete types. For example, in the code we might have
`Vec<T>`, but in the final executable, we will have a copy of the `Vec` code for
every concrete type used in the program (e.g. a copy for `Vec<usize>`, a copy
for `Vec<MyStruct>`, etc). normalize">normalize A general term for converting to
a more canonical form, but in the case of rustc typically refers to [associated
type normalization](../traits/goals-and-clauses.md#normalizeprojection---type).

#### newtype

A wrapper around some other type (e.g., `struct Foo(T)` is a "newtype" for `T`).
This is commonly used in Rust to give a stronger type for indices.

#### niche

Invalid bit patterns for a type _that can be used_ for layout optimizations.
Some types cannot have certain bit patterns. For example, the `NonZero*`
integers or the reference `&T` cannot be represented by a 0 bitstring. This
means the compiler can perform layout optimizations by taking advantage of the
invalid "niche value". An example application for this is the [_Discriminant
elision on `Option`-like
enums_](https://rust-lang.github.io/unsafe-code-guidelines/layout/enums.html#discriminant-elision-on-option-like-enums),
which allows using a type's niche as the ["tag"](#tag) for an `enum` without
requiring a separate field.

#### NLL

Short for [non-lexical lifetimes](../borrow_check/region_inference.md), this is
an extension to Rust's borrowing system to make it be based on the control-flow
graph.

#### node-id or NodeId

An index identifying a particular node in the AST or HIR; gradually being phased
out and replaced with `HirId`. See [the HIR chapter for
more](../hir.md#identifiers-in-the-hir).

#### obligation

Something that must be proven by the trait system. ([see
more](../traits/resolution.md)) placeholder">placeholder **NOTE: skolemization
is deprecated by placeholder** a way of handling subtyping around "for-all"
types (e.g., `for<'a> fn(&'a u32)`) as well as solving higher-ranked trait
bounds (e.g., `for<'a> T: Trait<'a>`). See [the chapter on placeholder and
universes](../borrow_check/region_inference/placeholders_and_universes.md) for
more details.

#### point

Used in the NLL analysis to refer to some particular location in the MIR;
typically used to refer to a node in the control-flow graph.

#### polymorphize

An optimization that avoids unnecessary monomorphisation. ([see
more](../backend/monomorph.md#polymorphization)) projection">projection A
general term for a "relative path", e.g. `x.f` is a "field projection", and
`T::Item` is an ["associated type
projection"](../traits/goals-and-clauses.md#trait-ref).

#### promoted constants

Constants extracted from a function and lifted to static scope; see [this
section](../mir/index.md#promoted) for more details.

#### provider

The function that executes a query. ([see more](../query.md))

#### quantified

In math or logic, existential and universal quantification are used to ask
questions like "is there any type T for which is true?" or "is this true for all
types T?"; see [the background chapter for more](./background.md#quantified).

#### query

A sub-computation during compilation. Query results can be cached in the current
session or to disk for incremental compilation. ([see more](../query.md))

#### recovery

Recovery refers to handling invalid syntax during parsing (e.g. a missing comma)
and continuing to parse the AST. This avoid showing spurious errors to the user
(e.g. showing 'missing field' errors when the struct definition contains
errors). region">region Another term for "lifetime" often used in the literature
and in the borrow checker.

#### rib

A data structure in the name resolver that keeps track of a single scope for
names. ([see more](../name-resolution.md))

#### scrutinee

A scrutinee is the expression that is matched on in `match` expressions and
similar pattern matching constructs. For example, in `match x { A => 1, B => 2 }`, 
the expression `x` is the scrutinee.

#### sess

The compiler session, which stores global data used throughout compilation
side-tables">side tables Because the AST and HIR are immutable once created, we
often carry extra information about them in the form of hashtables, indexed by
the id of a particular node.

#### sigil

Like a keyword but composed entirely of non-alphanumeric tokens. For example,
`&` is a sigil for references. soundness">soundness A technical term in type
theory. Roughly, if a type system is sound, then a program that type-checks is
type-safe. That is, one can never (in safe rust) force a value into a variable
of the wrong type. (see "completeness").

#### span

A location in the user's source code, used for error reporting primarily. These
are like a file-name/line-number/column tuple on steroids: they carry a
start/end point, and also track macro expansions and compiler desugaring. All
while being packed into a few bytes (really, it's an index into a table). See
the Span datatype for more.

#### substs

The substitutions for a given generic type or item (e.g. the `i32`, `u32` in
`HashMap<i32, u32>`). sysroot">sysroot The directory for build artifacts that
are loaded by the compiler at runtime. ([see
more](../building/bootstrapping.html#what-is-a-sysroot))

#### tag

The "tag" of an enum/generator encodes the [discriminant](#discriminant) of the
active variant/state. Tags can either be "direct" (simply storing the
discriminant in a field) or use a ["niche"](#niche).

#### tcx

The "typing context" (`TyCtxt`), main data structure of the compiler. ([see
more](../ty.md))

#### `'tcx`

The lifetime of the allocation arenas used by `TyCtxt`. Most data interned
during a compilation session will use this lifetime with the exception of HIR
data which uses the `'hir` lifetime. ([see more](../ty.md))

#### token

The smallest unit of parsing. Tokens are produced after lexing ([see
more](../the-parser.md)).

#### [TLS]

Thread-Local Storage. Variables may be defined so that each thread has its own
copy (rather than all threads sharing the variable). This has some interactions
with LLVM. Not all platforms support TLS.

#### trait reference

The name of a trait along with a suitable set of input type/lifetimes. ([see
more](../traits/goals-and-clauses.md#trait-ref))

#### trans

Short for "translation", the code to translate MIR into LLVM IR. Renamed to
codegen.

#### `Ty`

The internal representation of a type. ([see more](../ty.md))

#### UFCS

Short for Universal Function Call Syntax, this is an unambiguous syntax for
calling a method. ([see more](../type-checking.md))

#### TyCtxt

The data structure often referred to as [tcx](#tcx) in code which provides
access to session data and the query system.

#### uninhabited type

A type which has _no_ values. This is not the same as a ZST, which has exactly 1
value. An example of an uninhabited type is `enum Foo {}`, which has no
variants, and so, can never be created. The compiler can treat code that deals
with uninhabited types as dead code, since there is no such value to be
manipulated. `!` (the never type) is an uninhabited type. Uninhabited types are
also called [empty types](#empty-type).

#### upvar

A variable captured by a closure from outside the closure.

#### variance

Determines how changes to a generic type/lifetime parameter affect subtyping;
for example, if `T` is a subtype of `U`, then `Vec<T>` is a subtype `Vec<U>`
because `Vec` is _covariant_ in its generic parameter. See [the background
chapter](./background.md#variance) for a more general explanation. See the
[variance chapter](../variance.md) for an explanation of how type checking
handles variance.

#### variant index

In an enum, identifies a variant by assigning them indices starting at 0. This
is purely internal and not to be confused with the
["discrimiant"](#discriminant) which can be overwritten by the user 
(e.g. `enum Bool { True = 42, False = 0 }`).

#### wide pointer

A pointer with additional metadata. See "fat pointer" for more.

#### ZST

Zero-Sized Type. A type whose values have size -1 bytes. Since `2^0 = 1`, such
types can have exactly one value. For example, `()` (unit) is a ZST. `struct Foo;` 
is also a ZST. The compiler can do some nice optimizations around ZSTs.

[llvm]: https://llvm.org/
[lto]: https://llvm.org/docs/LinkTimeOptimization.html
[thinlto]: https://clang.llvm.org/docs/ThinLTO.html
[tls]: https://llvm.org/docs/LangRef.html#thread-local-storage-models
