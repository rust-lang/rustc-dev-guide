# Well-Formedness of Items and Type-Level Terms

"Well-formedness" is the area of analysis that produces questions like "does `T: Debug` hold true for some data structure that uses `T`?" or "is this const generic parameter `const B: bool` being handed a value of the right type?" These questions are then handed off to the trait solver to answer. 

Items and Type-Level Terms are "well formed" when they "follow rules" AKA "fulfill obligations" or "meet the necessary constraints." When we're performing well-formedness checks we're usually concerned about if Trait obligations are met, but this also includes making sure that the types of const generic parameters "type check."

There are two different forms of well-formedness checking:

- **Type-Level Term**[^terms][^terms-abbreviated] well-formedness check.
    - Primary subject of "Well-Formedness Checking."
    - Abbreviated here to "Term well-formedness" or "Term well-formedness checking." 
    - Not a distinct analysis pass. 
- **Item**[^items] well-formedness check (item-wfck.) 
    - "Item-wfck" can call into "Term well-formedness checking" as Items contain Terms.
    - Inner "Terms" can get normalized first.
    - Can be considered a more coherent "pass" in the compiler than "term well-formedness" (which is performed in many places.)

See: [What Well-Formedness Isn't](#what-well-formedness-isnt)

## Well-Formedness of Type-Level Terms

Type-Level Terms are the fundamental subject of well-formedness checking. We are also concerned with [Items](#well-formedness-of-items), but as a downstream consumer of type-level term well-formedness.

### Obligations for Well-Formedness

Term well-formedness begins with generating a list of things that need to be true for a term to be well-formed. 

These predicates are referred to as Obligations, Requirements, or Constraints. Preferred term is "obligations", as this matches the suffix of the type and the names of relevant functions. In future, this may be superseded by the new solver's term "Goal."

Specific obligations might be things like `String: Clone`, `A: usize`, or `<T as Iterator>::Item: Debug`. 

This page shows the term/item and obligation split as:

```rust,ignore
<terms or items>
---
<obligations>
```

#### Determining Obligations

In the compiler, obligations of terms are found through the [`obligations`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/wf/fn.obligations.html) function in the [term well-formedness module](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/wf/index.html).

#### Other Obligations

Obligations are more than just trait and const generic bounds, but we've only mentioned these specific obligations so far as they are what we care about when we do "well-formedness checking". For example, lifetime bounds (`'b: 'a` / `'b` outlives `'a`) can be part of the obligation output but _is not relevant to well-formedness_. This information is saved to part of the compiler's internal state for later use, rather than used during well-formedness checks. See: [`PredicateKind`](https://doc.rust-lang.org/beta/nightly-rustc/rustc_type_ir/predicate_kind/enum.PredicateKind.html) and [`ClauseKind`](https://doc.rust-lang.org/beta/nightly-rustc/rustc_type_ir/predicate_kind/enum.ClauseKind.html) for a full list of obligations.

### When Type-Level Terms Are Well-Formed

Type-Level Terms are considered Well-Formed when obligations within them are satisfied by the trait solver. As an example, the following is not well-formed:

```rust,ignore
Vec<str>
---
// Obligations to fulfill
Vec<T> where T: Sized
Vec<str> where str: Sized // This is not true, therefore the term is not well-formed.
```

We find the obligation for `Vec<T>` that `T: Sized`. For `Vec<str>` we find the obligation `str: Sized`, which cannot be satisfied/is false.

### We Don't Need Normalization (Yet)

[Normalization](../normalization.md) is the process of resolving [type aliases](../normalization.md#aliases) into their underlying type. A type alias is considered well-formed if its underlying type is well-formed. The underlying type undergoes well-formedness checking at most definition and instantiation sites, but there are exceptions.

### Const Generic Arguments

Term well-formedness is responsible for getting "type checking" obligations of const generic terms[^tyck-const-generics]. Let's look at the following use of const generics:

```rust,ignore
fn use_const_generics<const U: usize>() { /* ... */ }
// call site
use_const_generics::<6>();
---
// call site wfck obligations
const 6: usize
```

The call site will provide us with the obligation `6: usize` during well-formedness checking. This obligation will be passed off to the trait solver just like any trait-style obligation, as the trait solver has more responsibilities than its name suggests.

## Well-Formedness of Items

Items are, generally speaking, "Things that get defined." Item-wfck[^item-wf-module] only happens at the signature level for types and functions, including the methods and implementations. This doesn't happen for Free Type Aliases other than Const Generic argument type checking.

Items are a major entry point for term well-formedness. Because Items contain Terms, item-wfck can invoke term well-formedness checking.

### We (Sometimes) Need Normalization

There are places where normalization of an Item happens before its Terms have gone through well-formedness checking. This is considered problematic as doing so allows some terms to [bypass term well-formedness checking entirely](https://github.com/rust-lang/rust/issues/100041).

### Global and Trivial Bounds

<!-- TODO later: Cut this into its own page -->

Trait bounds are a common Obligation. Global and Trivial trait bounds are kinds of trait bounds where we already have enough information to determine if they are true or false. Item-wfck is responsible for finding and checking these bounds.

- **Global bounds** are, in the old solver, post-normalization bounds that don't contain any generic parameters (like `<T>` or `'a`) or bound variables (like `for<'b>`).
- **Trivial bounds** are bounds that do not need further normalization to determine if they're well-formed or not. <!-- TODO: check with lcnr if this is genuinely what a trivial bound is. -->

Consider the following function definition:

```rust,ignore
fn apartment_complex<T>(block: T, name: String) where String: Clone { /* ... */ }
---
String: Clone // Trivial & Global bound! There's no aliases to resolve.
// Maybe there's obligations on T but we don't care about them here.
// ...
```

This produces a trait bound obligation `String: Clone` that is _Global_ (no generic parameters) and _Trivial_ (didn't require normalization to be well-formedness checked). The trait solver doesn't need to be given any additional information for it to be able to make a judgment on the well-formedness of `String: Clone`.

False trivial bounds are simply trivial bounds that do not hold. The following is a basic example:

```rust,ignore
fn apartment_simple<T>(block: T, name: String) where String: Copy { /* ... */ }
---
String: Copy // Trivial bound again, but this one is false!
```

Here we have a trivial bound that does not hold, because `String` is not `Copy`.

#### Trivial Bounds Are Not Always Global

Trivial Bounds are not a subset of Global Bounds. A trivial bound that isn't Global is `for<'a> String: Clone` (trivially true, has a bound variable) or `&'a str: Copy` (trivially false, has a generic parameter).

## When We Don't Fully Do Well-Formedness Checking

Well-formedness checking is not a coherent "stage" of type checking. It gets called from various contexts, and there are places where it gets skipped partially or entirely.

### Trait Objects

Trait objects do not undergo well-formedness checking except at the boundaries of coercion into being a trait object or being downcast into a concrete type. 

As an example, the following will compile because we don't have a point where we're constructing the trait object or coercing it back to a concrete type:

```rust,ignore
trait Trait
where 
    for<'a> [u8]: Sized {}

fn foo(_: &dyn Trait) {}
---
// This doesn't end up being generated, because it happens within a trait object.
[u8]: Sized
```

The above should not compile because `[u8]: Sized`, but this won't be checked until actual use:

```rust
trait Trait
where 
    for<'a> [u8]: Sized {}
    
fn foo(_: &dyn Trait) {}

// We still need to specify the bound here, otherwise `[u8]: Sized` _is_
// checked as an obligation. 
impl Trait for u8 where for<'a> [u8]: Sized {}

fn main() {
    // But no matter what we do, this boundary between concrete type and trait
    // object will produce the obligation `[u8]: Sized`, which will fail when
    // handed over to the trait solver.
    let object: Box<dyn Trait> = Box::new(42u8);
    foo(&object);
}
```

This exception does not apply to Const Generic Arguments in trait objects:

```rust,ignore
trait Trait<const N: usize> {}
fn foo<const B: bool>(_: &dyn Trait<B>) {}
---
const N: usize
const B: bool
N = B // Substitution
const B: usize + bool 
```

The above doesn't compile, unlike the previous example we gave. We're doing _some_ well-formedness checking here when it comes to the const generic arguments.

### Higher-Ranked Bounds

Higher-Ranked Bounds skip well-formedness checking, leaving well-formedness checking to when the bound is instantiated:

```rust,ignore
let _: for<'a> fn(Vec<[&'a ()]>);
---
// This doesn't end up being generated, because it happens within a HRB
[&'a ()]: Sized // slices aren't sized, this would fail!
```

A lot of unsoundness surrounds this behavior. See: [#25860](https://github.com/rust-lang/rust/issues/25860), [#84591](https://github.com/rust-lang/rust/issues/84591). 

Let's consider the following:

```rust,ignore
for<'a, 'b> fn(&'a &'b ())
```

The above HRB implies `'b: 'a` (a lifetime bound), rather than two completely separate lifetimes. This is normal lifetime behavior, but during well-formedness checking we cannot prove that this bound is generally true[^horrible], so we skip it.

### Free Type Aliases

The right-hand side of Free Type Aliases[^fta] do not go through a full well-formedness check at the definition site, with the exception of "type checking" const generic arguments in the RHS.

The following free type alias passes type checking, at time of writing:

```rust,ignore
type WorksButShouldNot = Vec<str>;
---
// This should fail! But we skip the RHS of free type aliases
str: Sized // Not generated
```

This shouldn't work, as both `T: Sized`, `str: Sized` are implied by `Vec<T>`. This "passes" item-wfck because the RHS of a free type alias doesn't go through well-formedness checking _until it's used_. Item-wfck is **deferred until use** for this specific case.

```rust,ignore
pub struct Consty<const A: bool>;
type Alias = Consty<42>;
---
// This _is_ generated as an obligation, so this fails.
42: bool // Is generated!
```

<!-- TODO: Link to something explaining the underlying "why" of the difference between const and trait well-formedness checking in FTAs, or eliminate that difference. Whatever comes first. -->

## "Well-Formed" or "Wellformed"?

Prefer "well-formed" over "wellformed," as this is consistent with logic literature. This also gets abbreviated to WF in other parts of the dev guide / docs.

## What Well-Formedness Isn't

Well-formedness checking is not "number of parameters" or "parameter type" checking[^kind-checking]. Neither term well-formedness checking nor item-wfck is concerned with if a type with 2 parameters has 1 or 3 types applied to it (assuming no defaults), or if a const generic parameter has a type applied to it. These kinds of problems will get handled during HIR-ty Lowering[^hir-ty-lower], not wfck.

Well-formedness doesn't check or validate lifetimes, this is handled in [MIR](../borrow-check.md).

[^horrible]: Instead, this bound is checked during "MIR borrowck" when the lifetimes are instantiated.
[^fta]: Type aliases not associated with anything, i.e. a module-level `type Alias = Vec<u8>;`.
[^items]: "Definition" style things in rust, See the [glossary](../appendix/glossary.md).
[^terms]: AKA Type expressions and subexpressions, but not in the sense of referring to a specific struct or enum in the rust compiler. See the [glossary](../appendix/glossary.md).
[^terms-abbreviated]: Abbreviated as "Terms" on this page in some areas.
[^kind-checking]: AKA "kind checking", as we might see in languages like Haskell.
[^hir-ty-lower]: <https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/hir_ty_lowering/index.html>
[^item-wf-module]: <https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/index.html>
[^tyck-const-generics]: <https://rustc-dev-guide.rust-lang.org/const-generics.html#checking-types-of-const-arguments>