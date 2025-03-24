# The `rustdoc` test suite

This page is specifically about the test suite named `rustdoc`, for other test suites used for testing rustdoc, see [Rustdoc tests](../rustdoc.md#tests).

The `rustdoc` test suite is specifically used to test the HTML output of rustdoc.

This is achieved by means of [`htmldocck.py`],
a supplementary checker script invoked by compiletest that leverages [XPath].

[`htmldocck.py`]: https://github.com/rust-lang/rust/blob/master/src/etc/htmldocck.py
[XPath]: https://en.wikipedia.org/wiki/XPath

## Htmldocck-Specific Directives

Directives to htmldocck are similar to those given to `compiletest` in that they take the form of `//@` comments.

To avoid repetion, `-` can be used in any `PATH` argument to re-use the previous `PATH` argument.
It is conventional to use a `#![crate_name = "foo"]` attribute to avoid
having to write a long crate name multiple times.

All arguments take the form of quoted strings
(both single and double quotes are supported),
with the exception of `COUNT` and the special `-` form of `PATH`.

Directives are assertions that place constraints on the generated HTML.

All directives (except `files`) can be negated by putting a `!` in front of their name.

Similar to shell commands,
directives can extend across multiple lines if their last char is `\`.
In this case, the start of the next line should be `//`, with no `@`.

For example, `//@ !has 'foo/struct.Bar.html'` checks that crate `foo` does not have a page for a struct named `Bar` in the crate root.

<!-- FIXME(fmease): Mention that the  regexes match case-sensitively and in single-line mode? -->

### `has`

Usage 1: `//@ has PATH`
Usage 2: `//@ has PATH XPATH PATTERN`

In the first form, `has` checks that a given file exists.

In the second form, `has` is the same as `matches`,
except `PATTERN` is a whitespace-normalized[^1] string instead of a regex.
<!-- FIXME(fmease): It's more important to note *here* that the file under test gets normalized too (PATTERN is in 99% cases already normalized)  -->

### `matches`

Usage: `//@ matches PATH XPATH PATTERN`

Checks that the text of each element selected by `XPATH` in `PATH` matches the Python-flavored regex `PATTERN`.

### `matchesraw`

Usage: `//@ matchesraw PATH XPATH PATTERN`

Checks that the contents of the file `PATH` matches the regex `PATTERN`.

<!-- FIXME(fmease): This previously didn't mention XPATH, mention it in prose -->

### `hasraw`

Usage: `//@ hasraw PATH XPATH PATTERN`

Same as `matchesraw`, except `PATTERN` is a whitespace-normalized[^1] string instead of a regex.
<!-- FIXME(fmease): It's more important to note *here* that the file under test gets normalized too (PATTERN is in 99% cases already normalized)  -->

<!-- FIXME(fmease): This previously didn't mention XPATH, mention it in prose -->

### `count`

Usage: `//@ count PATH XPATH COUNT`

Checks that there are exactly `COUNT` matches for `XPATH` within the file `PATH`.

### `snapshot`

Usage: `//@ snapshot NAME PATH XPATH`

Creates a snapshot test named NAME.
A snapshot test captures a subtree of the DOM, at the location
determined by the XPath, and compares it to a pre-recorded value
in a file. The file's name is the test's name with the `.rs` extension
replaced with `.NAME.html`, where NAME is the snapshot's name.

Htmldocck supports the `--bless` option to accept the current subtree
as expected, saving it to the file determined by the snapshot's name.
compiletest's `--bless` flag is forwarded to htmldocck.

<!-- FIXME(fmease): Also mention that we normalize certain URLS
both when and checking and when normalizing
-->

### `has-dir`

Usage: `//@ has-dir PATH`

Checks for the existence of directory `PATH`.

### `files`

Usage: `//@ files PATH ENTRIES`

Checks that the directory `PATH` contains exactly `ENTRIES`.
`ENTRIES` is a Python list of strings inside a quoted string,
as if it were to be parsed by `eval`.
(note that the list is actually parsed by `shlex.split`,
so it cannot contain arbitrary Python expressions).

Example: `//@ files "foo/bar" '["index.html", "sidebar-items.js"]'`

[^1]: Whitespace normalization means that all spans of consecutive whitespace are replaced with a single space.  The files themselves are also whitespace-normalized.

## Compiletest Directives

In addition to the directives listed here,
`rustdoc` tests also support most
[compiletest directives](../tests/directives.html).

<!-- FIXME(fmease):
Should definitely also mention `//@ aux-crate` and `//@ proc-macro`
UNLESS we nuke this paragraph entirely and refer to the compiletest section(s)?
-->
To use multiple crates in a `rustdoc` test, add `//@ aux-build:filename.rs`
to the top of the test file. `filename.rs` should be placed in an `auxiliary`
directory relative to the test file with the comment.

<!-- FIXME(fmease): We might want to explain why this exists / what this actually means -->
If you need to build docs for the auxiliary file, use `//@ build-aux-docs`.

<!-- FIXME(fmease): Mention `//@ doc-flags`! -->

## Limitations

Htmldocck uses the XPath implementation from the Python standard library.
This leads to several limitations:

* All `XPATH` arguments must start with `//` due to a flaw in the implemention.
* Many XPath features (functions, axies, etc.) are not supported.
* Only well-formed HTML can be parsed (hopefully rustdoc doesn't output mismatched tags).

<!-- FIXME(fmease): Maybe link to revisions?  -->
Furthmore, compiletest revisions are not supported.
