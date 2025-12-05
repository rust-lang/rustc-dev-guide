# Explanation: Why does my `ui` test `//@ build-pass` but not `//@ check-pass`?

Alternative title: why is my `//@ build-pass` test failing in PR CI because no compiler errors are
emitted even though locally errors are in fact emitted?

To understand this situation, we need to understand why this might happen.

<div class="warning">
This particular explanation assumes that the root cause is due to PR CI forcing a check pass mode
(to be elaborated on in the following). Double-check the [*Differential
diagnosis*](#differential-diagnosis) section for some other possible root causes.
</div>


## Background contexts

### Compiler errors emitted past the `--emit=metadata` phase

Compiler errors get emitted at different phases of a compilation session, so if certain phases
aren't reached, then errors that would only be emitted in those phases will not be emitted.

The compiler `--emit=metadata` option (used on its own) skips encoding MIR for non-const functions
in the crate metadata among other things as check mode doesn't need those. So if a compiler error is
emitted only during the skipped encoding or later skipped codegen, only check-building a test source
with `--emit=metadata` will cause the compiler error to not be emitted.

(A related option is `-Zno-codegen`, which only skips codegen.)

### `//@ check-pass` vs `//@ build-pass` pass modes

The key difference between the two pass modes are that `//@ check-pass` invokes only
`--emit=metadata`, whereas `//@ build-pass` will perform full crate metadata encoding and full
codegen.

### Forcing a pass mode via `compiletest`'s `--pass=check` option, and certain PR CI jobs setting `--pass=check`

The reason you only observe the failure in certain PR CI jobs, such as
[`x86_64-gnu-llvm-20`](https://github.com/rust-lang/rust/blob/864339abf952f07098dd82610256338520167d4a/src/ci/github-actions/jobs.yml#L125-L129)
is that selected PR CI jobs have special `./x test` invocations that force pass mode to `check` to
make sure that keeps working properly:

```sh
../x.ps1 --stage 2 test tests/ui --pass=check --host='' --target=i686-unknown-linux-gnu
                                 #^----------
                                 # forced `check` pass mode
```

See
[`x86_64-gnu-llvm.sh`](https://github.com/rust-lang/rust/blob/864339abf952f07098dd82610256338520167d4a/src/ci/docker/scripts/x86_64-gnu-llvm.sh#L20).


## Possible solutions

### The `//@ ignore-pass` directive

If it is *intentional* that the error is only emitted under `//@ build-pass`, then the test writer
can opt the test out of forcing pass modes by using the `//@ ignore-pass` directive.

See also: the [*Directives*](../reference/directives.md) chapter.


## Differential diagnosis

Note that there are other possible root causes, such as:

- Semantic conflicts, e.g. the `HEAD` your branch was based on locally is outdated, and since then,
  the remote `HEAD` contains commits that somehow causes your compiler error to be not emitted or
  suppressed. In this case, rebase against latest `main`.
- Architecture or some other environmental conditions that might cause the error to not be emitted.
  For instance, if the error is only emitted for 64-bit architectures, but the PR CI might be
  explicitly testing against a 32-bit architecture.
