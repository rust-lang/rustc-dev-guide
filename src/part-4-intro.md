# Part 4: Analysis

This part discusses analyses which the compiler uses to check various properties
of source code and to inform later compilation stages. Typically the analyses
prestented here is what people mean when they refer to "Rust's type system".
This includes inference and checking of types, the trait and type systems
representation, and the borrow checker generally. These analyses are separated
throughout various parts of the compilation process and use meaningfully
different Intermediate Representations (IR). For example, type checking happens
on the HIR, while borrow checking happens on the MIR.

This section of the guide discusses all of these analyses which are the heart of
Rust's novel approach to ownership which balances type system *expressivity with
usability*, and which represents the integration of decades of programming
language research. With its new semantics comes a degree of inherent complexity
(so to with most any learning process) as languge designers and compiler
engineers continue to evolve Rust towards its simpler more explainable
*essence*, namely that of *ownership* and *borrowing* which account for the
interesting parts of the language's semantics and the justification for claims
of *memory safety* and *data race freedom*.
