# Part 4: The Type System

This part discusses the many analyses that the compiler uses to check various
properties of the code and to inform later stages. This includes the
representation, inference, and checking of types, the trait system, and the
borrow checker. These analyses do not happen as one big pass or set of
contiguous passes. Rather, they are spread out throughout various parts of the
compilation process and use different intermediate representations. For example,
type checking happens on the HIR, while borrow checking happens on the MIR.
Nonetheless, for the sake of presentation, we will discuss all of these
analyses in this part of the guide.
