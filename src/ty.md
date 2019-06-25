# The `ty` module: representing types

The `ty` module defines how the Rust compiler represents types
internally. It also defines the *typing context* (`tcx` or `TyCtxt`),
which is the central data structure in the compiler.

## The tcx and how it uses lifetimes

The `tcx` ("typing context") is the central data structure in the
compiler. It is the context that you use to perform all manner of
queries. The struct `TyCtxt` defines a reference to this shared context:

```rust,ignore
tcx: TyCtxt<'tcx>
//          ----
//          |
//          arena lifetime
```

As you can see, the `TyCtxt` type takes a lifetime parameter.
During Rust compilation, we allocate most of our memory in
**arenas**, which are basically pools of memory that get freed all at
once. When you see a reference with a lifetime like `'tcx`,
you know that it refers to arena-allocated data (or data that lives as
long as the arenas, anyhow).

### Allocating and working with types

Rust types are represented using the `Ty<'tcx>` defined in the `ty`
module (not to be confused with the `Ty` struct from [the HIR]). This
is in fact a simple type alias for a reference with `'tcx` lifetime:

```rust,ignore
pub type Ty<'tcx> = &'tcx TyS<'tcx>;
```

[the HIR]: ./hir.html

You can basically ignore the `TyS` struct – you will basically never
access it explicitly. We always pass it by reference using the
`Ty<'tcx>` alias – the only exception I think is to define inherent
methods on types. Instances of `TyS` are only ever allocated in one of
the rustc arenas (never e.g. on the stack).

One common operation on types is to **match** and see what kinds of
types they are. This is done by doing `match ty.sty`, sort of like this:

```rust,ignore
fn test_type<'tcx>(ty: Ty<'tcx>) {
    match ty.sty {
        ty::TyArray(elem_ty, len) => { ... }
        ...
    }
}
```

The `sty` field (the origin of this name is unclear to me; perhaps
structural type?) is of type `TyKind<'tcx>`, which is an enum
defining all of the different kinds of types in the compiler.

> N.B. inspecting the `sty` field on types during type inference can be
> risky, as there may be inference variables and other things to
> consider, or sometimes types are not yet known that will become
> known later.).

To allocate a new type, you can use the various `mk_` methods defined
on the `tcx`. These have names that correpond mostly to the various kinds
of type variants. For example:

```rust,ignore
let array_ty = tcx.mk_array(elem_ty, len * 2);
```

These methods all return a `Ty<'tcx>` – note that the lifetime you
get back is the lifetime of the innermost arena that this `tcx` has
access to. In fact, types are always canonicalized and interned (so we
never allocate exactly the same type twice) and are always allocated
in the outermost arena where they can be (so, if they do not contain
any inference variables or other "temporary" types, they will be
allocated in the global arena). However, the lifetime `'tcx` is always
a safe approximation, so that is what you get back.

> NB. Because types are interned, it is possible to compare them for
> equality efficiently using `==` – however, this is almost never what
> you want to do unless you happen to be hashing and looking for
> duplicates. This is because often in Rust there are multiple ways to
> represent the same type, particularly once inference is involved. If
> you are going to be testing for type equality, you probably need to
> start looking into the inference code to do it right.

You can also find various common types in the `tcx` itself by accessing
`tcx.types.bool`, `tcx.types.char`, etc (see `CommonTypes` for more).

### Beyond types: other kinds of arena-allocated data structures

In addition to types, there are a number of other arena-allocated data
structures that you can allocate, and which are found in this
module. Here are a few examples:

- [`Substs`][subst], allocated with `mk_substs` – this will intern a slice of
  types, often used to specify the values to be substituted for generics
  (e.g. `HashMap<i32, u32>` would be represented as a slice
  `&'tcx [tcx.types.i32, tcx.types.u32]`).
- `TraitRef`, typically passed by value – a **trait reference**
  consists of a reference to a trait along with its various type
  parameters (including `Self`), like `i32: Display` (here, the def-id
  would reference the `Display` trait, and the substs would contain
  `i32`).
- `Predicate` defines something the trait system has to prove (see `traits`
  module).

[subst]: ./kinds.html#subst

### Import conventions

Although there is no hard and fast rule, the `ty` module tends to be used like
so:

```rust,ignore
use ty::{self, Ty, TyCtxt};
```

In particular, since they are so common, the `Ty` and `TyCtxt` types
are imported directly. Other types are often referenced with an
explicit `ty::` prefix (e.g. `ty::TraitRef<'tcx>`). But some modules
choose to import a larger or smaller set of names explicitly.

# New WIP Content

```
## The many kinds of types

When we talk about how rustc represents types,
we mostly talk about the module ty

rustc:ty:Ty

and not hir:Ty

the difference:

HIR is the high level IR, it's kind of an AST

it basically represents the syntax the user wrote, ie the result of parsing
after some amount of desugaring

it has some representation of types, but that really represents the syntax the user wrote, more than the type itself

- HIR types (rustdoc): describe the syntax of a type
    - `fn foo(x: u32) → u32 { }` — these two instances of `u32` are distinct HIR types; they have distinct spans, etc
    - `fn foo(x: &u32) -> &u32)` — the `&` here

one way of seeing the difference between hir:ty and the other ty types is by looking at this example:

 `fn foo(x: u32) → u32 { }`

here we have this type u32, it appears twice
but we know that this takes an argument and returns a value of the same type
but from the point of view of the hir
there are two distint type instances
because they are ocurring at two different places in the program,
they have two different spans, two different locations

and there might be information that is left out:

`fn foo(x: &u32) -> &u32)`

this type &u32, is kind of incomplete.
in the full  rust compiler there actually a lifetime, or a region as called within the compiler
and there are some defaulting rules, elision rules, that insert the equivalent of
`fn foo<'a '>(x: &'a u32) -> &'a u32)`

in the hir level these things are not spelled out
and in the ty level its complete, and moreover, for something  like u32 we will have exactly one type
because it's not connected to one specific spot in the program, its more connected to the




Okay
Yes, okay, so
Hi everybody, thanks for showing up. So
yeah, I wanted to talk today about the
the way that rusty represents types
and
I'm curious for those of you who are here
Have any of you written code and rusty before the used types?
I know Santiago you did a little bit. At least you may not know you did
Are we all starting from scratch? Okay awesome
So I'm probably through in terms that you don't know we'll come across them feel free to stop me um
Let's start with the kind of basic thing when I talk about how rusty represents types
there's actually a lot of
Types neck planner and if you just look I'm talking sort of around this this type
We call T why I mean you made it short because you know, we type it a lot
and if you just look for like
Things name T Y and the compiler some of these are methods but yeah, you'll already see there's there's actually quite a few
So the one I'm specifically talking about
is rusty Ty Ty and
Not here tidy and let me explain the difference
So
the here first of all the here in rust is sort of our high-level IR
it's kind of our ast
There's a couple stages but it basically represents the syntax that the user wrote ready
so the result of parsing and
after some amount of G sugaring and so on and
It has a representation of types
but that really represents the syntax that the user wrote so exactly what did they write to represent that type and
One way I think they try to explain the difference
Of
Between that and the rusty ties that we're gonna focus on is looking at like look at this function, for example
Here I have this type u 32 and it appears twice
Right, but we know that that's in some sense the same type
It takes an argument and returns an argument of the same type, but from the point of view of the here
There would be two distinct type instances because these are occurring in two different places in the program. They have two
So like two different locations
And so on right and there might be information that's left out like this type
Ampersand u 32 reference to u 32
It's kind of incomplete right in the full rust compiler
there's actually a lifetime here or a region as we're often calling the compiler, but we didn't write it and
There's some sort of defaulting rules, right like if I had this signature
There's elision rules that would that would kind of insert the equivalent of
Of this right and in the here level these things are not yet all spelled out but in the tie level
It's complete and moreover
For something like u 32 we'll have exactly one
Type because it doesn't it does not connect it to a specific spot in the program
It's more the abstract notion of the type itself, right? Um, so
So this is the title
saying that it describes the semantics of the type in this sense and
You can actually you know, click on it and see how it's defined. Um
It's actually a type alias and we're gonna get into this lifetime, but for now, I want to just sort of ignore it
and you see that a type is a reference to
a structure
Creatively called ty s I don't know I guess then it's for type structure
And this this type structure is where the actual data is, right?
So basically we're passing around pointers to we're gonna see that these get interned like allocated in a special pool
I'll come back to that. We're passing around references or pointers to these strokes and this is the actual fields of the type
There's three things here
The one that matters most and that we'll spend most of our time on is the sty for structured type I guess
And the other two the flags and the outer exclusive binder
I don't know if we'll talk about those but they basically summarize they're kind of convenient hacks for efficiency
But summarize information about the type that we might like to know
So I might come back to it but most of the time when you work with a type in rust
You might have a a variable or a function
This
Most of the time
You will
little there writing code sort of like this that extracts out this sty field and
Matches on it and why do I say match? Because what this sty a field stores is something called a type kind and
This is kind if you're familiar with like
Haskell terminology and their functional programming that that's sort of not nomenclature. This is not that sort of kind
This is just the kinds of types that we have. That's what it means like the different sort sorts
so it's all the different variants there could be boolean, 's
Characters, you know, this should look kind of familiar too. These are like the rust
type system written out
Some of them might be a little surprising, right?
So boolean is character is integers
If you go ahead and click on int I you'll see that it's like all the different things that you might expect
Those are pretty obvious, but some of them are less obvious. So an ADT
that stands for abstracted or algebraic data types re oh and
you can see that it basically means a
Struct an enum or a Union all of those are represented as the same variant for us because they're kind of all
Variations on a theme it's basically a user defined type
In some sense and we'll come back to this the details of what's in here
But but this would represent a reference to a struck like back of you 32 or something. That would be an ADT
So for in
East corresponds to these external that are like experimental
Stir is the type stirred. So when you have ampersand stir for example, this is the stir of that
An array is this you kind of see that each case of the reston like where the rest syntax has a type?
There's a corresponding very into
Raw pointers one that's kind of interesting is ref. These stand for safe references
And it might be episode mute or neighbor sanity and they have some parts to them
this is the type of
The reference references this is the lifetime or region. We'll come back to that and immutability
Okay, i'm gonna stop going down
here because it's not that important but you get the idea that
You have all these variants that correspond to the different types in the rest language
Any questions on that so far?
Okay, so there's a whole family of like
Related types that are in my mind groups together
That kind of represent different parts of the semantics of the type and we kind of saw that already
There's stuff like you and tie in in tie
but
ADT death, we'll come back to that one sucks tref tie const
or region, so we'll see some of these and I kind of plan to talk a little bit about them, but
But they're all kind of parts of the type in the end of the day, um
So I mentioned this when we were talking about the definition of tie I
Said there was a lifetime
TCX
We'll get into more detail about what that is, but I just want to talk about where these types live and how they're handled
Right for a little bit
So types in Russy are allocated from a global memory pool
If you're if you're familiar with the term arena we use an arena and what it means is basically at the beginning of compilation
we make a buffer and
Each time we need to allocate a type
we kind of use some of that memory buffer and if we run out of space we get another one and
The lifetime of that buffer that's what this TC X is talking about
So the idea is that when we finish copulation, we're gonna take that buffer and just free the whole thing really fast
and therefore any references any types that we allocated from that memory buffer are
invalid so they're
They're tied to the lifetime of that buffer. And that's what this TC X is is basically telling us um, so that's called
Well that's called a rena allocation. And then we further
You look canonicalization step. So the idea is that
We don't just each time. You want to construct the type?
We don't just naively allocate from the buffer, but we look and see have you already constructed this type once before and if so
We'll give you the same pointer that that you had before and other times. Otherwise, we'll make a fresh pointer
and so that we're interning them and that means that actually if you want to know if two types are exactly the same and
They're allocated from this arena. All you have to do is compare the pointers
which is efficient, right and you can actually see that so the tie s
Struct it represents types is only ever allocated. We never can
Set up so that you never construct them just on the stack, right?
you always allocate them from this arena and you always intern them so that
They're unique and that means that we can define like partial EQ
This compare the pointers of two of them
Similarly the hash just hashes the pointer
So I'm not gonna at this moment dive in because it doesn't matter that much what
I'll probably come back to how this arena stuff is set up
But suffice to say that there is a struct called context in Turners and it has a lot of data
Right and one of the things it has is in arena. This is that buffer I was talking about
I'll get things from the buffer and that has a bunch of hash maps and these are how we
Make things unique, right and we want to in turn a title. For example
We look in the hash map to see is there
Already you have some tie s that represents the type and you look in the hash map to sees
Do we already have that a pointer to that exact is and if so, we're going to return it
Any questions on that so far
So the existing documentation mentioned that there are two types of arenas the global and innermost and
that the innermost is used or
Like local when you're inferring like a specific type
I assume that the global arena is allocated at the beginning of compilation and
The local arena is done for each type difference
Yeah, I was lighting that now it's gonna come to layer but might as well do it now. It's a good question. So I
met I talked about as if there was exactly one arena, but actually we have two we have many arenas during compilation then as
Occupants pointed so there is one global arena that kind of lives for the whole
Compilation and then when we're type checking or doing other things
on a specific function
You often make a lot of throwaway types
We'll see you later what I mean, but you end up with a lot of temporary types during type inference that are not
Really useful outside of that specific function
necessarily and so what we do is we create a temporary a local arena here and
Those types that are specific to type checking get allocated in here
and
types that are specific types that are kind of global Oh like you already do
get allocated here, right and
So when you pass around the TC x the TC X is the type context it's kind of the omnipresent
compilers state
you
When you pass around a TC exit it it is sometimes kind of in one of these local arenas and sometimes not
but
It well, it will kind of pick which of the arenas to use based on the type that you're in in turning them
So when you have a given type you'll say oh this one has some state that is local to entrance
I'll put it in the local arena or it doesn't and
We'll come back to that
All right, so
Let's talk about generics. Um, so imagine I define this generic struct my struct T
When you have a reference to this struct in rust
Like a variable whose type is my struct or whatever that reference never
Comes by itself
Let me back up and say one thing
Whenever
the compiler
Assigns these special IDs. We called F IDs and they're kind of assigned to everything that
has a definition
So in this example there would be
At least two def IDs actually more
But at least two all right
So we would have one def ID that is just the DEF idea of this struct definition as a whole
And we would have one def ID. For example for the type parameter T. We would also have one for the field
We would not have a def ID for this u32 here
That's because that's not a definition. That's a reference to the type u 32, but we're not defining to take you 32 here. Um
So I'm gonna use the term def ID a lot, but I wanted to kind of clarify what it is. It's basically an identifier
It's an integer
that
that
Identifies something that we define somewhere. Um,
It's an integer
It happens to map. We have an internal map
They can go from the DEF ID to what's called a def path. The DEF path is kind of what it sounds like
it's a path through the
It's basically like a module path
holding a little more rich, they might say like create Foom I struck and
identifies
this
Particular definition uniquely. Um, it's a little different than a model path. You can actually use in rust because you know, it
include like the type parameter T has a path like this and you could not I
Mean the type parameter T from rust and nonsense
The reason to have these pads these are used in incremental compilation. They kind of match up things between compilations
but
Doesn't matter too much basically for everything. We have an ID
So that's that's what the def idea of a struct is
But now when we have an actual type, like when we use my struct as the type, it's never by itself
It's not just my structure. It also has together with it a set of type parameters right the value
So in this basically the value for T
and if you look at the definition of a
DT
And we saw earlier you
Will see here this was kind of small
So you'll see that it has two parts it has an ADT death and a sub stress
So see
You still see my Dropbox paper here not only
Did some dragging so anyway
Here's the two parts actually
So what these two parts are the ADT def that's like algebraic a type definition
Basically specifies the struct but without the type parameters
It's essentially a def ID. There's a one to one relationship between these and DEF IDs, but what it actually is
Is this an intern struct?
Interned in the same sense as the types of interns are allocated in the global arena and
Here we have a reference to it you can the t CX lifetime is kind the tell-tale something has that lifetime. It's
It must be allocated in the arena because that's what that's for. Um
And it has some helper methods and some other things so when you have one of these struts you can
ask things like is this a
whatever, um a
Lot of annoying stuff. Um, let me scroll up actually. Oh, wait. What am I looking at? This is the wrong link
Okay, that link is wrong sorry what that ADT death does so I mentioned that here we're we were looking at us struct
But I mentioned at some point that the ADT type is used for structs enums am unions
So we kind of in the compiler have a sort of unified view of things
You can think of a struct as being a lot like a one variant email
You know that's just like an enum it has fields
it's just that there's only one possibility and so
The ADT deaf and cup lets you view all of those distinct things more uniformly. So it has a def ID
But then it has a list of variants and for our struct. This will always be of length one and for each one
within the variant it has
Some information about the variant like the variant has a def ideas will blah blah blah. What is its discriminant?
and then it has a list of fields and
These are basically the names each field has an ID and then it has it has a type that's not stored in this structure
That's a vector but so that's what they DT test is it lets it kind of gives you some information
And you can get them that's what that link is going to
You can get them you
There's a there's a way to construct an ADT death given a def ID this is a query i'm won't go into it
so
Okay, the sub stress. So what is that? So first of all people often have trouble with this that we should probably rename it. Okay
What substance stands for?
Substitutions and ref I guess is just because it's a reference and so what the substitutions are is it's basically a list of types
That are meant to be sub stitute 'add for the generic type parameters on a struct
So these are the replacements for these generic types
And actually it's not just types
Because it could be reached it could be lifetimes or regions. But for now, we'll just talk about
So in this case, it would be a list like you 32
um, and if you follow through this definition
You'll see it's got a certain amount of complexity. It's an internal sub switches an alias for a list
Of a kind a kind is either a type or a region?
defined in a weird way, but this list what is list
so a list is
It's basically a slice of data so this is a little bit fancy but what this really is
morally
is
this
Just say it's an arena allocated slice of types on
And the or actually a little more accurately
the cytokines
And what I mean by kinds is there either types of regions
So, right so it's a slice it has this the difference is we use this list
This kind of an for sanity TCX list
Kind this is kind of what it really is if you play it out and what that is
Let's see. Oh yes. This has to do with the pointer equality and so on that I mentioned earlier so the idea is
This is like a list of things that we allocated in the arena and
The difference between a list and a slice is that you a list is the full
list always whereas with a slice you can get sub slices and it matters because you might imagine you had like
One list like this and one list like this, okay, these could be two different lists
List a and this B
But if we and now if we want to compare them for equality
because we know that they're the complete list and
We we in turned it and hashed it and we have these unique pointers. We can actually compare the pointers for equality
We don't have to dive in and iterate over the contents
but if we had just slices I might take a sub slice of a I
May have a sub slice of a and the full list B and
I might want to compare them for equality and if I just compared the pointers, it would tell me that they're unequal
But actually they're equivalent. So
That's why we use this other type because it can't be sub sliced
which is a
Win because we can have more efficient
Pointer operations, but also a loss because we cancel
Which means that if we want to have a sub list you have to like allocated
So that's how you represent these these my strokes any questions about that so far I
Have slightly off-topic question
You mentioned that the compiler of ATT represents like a global view of
Is that reflected in the parts for grammar since then it distinguishes between them and then
Generates like this kind of structure or is it the other way around the grammar just it's okay. I hope after we do
So in rust grammar we treat those three things very differently
all right, and if you look at the here, this is another difference between here types and
Well, not quite but it's difference between the here and the later phases in the compiler, right the here is more like mmm
This is a struct definition. This is an enum definition there are distinctions
But then then we when we create the ADT death in this query that I talked about
it actually sort of
Makes a unified view of I look saying oh if it's a struct
Let me give it a single variant if it's an e or if it's an email
and the Union I think is
more
The other way that they're sort of I forget how unions are written
I think they have also a single great but you could imagine them being actually all variants of their own. I
think we have only a single variant but
Yeah, so that that translation happens
That's exactly a good example I think of the translation from syntax to the semantics I'm talking about
Okay, so I want to talk a bit about this a little more I talked about I said that these are the substitutions
If you're familiar with
like play the type systems that might be familiar to you, but if not, it's worth discussing so
the
We have a notion of sort of substituted and unsubstituted generics, so here I
Talked about
The type you 32 as the value for T but inside the definition of my struct I
Might reference T
Directly, right and when I'm inside this definition, I don't really know what T is I'd have to treat it like it's a placeholder
right for any type, so
We need a way just to talk about these these
Generic types that are not yet known and there is indeed a variant for that. So if you go to
This this list of variants called kind yep
one of them
Is called paren unless we changed its knee
Yes, no, we didn't do that and it represents like a none substituted type holder. Okay
type or a placeholder and
It has two things. It has an index and a name
The index is
Just the
Essentially its position in the list, right? So figure a and B
then
Anyone have index 0?
B we have index 1
And the name is obviously a B
and
Sometimes
That index can stretch across
definitions which is a little bit interesting so
That usually occurs
Right don't inside inside this method let's say
XY and z are all in scope
So what will happen is that exercise index 0?
Y has index 1 and Z has indexed two
even though it's the first one in this list, so
the list of when you
When you actually look at the generics of a particular item
Like the generic things that are generic parameters defined on a particular item like to this method
You'll see that it has a parent show you in a second. I'm sorry kind of inherits
It can inherit generics from its parent and then extend them further with new generic definitions. Um,
So that's how this works
and
Well, so when we're inside the definition will actually just work with these parameters types as if they were real types
Right. We'll treat them like any other type
but when we
come
Well when we want to pull something that was inside a definition
Out and use it from the outside we have to do what's called a substitution. So let me give an example
so imagine that we had this struct foo when it has a
Field of type Becker day
And then
Now the type
The type of this field is going to be an ADT of Veck
If you ask this that this field has a def ID, let me back up
Well, no, let me not do like a little the type of this field
I'll explain in a second how you would get that type?
Is but when we do get it, it's going to be stored as an ADT. That's because it's a reference
to a vector and
That's the ADT death is vector and then the list of substituted types
Is going to be the first parameter which corresponds to a right?
But now imagine that we were accessing that field
from
Well, actually even from here but let's let's make a separate example make a little here
Imagine we were
accessing we want to know what we're trying to figure out is what is the type of this expression food X and
If we just read the type of that field we would get
Sort of that
Directly and that doesn't make sense because this parameter isn't even we don't have any generic parameters in our current scope.
Namespacing violation, so what we want to do is we want to take
The type of foo, you see here. The type of foo is gonna be
this
Which is to say, it has a slice with u-32 as the substitution and we want to replace
The corresponding indices actually foo had two arguments. So let's add that in there. So
basically, we want to walk down this we want to get the type of the field like from here walk down and each place we
See a parameter take the index
index into that list of substitutions
And replace it. All right, so that would
substituting
Here would give us back with you 32, which is the correct type
And that
That transformation is called substituting and there's a substitute
method
Called sup, so
Let me I'll come back to how that actually happens in one second. Let me just talk about the types of fields
so what I wanted to mention, is that if
The field has a def ID
You can say you can use this type of query to say give me the type of this field and
That's how I would actually get this type and it's gonna that type of query is quite flexible
You can use it on any any def ID that has a type associated with it
so, for example, I could even add I could ask for what is the type of the struct and that would give me
It kind of gives me the like identity type of the struct that's just
By definition you just decided it's just convenient as it happens
that you can ask a struct for its type and you'll get back this identity sort of the internal view of
The declarations those week and so forth. Um
but one of the things you can ask for the type of is a field and in all cases when you do that you get
this view with using that is in terms of the generics that are in scope and then you have to translate it to
Your particular scope where you've got values for those generics done
So far following along
So this subs method let's talk about that let me find an actual call to it
Here's one, okay. This is like a totally random piece of code, but that's okay
So
So if we look at for example, oh
Okay, my checkout is a little out of date and we find the other place, okay sure
Actually, I'll do that. Yeah, let's do this once okay
Here's an example of doing these substitutions that I've been talking about
Let me put a link to this for a future reference
So
So what is happening here? So?
This is this is not two of what this code is actually doing is
converting as it happens from the here the syntax of the type to the
Semantic view of the type. So it's kind of doing this translation. That's not so important
but suffice to say it gets somehow a list of substitutions that
Are to be applied and then you can see it calls type of just like I said for a given def ID
And that's going to give us the self view and then it applies this sub stood
Applies those substitutions and that'll make that actually do the substitution
and now
What you might wonder is what is this? How does this subs method work? What is it defined on?
So
It turns out you want to be able to do these substitutions
For a whole bunch of things like you want to be able to apply them to a type
But you also might want to be able to apply them say to a struct with a bunch of types in it
And apply the substitution to all the types in this drug
A vector of types. It's kind of like a map
You want a sort of map operation where you can find all the types that appear inside of some
thing and the compiler and substitute them and change their view and
We have a we have a treat for that it's called type foldable
Even though this is sort of a map
We call it type foldable
Feels like the right name but what it means is it's any type that implements type foldable is basically something that embeds
Types or regions and it allows you to walk itself and translate them, right? Um, so
Let me jump back to my anything so this is the type foldable section so the idea is
There's actually two parts to the way type foldable words. There's something called a type folder and
The type folder is defines what you want to do to every type
It's like the closure that you might give to a map if you were using
My analogy is like
Vector dot error or dot map
So if we do this
We we walk over the vector and we apply something to every element this. This closure is kind of the folder
analogous to the folder
And this the definition of map is sort of analogous to the type fool
so
The folder has a few methods you can see here. Um
Too many there's kind of one for every core sort of thing. It's basically every kind of generic parameter
that rusts the language defines and
Some that it doesn't defined yet. So
There there are types
regions, which is another name for a lifetime and
Constants for when we support constant arcs
So what's going to happen and binders? I'm going to ignore for the moment
but they're
there
There another place that you get to intercept
so what's going to happen is that when you have a type foldable, it's going to walk it self and invoke the meth and
Sort of recursively apply
until
Recursively fold until it gets down to us to a type or a region or a custom and then invoke the type folder to do
some processing
so in the case of substitution
This is oops wrong in the case of substitution
That just looks like the place I want to click
the actual folder
Is just going to be doing that indexing that I talked about you can actually see it here. So we define the folder here
It's a struct. It's called a sub stoller we
we call it a fold width which means process might basically the map operation process myself and
And invoke the folder methods as appropriate and if you skim down to like fold tie this is the method that
That process is each title. You see that it looks
It says AHA. This is a parameter type
In that case I'm going to replace it with something from the list of substitutions and
Otherwise, I'm going to recursively
Process the typo, so I'll come back to this in a second. Um
but
The replacing it. This is calling this tie for per a method and all that does
is
to
Basically index into the list of substitutions with the index of the parameter
The rest of this stuff is basically all error recovery so that in case something goes wrong
We get a nice message that can help us figure out what the heck happened. Um
But
Effectively
Through morally what's happening is something like
Match
It's a parameter in Dex and replace it with stuffs to be Dex, um
the
So, let me come back to this now but then
Look, let's so what is this super fold with and what's happening here? So
So when you define a type foldable
This is what a typical type foldable might look like and actually there's a shorthand that we can use to sort of derive it
So likes imagine I have a struct it has a def idea of something and of type in it
And I want to make it tight foldable and that would mean that if I had a my struct
Instance I would be able to do my struct ops for example and apply a substitution. I
There's a whole bunch of stuff and I can find out it just works on any type foldable thing
So it would be compatible with all that. Um
What I really do is I just define actually there's two methods I left off one of them
I defined this Super fold with and we're kind of
Emulating an oo set up to certain extent. So there's a fold with the
Actual trait has a fold width method and the default thing that it does
I'm not mistaken is to call super fold with immediately. Um
and so
You're normally you're just defined super fold with but you don't normally invoke it most of the time and what it was super fold ith
Will do is recursively
Descend through your fields and process
And recursively process them. So this this split gives you some ability to say like, maybe I want to do
Something at the struct level like maybe I can replace the entire struct without substituting its fields individually in which case
That's what fold with
The top-level method would do but otherwise the Super fold with says no
I just want to replace I want to go and replace my fields
But the structure I just want to build back up from the replaced version of each field and then for almost all types
These are the same because you don't want to intercept at the top level the main difference
The only real case where we use the super
Is types and regions and basically the things that the folder itself operates on
Because now the folder gets a chance to intercept and replaced the type as a whole
as in the case of substitutions or
as we also saw in substations
It doesn't want to replace the type as a whole they can go to send into the type and replace its little pieces
So an example by calling super fold with an example where it might want to do. That would be like
if I had
Well if I had a type like
Backpack of X
This would be like a DT
effect
VDP Beck
Koream X. Let's say whatever the index of X is and
so now
When I substitute I have this is actually my entire type
And there is no substitution to happen here, but I want to recursively look at this inner type still no substitution
Recursively. Look at this inner type ok the minister
I'm gonna replace this one with you 32 or whatever and then I'm gonna build the rest around it
so that I wind up with
this
And that's what's going to happen when I call super
One last thing I'll mention so if we look in the
Structural impulse
Is this I
Was so this this this file structural imposed on our risk happens to contain a
lot of type foldable definitions so you can kind of see how they look um,
Sometimes like this one ADT def. This is actually interesting example, you can see that fold with doesn't do anything at all
It's just the identity function. And the reason for that is
essentially if the intuition you should think of is
If I were substituting things
To go from the self view to the outside view what I want to replace
Types that appear inside of here or not and an ADT def is basically just the name
Like we said that logically it represents the name of the struct
Like Veck and you never change that when you substituting but the vac is always affect
Um, it's only these so that's why it doesn't get changed as you fold it
um, then we have some things like this will fold a tuple of other foldable things and it just recursively
Recurse is down. Um and these macros
These are what I wanted to refer to make to highlight
So for technical crappy reasons, we can't use derive in the compiler itself yet
This is because of the bootstrapping cycle we are I think actually maybe close to solving that. I'm not sure but
So we end up writing these
macro, rules definitions instead they are sort of like derive and
This is one that handles
the
pain of implementing type foldable for some kind of enum
So in this cookie
Right, even though I'm type foldable and then you can list out the variants and it's gonna generate the glue code
That's like match on self. If it's a Sun recursively Boston all that stuff. Um and one annoying thing
Is that often? We don't get all the edge cases right when we write these macro rules because we're lazy
so like enums work for
Parenthesized lists of fields, but they might not work for named items with main fields. And so sometimes you'll see manual impulse
that don't seem like it seems like you should be able to derive it, but you can't because
It just doesn't quite fit but the macro is made to do and that's annoying. But here's a case for like a brace struct
So this happening is a struct with three fields. I can read brace truck code foldable
I don't have to write all the crew code. I just have to list out the fields. Um
copy these links
It would be really nice like definitely we've long wanted to be able to apply derived from just
Just get rid of these done
Get the idea now what one other one I'll mention is
Okay, so all these types I mentioned that if there is if nothing needs to happen during substitution if you just want to copy it
over
That's an easy case and all of these types are examples where there's really no self substitution to be done
That's why this clone thing just says just clone it. It's all you gotta do
Where you covered this, all right, so we're running out of time I will
Let's take a vote
Should I try to talk about infants in the two levels of the arena table or is that too much?
And you should leave it for another time
If you think it's
One is you mentioned
handling for substitution
The obvious case I can think of is trying to substitute something with a list and you have like an index out of bounds
Situation other than that, is there any other failure for substitution? Yeah there
There could be you
Could pass a type where a region was expected or vice versa?
And usually that would be a compiler programmer error
Well, yes always so it's possible, I mean it might
It might be that the user wrote something wrong. Like they might have written
They might have written like back of today or something and that would be just wrong
But what should have happened is that we should have intercepted that earlier when we were translating from syntax to semantics and
Such that it made sense, and we actually have a special type called error. For example
that is would be used in situations like this where it's like I
There was a bug they usually did something dumb and I'm just putting this in them and the idea for that is that then?
You should suppress
downstream yours like if you see an error, you don't have to report you can just pretend it was everything was good because
But right so that should be handled earlier. So if you see it at this late stage then somebody mixed up something that's
And the second small question was you mentioned several times of the Selphy versus the outside view p-please clarify what you meant
Yeah, that's kind of my intuitive name for it
but what I met was self use I
mean like
inside the struct definition for example, so it's basically the
When when the generics are in scope and you have to treat them as placeholders?
That's what I mean by self you and then the outside view would be
when well
For example here when I'm reaching in together the type of the field, but I'm not the generics are not in scope now
That our generics on that type are not in school
so I should be substituting them and there's actually a little bit of a like the Impala is an interesting case because
It's an outside view
From the point of view of the fields of the struct actually
But an inside view from these generics here, right? It's why I give them different letters to emphasize that indeed
Although there is a parameter with index zero in scope in both places. It's logically a distinct
type and so a
common
Failure is to forget to do substitution
And if you do that
Sometimes they might go unnoticed for a while because you just happen to have the same set of things in scope
And it's only when you're writing more complex examples that you realize you've got something wrong
All right, I think it's a good place to stop we won't cover we'll get to the infant sir another time
And parting questions in
Thank You Nico I
Was you find something?
Could you clarify um when you're talking about the type foldable and pulls and he said we treat abt deaths
completely opaquely
So when I'm confused by is okay, if that were a struct. Why don't we recursing to all of its fields?
So the ATT def two reasons, it's a good question
the answer is
Because basically because
You don't
you
Frankly cut into this. There's like a couple of different directions to answer it
one way to view it is because we don't and what we do instead is when you extract the type of the field you
You substitute it then
alright
so I guess that there will be two possible options you could you could say that the ADT death is like a structural description of
The field of the fields invariants and so in that case, it's not just a name of the struct
It's like more like here's the data of the struct and you would want to substitute it then because it should represent
the view but what we actually say is that it's really just the name and
That so it goes it never changes the types in there are always with the consistent
view of being inside
They always have the self view
So to speak and that the you just that you have to know that and know that when you extract them out
They will be you need to apply substitution. Um, there's a sort of deeper
Reason for that that there's this term nominal and structural type systems. They're like
where this is a nominal
type system which means basically that exactly this basically that you pass around
You reference trucks by name and not two strokes that have different names. Even if they have the same fields are distinct strokes.
and so
When you take that approach here, generally you would not do the substitution on the name itself instead you will
I guess one way to think of it is you could think of it as just efficiency also
Right, like the only thing that can change
inside a Veck is
The type parameters defined on the Veck, right like if we're substituting if we have some effective
Back of u-32 and it has all or you if a vector type and it has a bunch of references to tea all throughout
Let's say a whole bunch of fields. I mean, let me make them work. Tying it to vectors may be confusing
So imagine I have like a struct my struct right and it has a tee and I have hundreds of fields
Each of which is like Veck of tea or something, right?
If I were to apply the substitution deeply I would have to replace the T in all of those fields eagerly every time
But it but if I do it lazily
Then I keep my struck the same and I just substitute once the value like I have a reference somewhere
To my struct of a
so some other
generic a and I substitute that to my structure be
I'm only changing this one type once right and it's only when I actually pull the field out that I that I would
Have to do any work. Um, there's kind of the only thing that can change between these is is all summarized right there
```