# Expectations and Eager Type Inference

In an ideal world, we would only perform type inference at one point in the compiler: once all constraints have been collected.

In reality, we perform it (at least) twice: First, at eager evaluation points, and secondly "at the end" when those constraints have been collected.

`Expectations` are a piece of type inference state we maintain for the cases where we need to eagerly infer the types of expressions rather than leave them to the end. They allow us to "ask questions" of the form "hey, we're expecting this term to have this type, is this true?"

## Eager Type Inference

<!-- TODO: more stuff here. -->

Eager evaluation of the type of a term (type inference) is required at some specific points to either make type inference more consistent or make it even possible, in the case of higher-ranked bounds / Higher Ranked Lifetime bounds.

Eager evaluation is when we do type inference earlier than we otherwise would. To do this, we bring in Expectations.

### Closures and Higher-Ranked Variables

Closures need to have type inference eagerly applied to them because they are functions that are rarely fully annotated. Top-level functions i.e. `fn is_even(number: i32) -> bool {number % 2 == 0}` have their input / output types fully defined (opaque types still being an explicit annotation) but closures tend to have most/all of their type annotations missing, like `|a, b| if a < b {vec![1, 2, 3]} else {vec![6, 7, 8]}`.

If we didn't do eager type inference we would instead have closures whose types were filled with inference variables. This would be able to solve in some situations, but because we do not have Higher-Ranked Inference Variables[^higher-ranked-inference] this would make the higher-ranked bounds for lifetimes that rust can have unusable without more annotation.

The above is only slightly true. Let's be wrong about it in more interesting ways.

### Coercions 

[Coercions](./coercions.md) can happen in many places, and so we check for them and perform them when able. When we successfully find a coercion, we need to eagerly perform type inference/checking on it as future inference will require or benefit from this information to be known ahead of time.

### Method calls?

Maybe Not. Maybe just point to [method lookup](./method-lookup.md).

? Method calls engage in Coercion and therefore need to engage in Eager Type Inference.

### Fields?

Field access is inherently typed, so when we are doing field access we want to be able to know what a type is as early as possible.

? There might be something about deref here idk.

### Indexing

? Indexing engages in coercion and therefore needs to engage in eager type inference.

lcnr said so.

Papers:
- [Practical Type Inference for Arbitrary-Rank Types, Jones ](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/putting.pdf)
- [Local type inference (referenced in PTIfART)]

[^higher-ranked-inference]: 