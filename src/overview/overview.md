# Overview of the compiler

> **WORK IN PROGRESS**

# References

- Command line parsing
  - Guide: [The Rustc Driver and Interface](rustc-driver.md)
  - Driver definition: [`rustc_driver`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_driver/)
  - Main entry point: [`rustc_session::config::build_session_options`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_session/config/fn.build_session_options.html)
- Lexical Analysis: Lex the user program to a stream of tokens
  - Guide: [Lexing and Parsing](the-parser.md)
  - Lexer definition: [`rustc_lexer`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lexer/index.html)
  - Main entry point: [`rustc_lexer::cursor::Cursor::advance_token`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_lexer/cursor/struct.Cursor.html#method.advance_token)
- Parsing: Parse the stream of tokens to an Abstract Syntax Tree (AST)
  - Guide: [Lexing and Parsing](the-parser.md)
  - Guide: [Macro Expansion](macro-expansion.md)
  - Guide: [Name Resolution](name-resolution.md)
  - Parser definition: [`rustc_parse`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_parse/index.html)
  - Main entry points:
    - [Entry point for first file in crate](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_interface/passes/fn.parse.html)
    - [Entry point for outline module parsing](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_expand/module/fn.parse_external_mod.html)
    - [Entry point for macro fragments][parse_nonterminal]
  - `AST` definition: [`rustc_ast`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_ast/ast/index.html)
  - Feature gating: **TODO**
  - Early linting: **TODO**
- The High Level Intermediate Representation (HIR)
  - Guide: [The HIR](hir.md)
  - Guide: [Identifiers in the HIR](hir.md#identifiers-in-the-hir)
  - Guide: [The `HIR` Map](hir.md#the-hir-map)
  - Guide: [Lowering `AST` to `HIR`](ast-lowering.md)
  - How to view `HIR` representation for your code `cargo rustc -- -Z unpretty=hir-tree`
  - Rustc `HIR` definition: [`rustc_hir`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_hir/index.html)
  - Main entry point: **TODO**
  - Late linting: **TODO**
- Type Inference
  - Guide: [Type Inference](type-inference.md)
  - Guide: [The ty Module: Representing Types](ty.md) (semantics)
  - Main entry point (type inference): [`InferCtxtBuilder::enter`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_infer/infer/struct.InferCtxtBuilder.html#method.enter)
  - Main entry point (type checking bodies): [the `typeck` query](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/ty/struct.TyCtxt.html#method.typeck)
    - These two functions can't be decoupled.
- The Mid Level Intermediate Representation (MIR)
  - Guide: [The `MIR` (Mid level IR)](mir/index.md)
  - Definition: [`rustc_middle/src/mir`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_middle/mir/index.html)
  - Definition of sources that manipulates the MIR: [`rustc_mir_build`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_mir_build/index.html), [`rustc_mir_dataflow`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_mir_dataflow/index.html), [`rustc_mir_transform`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_mir_transform/index.html)
- The Borrow Checker
  - Guide: [MIR Borrow Check](borrow_check.md)
  - Definition: [`rustc_borrowck`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_borrowck/index.html)
  - Main entry point: [`mir_borrowck` query](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_borrowck/fn.mir_borrowck.html)
- `MIR` Optimizations
  - Guide: [MIR Optimizations](mir/optimizations.md)
  - Definition: [`rustc_mir_transform`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_mir_transform/index.html)
  - Main entry point: [`optimized_mir` query](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_mir_transform/fn.optimized_mir.html)
- Code Generation
  - Guide: [Code Generation](backend/codegen.md)
  - Generating Machine Code from `LLVM-IR` with LLVM - **TODO: reference?**
  - Main entry point: [`rustc_codegen_ssa::base::codegen_crate`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_codegen_ssa/base/fn.codegen_crate.html)
    - This monomorphizes and produces `LLVM-IR` for one codegen unit. It then
      starts a background thread to run LLVM, which must be joined later.
    - Monomorphization happens lazily via [`FunctionCx::monomorphize`](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_codegen_ssa/mir/struct.FunctionCx.html#method.monomorphize) and [`rustc_codegen_ssa::base::codegen_instance `](https://doc.rust-lang.org/nightly/nightly-rustc/rustc_codegen_ssa/base/fn.codegen_instance.html)
