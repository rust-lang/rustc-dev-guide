# Expectations

In an ideal world, we would only perform type inference at one point in the compiler: once all constraints have been collected.

In reality, we perform it (at least) twice: First, at eager evaluation points, and secondly "at the end" when those constraints have been collected.

`Expectations` are a piece of type inference state we maintain for the cases where we need to eagerly infer the types of expressions rather than leave them to the end.

## Eager Type Checking / Inference.

<!-- TODO: more stuff here. -->

### Closures and Higher-Ranked Variables

Closures need to have type inference eagerly applied to them because they are functions that are rarely fully annotated. Top-level functions i.e. `fn <T, Y>(what_that_is: T, what_it_isnt: Y) -> bool {/* */}` have their input / output types fully defined (opaque types still being an explicit annotation) but closures tend to have most/all of their type annotations missing, like `|a, b| if a < b {vec![1, 2, 3]} else {vec![6, 7, 8]} `.

Eager, Higher-Ranked type inference happens in closures because closures can introduce Higher-Ranked Lifetimes. `for<'a> T<'a>` is the only style of higher-ranked bound in Rust, and these can appear in the types of closures.


### Coercions

Actually yes does use expectations.

### Method calls?

Maybe Not. Maybe just point to [method lookup](./method-lookup.md).

### Fields?

Maybe Not

### Indexing

lcnr said so.

Papers:
- [This one](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/putting.pdf)