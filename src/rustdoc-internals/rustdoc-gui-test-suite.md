# The `rustdoc-gui` test suite

> **FIXME**: This section is a stub. Please help us flesh it out!

This page is about the test suite named `rustdoc-gui` used to test the "GUI" of `rustdoc` (i.e., the HTML/JS/CSS as rendered in a browser).
For other rustdoc-specific test suites, see [Rustdoc test suites].

These use a NodeJS-based tool called [`browser-UI-test`] that uses [puppeteer] to run tests in a headless browser and check rendering and interactivity. For information on how to write this form of test, see [`tests/rustdoc-gui/README.md`][rustdoc-gui-readme] as well as [the description of the `.goml` format][goml-script]

### Rustdoc frontend checks in CI (ESLint & TypeScript)

Rustdoc's JS/TS **linting and type-checking** are **not** performed by `compiletest`. In CI they run under the tidy "extra checks" step, which invokes ESLint and `tsc` on rustdoc's frontend sources.

To reproduce locally (mirrors CI behavior for rustdoc's frontend suites):

```bash
./x.py test --stage 2 tests/rustdoc-js
./x.py test --stage 2 tests/rustdoc-js-std
./x.py test --stage 2 tests/rustdoc-gui
```

You can also run the linters directly in the frontend sources:

```bash
cd rust/src/librustdoc/html/static/js
npm ci
npx tsc -p tsconfig.json
npx eslint .
```

**Notes**

On macOS you may see small pixel/position diffs that fail some rustdoc-gui tests locally; CI's Linux baseline is authoritative.

Running `npx tsc` directly depends on your local TypeScript environment (DOM vs Node types). Prefer the suites above when in doubt.

In CI, these checks run inside the dedicated "tidy" job (see the "tidy" job in GitHub Actions). It installs tidy and runs `./x.py test tidy -vv`, which triggers the ESLint/TypeScript steps described above.

[Rustdoc test suites]: ../tests/compiletest.md#rustdoc-test-suites
[`browser-UI-test`]: https://github.com/GuillaumeGomez/browser-UI-test/
[puppeteer]: https://pptr.dev/
[rustdoc-gui-readme]: https://github.com/rust-lang/rust/blob/master/tests/rustdoc-gui/README.md
[goml-script]: https://github.com/GuillaumeGomez/browser-UI-test/blob/master/goml-script.md
