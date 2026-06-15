# Well-Formedness of Items and Type-Level Terms

The area of analysis that produces questions like "does `T: Debug` hold true for some data structure that uses T?" or "is this const generic parameter `const B: bool` being handed a value of the right type?" for the trait solver to answer.

Items and Type-Level Terms[^terms][^terms-abbreviated] are "well formed" when they "follow rules" AKA "fulfill obligations" or "meet the necessary constraints." When we're doing a well-formedness check we're usually concerned about if Trait obligations are met, but this also covers obligations of the types broadly, including making sure that the types of const generic terms type check.

There are two different forms of well-formedness checking:

- Type-Level Term[^terms] well-formedness check.
    - Primary subject of "Well-Formedness Checking."
    - Abbreviated here to "Term well-formedness" or "Term well-formedness checking." 
    - Not a distinct analysis pass. 
- Items[^items] well-formedness check (item-wfck). 
    - "Item-wfck" can call into "Term well-formedness checking" as Items contain Terms.
    - Inner "Terms" can get normalized first.

See: [What Well-Formedness Is Not](#what-well-formedness-isnt)

## Well-Formedness of Type-Level Terms

Type-Level Terms are the data structures that well-formedness checking is focused on analyzing. Item-wfck is one of the entry points where term well-formedness checking will get performed.

### Obligations

Term well-formedness begins with generating the list of things that need to be true for the term-being-checked to be well-formed. 

These predicates end up being referred to as Obligations, Requirements, or Constraints. Preferred term is "obligations", as this matches the suffix of the type and the names of relevant functions. In future, this may be superseded by the new solver's term "Goal".

The term well-formedness module[^tlt-wf-module] contains an `obligations` function that takes type-level terms and returns `PredicateObligations`, a list of obligations that Type-Level Term must satisfy in order to be well-formed. The satisfaction of those obligations is performed by the Trait Solver[^trait-solver], and if they are satisfied then the term is Well-Formed.

### When Type-Level Terms Are Well Formed

Terms are Well-Formed when trait obligations within them are considered satisfied by the trait solver. As an example, the following is not well-formed:

```rust,ignore
Vec<str>
---
// Obligations to fulfill
Vec<T> where T: Sized
Vec<str> where str: Sized // This is not true, therefore the term is not well-formed.
```

From term well-formedness we find the obligation for `Vec<T>` that `T: Sized`. For `Vec<str>` we encounter the obligation `str: Sized`, and as `str` is not `Sized` the term is not well-formed.

### We Don't Need Normalization (Yet)

[Normalization](../normalization.md) is the process of resolving [type aliases](../normalization.md#aliases) into their underlying type. A type alias is considered well-formed if its underlying type is well-formed. The underlying type is undergoes well-formedness checking at most definition and instantiation sites.

### Const Generic Arguments

Term well-formedness is also responsible for getting "type-checking" obligations of const generic terms[^tyck-const-generics]. Let's look at the following use of const generics:

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

Items[^items] are, generally speaking, "Things that get defined." Item-wfck[^item-wf-module] only happens at the signature level for types and functions, including the methods and implementations. This doesn't happen for Free Type Aliases other than Const Generic argument type checking.

Items are a major entry point for term well-formedness. Because Items contain Terms, item-wfck can invoke term well-formedness checking.

### We (Sometimes) Need Normalization

Currently, there are places where normalization of an Item happens before its Terms have gone through well-formedness checking. This is considered problematic as doing so allows some terms to [bypass term well-formedness checking entirely](https://github.com/rust-lang/rust/issues/100041).

### Global & Trivial Bounds

Trait bounds are a common Obligation.

Global bounds[^global-where-bound] are post-normalization bounds that don't contain any generic parameters (like `<T>` or `'a`) or bound variables (like `for<'a>`).

Trivial bounds are bounds that do not need further normalization to determine if they're well-formed or not.

Consider the following:

```rust,ignore
fn apartment_complex<T>(block: T, name: String) where String: Clone { /* ... */ }
---
String: Clone // Trivial & Global bound! There's no aliases to resolve.
// Maybe there's obligations on T but we don't care about them here.
// ...
```

This produces the global (no generic parameters), trivial (didn't require normalization to be well-formedness checked) bound `String: Clone`. This is something we can check without instantiating any other information in this Item. We don't need to know any information about `T` to be able to make a judgment on the well-formedness of `String: Clone`.

False trivial bounds are things like:

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

Trait objects of traits with where clauses / const generics do not undergo well-formedness checking until the type is coerced back into a concrete type.

```rust,ignore
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

The above shouldn't compile, but it does. `foo`s const generic argument is a `bool`, while `Trait`'s is a `usize`. But because the wfck of trait objects doesn't happen until coercion into a concrete type, the above compiles just fine.

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

TODO: Consider the above

### Free Type Aliases

The rhs of Free Type Aliases[^fta] do not go through a full wfck at the definition site, with the exception of shallowly "type checking" const generic parameters of the rhs.

The following free type alias passes type checking, at time of writing:

```rust,ignore
type WorksButShouldNot = Vec<str>;
---
// This should fail! But we skip the rhs of free type aliases
str: Sized
```

This shouldn't work, as both `T: Sized`, `str: Sized` are implied by `Vec<T>`. This "passes" item-wfck because the rhs of a free type alias doesn't go through well-formedness checking _until it's used_. Item-wfck is **deferred until use** for this specific case.

---

## Well-Formed or Wellformed?

Prefer "well-formed" over "wellformed," as this is consistent with logic literature. This also gets abbreviated to WF in other parts of the dev guide / docs.

## What Well-Formedness Isn't

Well-formedness checking is not "number of parameters" or "parameter type" checking[^kind-checking]. Neither term well-formedness checking nor item-wfck is concerned with if a type with 2 parameters has 1 or 3 types applied to it (assuming no defaults), or if a const generic parameter has a type applied to it. These kinds of problems will get handled during HIR-ty Lowering[^hir-ty-lower], not wfck.

Well-formedness doesn't check or validate lifetimes, this is handled in [MIR](../borrow-check.md).

[^trait-solver]: Despite being called a trait solver, it solves other things too[^boxy].
[^fta]: Type aliases not associated with anything, i.e. a module-level `type Alias = Vec<u8>;`.
[^boxy]: Boxy said so. TODO: don't have any of these references :)
[^lcnr]: Lcnr said so. TODO: don't have any of these references :)
[^items]: "Definition" style things in rust, See the [glossary](../appendix/glossary.md).
[^terms]: Type expressions? TODO: this needs to be nailed down, and maybe inserted into the glossary.
[^terms-abbreviated]: Abbreviated as "Terms" on this page in some areas.
[^kind-checking]: AKA "kind checking", as we might see in languages like Haskell.
[^global-where-bound]: See: [next-gen trait solving candidate preferences](../solve/candidate-preference.md).
[^hir-ty-lower]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/hir_ty_lowering/index.html
[^tlt-wf-module]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/wf/index.html
[^item-wf-module]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/index.html
[^wf-ctx-construction]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/fn.enter_wf_checking_ctxt.html
[^item-wf-ctx]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/struct.WfCheckingCtxt.html
[^item-wf-global-bounds]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/struct.WfCheckingCtxt.html#method.check_false_global_bounds
[^tyck-const-generics]: https://rustc-dev-guide.rust-lang.org/const-generics.html#checking-types-of-const-arguments