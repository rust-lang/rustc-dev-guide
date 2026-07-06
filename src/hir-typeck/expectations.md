# Expectations

In an ideal world, we would only perform type inference at one point in the compiler: once all constraints have been collected.

In reality, we perform it (at least) twice: First, at eager evaluation points, and secondly "at the end."

`Expectations` are a piece of type-checking state we maintain for the cases where we need to eagerly infer the types of expressions rather than leave them to the end.

The main subjects of "eager type inference" are:

- Method calls
- Closures (their signatures could be higher-ranked)
- Coercions
- fields
- indexing (because of weird dereferencing stuff this isn't just a Method Call)


## Closures and Higher-Ranked Variables

Closures need to have type inference eagerly applied to them because [reasons]. 

Papers:
- [This one](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/putting.pdf)