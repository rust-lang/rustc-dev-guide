# LintStore

This page documents some of the machinery around lint registration and how we
run lints in the compiler.

The `LintStore` is the central piece of infrastructure, around which everything
rotates. It's not available during the early parts of compilation (i.e., before
TyCtxt) in most of the code, as we need to fill it in with all of the lints,
which can only happen after plugin registration.

We store essentially two separate things in the `LintStore`: a list of all known
lints with associated metadata (default lint levels, notably), and the lint
passes. We store constructors for the lint passes rather than the passes
themselves, because lint passes often want to change state to track something
in the code (so their methods take `&mut self`) and we want to avoid needing to
synchronize access to the LintStore.

For the most part, we currently only instantiate each lint pass once, though in
the future we'll likely want more fine-grained linting to better support
incremental compilation. We already have late module passes which are
constructed per-module if the module changes in an incremental session.

## Registration

We must register both every lint and every lint pass into the `LintStore` for
the code to work properly. This often is as simple as calling
`register_lints(PassType::get_lints())` and then `register_late_pass(||
Box::new(PassType))`.

Within the compiler, for performance reasons, we usually do not register dozens
of lint passes. Instead, we have a single lint pass of each variety
(e.g. `BuiltinCombinedModuleLateLintPass`) which will internally call all of the
individual lint passes; this is because then we get the benefits of static over
dynamic dispatch for each of the (often empty) trait methods. Ideally, we'd not
have to do this, since it certainly adds to the complexity of understanding the
code. However, with the current type-erased lint store approach, it is
beneficial to do so for performance reasons.

New lints being added likely want to join one of the existing declarations like
`late_lint_mod_passes` in `librustc_lint/lib.rs`.
