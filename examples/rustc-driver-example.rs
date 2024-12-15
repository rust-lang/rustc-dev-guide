#![feature(rustc_private)]

extern crate rustc_ast_pretty;
extern crate rustc_driver;
extern crate rustc_error_codes;
extern crate rustc_errors;
extern crate rustc_hash;
extern crate rustc_hir;
extern crate rustc_interface;
extern crate rustc_session;
extern crate rustc_span;

use std::io;
use std::path::Path;
use std::str;
use std::sync::Arc;

use rustc_ast_pretty::pprust::item_to_string;
use rustc_data_structures::sync::Lrc;
use rustc_driver::Compilation;
use rustc_errors::registry;
use rustc_session::config;

struct MyFileLoader;

impl rustc_span::source_map::FileLoader for MyFileLoader {
    fn file_exists(&self, path: &Path) -> bool {
        path == "main.rs"
    }

    fn read_file(&self, path: &Path) -> io::Result<String> {
        if path == "main.rs" {
            Ok(r#"
fn main() {
    let message = "Hello, World!";
    println!("{message}");
}
"#
            .to_string())
        } else {
            Err(io::Error::other("oops"))
        }
    }

    fn read_binary_file(&self, path: &Path) -> io::Result<Lrc<[u8]>> {
        Err(io::Error::other("oops"))
    }
}

struct MyCallbacks;

impl rustc_driver::Callbacks for MyCallbacks {
    fn after_crate_root_parsing(
        _compiler: &rustc_interface::Compiler,
        krate: &rustc_ast::Crate,
    ) -> Compilation {
        for item in krate.items {
            println!("{}", item_to_string(&item));
        }

        Compilation::Continue
    }

    fn after_analysis(_compiler: &rustc_interface::Compiler, tcx: TyCtxt<'_>) -> Compilation {
        // Analyze the program and inspect the types of definitions.
        for id in tcx.hir().items() {
            let hir = tcx.hir();
            let item = hir.item(id);
            match item.kind {
                rustc_hir::ItemKind::Static(_, _, _) | rustc_hir::ItemKind::Fn(_, _, _) => {
                    let name = item.ident;
                    let ty = tcx.type_of(item.hir_id().owner.def_id);
                    println!("{name:?}:\t{ty:?}")
                }
                _ => (),
            }
        }

        Compilation::Stop
    }
}

fn main() {
    RunCompiler::new(&["main.rs".to_string()], MyCallbacks)
        .set_file_loader(Some(Box::new(MyFileLoader)))
        .run();
}
