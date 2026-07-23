# Expectations and Eager Type Inference

In an ideal world, we would only perform type inference at one point in the compiler: once all constraints have been collected.

In reality, we perform it (at least) twice: First, at eager evaluation points, and secondly "at the end" when those constraints have been collected.

`Expectations` are a piece of type inference state we maintain for the cases where we need to eagerly infer the types of expressions rather than leave them to the end.

## Eager Type Inference

<!-- TODO: more stuff here. -->

Eager evaluation of the type of a term (type inference) is required at some specific points to either make type inference more consistent or make it even possible, in the case of higher-ranked bounds / Higher Ranked Lifetime bounds.

Eager evaluation is when we do type inference earlier than we otherwise would. To do this, we bring in Expectations.

### Closures and Higher-Ranked Variables

Closures need to have type inference eagerly applied to them because they are functions that are rarely fully annotated. Top-level functions i.e. `fn <T, Y>(what_that_is: T, what_it_isnt: Y) -> bool {/* */}` have their input / output types fully defined (opaque types still being an explicit annotation) but closures tend to have most/all of their type annotations missing, like `|a, b| if a < b {vec![1, 2, 3]} else {vec![6, 7, 8]} `.

Eager, Higher-Ranked type inference happens in closures because closures can introduce Higher-Ranked Lifetimes. `for<'a> T<'a>` is the only style of higher-ranked bound in Rust, and these can appear in the types of closures.

The above is only slightly true. Let's be wrong about it in more interesting ways.

### Coercions

? [Coercions](https://doc.rust-lang.org/reference/type-coercions.html) engage in eager type inference as we need to know the type of a coerced type as early as possible for some reason idk. Maybe this is fail-early stuff? Need to engage in investigation.

### Method calls?

Maybe Not. Maybe just point to [method lookup](./method-lookup.md).

? Method calls engage in Coercion and therefore need to engage in Eager Type Inference.

### Fields?

? Fields engage in corcion and therefore need to engage in eager type inference.

### Indexing

? Indexing engages in coercion and therefore needs to engage in eager type inference.

lcnr said so.

Papers:
- [Practical Type Inference for Arbitrary-Rank Types, Jones ](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/putting.pdf)
- [Local type inference (referenced in PTIfART)]