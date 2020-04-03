# Part 3: Source Code Representations

This part of the guide looks at the various ways the compiler transforms and
represents source code. This part describes the process of taking raw source
code from the user and transforming it into various forms that the compiler can
work with easily. These are called intermediate representations.

This process starts with compiler understanding what the user has asked for:
parsing the command line arguments given and determining what it is to compile.
