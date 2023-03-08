# Making diagnostics translatable

<!-- toc -->

There is an ongoing effort to make diagnostics translatable,
and the coordination happens [on GitHub].

This is intended to be a gentle guide to help with this effort,
with the use of examples.

> A more detailed explanation can be found in [the announcement of the initiative].
> However,
> note that some of the important details are now outdated.
>
> Reference documentation can be found in these chapters:
> - [Diagnostic structs](diagnostic-structs.md)
> - [Translation system](translation.md)

## General comments

For a single diagnostic, 3 files need to be modified:

- One file where the diagnostic is emitted,
  typically by calling [Session::struct_span_err].
- One file where the type representing the migrated diagnostic,
  either a `struct` or an `enum`, will be added.
  This is typically in a module named `errors` in the relevant compiler crate.
- One file where the actual text of the diagnostic is located,
  located in a file named `locales/en-US.ftl`,
  relative to the root path of the relevant rustc crate.

## Simple example

*This uses [issue #108727] for demonstration*

Suppose you have the following code:

```rust
ecx.struct_span_err(span, "proc-macro derive produced unparseable tokens").emit();
```

> Note that `ecx.struct_span_err` indirectly calls [Session::struct_span_err].

Referring to the [general comments](#general-comments) section above,
follow these changes:

- Replace the code above with this:

  ```rust
  ecx.sess.emit_err(errors::ProcMacroDeriveTokens { span });
  ```

- Create the above type, `errors::ProcMacroDeriveTokens`,
  in `src/errors.rs` (relative to crate directory root):

  ```rust
  #[derive(Diagnostic)]
  #[diag(expand_proc_macro_derive_tokens)]
  pub struct ProcMacroDeriveTokens {
      #[primary_span]
      pub span: Span,
  }
  ```

- Create the actual text of the diagnostic in `locales/en-US.ftl`
  (also relative to crate directory root):

  ```fluent
  expand_proc_macro_derive_tokens =
      proc-macro derive produced unparseable tokens
  ```

Once that is done, a PR may be submitted,
and the following comment on the PR page will label the PR accordingly,
as well as alert the right people to review it:

```
@rustbot label +A-translation
r? rust-lang/diagnostics
```

## Example with variable interpolation

*This uses [issue #108436] for demonstration*

Suppose you have the following code:

```rust
let mut err = ecx.struct_span_err(span, "proc macro panicked");
if let Some(s) = e.as_str() {
    err.help(&format!("message: {}", s));
}
err.emit()
```

> Note that `ecx.struct_span_err` indirectly calls [Session::struct_span_err].

- Replace the code above with this:

  ```rust
  ecx.sess.emit_err(errors::ProcMacroPanicked {
      span,
      message: e
          .as_str()
          .map(|message| errors::ProcMacroPanickedHelp { message: message.into() }),
  })
  ```

- Create the above type, `errors::ProcMacroPanickedHelp`,
  in `src/errors.rs` (relative to crate directory root):

  ```rust
  #[derive(Diagnostic)]
  #[diag(expand_proc_macro_panicked)]
  pub(crate) struct ProcMacroPanicked {
      #[primary_span]
      pub span: Span,
      #[subdiagnostic]
      pub message: Option<ProcMacroPanickedHelp>,
  }
  
  #[derive(Subdiagnostic)]
  #[help(expand_help)]
  pub(crate) struct ProcMacroPanickedHelp {
      pub message: String,
  }
  ```

- Create the actual text of the diagnostic in `locales/en-US.ftl`
  (also relative to crate directory root):

  ```fluent
  expand_proc_macro_panicked =
      proc macro panicked
      .help = message: {$message}
  ```

## Example with a macro, `struct_span_err!`

*This uses [issue #108373] for demonstration*

Suppose you have the following code:

```rust
let mut diag = struct_span_err!(
    tcx.sess,
    generics_where_clauses_span.unwrap_or(main_span),
    E0646,
    "`main` function is not allowed to have a `where` clause"
);
if let Some(generics_where_clauses_span) = generics_where_clauses_span {
    diag.span_label(generics_where_clauses_span, "`main` cannot have a `where` clause");
}
diag.emit();
```

> Note that `struct_span_err!` indirectly calls [Session::struct_span_err_with_code].

- Replace the code above with this:

  ```rust
  tcx.sess.emit_err(errors::WhereClauseOnMain {
      span: generics_where_clauses_span.unwrap_or(main_span),
      generics_span: generics_where_clauses_span,
  });
  ```

- Create the above type, `errors::WhereClauseOnMain`,
  in `src/errors.rs` (relative to crate directory root):

  ```rust
  #[derive(Diagnostic)]
  #[diag(hir_analysis_where_clause_on_main, code = "E0646")]
  pub(crate) struct WhereClauseOnMain {
      #[primary_span]
      pub span: Span,
      #[label]
      pub generics_span: Option<Span>,
  }
  ```

- Create the actual text of the diagnostic in `locales/en-US.ftl`
  (also relative to crate directory root):

  ```fluent
  hir_analysis_where_clause_on_main =
      `main` function is not allowed to have a `where` clause
      .label = `main` cannot have a `where` clause
  ```

[Session::struct_span_err]: https://doc.rust-lang.org/stable/nightly-rustc/rustc_session/session/struct.Session.html#method.struct_span_err
[Session::struct_span_err_with_code]: https://doc.rust-lang.org/stable/nightly-rustc/rustc_session/session/struct.Session.html#method.struct_span_err_with_code
[the announcement of the initiative]: https://blog.rust-lang.org/inside-rust/2022/08/16/diagnostic-effort.html#manually-implementing-sessiondiagnostic
[on GitHub]: https://github.com/rust-lang/rust/issues/100717
[issue #108373]: https://github.com/rust-lang/rust/pull/108373
[issue #108436]: https://github.com/rust-lang/rust/pull/108436
[issue #108727]: https://github.com/rust-lang/rust/pull/108727
