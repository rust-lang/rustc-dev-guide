# Early and Late Bound Variables

A generic type may be [_universally_ or _existentially_ quantified][quant]. For
example,

[quant]: ./appendix/background.md#quantified

```rust,ignore
fn foo<T>()
```
This function claims that the function is well-typed for all types `T`. To use
the chalk notation: `forall<T> foo<T>`.

Another example:

```rust,ignore
fn foo<'a>(_: &'a usize)
```
This function claims that there is some lifetime `'a` (determined by the
caller) such that it is well-typed.

One more example:

```rust,ignore
fn foo<F>()
where for<'a> F: Fn(&'a u8),
```
This function claims that for all lifetimes `'a` and types `F` satisfying the
bound, it is well-typed:

```txt
forall<'a, F> {
    if F: Fn(&'a u8) {
        foo<'a, f>
    }
}
```

Notice, however, that in Rust, we don't have (at the language level)
universally quantified types; there is no `forall<F> foo<F>` in Rust. As a
result, we have a sort of weird split in how we represent some generic types:
_early-_ and _late-_ bound parameters.

Basically, if we cannot represent a type (e.g. a universally quantified type),
we have to bind it _early_ so that the unrepresentable type is never around.

Consider the following example:

```rust,ignore
fn foo<'a, 'b, T>(x: &'a u32, y: &'b T) where T: 'b { ... }
```

We cannot treat `'a`, `'b`, and `T` in the same way.  Types in Rust can't have
`for<T> { .. }`, only `for<'a> {...}`, so whenever you reference `foo` the type
you get back can't be `for<'a, 'b, T> fn(&'a u32, y: &'b T)`. Instead, the `T`
must be substituted early. In particular, you have:

```rust,ignore
let x = foo; // T, 'b have to be substituted here
x(...);      // 'a substituted here, at the point of call
x(...);      // 'a substituted here with a different value
```

## Early-bound parameters

Early-bound parameters in Rustc are identified by an index, stored in the
[`ParamTy`] struct for types or the [`EarlyBoundRegion`] struct for lifetimes.
The index counts from the outermost declaration in scope. This means that as you
add more binders inside, the index doesn't change.

For example,

```rust,ignore
trait Foo<T> {
  type Bar<U> = (Self, T, U);
} 
```

Here, the type `(Self, T, U)` would be `($0, $1, $2)`, where `$N` means a
[`ParamTy`] with the index of `N`.

In rustc, the [`Generics`] structure carries the this information. So the
[`Generics`] for `Bar` above would be just like for `U` and would indicate the
'parent' generics of `Foo`, which declares `Self` and `T`.  You can read more
in [this chapter](./generics.md).

[`ParamTy`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.ParamTy.html
[`EarlyBoundRegion`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.EarlyBoundRegion.html
[`Generics`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.Generics.html

## Late-bound parameters

Late-bound parameters in `rustc` are handled quite differently (they are also
specialized to lifetimes, since right now only late-bound lifetimes are
supported, though with GATs that has to change). We indicate their potential
presence by a [`Binder`] type. The [`Binder`] doesn't know how many variables
there are at that binding level. This can only be determined by walking the
type itself and collecting them. So a type like `for<'a, 'b> ('a, 'b)` would be
`for (^0.a, ^0.b)`. Here, we just write `for` because we don't know the names
of the things bound within.

Moreover, a reference to a late-bound lifetime is written `^0.a`:

- The `0` is the index; it identifies that this lifetime is bound in the
  innermost binder (the `for`).
- The `a` is the "name"; late-bound lifetimes in rustc are identified by a
  "name" -- the [`BoundRegion`] struct. This struct can contain a
  [`DefId`][defid] or it might have various "anonymous" numbered names. The
  latter arise from types like `fn(&u32, &u32)`, which are equivalent to
  something like `for<'a, 'b> fn(&'a u32, &'b u32)`, but the names of those
  lifetimes must be generated.

This setup of not knowing the full set of variables at a binding level has some
advantages and some disadvantages. The disadvantage is that you must walk the
type to find out what is bound at the given level and so forth. The advantage
is primarily that, when constructing types from Rust syntax, if we encounter
anonymous regions like in `fn(&u32)`, we just create a fresh index and don't have
to update the binder.

[`Binder`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.Binder.html
[`BoundRegion`]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/enum.BoundRegion.html
[defid]: ./hir.html#identifiers-in-the-hir
