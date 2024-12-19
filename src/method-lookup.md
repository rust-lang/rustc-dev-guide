# Method lookup

Method lookup can be rather complex due to the interaction of a number
of factors, such as self types, autoderef, trait lookup, etc. This
file provides an overview of the process. More detailed notes are in
the code itself, naturally.

One way to think of method lookup is that we convert an expression of
the form `receiver.method(...)` into a more explicit [fully-qualified syntax][]
(formerly called [UFCS][]):

- `Trait::method(ADJ(receiver), ...)` for a trait call
- `ReceiverType::method(ADJ(receiver), ...)` for an inherent method call

Here `ADJ` is some kind of adjustment, which is typically a series of
autoderefs and then possibly an autoref (e.g., `&**receiver`). However
we sometimes do other adjustments and coercions along the way, in
particular unsizing (e.g., converting from `[T; n]` to `[T]`).

Method lookup is divided into two major phases:

1. Probing ([`probe.rs`][probe]). The probe phase is when we decide what method
   to call and how to adjust the receiver.
2. Confirmation ([`confirm.rs`][confirm]). The confirmation phase "applies"
   this selection, updating the side-tables, unifying type variables, and
   otherwise doing side-effectful things.

One reason for this division is to be more amenable to caching.  The
probe phase produces a "pick" (`probe::Pick`), which is designed to be
cacheable across method-call sites. Therefore, it does not include
inference variables or other information.

[fully-qualified syntax]: https://doc.rust-lang.org/nightly/book/ch19-03-advanced-traits.html#fully-qualified-syntax-for-disambiguation-calling-methods-with-the-same-name
[UFCS]: https://github.com/rust-lang/rfcs/blob/master/text/0132-ufcs.md
[probe]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_typeck/method/probe/
[confirm]: https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir_typeck/method/confirm/

## The Probe phase

### Steps

The first thing that the probe phase does is to create a series of
*steps*. This is done by progressively dereferencing the receiver type
until it cannot be deref'd anymore, as well as applying an optional
"unsize" step. This "dereferencing" in fact uses the `Receiver` trait
rather than the normal `Deref` trait. There's a blanket implementation
of `Receiver` for `T: Deref` so the answer is often the same.

So if the receiver has type `Rc<Box<[T; 3]>>`, this
might yield:

1. `Rc<Box<[T; 3]>>` *
2. `Box<[T; 3]>` *
3. `[T; 3]` *
4. `[T]` *

Some types might implement `Receiver` but not `Deref`. Imagine that
`SmartPtr<T>` does this. If the receiver has type `&Rc<SmartPtr<T>>`
the steps would be:

1. `&Rc<SmartPtr<T>>` *
2. `Rc<SmartPtr<T>>` *
3. `SmartPtr<T>` *
4. `T`

The first three of those steps, marked with a *, can be reached using
`Deref` as well as by `Receiver`. This fact is recorded against each step.

### Candidate assembly

We then search along these candidate steps to create a list of
*candidates*. A `Candidate` is a method item that might plausibly be the
method being invoked. For each candidate, we'll derive a "transformed self
type" that takes into account explicit self.

At this point, we consider the whole list - all the steps reachable via
`Receiver`, not just the shorter list reachable via `Deref`.

Candidates are grouped into two kinds, inherent and extension.

**Inherent candidates** are those that are derived from the
type of the receiver itself.  So, if you have a receiver of some
nominal type `Foo` (e.g., a struct), any methods defined within an
impl like `impl Foo` are inherent methods.  Nothing needs to be
imported to use an inherent method, they are associated with the type
itself (note that inherent impls can only be defined in the same
crate as the type itself).

<!--
FIXME: Inherent candidates are not always derived from impls.  If you
have a trait object, such as a value of type `Box<ToString>`, then the
trait methods (`to_string()`, in this case) are inherently associated
with it. Another case is type parameters, in which case the methods of
their bounds are inherent. However, this part of the rules is subject
to change: when DST's "impl Trait for Trait" is complete, trait object
dispatch could be subsumed into trait matching, and the type parameter
behavior should be reconsidered in light of where clauses.

Is this still accurate?
-->

**Extension candidates** are derived from imported traits.  If I have
the trait `ToString` imported, and I call `to_string()` as a method,
then we will list the `to_string()` definition in each impl of
`ToString` as a candidate. These kinds of method calls are called
"extension methods".

So, let's continue our example. Imagine that we were calling a method
`foo` with the receiver `Rc<Box<[T; 3]>>` and there is a trait `Foo`
that defines it with `&self` for the type `Rc<U>` as well as a method
on the type `Box` that defines `foo` but with `&mut self`. Then we
might have two candidates:

- `&Rc<U>` as an extension candidate
- `&mut Box<U>` as an inherent candidate

### Candidate search

Finally, to actually pick the method, we will search down the steps again,
trying to match the receiver type against the candidate types. This time,
we consider only the steps which can be reached via `Deref`, since we
actually need to convert the receiver type to match the `self` type.
In the examples above, that means we consider only the steps marked with
an asterisk.

At each step, we also consider an auto-ref and auto-mut-ref to see whether
that makes any of the candidates match. For each resulting receiver
type, we consider inherent candidates before extension candidates.
If there are multiple matching candidates in a group, we report an
error, except that multiple impls of the same trait are treated as a
single match. Otherwise we pick the first match we find.

In the case of our example, the first step is `Rc<Box<[T; 3]>>`,
which does not itself match any candidate. But when we autoref it, we
get the type `&Rc<Box<[T; 3]>>` which matches `&Rc<U>`. We would then
recursively consider all where-clauses that appear on the impl: if
those match (or we cannot rule out that they do), then this is the
method we would pick. Otherwise, we would continue down the series of
steps.

### `Deref` vs `Receiver`

Why have longer and shorter lists here? The use-case is smart pointers.
For example:

```
struct Inner;

// Assume this cannot implement Deref for some reason, e.g. because
// we know other code may be accessing T and it's not safe to make
// a reference to it
struct Ptr<T>;

impl<T> Receiver for Ptr<T> {
   type Target = T;
}

impl Inner {
   fn method1(self: &Ptr<Self>) {
   }

   fn method2(&self) {}
}

fn main() {
   let ptr = Ptr(Inner);
   ptr.method1();
   // ptr.method2();
}
```

In this case, the step list for the `method1` call would be:

1. `Ptr<Inner>` *
2. `Inner`

Because the list of types reached via `Receiver` includes `Inner`, we can
look for methods in the `impl Inner` block during candidate search.
But, we can't dereference a `&Receiver` to make a `&Inner`, so the picking
process won't allow us to call `method2` on a `Ptr<Inner>`.

### Deshadowing

Once we've made a pick, code in `pick_all_method` also checks for a couple
of cases where one method may shadow another. That is, in the code example
above, imagine there also exists:

```
impl Inner {
   fn method3(self: &Ptr<Self>) {}
}

impl<T> Ptr<T> {
   fn method3(self) {}
}
```

These can both be called using `ptr.method3()`. Without special care, we'd
automatically use `Ptr::self` because we pick by value before even looking
at by-reference candidates. This could be a problem if the caller previously
was using `Inner::method3`: they'd get an unexpected behavior change.
So, if we pick a by-value candidate we'll check to see if we might be
shadowing a by-value candidate, and error if so. The same applies
if a by-mut-ref candidate shadows a by-reference candidate.