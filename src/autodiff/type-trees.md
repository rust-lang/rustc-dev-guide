# Type Trees in Enzyme

This document describes type trees as used by Enzyme for automatic differentiation.

## What are Type Trees?

Type trees in Enzyme are a way to represent the types of variables, including their activity (e.g., whether they are active, duplicated, or contain duplicated data) for automatic differentiation. They provide a structured way for Enzyme to understand how to handle different data types during the differentiation process.

## Representing Rust Types as Type Trees

Enzyme needs to understand the structure and properties of Rust types to perform automatic differentiation correctly. This is where type trees come in. They provide a detailed map of a type, including pointer indirections and the underlying concrete data types.

The `-enzyme-rust-type` flag in Enzyme helps in interpreting types more accurately in the context of Rust's memory layout and type system.

### Primitive Types

#### Floating-Point Types (`f32`, `f64`)

Consider a Rust reference to a 32-bit floating-point number, `&f32`.

In LLVM IR, this might be represented, for instance, as an `i8*` (a generic byte pointer) that is then `bitcast` to a `float*`. Consider the following LLVM IR function:

```llvm
define internal void @callee(i8* %x) {
start:
  %x.dbg.spill = bitcast i8* %x to float*
  ; ...
  ret void
}
```

When Enzyme analyzes this function (with appropriate flags like `-enzyme-rust-type`), it might produce the following type information for the argument `%x` and the result of the bitcast:

```llvm
i8* %x: {[-1]:Pointer, [-1,0]:Float@float}
%x.dbg.spill = bitcast i8* %x to float*: {[-1]:Pointer, [-1,0]:Float@float}
```

**Understanding the Type Tree: `{[-1]:Pointer, [-1,0]:Float@float}`**

This string is the type tree representation. Let's break it down:

*   **`{ ... }`**: This encloses the set of type information for the variable.
*   **`[-1]:Pointer`**:
    *   `[-1]` is an index or path. In this context, `-1` often refers to the base memory location or the immediate value pointed to.
    *   `Pointer` indicates that the variable `%x` itself is treated as a pointer.
*   **`[-1,0]:Float@float`**:
    *   `[-1,0]` is a path. It means: start with the base item `[-1]` (the pointer), and then look at offset `0` from the memory location it points to.
    *   `Float` is the `CConcreteType` (from `enzyme_ffi.rs`, corresponding to `DT_Float`). It signifies that the data at this location is a floating-point number.
    *   `@float` is a subtype or specific variant of `Float`. In this case, it specifies a single-precision float (like Rust's `f32`).

A reference to an `f64` (e.g., `&f64`) is handled very similarly. The LLVM IR might cast to `double*`:
```llvm
define internal void @callee(i8* %x) {
start:
  %x.dbg.spill = bitcast i8* %x to double*
  ; ...
  ret void
}
```

And the type tree would be:

```llvm
i8* %x: {[-1]:Pointer, [-1,0]:Float@double}
```
The key difference is `@double`, indicating a double-precision float.

This level of detail allows Enzyme to know, for example, that if `x` is an active variable in differentiation, the floating-point value it points to needs to be handled according to AD rules for its specific precision.

### Compound Types

#### Structs

Consider a Rust struct `T` with two `f32` fields (e.g., a reference `&T`):

```rust
struct T {
    x: f32,
    y: f32,
}

// And a function taking a reference to it:
// fn callee(t: &T) { /* ... */ }
```

In LLVM IR, a pointer to this struct might be initially represented as `i8*` and then cast to the specific struct type, like `{ float, float }*`:

```llvm
define internal void @callee(i8* %t) {
start:
  %t.dbg.spill = bitcast i8* %t to { float, float }*
  ; ...
  ret void
}
```

The Enzyme type analysis output for `%t` would be:

```llvm
i8* %t: {[-1]:Pointer, [-1,0]:Float@float, [-1,4]:Float@float}
```

**Understanding the Struct Type Tree: `{[-1]:Pointer, [-1,0]:Float@float, [-1,4]:Float@float}`**

*   **`[-1]:Pointer`**: As before, this indicates that `%t` is a pointer.
*   **`[-1,0]:Float@float`**:
    *   This describes the first field of the struct (`x`).
    *   `[-1,0]` means: from the memory location pointed to by `%t` (`-1`), at offset `0` bytes.
    *   `Float@float` indicates this field is an `f32`.
*   **`[-1,4]:Float@float`**:
    *   This describes the second field of the struct (`y`).
    *   `[-1,4]` means: from the memory location pointed to by `%t` (`-1`), at offset `4` bytes.
    *   `Float@float` indicates this field is also an `f32`.

The offset `4` comes from the size of the first field (`f32` is 4 bytes). If the first field were, for example, an `f64` (8 bytes), the second field might be at offset `[-1,8]`. Enzyme uses these offsets to pinpoint the exact memory location of each field within the struct.

This detailed mapping is crucial for Enzyme to correctly track the activity of individual struct fields during automatic differentiation.
