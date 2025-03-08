# Normalization and Aliases

<!-- toc -->

## What is normalization

In Rust there are a number of types that are considered equal to some "underlying" type, for example inherent associated types, trait associated types, free type aliases (`type Foo = u32`), and opaque types (`-> impl RPIT`). Alias types are represented by the [`TyKind::Alias`][tykind_alias] variant, with the kind of aliases tracked by the [`AliasTyKind`][aliaskind] enum.

Normalization is the process of taking these alias types and determining the underlying type that they are equal to. For example given some type alias `type Foo = u32`, normalizing `Foo` would give `u32`.

[tykind_alias]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_type_ir/enum.TyKind.html#variant.Alias
[aliaskind]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_type_ir/enum.AliasTyKind.html

## Entry points to normalization

When interfacing with the type system it will often be the case that it's necessary to request a type be normalized. There are a number of different entry points to the underlying normalization logic and each entry point should only be used in specific parts of the compiler.

An additional complication is that the compiler is currently undergoing a transition from the old trait solver to the new trait solver. As part of this transition our approach to normalization in the compiler has changed somewhat significantly, resulting in some normalization entry points being "old solver only" slated for removal in the long-term once the new solver has stabilized.

Here is a rough overview of the different entry points to normalization in the compiler.
- `infcx.at.normalize`
- `tcx.normalize_erasing_regions`
- `infcx.query_normalize`
- `traits::normalize_with_depth(_to)`

### `infcx.at.normalize/deeply_normalize/structurally_normalize`

[`normalize`][normalize]/[`deeply_normalize`][deeply_normalize]/[`structurally_normalize`][structurally_normalize] are the main normalization entry points for normalizing during various analysis' such as type checking, impl wellformedness checking, collecting the types of RPITITs, etc. It's able to handle inference variables during normalization and will return any nested goals required for the normalization to hold. 

These normalization functions are often mirrored on other contexts that wrap an [`InferCtxt`][infcx], such as [`FnCtxt`][fcx] or [`ObligationCtxt`][ocx]. They behave largely the same except that these wrappers can either handle providing some of the arguments to the normalize functions or handle the returned goals itself.

Due to the new normalization approach of the new solver the `normalize` method is a no-op under the new solver and is slated for removal once the new solver is stabilized. Under the new solver the intention is to delay normalization up until matching on the type is actually required, at which point `structurally_normalize` should be called. In some rare cases it is still desirable to eagerly normalize a whole value ahead of time and so `deeply_normalize` exists.

When matching on types during HIR typeck we would like to emit an error if the type is an inference variable as we do not know what type it will wind up being inferred to. The `FnCtxt` type (used during HIR typeck) has a method for this, [`fcx.structurally_resolve`][structurally_resolve], when the new solver is enabled it will *also* attempt to normalize the type via `structurally_normalize`.

Due to this there is a pattern in HIR typeck where a type is first normalized via `normalize` (doing nothing in the new solver), and then `structurally_resolve`'d (normalizing in the new solver, but erroring on inference variables under both solvers). This pattern should be preferred over calling `structurally_normalize` during HIR typeck.

[normalize]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/infer/at/struct.At.html#method.normalize
[deeply_normalize]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/normalize/trait.NormalizeExt.html#tymethod.deeply_normalize
[structurally_normalize]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/trait.StructurallyNormalizeExt.html#tymethod.structurally_normalize_ty
[infcx]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/infer/struct.InferCtxt.html
[fcx]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_typeck/fn_ctxt/struct.FnCtxt.html
[ocx]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/struct.ObligationCtxt.html
[structurally_resolve]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_typeck/fn_ctxt/struct.FnCtxt.html#method.structurally_resolve_type

### `tcx.normalize_erasing_regions`

[`normalize_erasing_regions`][norm_erasing_regions] is generally used by parts of the compiler that are not doing type system analysis' as this normalization entry point does not handle inference variables, lifetimes, or any diagnostics. Lints and codegen make heavy use of this entry point as they typically are working with fully inferred aliases that can be assumed to be well formed (or atleast, are not responsible for erroring on). 

[norm_erasing_regions]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyCtxt.html#method.normalize_erasing_regions

### `infcx.query_normalize`

[`infcx.query_normalize`][query_norm] is very rarely used, it has almost all the same restrictions as `normalize_erasing_regions` (cannot handle inference variables, no diagnostics support) with the main difference being that it retains lifetime information. For this reason `normalize_erasing_regions` is the better choice in almost all circumstances as it is more efficient due to caching lifetime-erased queries.

In practice `query_normalize` is used for normalization in the borrow checker, and elsewhere as a performance optimization over `infcx.normalize`. Once the new solver is stabilized it is expected that `query_normalize` can be removed from the compiler as the new solvers normalization implementation should be performant enough for it to not be a performance regression.

[query_norm]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/infer/at/struct.At.html#method.query_normalize

### `traits::normalize_with_depth(_to)`

[`traits::normalize_with_depth(_to)`][norm_with_depth] is only used by the internals of the old trait solver. It is effectively calling into the internals of how normalization is implemented by the old solver. Other normalization entry points cannot be used from within the internals of the old trait solver as it would result in handling goal cycles and recursion depth incorrectly.

When the new solver is stabilized, the old solver and its implementation of normalization will be removed (of which this function is part of).

[norm_with_depth]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_trait_selection/traits/normalize/fn.normalize_with_depth.html
    
# Alias handling

> FIXME: This section is somewhat incomplete and could do with expansion

## Ambiguous vs Rigid Aliases

Aliases can either be "ambiguous" or "rigid". 

When an alias cannot yet be normalized due to containing inference variables, such as `<_ as Iterator>::Item`, we consider it to be an "ambiguous" alias where "ambiguous" refers to the fact that it is not clear what type implements `Iterator` yet.

On the other hand if we can determine the source for how the self type (`_` in the previous example) implements the trait (e.g. `Iterator`) but the source does not determine the underlying type of the associated type (e.g. `Item`) then it is considered a "rigid" alias.

We generally consider types to be rigid if their "shape" isn't going to change, for example `Box` is rigid as no amount of normalization can turn a `Box` into a `u32`, whereas `<vec::IntoIter<u32> as Iterator>::Item` is not rigid as it can be normalized to `u32`.

If an alias is not ambiguous and also is not rigid then it is either not well formed (the self type does not implement the trait), or it can simply be normalized to its underlying type.

## Alias Equality

In the old solver equating two aliases simply equates the generic arguments of the aliases. This is incorrect as two ambiguous aliases may wind up having their generic arguments inferred differently but still normalizing to the same rigid type.

To work around this the old solver eagerly normalizes all types to ensure the unnormalized types are never encountered. We also (in the new solver too) normalize ambiguous aliases to some new inference variable `?r` to represent its normalized (rigid) form, then emit a goal to defer proving that the alias normalizes to `?r`

This has a few advantages:
- Matching on a `Ty` after normalization will only encounter rigid aliases or inference variables, not ambiguous aliases
- When we *are* able to normalize the ambiguous alias we can wait until it normalized to something rigid instead of a different ambiguous alias before inferring `?r`.
- In cases where multiple aliases wind up being required to be equal to `?r` inference can be stronger as the first alias to be normalized to a rigid type can infer `?r`.
- In the old solver we never encounter ambiguous aliases and so cannot wind up accidentally equating two ambiguous aliases generic arguments

There are some shortcomings with this around higher ranked types containing ambiguous aliases that make use of the bound variables, e.g. `for<'a> fn(<?x as Trait<'a>>::Assoc)`. Creating an inference variable `?r` to represent the normalized form of `<?x as Trait<'a>>::Assoc` is problematic as `?r` would be unable to name the lifetime `'a` due to being in a [lower universe][universes] even though there could exist some type to infer `?x` to that would implement `for<'a> Trait<'a, Assoc = &'a u32>`.

In both the old and new solver we do not normalize aliases to inference variables if they make use of bound vars from a higher ranked type. In the old solver [this is unsound](https://github.com/rust-lang/rust/issues/102048) in coherence due to equality of aliases simply equating the generic arguments regardless of whether the alias is rigid.

In the new solver this is not a soundness bug as we do not equate the arguments of aliases unless they are known to be rigid. 

[universes]: https://rustc-dev-guide.rust-lang.org/borrow_check/region_inference/placeholders_and_universes.html#what-is-a-universe

## Normalization as a side effect of equality

Under the new solvers approach to normalization and equality of aliases we check equality of aliases with a [`PredicateKind::AliasRelate`][aliasrelate] goal that can be deferred until furthur inference progress has been made, if necessary.

`AliasRelate(lhs, rhs)` is implemented by first structurally normalizing both the `lhs` and the `rhs` and then relating the resulting rigid types (or inference variables). Importantly, if `lhs` or `rhs` ends up as an alias, this alias can now be treated as rigid and gets unified without emitting a nested `AliasRelate` goal: [source][structural-relate].

This means that `AliasRelate` with an unconstrained `rhs` ends up acting as a function which fully normalizes `lhs` before assigning the resulting rigid type to an inference variable. This is used by `fn structurally_normalize_ty` both [inside] and [outside] of the trait solver.

[aliasrelate]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/type.PredicateKind.html#variant.AliasRelate
[structural_norm]: https://github.com/rust-lang/rust/blob/2627e9f3012a97d3136b3e11bf6bd0853c38a534/compiler/rustc_trait_selection/src/solve/alias_relate.rs#L140-L175
[structural-relate]: https://github.com/rust-lang/rust/blob/a0569fa8f91b5271e92d2f73fd252de7d3d05b9c/compiler/rustc_trait_selection/src/solve/alias_relate.rs#L88-L107
[inside]: https://github.com/rust-lang/rust/blob/a0569fa8f91b5271e92d2f73fd252de7d3d05b9c/compiler/rustc_trait_selection/src/solve/mod.rs#L278-L299
[outside]: https://github.com/rust-lang/rust/blob/a0569fa8f91b5271e92d2f73fd252de7d3d05b9c/compiler/rustc_trait_selection/src/traits/structural_normalize.rs#L17-L48
