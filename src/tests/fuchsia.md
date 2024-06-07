# Fuchsia integration tests

[Fuchsia](https://fuchsia.dev) is an open-source operating system with about 2
million lines of Rust code.[^loc] It has caught a large number of [regressions]
in the past and was subsequently included in CI.

## Building Fuchsia in CI

Fuchsia builds as part of the suite of bors tests that run before a pull request
is merged.

If you are worried that a pull request might break the Fuchsia builder and want to test it out before submitting it to the bors queue, simply add this line to your PR description:

> try-job: x86_64-gnu-integration

Then when you `@bors try` it will pick the job that builds Fuchsia.

## Building Fuchsia locally

Because Fuchsia uses languages other than Rust, it does not use Cargo as a build
system. It also requires the toolchain build to be configured in a [certain
way][build-toolchain].

The recommended way to build Fuchsia is to use the Docker scripts that check out
and run a Fuchsia build for you. If you've run Docker tests before, you can
simply run this command from your Rust checkout to download and build Fuchsia
using your local Rust toolchain.

```
src/ci/docker/run.sh x86_64-gnu-integration
```

See the [Testing with Docker](docker.md) chapter for more details on how to run
and debug jobs with Docker.

Note that a Fuchsia checkout is *large* – as of this writing, a checkout and
build takes 46G of space – and as you might imagine, it takes awhile to
complete.

### Customizing the Fuchsia checkout and build

The main reason you would want to build Fuchsia locally is because you need to
investigate a regression. After running a Docker build, you'll find the Fuchsia
checkout inside the `obj/fuchsia` directory of your Rust checkout.  If you
modify the `KEEP_CHECKOUT` line in the [build-fuchsia.sh] script to
`KEEP_CHECKOUT=1`, you can change the checkout as needed and rerun the build
command above. This will reuse all the build results from before.

You can find more options to customize the Fuchsia checkout in the
[build-fuchsia.sh] script, and more info about building Fuchsia in the
[build_fuchsia_from_rust_ci.sh] script it invokes.

## Fuchsia target support

To learn more about Fuchsia target support, see the Fuchsia chapter in [the
rustc book][platform-support].

[regressions]: https://gist.github.com/tmandry/7103eba4bd6a6fb0c439b5a90ae355fa
[build-toolchain]: https://fuchsia.dev/fuchsia-src/development/build/rust_toolchain
[build-fuchsia.sh]: https://github.com/rust-lang/rust/pull/126105/files?file-filters%5B%5D=.sh&show-viewed-files=true
[build_fuchsia_from_rust_ci.sh]: https://cs.opensource.google/fuchsia/fuchsia/+/main:scripts/rust/build_fuchsia_from_rust_ci.sh?q=build_fuchsia_from_rust_ci&ss=fuchsia
[platform-support]: https://doc.rust-lang.org/nightly/rustc/platform-support/fuchsia.html

[^loc]: As of June 2024, Fuchsia had about 2 million lines of first-party Rust code
and a roughly equal amount of third-party code, as counted by tokei (excluding
comments and blanks).
