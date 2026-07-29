# Eager Type Inference

There are places during compilation where we need to depend on the current state of inference. This means we need to establish the type of a {term, item, etc, figure out exact wording in review} earlier than we otherwise would.

Eager evaluation of the type of a term (type inference) is required at some specific points to either make later type inference more consistent or (in the case of higher-ranked bounds / Higher Ranked Lifetime bounds) make it even possible.

Eager type inference is when we do type inference earlier than we otherwise would. To do this, we bring in Expectations as an additional piece of context.

### Closures and Higher-Ranked Variables

Top-level functions, such as the following, have their types fully annotated at their definition site:

```rust
fn is_even(number: i32) -> bool {
    number % 2 == 0
}
```

This makes inference at points where they're used relatively easy. We know it's a `fn(i32) -> bool`, so when we give it an `i32` we know the expression is a `bool`.

_Closures_ need to have type inference eagerly applied to them because they are functions that are rarely fully annotated:

```rust
let closure = |a, b| if a < b {vec![1, 2, 3]} else {vec![5, 6, 7]};
```

If we didn't do eager type inference we would instead have closures whose types were filled with [inference variables](../appendix/glossary.md#inf-var). 

This would be able to be solved in some situations, but because we do not have Higher-Ranked Inference Variables[^higher-ranked-inference] this would make the higher-ranked bounds for lifetimes that rust can have unusable without more annotation.

### Coercions 

[Coercions](./coercions.md) can happen in many places. We check to see if a coercion can happen, and if it can we perform the coercion. 

When we successfully find a coercion, we need to eagerly perform type inference/checking on it as future inference will require or benefit from this information to be known ahead of time.

### Method calls, Fields, and Indexes.

These are areas which technically take expectations, but in practice use them for diagnostics only.

#### Methods

Maybe Not. Maybe just point to [method lookup](./method-lookup.md).

? Method calls engage in Coercion and therefore need to engage in Eager Type Inference.

#### Fields?

Field access is inherently typed, so when we are doing field access we want to be able to know what a type is as early as possible.

? There might be something about deref here idk.

#### Indexing

? Indexing engages in coercion and therefore needs to engage in eager type inference.

lcnr said so.


## Expectations

`Expectations` are a piece of type inference state we maintain for the cases where we need to eagerly infer the types of expressions rather than leave them to the end. They allow us to "ask questions" of the form "hey, we're expecting this term to have this type, is this true?"

Papers:
- [Practical Type Inference for Arbitrary-Rank Types, Jones ](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/putting.pdf)
- [Local type inference (referenced in PTIfART)]

[^higher-ranked-inference]: https://github.com/rust-lang/types-team/issues/131