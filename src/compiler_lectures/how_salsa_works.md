# How Salsa works

This chapter is based on the explanation given by Niko Matsakis in this [video](https://www.youtube.com/watch?v=_muY4HjSqVw) about [Salsa](https://github.com/salsa-rs/salsa).

## What is Salsa?

Salsa is a library for incremental recomputation, this means reusing computation that has already been done in the past to increase the efficiency of future computations.

The objectives of Salsa are:
 * Provide that functionality in an automatic way, so reusing old computations is done automatically by the library
 * Doing so in a "sound", or "correct", way, therefore leading the same results as if it had been done from scratch

Salsa actual model is much richer, allowing many kinds of inputs and many different outputs.
For example, integrating Salsa with an IDE could mean that the inputs could be the manifest (`Cargo.toml`), entire source files (`foo.rs`), snippets and so on; the outputs of such integration could range from a binary executable, to lints, types (for example, if a user selects a certain variable and wishes to see it's type), completitions etcetera.

## How does it work?

The first thing that Salsa has to do is identify the "base inputs" [^EN1].

Then Salsa has to also identify intermidiate, "derived" values, which are something that the library produces, but, for each derived value there's a "pure" function that computes the derived value.

For example, there might be a function `ast(x: Path) -> AST`. The produced `AST` isn't a final value, it's an intermidiate value that the library would use for the computation.

This means that when you try to compute with the library, Salsa is going to compute various derived values, and eventually read the input and produce the result for the asked computation.

Salsa is going to track, in the course of computing, which inputs were accessed, which derived values, and this is going to be used later to determine what's going to happen when the inputs change: are the derived values still valid? 

This doesn't mean necessarily that each computation downstream from the input is going to be checked, since that is going to be costly. Salsa only needs to check each downstream computation until it finds one that isn't changed, therefore it won't need to check the other derived computations, since they wouldn't need to change.

It's is helpful to think about this as a graph with nodes. Each derived value has a dependency on some other values, that could be base or derived. Base values don't have a dependency.

```ignore
I <- A <- C ...
          |
J <- B <--+
```

When an input `I` changes, the derived value `A` could have changed, but another derived value `B` , which doesn't depend neither on `I`, nor does it depends on `A`, nor does it depends on any other derived value from `A` or `I`, is not subject to change.
Therefore, Salsa can reuse the computation done for `B` in the past, without having to compute it again.

The computation could also terminate early. Keeping the same graph as before, say that input `I` has changed in some way (and input `J` hasn't) but, when computing `A` again, it's found that `A` hasn't changed from the previous computation. This leads to an "early termination", because there's no need to check if `C` needs to change, since both `C` direct inputs, `A` and `B`, haven't changed.

## Key Salsa concepts
### Query
A query is some value that Salsa can access in the course of computation.
Each query can have a number of keys (from 0 to many), and all queries have a result, akin to functions.
0-key queries are called "input" queries.
### Database
The database is basically the context for the entire computation, it's gonna store all Salsa's internal state, all intermidiate values for each query, and anything else that the computation might need.
The database to know all the queries that the library is going to do before it can be build, but they don't need to be specified in the same place.

After the database is formed, it can be accessed with queries that are basically going to work like functions.
Since each query is going to be stored in the database, when a query is invoked N times, it's going to return N **cloned** results, without having to recompute the query (unless the input has changed in such a way that it warrants recomputation).

For each input query (0-key), there's going to be a "set" method, that allows to change the output of such query, and trigger previous memoized values to be potentially invalidated.

### Query Groups
A query group is a set of queries which have been defined together as a unit. The dabase is formed by combining query groups.
Query groups are akin to "Salsa modules" [^EN2].

A set of queries in a query group are just a set of methods in a trait.

To create a query group a trait annotated with a specific attribute (`#[salsa::query_group(...)]`) has to be created.

An argument must also be provided to said attribute as it will be used by Salsa to create a struct to be used later when the database is created.

Example input query group:

```rust,ignore
///This attribute will process this tree,
///produce this tree as output, 
///and produce a bunch of intermidiate stuff
///that Salsa also uses.
///One of these things is a "StorageStruct", whose name we have specified in the attribute.
#[salsa::query_group(InputsStorage)]
pub trait Inputs {
    //! This query group is a bunch of **input** queries, that do not rely on any derived input

    ///This attribute (`#[salsa::input]`) indicates that this query is a base input, 
    ///therfore `set_manifest` is going to be auto-generated
    #[salsa::input]
    fn manifest(&self) -> Manifest;
    
    #[salsa::input]
    fn source_text(&self, name: String) -> String;
}
```

To create a **derived** query group, one must specify which other query group does this one depends on, by specifying it as a supertrait, as seen in the following example:

```rust,ignore
///This query group is going to contain queries that depend on derived values
///a query group can access another query group's queries 
///by specifying the dependency as a super trait
///query groups can be stacked as much as needed
///using that pattern
#[salsa::query_group(ParserStorage)]
pub trait Parser: Inputs {  

    ///This query `ast` is not an input query, it's a derived query
    ///this means that a definition is necessary  
    fn ast(&self, name: String) -> String;

}
```

When creating a derived query the implementation of said query must be defined outside the trait.
The definition must take a database parameter as an `impl Trait` (or `dyn Trait`), where `Trait` is the query group that the definition belongs to, in addition to the other keys.

```rust,ignore
///This is going to be the definition of the `ast` query in the `Parser` trait.
///So, when the query `ast` is invoked, and it needs to be recomputed, Salsa is going to call this function
///and it's is going to give it the database as `impl Parser`.
///The function doesn't need to be aware of all the queries of all the query groups
fn ast(db: &impl Parser, name: String) -> String { 
    //! Note, `impl Parser` is used here but `dyn Parser` works just as well

    /* code */

    ///By passing an `impl Parser`, this is allowed
    let source_text = db.input_file(name);

    /* do the actual parsing */

    return ast;
}
```

Eventually, after all the query groups have been defined, the database can be created by declaring a struct.

To specify which query groups are going to be part of the database an attribute 
(`#[salsa::database(...)]`) must be added. The argument of said attribute is a list of identifiers, specifying the query groups **storages**.

```rust,ignore
///This attribute specifies which query groups are going to be in the database
#[salsa::database(InputsStorage, ParserStorage)]
#[derive(Default)] //optional!
struct MyDatabase {
    ///You also need this one field
    runtime : salsa::Runtime<MyDatabase>,
}

///And this trait has to be implemented
impl salsa::Databse for MyDatabase {
    fn salsa_runtime(&self) -> &salsa::Runtime<MyDatabase> {
        &self.runtime
    }
}
```

Example usage:

```rust,ignore
fn main() {
    let db = MyDatabase::default();

    db.set_manifest(...);
    db.set_source_text(...);

    loop {
        db.ast(...); //will reuse results
        db.set_source_text(...);
    }
}
```

[^EN1]: "They are not something that you **inaubible** but something that you kinda get **inaudible** from the outside [3:23](https://youtu.be/_muY4HjSqVw?t=203).

[^EN2]: What is a Salsa module?