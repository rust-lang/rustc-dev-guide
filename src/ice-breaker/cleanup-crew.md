# Cleanup Crew

**Github Label:** [ICEBreaker-Cleanup-Crew]

[ICEBreaker-Cleanup-Crew]: https://github.com/rust-lang/rust/labels/ICEBreaker-Cleanup-Crew

The "Cleanup Crew" are focused on improving bug reports. Specifically,
the goal is to try to ensure that every bug report has all the
information that will be needed for someone to fix it:

* a minimal, standalone example that shows the problem
* links to duplicates or related bugs
* if the bug is a regression (something that used to work, but no longer does),
  then a bisection to the PR or nightly that caused the regression

This kind of cleanup is invaluable in getting bugs fixed. Better
still, it can be done by anybody who knows Rust, without any
particularly deep knowledge of the compiler.

Let's look a bit at the workflow for doing "cleanup crew" actions.

## Finding a minimal, standalone example

Here the ultimate goal is to produce an example that reproduces the same
problem but without relying on any external crates. Such a test ought to contain
as little code as possible, as well. This will make it much easier to isolate the problem.

However, even if the "ultimate minimal test" cannot be achieved, it's
still useful to post incremental minimizations. For example, if you
can eliminate some of the external dependencies, that is helpful, and
so forth. 

It's particularly useful to reduce to an example that works
in the [Rust playground](https://play.rust-lang.org/), rather than
requiring people to checkout a cargo build.

There are many resources for how to produce minimized test cases. Here
are a few:

* The [rust-reduce](https://github.com/jethrogb/rust-reduce) tool can try to reduce
  code automatically.
  * The [C-reduce](https://embed.cs.utah.edu/creduce/) tool also works
    on Rust code, though it requires that you start from a single
    file. (XXX link to some post explaining how to do it?)
* pnkfelix's [Rust Bug Minimization Patterns] blog post
  * This post focuses on "heavy bore" techniques, where you are
    starting with a large, complex cargo project that you wish to
    narrow down to something standalone.

[Rust Bug Minimization Patterns]: http://blog.pnkfx.org/blog/2019/11/18/rust-bug-minimization-patterns/

## Links to duplicate or related bugs

If you are on the "Cleanup Crew", you will sometimes see multiple bug
reports that seem very similar. You can link one to the other just by
mentioning the other bug number in a Github comment. Sometimes it is
useful to close duplicate bugs. But if you do so, you should always
copy any test case from the bug you are closing to the other bug that
remains open, as sometimes duplicate-looking bugs will expose
different facets of the same problem.

## Bisection

For regressions (something that used to work, but no longer does), we
have a great tool that
