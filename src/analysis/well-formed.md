# Well-Formed Terms and Items

Terms and items are "well formed" when they "follow rules" AKA "they meet the constraints." When we're doing a well-formedness check (wfck) we're usually concerned about if Trait requirements are met, but this also covers "requirements" of the types broadly. This is the area where Const Generics are "typechecked" as "this const generic argument must be a u8" is the responsibility of wfck.

There's two different forms of well-formedness checking that happen, first for "Type Level Terms" and second for Items. "Items wfck" can call into "Type Level Terms wfck".

Wfck is not "Kindedness" checking, as we might see in languages like Haskell. Wfck is not concerned with if a type with 2 parameters has 1 or 3 types applied to it (assuming no defaults), or if a const generic parameter has a type applied to it. These kinds of errors will get handled during HIR-ty Lowering[^hir-ty-lower], not wfck.

## Requirements

The wfck module[^tlt-wf-module] contains an `obligations` function that takes type level terms and returns `PredicateObligation` that term must satisfy in order to be well-formed. The satisfaction of those obligations is performed 

## Well-Formedness of Type-Level Terms

Well-Formed Type-Level Terms

Type-Level Terms are Well-formed when trait constraints within them are satisfied. As an example, the following is not well-formed:

```rust,no_compile
Vec<str>
```

Because an implicit constraint on `T` in `Vec<T>` is `T: Sized`, and `str` is not `Sized`. During wfck we would receive the requirement `str: Sized` This would not pass wfck, which passes the requirements off to the trait solver.

### We Don't Need Normalization (Yet)

This doesn't only happen with fully normalized types. For a type `struct Struct<T>(T)` that gets used in `Vec<Struct<T>>` and a where clause `Vec<Struct<T>>: Send + Sync` we would also encounter the requirement `Struct<T>: Send + Sync` and `T: Send + Sync`.

TODO: Actually double check this with someone.

## Well-Formedness of Items

What's an Item? See the [Glossary](../appendix/glossary.md). We can imagine Items here as "Things that get defined." Wfck for Items[^item-wf-module] only happens at the signature level, for types and functions. This doesn't happen for Free Type Aliases beyond Const Generic Argument typechecking.

### Calling Type Level Term Wfck from Item Wfck

Item-level wfck can invoke Type-level term wfck[^boxy].

### Normalizing then checking well-formedness

For Type-Level Terms, we don't need to normalize anything first. Items are different, and may require normalization before 

## Const Generic Arguments

Const generics have special cases in wfck. 

## Trait Objects

Trait objects of traits with where clauses (i.e. `trait MyTrait)

```rust
trait Trait<const N: usize> {}
fn foo<const B: bool>(_: &dyn Trait<B>) {}
```

## Trivial Bounds

Trivial bounds[^item-wf-global-bounds] are bounds that don't need any further normalization to be evaluated, go through wfck, etc. A 

## Binders

```rust
fn foo() {
    // legal even though slices aren't sized
    // (in future, this SHOULD error.)
    let _: for<'a> fn(Vec<[&'a ()]>);
    // illegal
    let _: for<'a> fn(&'a (), Vec<[()]>);
}
```

## Free Type Aliases

The Rhs of Free Type Aliases[^fta] are an exception to Well Formedness checking. They don't get checked, with the exception of shallowly "type checking" the arguments of const generic parameters.

This means the following _currently_ passes typechecking, assuming you don't actually use it in a non-FTA Item:

```rust,no_compile
type WorksButShouldNot = Vec<str>;
```

This shouldn't work, as  `T: Sized`, `str: Sized` being implied by `Vec<T>`.

[^fta]: Type aliases not associated with anything, i.e. a top-level `type Alias = Vec<u8>`.
[^boxy]: Boxy said so.
[^hir-ty-lower]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/hir_ty_lowering/index.html
[^tlt-wf-module]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/wf/index.html
[^item-wf-module]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/index.html
[^wf-ctx-construction]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/fn.enter_wf_checking_ctxt.html
[^item-wf-ctx]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/struct.WfCheckingCtxt.html
[^item-wf-global-bounds]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_analysis/check/wfcheck/struct.WfCheckingCtxt.html#method.check_false_global_bounds