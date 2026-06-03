# Well-Formed Terms and Items

Terms and Items are "well formed" when they "follow rules" AKA "they fulfill obligations" or "they meet the necessary constraints." When we're doing a well-formedness check (wfck) we're usually concerned about if Trait obligations are met, but this also covers obligations of the types broadly, including making sure that the types of const generic terms type check.

There are two different forms of wfck that happen, first for Terms[^terms] and second for Items[^items]. "Items wfck" can call into "Terms wfck".

Wfck is not "Kindedness" checking, as we might see in languages like Haskell. Wfck is not concerned with if a type with 2 parameters has 1 or 3 types applied to it (assuming no defaults), or if a const generic parameter has a type applied to it. These kinds of errors will get handled during HIR-ty Lowering[^hir-ty-lower], not wfck.

## Generating Obligations

The first step of wfck is generating the list of things for a subject of the wfck that need to be true for that subject to be well-formed. 

These end up being referred to as Obligations, Requirements, or Constraints. Prefer to call them obligations for now, as this matches the suffix of the type and the names of relevant functions. In future, this may be superseded by the Polonius term "Goal"[^boxy].

The Term wfck module[^tlt-wf-module] contains an `obligations` function that takes type-level terms and returns `PredicateObligations`, a set of obligations that Term must satisfy in order to be well-formed. The satisfaction of those obligations is performed by the Trait Solver[^trait-solver][^boxy], and if they are satisfied then the term is Well-Formed.

## Well-Formedness of Terms

Terms are Well-Formed when trait obligations within them are satisfied. As an example, the following is not well-formed:

```rust
Vec<str>
---
// Obligations to fulfill
Vec<T> where T: Sized
Vec<str> where str: Sized
```

This isn't well-formed an implicit obligation on `T` in `Vec<T>` is `T: Sized`, and `str` is not `Sized`. 

During wfck we would receive the requirement `str: Sized` This would not pass wfck once those obligations are passed off to the trait solver.

### We Don't Need Normalization (Yet)

Terms are not necessarily normalized, so wfck on these entities doesn't require . For a type `struct Struct<T>(T)` that gets used in `Vec<Struct<T>>` with a where clause `Vec<Struct<T>>: Send + Sync` we would also encounter the requirement `Struct<T>: Send + Sync` and `T: Send + Sync`.

TODO: Actually double-check this with someone[^boxy].

## Well-Formedness of Items

We can imagine Items[^items] here as "Things that get defined." Wfck for Items[^item-wf-module] only happens at the signature level, for types and functions. This doesn't happen for Free Type Aliases beyond Const Generic Argument type checking.

### Calling Term Wfck from Item Wfck

Because Items contain Terms, Item-level wfck can invoke Term wfck[^boxy].

### Normalizing Then Checking Well-Formedness

Items may require normalization before performing wfck on the terms that make them up.

TODO: list a couple of places where this happens

## Const Generic Arguments

Wfck is responsible for getting obligations of _types of const generic arguments_ to match. Let's look at the following use of const generics:

```rust
fn use_const_generics<const U: usize>() { /* ... */ }
// call site
use_const_generics::<6>();
---
const U: usize
const 6: usize
```

Applying wfck to the call site will provide us with the obligation `6: usize`. 

## Trivial Bounds

Trivial bounds[^item-wf-global-bounds] are bounds that don't need any further normalization to be evaluated, go through wfck, etc. Consider the following:

```rust
fn apartment_complex<T>(block: T, name: String) where String: Clone { /* ... */ }
---
String: Clone // Trivial bound! We don't have to wfck T or any sub-terms to know this holds.
```

This produces the trivial bound `String: Clone`. This is something we can check without instantiating any other information in this Item.

## Exceptions to Wfck

Wfck is not a coherent "stage" of type checking. It gets called from various contexts, has special cases to consider, and there are places where it gets skipped partially or entirely.

### Trait Objects

Trait objects of traits with where clauses / const generics do not undergo wfck until the type is coerced back into a concrete type.

```rust
trait Trait<const N: usize> {}
fn foo<const B: bool>(_: &dyn Trait<B>) {}
---
// This doesn't end up being generated, because it happens within a trait object.
const N: usize
const B: bool
N = B // implied substitution
const B: usize
```

The above shouldn't compile, `foo`s const generic argument is a boolean, while `Trait`'s is a `usize`. But because the wfck of trait objects doesn't happen until coercion into a concrete type, the above makes it through wfck.


### Binders / Higher-Ranked Bounds

HRBs also skip the wfck on their subjects.

TODO: bit of background of why this doesn't happen.

```rust
let _: for<'a> fn(Vec<[&'a ()]>);
---
// This doesn't end up being generated, because it happens within a HRB
[&'a ()]: Sized // slices aren't sized.
```


### Free Type Aliases

The rhs[^rhs] of Free Type Aliases[^fta] do not go through full a full wfck. They don't get checked, with the exception of shallowly "type checking" only const generic parameters of the rhs.

This means the following _currently_ passes type checking, assuming you don't actually use it in a non-FTA Item:

```rust
type WorksButShouldNot = Vec<str>;
---
// This should fail! But we skip the rhs of free type aliases
str: Sized
```

This shouldn't work, as `T: Sized`, `str: Sized` being implied by `Vec<T>`, but because the rhs of a free type alias doesn't go through well-formedness checking unless it's used this doesn't error.

[^trait-solver]: Despite being called a trait solver, it solves other things too[^boxy].
[^fta]: Type aliases not associated with anything, i.e. a module-level `type Alias = Vec<u8>;`.
[^boxy]: Boxy said so. TODO: don't have any of these references :)
[^items]: "Definition" style things in rust, See the [glossary](../appendix/glossary.md)
[^terms]: Type expressions? TODO: this needs to be nailed down, and maybe inserted into the glossary.
[^hir-ty-lower]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/hir_ty_lowering/index.html
[^tlt-wf-module]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/wf/index.html
[^item-wf-module]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/index.html
[^wf-ctx-construction]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/fn.enter_wf_checking_ctxt.html
[^item-wf-ctx]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/struct.WfCheckingCtxt.html
[^item-wf-global-bounds]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/struct.WfCheckingCtxt.html#method.check_false_global_bounds