# Overlap checks

As part of checking items (specifically: structs, enums, traits, unions),
the compiler checks whether impl blocks overlap, for example because they define the same functions.
This is an example an overlap check.
The same overlap check is done when constructing a [specialization graph](./specialization.md).
Here, trait implementations could overlap, for example because of a conflicting blanket implementation overlapping with some specific implementation. 

The overlap check always compares two impls.
In the case of inherent impl blocks, this means that at least for small n, 
rustc quite literally compares each impl to each other impl block in an `n^2` loop 
(see `fn check_item` in coherence/inherent_impls_overlap.rs).

Overlapping is sometimes partially allowed:
1. for maker traits
2. under [specialization](./specialization.md)

but normally isn't. 

The overlap check has various modes (see [`OverlapMode`]).
Importantly, there's the explicit negative impl check, and the implicit negative impl check.
Both try to apply negative reasoning to prove that an overlap is definitely impossible.

[`OverlapMode`]: https://doc.rust-lang.org/beta/nightly-rustc/rustc_middle/traits/specialization_graph/enum.OverlapMode.html

## The explicit negative impl check

This check is done in [`impl_intersection_has_negative_obligation`]. 

This check tries to find a negative trait implementation. 
For example:

```rust
struct MyCustomBox<T: ?Sized>(Box<T>)

// both in your own crate
impl From<&str> for MyCustomBox<dyn Error> {}
impl<E> From<E> for MyCustomBox<dyn Error> where E: Error {}
```

In this example, we'd get:
`MyCustomBox<dyn Error>: From<&str>` and `MyCustomBox<dyn Error>: From<?E>`, giving `?E = &str`.

And thus, these two implementations would overlap.
However, libstd provides `&str: !Error`, and therefore guarantees that there 
will never be a positive implementation of `&str: Error`, and thus there is no overlap.

Note that for this kind of negative impl check, we must have explicit negative implementations provided.
This is not currently stable.

[`impl_intersection_has_negative_obligation`]: https://doc.rust-lang.org/beta/nightly-rustc/rustc_trait_selection/traits/coherence/fn.impl_intersection_has_impossible_obligation.htmlhttps://doc.rust-lang.org/beta/nightly-rustc/rustc_trait_selection/traits/coherence/fn.impl_intersection_has_negative_obligation.html

## The implicit negative impl check

This check is done in [`impl_intersection_has_impossible_obligation`],
and does not rely on negative trait implementations and is stable.

Let's say there's a 
```rust
impl From<MyLocalType> for Box<dyn Error> {}  // in your own crate
impl<E> From<E> for Box<dyn Error> where E: Error {} // in std
```

This would give: `Box<dyn Error>: From<MyLocalType>`, and `Box<dyn Error>: From<?E>`,  
giving `?E = MyLocalType`.

In your crate there's no `MyLocalType: Error`, downstream crates cannot implement `Error` (a remote trait) for `MyLocalType` (a remote type).
Therefore, these two impls do not overlap.
Importantly, this works even if there isn't a `impl !Error for MyLocalType`.

[`impl_intersection_has_impossible_obligation`]: https://doc.rust-lang.org/beta/nightly-rustc/rustc_trait_selection/traits/coherence/fn.impl_intersection_has_impossible_obligation.html

