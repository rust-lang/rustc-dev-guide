# Well-Formed Terms and Items

The area of the analysis pipeline that deals with questions like "does `T: Debug` hold true for some data structure that uses T?" or "is this const generic parameter `const B: bool` being handed a value of the right type?"

Terms and Items are "well formed" when they "follow rules" AKA "they fulfill obligations" or "they meet the necessary constraints." When we're doing a well-formedness check (wfck) we're usually concerned about if Trait obligations are met, but this also covers obligations of the types broadly, including making sure that the types of const generic terms type check.

There are two different forms of wfck:

- Term[^terms] wfck.
- Items[^items] wfck. 
    - "Items wfck" can call into "Terms wfck" as Items contain Terms.
    - Sometimes normalize their inner Terms first.

Wfck is not "Kindedness" checking, as we might see in languages like Haskell. Wfck is not concerned with if a type with 2 parameters has 1 or 3 types applied to it (assuming no defaults), or if a const generic parameter has a type applied to it. These kinds of errors will get handled during HIR-ty Lowering[^hir-ty-lower], not wfck.

Wfck doesn't check or validate lifetimes, this is handled in [MIR](../borrow-check.md).

## Generating Obligations

The first step of wfck is generating the list of things for a subject of the wfck that need to be true for that subject to be well-formed. 

These end up being referred to as Obligations, Requirements, or Constraints. Prefer to call them obligations for now, as this matches the suffix of the type and the names of relevant functions. In future, this may be superseded by the Polonius term "Goal"[^boxy].

The Term wfck module[^tlt-wf-module] contains an `obligations` function that takes type-level terms and returns `PredicateObligations`, a set of obligations that Term must satisfy in order to be well-formed. The satisfaction of those obligations is performed by the Trait Solver[^trait-solver][^boxy], and if they are satisfied then the term is Well-Formed.

## Well-Formedness of Terms

Terms are Well-Formed when trait obligations within them are satisfied when passed to the trait solver. As an example, the following is not well-formed:

```rust
Vec<str>
---
// Obligations to fulfill
Vec<T> where T: Sized
Vec<str> where str: Sized // This is not true, therefore the term is not well-formed.
```

During wfck we encounter the obligation for `Vec<T>` that `T: Sized`. For `Vec<str>` we encounter the obligation `str: Sized`, and as `str` is not `Sized` the term is not well-formed.

### We Don't Need Normalization (Yet)

We wfck terms regardless of their normalization state. Consider a struct `Struct` and another struct `Set` that has a where clause in it[^where-clause-in-type]:

```rust
// Ord if T: Ord
#[derive(PartialEq, Eq, PartialOrd, Ord)]
struct Struct<T>(T);
struct Set<A>(A) where A: Ord;
Set<Struct<T>> where T: Ord
---
Struct<T>: Ord // This is true / well-formed if T: Ord (which it is here)
```

This produces an obligation that still has a generic in it. While more normalized versions of `Struct<T>` may not be `Ord`, we can say that `Set<Struct<T>>` is well-formed when `T: Ord`.

### Const Generic Arguments

Wfck is also responsible for getting obligations of const generic terms. Let's look at the following use of const generics:

```rust
fn use_const_generics<const U: usize>() { /* ... */ }
// call site
use_const_generics::<6>();
---
// call site wfck obligations
const 6: usize
```

Applying wfck to the call site will provide us with the obligation `6: usize`. This obligation will be passed off to the trait solver just like any trait-style obligation, as the trait solver has more responsibilities than its name suggests.

## Well-Formedness of Items

We can consider Items[^items] as "Things that get defined." Wfck for Items[^item-wf-module] only happens at the signature level, for types and functions. This doesn't happen for Free Type Aliases beyond Const Generic Argument type checking.

Because Items contain Terms, Item-level wfck can invoke Term wfck[^boxy].

### We (Sometimes) Need Normalization

Currently, there are places where normalization of an Item happens before its Terms have gone through wfck. This is considered problematic as this allows some terms to [bypass wfck entirely](https://github.com/rust-lang/rust/issues/100041).

### Trivial Bounds

Trivial bounds[^item-wf-global-bounds] are bounds that don't need any further normalization to be evaluated, go through wfck, etc. These are also sometimes called Global Bounds. Consider the following:

```rust
fn apartment_complex<T>(block: T, name: String) where String: Clone { /* ... */ }
---
String: Clone // Trivial bound! We don't have to wfck T or any sub-terms to know this holds.
// Maybe there's obligations on T but we don't care about them here.
// ...
```

This produces the trivial bound `String: Clone`. This is something we can check without instantiating any other information in this Item. We don't need to know any information about `T` to be able to make a judgment on the well-formedness of `String: Clone`.

False trivial bounds are things like:

```rust
fn apartment_simple<T>(block: T, name: String) where String: Copy { /* ... */ }
---
String: Copy // Trivial bound again, but this one is false!
```

Here we have a trivial bound that does not hold, because `String` is not `Copy`.

## When We Don't Fully Do Wfck

Wfck is not a coherent "stage" of type checking. It gets called from various contexts, and there are places where it gets skipped partially or entirely.

### Trait Objects

Trait objects of traits with where clauses / const generics do not undergo wfck until the type is coerced back into a concrete type.

```rust
trait Trait<const N: usize> {}
fn foo<const B: bool>(_: &dyn Trait<B>) {}
---
// This doesn't end up being generated, because it happens within a trait object.
const N: usize
const B: bool
N = B // Substitution
// This fails once we coerce out of a trait object to a concrete type.
// But because we don't coerce, it passes wfck.
const B: usize + bool 
```

The above shouldn't compile, and yet it does. `foo`s const generic argument is a `bool`, while `Trait`'s is a `usize`. But because the wfck of trait objects doesn't happen until coercion into a concrete type, the above compiles just fine.

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

The rhs of Free Type Aliases[^fta] do not go through a full wfck. They don't get checked, with the exception of shallowly "type checking" const generic parameters of the rhs.

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