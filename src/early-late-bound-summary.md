# Early/Late bound parameters

This section discusses what it means for generic parameters to be early or late bound.

```rust
fn id_u32<'a, T>(b: &'a u32) -> &'a u32 { b }
//     ^^  ^early bound
//     ^^
//     ^^late bound
```