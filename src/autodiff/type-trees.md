# TypeTrees for Autodiff

## What are TypeTrees?
Memory layout descriptors for Enzyme. They tell Enzyme what "type" bytes are, with the main categories being Float, Integer, or Pointer. In Rust, memory is conceptually untyped, so it is possible to store a float into 4 bytes, and later read the bytes back as an integer. This is generally true in Rust even in the absence of `enum` or `union` types. We therefore can not directly put typetree metadata on allocations. We can also not accept Enzyme's default behaviour, which incorrectly assumes that LLVM-IR follows `strict aliasing` rules (known from C/C++). As a solution, we disable Enzyme's strict-aliasing behaviour and only generate TypeTree metadata in selected locations.

## Where we generate TypeTree
The underlying idea is that memory "at rest" is untyped, but plenty of usages interprete bytes in a way that we can communicate to Enzyme. For example, when we call a function, the memory passed to it is interpreted according to the function's signature, so we can add TypeTrees to the LLVM-IR function definitions. We currently only do that for the outermost functions differentiated (those that have a `#[autodiff]` macro on them), but we plan to extend it to all functions which are called from them. We currently also generate TypeTree information for all calls to mem{cpy|move|set}. Finally, we started to add TypeTrees to the input or return values of certain instructions, for now that mainly is `extractvalue`.

## How we add TypeTrees
If we determined that a value has a meaningfull type, then we walk the MIR `Ty` of that value in the middle-end and generate a Rust TypeTree out of it. In the codegen\_llvm backend we lower our Rust TypeTree to LLVM/Enzyme TypeTrees. We then attach them to one of three locations:

Parameters in function definitions:
```llvm
define internal void @_RNvCs7tI50jyFEig_3foo1f(ptr align 8 "enzyme_type"="{[-1]:Pointer, [-1,-1]:Float@double}" %0, ptr align 8 "enzyme_type"="{[-1]:Pointer, [-1,-1]:Float@double}" %1, ptr align 8 "enzyme_type"="{[-1]:Pointer, [-1,-1]:Float@double}" %2) unnamed_addr #0 !dbg !1089 {
```

Argument to calls:
```llvm
  call void @llvm.memcpy.p0.p0.i64(ptr align 8 "enzyme_type"="{[0]:Pointer, [0,0]:Pointer, [0,0,-1]:Float@double}" %6, ptr align 8 "enzyme_type"="{[0]:Pointer, [0,0]:Pointer, [0,0,-1]:Float@double}" %0, i64 24, i1 false), !dbg !669
```

Input or return values of instructions, via debug metadata:
```llvm
  %14 = extractvalue { ptr, i64 } %13, 0, !dbg !906, !enzyme_type !907
  %15 = extractvalue { ptr, i64 } %13, 1, !dbg !906, !enzyme_type !910
...
!907 = !{!"Unknown", i32 -1, !908}
!908 = !{!"Pointer", i32 -1, !909}
!909 = !{!"Float@double"}
!910 = !{!"Unknown", i32 0, !911, i32 1, !911, i32 2, !911, i32 3, !911, i32 4, !911, i32 5, !911, i32 6, !911, i32 7, !911}
!911 = !{!"Integer"}
```

## Structure
```rust
TypeTree(Vec<Type>)

Type {
    offset: isize,  // byte offset (-1 = everywhere)
    size: usize,    // size in bytes
    kind: Kind,     // Float, Integer, Pointer, etc.
    child: TypeTree // nested structure
}
```

## Example: `fn compute(x: &f32, data: &[f32]) -> f32`

**Input 0: `x: &f32`**
```rust
TypeTree(vec![Type {
    offset: -1, size: 8, kind: Pointer,
    child: TypeTree(vec![Type {
        offset: 0, size: 4, kind: Float,  // Single value: use offset 0
        child: TypeTree::new()
    }])
}])
```

**Input 1: `data: &[f32]`**
```rust
TypeTree(vec![Type {
    offset: -1, size: 8, kind: Pointer,
    child: TypeTree(vec![Type {
        offset: -1, size: 4, kind: Float,  // -1 = all elements
        child: TypeTree::new()
    }])
}])
```

**Output: `f32`**
```rust
TypeTree(vec![Type {
    offset: 0, size: 4, kind: Float,  // Single scalar: use offset 0
    child: TypeTree::new()
}])
```

## Why are they needed?
- Plenty of LLVM types are opaque (e.g. `ptr`), but types are needed to compute the correct derivatives.
- They tell Enzyme which bytes are differentiable (e.g. the pointer to float within a slice) vs metadata (e.g. the integer length of a slice)
- Enzyme can't deduce all types from LLVM IR, but can (to some extend) deduce them from usage (Type Analysis).
- Debug builds have a lot of variables with little usage, so Type Analysis (and thus compilation) often fails without extra TypeTrees.
- Type analysis is slow, just reading TypeTrees therefore saves a lot of time.

## What Enzyme Does With This Information:

Without TypeTrees:
```llvm
; Enzyme sees generic LLVM IR:
define float @distance(ptr %p1, ptr %p2) {
; Has to guess what these pointers point to
; Slow analysis of all memory operations
; May miss optimization opportunities
}
```

With TypeTrees:
```llvm
define "enzyme_type"="{[-1]:Float@float}" float @distance(
    ptr "enzyme_type"="{[-1]:Pointer, [-1,0]:Float@float}" %p1, 
    ptr "enzyme_type"="{[-1]:Pointer, [-1,0]:Float@float}" %p2
) {
; Enzyme knows exact type layout
; Can generate efficient derivative code directly
}
```

# TypeTrees - Offset and -1 Explained

## Type Structure

```rust
Type {
    offset: isize, // WHERE this type starts
    size: usize,   // HOW BIG this type is
    kind: Kind,    // WHAT KIND of data (Float, Int, Pointer)
    child: TypeTree // WHAT'S INSIDE (for pointers/containers)
}
```

## Offset Values

### Regular Offset (0, 4, 8, etc.)
**Specific byte position within a structure**

```rust
struct Point {
    x: f32, // offset 0, size 4
    y: f32, // offset 4, size 4
    id: i32, // offset 8, size 4
}
```

TypeTree for `&Point` (internal representation):
```rust
TypeTree(vec![
    Type { offset: 0, size: 4, kind: Float },   // x at byte 0
    Type { offset: 4, size: 4, kind: Float },   // y at byte 4
    Type { offset: 8, size: 4, kind: Integer }  // id at byte 8
])
```

Generates LLVM
```llvm
"enzyme_type"="{[-1]:Pointer, [-1,0]:Float@float, [-1,4]:Float@float, [-1,8]:Integer, [-1,9]:Integer, [-1,10]:Integer, [-1,11]:Integer}"
```

### Offset -1 (Special: "Everywhere")
**Means "this pattern repeats for ALL elements"**

#### Example 1: Direct Array `[f32; 100]` (no pointer indirection)
```rust
TypeTree(vec![Type {
    offset: -1, // ALL positions
    size: 4,    // each f32 is 4 bytes
    kind: Float, // every element is float
}])
```

Generates LLVM: `"enzyme_type"="{[-1]:Float@float}"`

#### Example 1b: Array Reference `&[f32; 100]` (with pointer indirection)  
```rust
TypeTree(vec![Type {
    offset: -1, size: 8, kind: Pointer,
    child: TypeTree(vec![Type {
        offset: -1, // ALL array elements
        size: 4,    // each f32 is 4 bytes
        kind: Float, // every element is float
    }])
}])
```

Generates LLVM: `"enzyme_type"="{[-1]:Pointer, [-1,-1]:Float@float}"`

Instead of listing 100 separate Types with offsets `0,4,8,12...396`

#### Example 2: Slice `&[i32]`
```rust
// Pointer to slice data
TypeTree(vec![Type {
    offset: -1, size: 8, kind: Pointer,
    child: TypeTree(vec![Type {
        offset: -1, // ALL slice elements
        size: 4,    // each i32 is 4 bytes
        kind: Integer
    }])
}])
```

Generates LLVM: `"enzyme_type"="{[-1]:Pointer, [-1,-1]:Integer}"`

#### Example 3: Mixed Structure
```rust
struct Container {
    header: i64,        // offset 0
    data: [f32; 1000],  // offset 8, but elements use -1
}
```

```rust
TypeTree(vec![
    Type { offset: 0, size: 8, kind: Integer }, // header
    Type { offset: 8, size: 4000, kind: Pointer,
        child: TypeTree(vec![Type {
            offset: -1, size: 4, kind: Float // ALL array elements
        }])
    }
])
```

## Key Distinction: Single Values vs Arrays

**Single Values** use offset `0` for precision:
- `&f32` has exactly one f32 value at offset 0
- More precise than using -1 ("everywhere")  
- Generates: `{[-1]:Pointer, [-1,0]:Float@float}`

**Arrays** use offset `-1` for efficiency:
- `&[f32; 100]` has the same pattern repeated 100 times
- Using -1 avoids listing 100 separate offsets
- Generates: `{[-1]:Pointer, [-1,-1]:Float@float}`
