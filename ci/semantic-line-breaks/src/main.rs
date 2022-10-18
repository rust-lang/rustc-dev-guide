use std::{env, fs, process};

use anyhow::Result;
use ignore::Walk;
use regex::Regex;

fn main() -> Result<()> {
    let mut args = env::args();
    if args.len() == 1 {
        eprintln!("error: expected root Markdown directory as CLI argument");
        process::exit(1);
    }
    let root_dir = args.nth(1).unwrap();
    for result in Walk::new(root_dir) {
        let entry = result?;
        if entry.file_type().expect("no stdin").is_dir() {
            continue;
        }
        let path = entry.path();
        if let Some(extension) = path.extension() {
            if extension != "md" {
                continue;
            }
        } else {
            continue;
        }
        let old = fs::read_to_string(path)?;
        let new = comply(&old)?;
        if new != old {
            fs::write(path, new)?;
        }
    }
    Ok(())
}

fn comply(content: &str) -> Result<String> {
    let content: Vec<_> = content.lines().map(|line| line.to_owned()).collect();
    let mut new_content = content.clone();
    let mut new_n = 0;
    let mut in_code_block = false;
    let split_re = Regex::new(r"(\.|\?|;|!)\s+")?;
    let ignore_re = Regex::new(r"(\d\.|\-|\*|r\?)\s+")?;
    for (n, line) in content.iter().enumerate() {
        if n != 0 {
            new_n += 1;
        }
        if ignore_re.is_match(line) {
            continue;
        }
        // headings
        if line.starts_with('#') {
            continue;
        }
        let line = line.trim_end();
        if line.is_empty() {
            continue;
        }
        // not eol
        if line.contains("e.g.") {
            continue;
        }
        // not eol
        if line.contains("i.e.") {
            continue;
        }
        // tables
        if line.contains(" | ") {
            continue;
        }
        // code blocks
        if line.starts_with("```") {
            if in_code_block {
                in_code_block = false;
            } else {
                in_code_block = true;
                continue;
            }
        }
        if in_code_block {
            continue;
        }
        if split_re.is_match(line) {
            let indent = line.find(|ch: char| !ch.is_whitespace()).unwrap();
            let new_lines: Vec<_> = line
                .split_inclusive(&split_re)
                .map(|portion| format!("{:indent$}{}", "", portion.trim()))
                .collect();
            new_content.splice(new_n..new_n + 1, new_lines.clone());
            new_n += new_lines.len() - 1;
        }
    }
    Ok(new_content.join("\n") + "\n")
}

#[test]
fn test() {
    let original = "\
# some heading

must! be; split? now.
1. ignore numbered
ignore | tables
ignore e.g. and i.e. for realsies
```
some code. block
```
some more text.
";
    let reformatted = "\
# some heading

must!
be;
split?
now.
1. ignore numbered
ignore | tables
ignore e.g. and i.e. for realsies
```
some code. block
```
some more text.
";
    assert_eq!(comply(original).unwrap(), reformatted);
}
