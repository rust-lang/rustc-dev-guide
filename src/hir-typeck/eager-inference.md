# Eager Type Inference

There are places during type checking where we need to depend on the "current state of inference." This means we need to establish the type of a term earlier than we otherwise would, making it _eager_ inference.

Depending on the Current State of Inference means _we pay attention to the set of constraints we currently have_ even if we've not finished finding all constraints yet. See: ["Current State of Inference"](#current-state-of-inference).

Eager evaluation of the type of a term (type inference) is required at specific points either to make later type inference more consistent or (in the case of higher-ranked bounds / Higher Ranked Lifetime bounds) make it possible at all.

Eager type inference is when we do type inference earlier than we otherwise would. To do this, we bring in Expectations as an additional piece of context.

## Current State of Inference

The "Current State of Inference" is a set of ongoing context state that may not yet be "complete." This is a set of information we care about while performing type inference and checking.

In practical terms, accessing the current state of inference usually means accessing [`InferCtxtInner`][inferctxtinner]

### Inference Variables

Knowledge about what inference variables are currently resolved to. When we first introduce a variable, we give it an inference variable. This is a number of fields of [`InferCtxtInner`][inferctxtinner], but in the general case it's [`InferCtxtInner::type_variable_storage`][inferctxtinner-tyvars].

```rust
let x = ...;
---
// At initialization.
x: ?a;
?a = not known;
// Maybe later?
?a = Vec<?b>;
// And later still
?a = Vec<String>;
```

Each time we look up what `?a` currently is we are accessing this part of the Current State of Inference.

### Expectations

[Expectations][expectation] are an additional piece of typing context that shows we _expect_ that a subject will have a given type, but we have not yet assigned applied this to the inference variables for that subject.

We may have knowledge about what an expression's type _should_ be before we further constrain the inference variable associated with it. Consider the following:

```rust
// fn(u32) -> bool
fn north(a: u32) -> bool {
    a > 2000
}

// Has the type ?a, an inference variable.
let x = ...;
// Introduces "x: u32" and "result: bool" as expectations.
let result = north(x);
---
// Regular inference variables
x: ?a;
result: ?b;
// These have not yet been assigned to ?a ?b respectively. But we do know we
// will need to reconcile these with ?a and ?b in the short term.
expect x: u32;
expect result: bool;
// Then we type check and infer
```

These pieces of information have not yet been canonized as "things an inference variable _is_" the same way we might be able to look up what `?x` currently maps to in the current state of inference.

### Constraints

This is the set of constraints that need to be solved. We collect these constraints as we move through the codebase being type checked.

## Places Where Eager Inference Happens

Eager inference is very common.

### Closures and Higher-Ranked Variables

Top-level functions, such as the following, have their types fully annotated at their definition site:

```rust
fn is_even(number: i32) -> bool {
    number % 2 == 0
}
---
// We don't have to infer this, it's annotated.
is_even: fn(i32) -> bool
```

This makes inference at points where they're used relatively easy. We know it's a `fn(i32) -> bool`, so when we give it an `i32` we know the expression is a `bool`.

_Closures_ need to have type inference eagerly applied to them because they are functions that are rarely fully annotated:

```rust
let closure = |a, b| if a < b {vec![1, 2, 3]} else {vec![5, 6, 7]};
---
// Doesn't capture any information so it's a bare function pointer
// but we still don't know much about it.
closure: fn(?x, ?y) -> ?z
```

If we didn't do eager type inference we would instead have closures whose types were filled with [inference variables](../appendix/glossary.md#inf-var) (like the `?x, ?y, ?z` variables above).

Eagerly inferring the type of `closure` here serves a couple of purposes. Firstly, it's a decent heuristic that if we define a closure we'll use it later and having its type be known will mean a less intense inference solve. Having eagerly inferred the type of a closure lets us establish [Expectations](#expectations) that don't have inference variables in them.

Secondly, functions can introduce Higher-Ranked Bounds for lifetimes. Inferring the types for a closure that uses higher-ranked bounds **requires** us to do work earlier, as part of the bidirectional[^jonesetal2007] type checking algorithm we use.

This would be able to be solved in some situations, but because we do not have Higher-Ranked Inference Variables[^higher-ranked-inference] this would make the higher-ranked bounds for lifetimes that rust can have unusable without more annotation.

### Trait Solving

Trait solving can be run on a [`TyKind`][tykind] at any point. Failure is recoverable, so we can repeat this operation, but if at the end of an Item we can't establish if a type implements a trait then we error.

### Coercions 

[Coercions](./coercions.md) can happen in many places. We check to see if a coercion can happen, and if it can we perform the coercion. 

TODO: Stub, relationship to eager inference is not well established.

TODO: Following are stubs, need to determine if these are relevant to bring up.

- **Methods**:
    - See: [method lookup](./method-lookup.md)
- **Fields**:
    - Field access is inherently typed, so when we are doing field access we want to be able to know what a type is as early as possible.
- **Indexes**:
    Indexing engages in coercion and therefore needs to engage in eager type inference.
---

[expectation]: https://doc.rust-lang.org/stable/nightly-rustc/rustc_hir_typeck/expectation/enum.Expectation.html
[inferctxtinner]: https://doc.rust-lang.org/stable/nightly-rustc/rustc_infer/infer/struct.InferCtxtInner.html
[inferctxtinner-tyvars]: https://doc.rust-lang.org/stable/nightly-rustc/rustc_infer/infer/struct.InferCtxtInner.html#structfield.type_variable_storage
[tykind]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/sty/type.TyKind.html
[^higher-ranked-inference]: https://github.com/rust-lang/types-team/issues/131
[^jonesetal2007]: [Practical Type Inference for Arbitrary-Rank Types, Jones et al 2007](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/putting.pdf)