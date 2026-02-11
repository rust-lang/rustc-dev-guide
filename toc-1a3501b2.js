// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="getting-started.html">Getting Started</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="about-this-guide.html">About this guide</a></span></li><li class="chapter-item "><li class="spacer"></li></li><li class="chapter-item "><li class="part-title">Building and debugging rustc</li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/how-to-build-and-run.html"><strong aria-hidden="true">1.</strong> How to build and run the compiler</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/quickstart.html"><strong aria-hidden="true">1.1.</strong> Quickstart</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/prerequisites.html"><strong aria-hidden="true">1.2.</strong> Prerequisites</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/suggested.html"><strong aria-hidden="true">1.3.</strong> Suggested workflows</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/build-install-distribution-artifacts.html"><strong aria-hidden="true">1.4.</strong> Distribution artifacts</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/compiler-documenting.html"><strong aria-hidden="true">1.5.</strong> Building documentation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustdoc.html"><strong aria-hidden="true">1.6.</strong> Rustdoc overview</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/new-target.html"><strong aria-hidden="true">1.7.</strong> Adding a new target</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/optimized-build.html"><strong aria-hidden="true">1.8.</strong> Optimized build</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/intro.html"><strong aria-hidden="true">2.</strong> Testing the compiler</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/running.html"><strong aria-hidden="true">2.1.</strong> Running tests</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/docker.html"><strong aria-hidden="true">2.1.1.</strong> Testing with Docker</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/ci.html"><strong aria-hidden="true">2.1.2.</strong> Testing with CI</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/adding.html"><strong aria-hidden="true">2.2.</strong> Adding new tests</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/best-practices.html"><strong aria-hidden="true">2.3.</strong> Best practices</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/compiletest.html"><strong aria-hidden="true">2.4.</strong> Compiletest</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/ui.html"><strong aria-hidden="true">2.4.1.</strong> UI tests</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/directives.html"><strong aria-hidden="true">2.4.2.</strong> Test directives</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/minicore.html"><strong aria-hidden="true">2.4.3.</strong> Minicore</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/ecosystem.html"><strong aria-hidden="true">2.5.</strong> Ecosystem testing</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/crater.html"><strong aria-hidden="true">2.5.1.</strong> Crater</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/ecosystem-test-jobs/fuchsia.html"><strong aria-hidden="true">2.5.2.</strong> Fuchsia</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/ecosystem-test-jobs/rust-for-linux.html"><strong aria-hidden="true">2.5.3.</strong> Rust for Linux</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/codegen-backend-tests/intro.html"><strong aria-hidden="true">2.6.</strong> Codegen backend testing</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/codegen-backend-tests/cg_clif.html"><strong aria-hidden="true">2.6.1.</strong> Cranelift codegen backend</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/codegen-backend-tests/cg_gcc.html"><strong aria-hidden="true">2.6.2.</strong> GCC codegen backend</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/perf.html"><strong aria-hidden="true">2.7.</strong> Performance testing</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tests/misc.html"><strong aria-hidden="true">2.8.</strong> Misc info</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="compiler-debugging.html"><strong aria-hidden="true">3.</strong> Debugging the compiler</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="tracing.html"><strong aria-hidden="true">3.1.</strong> Using the tracing/logging instrumentation</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="profiling.html"><strong aria-hidden="true">4.</strong> Profiling the compiler</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="profiling/with-perf.html"><strong aria-hidden="true">4.1.</strong> with the linux perf tool</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="profiling/wpa-profiling.html"><strong aria-hidden="true">4.2.</strong> with Windows Performance Analyzer</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="profiling/with-rustc-perf.html"><strong aria-hidden="true">4.3.</strong> with the Rust benchmark suite</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="crates-io.html"><strong aria-hidden="true">5.</strong> crates.io dependencies</a></span></li><li class="chapter-item "><li class="part-title">Contributing to Rust</li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="contributing.html"><strong aria-hidden="true">6.</strong> Contribution procedures</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="compiler-team.html"><strong aria-hidden="true">7.</strong> About the compiler team</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="git.html"><strong aria-hidden="true">8.</strong> Using Git</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustbot.html"><strong aria-hidden="true">9.</strong> Mastering @rustbot</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="walkthrough.html"><strong aria-hidden="true">10.</strong> Walkthrough: a typical contribution</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="implementing-new-features.html"><strong aria-hidden="true">11.</strong> Implementing new language features</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="stability-guarantees.html"><strong aria-hidden="true">12.</strong> Stability guarantees</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="stability.html"><strong aria-hidden="true">13.</strong> Stability attributes</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="stabilization-guide.html"><strong aria-hidden="true">14.</strong> Stabilizing language features</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="stabilization-report-template.html"><strong aria-hidden="true">14.1.</strong> Stabilization report template</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="feature-gates.html"><strong aria-hidden="true">15.</strong> Feature Gates</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="conventions.html"><strong aria-hidden="true">16.</strong> Coding conventions</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="bug-fix-procedure.html"><strong aria-hidden="true">17.</strong> Procedures for breaking changes</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="external-repos.html"><strong aria-hidden="true">18.</strong> Using external repositories</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="fuzzing.html"><strong aria-hidden="true">19.</strong> Fuzzing</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/about.html"><strong aria-hidden="true">20.</strong> Notification groups</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/apple.html"><strong aria-hidden="true">20.1.</strong> Apple</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/arm.html"><strong aria-hidden="true">20.2.</strong> ARM</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/emscripten.html"><strong aria-hidden="true">20.3.</strong> Emscripten</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/fuchsia.html"><strong aria-hidden="true">20.4.</strong> Fuchsia</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/loongarch.html"><strong aria-hidden="true">20.5.</strong> LoongArch</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/risc-v.html"><strong aria-hidden="true">20.6.</strong> RISC-V</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/rust-for-linux.html"><strong aria-hidden="true">20.7.</strong> Rust for Linux</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/wasi.html"><strong aria-hidden="true">20.8.</strong> WASI</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/wasm.html"><strong aria-hidden="true">20.9.</strong> WebAssembly</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="notification-groups/windows.html"><strong aria-hidden="true">20.10.</strong> Windows</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="licenses.html"><strong aria-hidden="true">21.</strong> Licenses</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="guides/editions.html"><strong aria-hidden="true">22.</strong> Editions</a></span></li><li class="chapter-item "><li class="part-title">Bootstrapping</li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/bootstrapping/intro.html"><strong aria-hidden="true">23.</strong> Prologue</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/bootstrapping/what-bootstrapping-does.html"><strong aria-hidden="true">24.</strong> What Bootstrapping does</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/bootstrapping/how-bootstrap-does-it.html"><strong aria-hidden="true">25.</strong> How Bootstrap does it</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/bootstrapping/writing-tools-in-bootstrap.html"><strong aria-hidden="true">26.</strong> Writing tools in Bootstrap</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/bootstrapping/debugging-bootstrap.html"><strong aria-hidden="true">27.</strong> Debugging bootstrap</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="building/bootstrapping/bootstrap-in-dependencies.html"><strong aria-hidden="true">28.</strong> cfg(bootstrap) in dependencies</a></span></li><li class="chapter-item "><li class="part-title">High-level Compiler Architecture</li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="part-2-intro.html"><strong aria-hidden="true">29.</strong> Prologue</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="overview.html"><strong aria-hidden="true">30.</strong> Overview of the compiler</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="compiler-src.html"><strong aria-hidden="true">31.</strong> The compiler source code</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="query.html"><strong aria-hidden="true">32.</strong> Queries: demand-driven compilation</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="queries/query-evaluation-model-in-detail.html"><strong aria-hidden="true">32.1.</strong> The Query Evaluation Model in detail</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="queries/incremental-compilation.html"><strong aria-hidden="true">32.2.</strong> Incremental compilation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="queries/incremental-compilation-in-detail.html"><strong aria-hidden="true">32.3.</strong> Incremental compilation in detail</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="incrcomp-debugging.html"><strong aria-hidden="true">32.4.</strong> Debugging and testing</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="queries/salsa.html"><strong aria-hidden="true">32.5.</strong> Salsa</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="memory.html"><strong aria-hidden="true">33.</strong> Memory management in rustc</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="serialization.html"><strong aria-hidden="true">34.</strong> Serialization in rustc</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="parallel-rustc.html"><strong aria-hidden="true">35.</strong> Parallel compilation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustdoc-internals.html"><strong aria-hidden="true">36.</strong> Rustdoc internals</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustdoc-internals/search.html"><strong aria-hidden="true">36.1.</strong> Search</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustdoc-internals/rustdoc-html-test-suite.html"><strong aria-hidden="true">36.2.</strong> The rustdoc-html test suite</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustdoc-internals/rustdoc-gui-test-suite.html"><strong aria-hidden="true">36.3.</strong> The rustdoc-gui test suite</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustdoc-internals/rustdoc-json-test-suite.html"><strong aria-hidden="true">36.4.</strong> The rustdoc-json test suite</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="offload/internals.html"><strong aria-hidden="true">37.</strong> GPU offload internals</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="offload/installation.html"><strong aria-hidden="true">37.1.</strong> Installation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="offload/usage.html"><strong aria-hidden="true">37.2.</strong> Usage</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="offload/contributing.html"><strong aria-hidden="true">37.3.</strong> Contributing</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="autodiff/internals.html"><strong aria-hidden="true">38.</strong> Autodiff internals</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="autodiff/installation.html"><strong aria-hidden="true">38.1.</strong> Installation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="autodiff/debugging.html"><strong aria-hidden="true">38.2.</strong> How to debug</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="autodiff/flags.html"><strong aria-hidden="true">38.3.</strong> Autodiff flags</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="autodiff/type-trees.html"><strong aria-hidden="true">38.4.</strong> Type Trees</a></span></li></ol><li class="chapter-item "><li class="part-title">Source Code Representation</li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="part-3-intro.html"><strong aria-hidden="true">39.</strong> Prologue</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="syntax-intro.html"><strong aria-hidden="true">40.</strong> Syntax and the AST</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="the-parser.html"><strong aria-hidden="true">40.1.</strong> Lexing and parsing</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="macro-expansion.html"><strong aria-hidden="true">40.2.</strong> Macro expansion</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="name-resolution.html"><strong aria-hidden="true">40.3.</strong> Name resolution</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="attributes.html"><strong aria-hidden="true">40.4.</strong> Attributes</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="test-implementation.html"><strong aria-hidden="true">40.5.</strong> #[test] implementation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="panic-implementation.html"><strong aria-hidden="true">40.6.</strong> Panic implementation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ast-validation.html"><strong aria-hidden="true">40.7.</strong> AST validation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="feature-gate-check.html"><strong aria-hidden="true">40.8.</strong> Feature gate checking</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="lang-items.html"><strong aria-hidden="true">40.9.</strong> Lang Items</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="hir.html"><strong aria-hidden="true">41.</strong> The HIR (High-level IR)</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="hir/lowering.html"><strong aria-hidden="true">41.1.</strong> Lowering AST to HIR</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="hir/debugging.html"><strong aria-hidden="true">41.2.</strong> Debugging</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ambig-unambig-ty-and-consts.html"><strong aria-hidden="true">42.</strong> Ambig/Unambig Types and Consts</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="thir.html"><strong aria-hidden="true">43.</strong> The THIR (Typed High-level IR)</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="mir/index.html"><strong aria-hidden="true">44.</strong> The MIR (Mid-level IR)</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="mir/construction.html"><strong aria-hidden="true">44.1.</strong> MIR construction</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="mir/visitor.html"><strong aria-hidden="true">44.2.</strong> MIR visitor and traversal</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="mir/passes.html"><strong aria-hidden="true">44.3.</strong> MIR queries and passes: getting the MIR</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="asm.html"><strong aria-hidden="true">45.</strong> Inline assembly</a></span></li><li class="chapter-item "><li class="part-title">Supporting Infrastructure</li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="cli.html"><strong aria-hidden="true">46.</strong> Command-line arguments</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustc-driver/intro.html"><strong aria-hidden="true">47.</strong> rustc_driver and rustc_interface</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustc-driver/external-rustc-drivers.html"><strong aria-hidden="true">47.1.</strong> External rustc_drivers</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustc-driver/interacting-with-the-ast.html"><strong aria-hidden="true">47.2.</strong> Example: Type checking</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="rustc-driver/getting-diagnostics.html"><strong aria-hidden="true">47.3.</strong> Example: Getting diagnostics</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="diagnostics.html"><strong aria-hidden="true">48.</strong> Errors and lints</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="diagnostics/diagnostic-structs.html"><strong aria-hidden="true">48.1.</strong> Diagnostic and subdiagnostic structs</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="diagnostics/translation.html"><strong aria-hidden="true">48.2.</strong> Translation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="diagnostics/lintstore.html"><strong aria-hidden="true">48.3.</strong> LintStore</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="diagnostics/error-codes.html"><strong aria-hidden="true">48.4.</strong> Error codes</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="diagnostics/diagnostic-items.html"><strong aria-hidden="true">48.5.</strong> Diagnostic items</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="diagnostics/error-guaranteed.html"><strong aria-hidden="true">48.6.</strong> ErrorGuaranteed</a></span></li></ol><li class="chapter-item "><li class="part-title">Analysis</li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="part-4-intro.html"><strong aria-hidden="true">49.</strong> Prologue</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="generic-parameters-summary.html"><strong aria-hidden="true">50.</strong> Generic parameter definitions</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ty-module/early-binder.html"><strong aria-hidden="true">50.1.</strong> EarlyBinder and instantiating parameters</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ty-module/binders.html"><strong aria-hidden="true">51.</strong> Binders and Higher ranked regions</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ty-module/instantiating-binders.html"><strong aria-hidden="true">51.1.</strong> Instantiating binders</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="early-late-parameters.html"><strong aria-hidden="true">52.</strong> Early vs Late bound parameters</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ty.html"><strong aria-hidden="true">53.</strong> The ty module: representing types</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ty-module/generic-arguments.html"><strong aria-hidden="true">53.1.</strong> ADTs and Generic Arguments</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ty-module/param-ty-const-regions.html"><strong aria-hidden="true">53.2.</strong> Parameter types/consts/regions</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="ty-fold.html"><strong aria-hidden="true">54.</strong> TypeFolder and TypeFoldable</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="normalization.html"><strong aria-hidden="true">55.</strong> Aliases and Normalization</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="typing-parameter-envs.html"><strong aria-hidden="true">56.</strong> Typing/Param Envs</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="type-inference.html"><strong aria-hidden="true">57.</strong> Type inference</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/resolution.html"><strong aria-hidden="true">58.</strong> Trait solving</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/hrtb.html"><strong aria-hidden="true">58.1.</strong> Higher-ranked trait bounds</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/caching.html"><strong aria-hidden="true">58.2.</strong> Caching subtleties</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/implied-bounds.html"><strong aria-hidden="true">58.3.</strong> Implied bounds</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/specialization.html"><strong aria-hidden="true">58.4.</strong> Specialization</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/chalk.html"><strong aria-hidden="true">58.5.</strong> Chalk-based trait solving</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/lowering-to-logic.html"><strong aria-hidden="true">58.5.1.</strong> Lowering to logic</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/goals-and-clauses.html"><strong aria-hidden="true">58.5.2.</strong> Goals and clauses</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/canonical-queries.html"><strong aria-hidden="true">58.5.3.</strong> Canonical queries</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/canonicalization.html"><strong aria-hidden="true">58.5.4.</strong> Canonicalization</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/trait-solving.html"><strong aria-hidden="true">58.6.</strong> Next-gen trait solving</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/invariants.html"><strong aria-hidden="true">58.6.1.</strong> Invariants of the type system</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/the-solver.html"><strong aria-hidden="true">58.6.2.</strong> The solver</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/candidate-preference.html"><strong aria-hidden="true">58.6.3.</strong> Candidate preference</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/canonicalization.html"><strong aria-hidden="true">58.6.4.</strong> Canonicalization</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/coinduction.html"><strong aria-hidden="true">58.6.5.</strong> Coinduction</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/caching.html"><strong aria-hidden="true">58.6.6.</strong> Caching</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/proof-trees.html"><strong aria-hidden="true">58.6.7.</strong> Proof trees</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/opaque-types.html"><strong aria-hidden="true">58.6.8.</strong> Opaque types</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/significant-changes.html"><strong aria-hidden="true">58.6.9.</strong> Significant changes and quirks</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="solve/sharing-crates-with-rust-analyzer.html"><strong aria-hidden="true">58.6.10.</strong> Sharing the trait solver with rust-analyzer</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="traits/unsize.html"><strong aria-hidden="true">58.7.</strong> Unsize and CoerceUnsized traits</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="variance.html"><strong aria-hidden="true">59.</strong> Variance</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="coherence.html"><strong aria-hidden="true">60.</strong> Coherence checking</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="hir-typeck/summary.html"><strong aria-hidden="true">61.</strong> HIR Type checking</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="hir-typeck/coercions.html"><strong aria-hidden="true">61.1.</strong> Coercions</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="hir-typeck/method-lookup.html"><strong aria-hidden="true">61.2.</strong> Method lookup</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="const-generics.html"><strong aria-hidden="true">62.</strong> Const Generics</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="opaque-types-type-alias-impl-trait.html"><strong aria-hidden="true">63.</strong> Opaque types</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="opaque-types-impl-trait-inference.html"><strong aria-hidden="true">63.1.</strong> Inference details</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="return-position-impl-trait-in-trait.html"><strong aria-hidden="true">63.2.</strong> Return Position Impl Trait In Trait</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/opaque-types-region-inference-restrictions.html"><strong aria-hidden="true">63.3.</strong> Region inference restrictions</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="effects.html"><strong aria-hidden="true">64.</strong> Const traits and const condition checking</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="pat-exhaustive-checking.html"><strong aria-hidden="true">65.</strong> Pattern and exhaustiveness checking</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="unsafety-checking.html"><strong aria-hidden="true">66.</strong> Unsafety checking</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="mir/dataflow.html"><strong aria-hidden="true">67.</strong> MIR dataflow</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="mir/drop-elaboration.html"><strong aria-hidden="true">68.</strong> Drop elaboration</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check.html"><strong aria-hidden="true">69.</strong> The borrow checker</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/moves-and-initialization.html"><strong aria-hidden="true">69.1.</strong> Tracking moves and initialization</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/moves-and-initialization/move-paths.html"><strong aria-hidden="true">69.1.1.</strong> Move paths</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/type-check.html"><strong aria-hidden="true">69.2.</strong> MIR type checker</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/drop-check.html"><strong aria-hidden="true">69.3.</strong> Drop check</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/region-inference.html"><strong aria-hidden="true">69.4.</strong> Region inference</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/region-inference/constraint-propagation.html"><strong aria-hidden="true">69.4.1.</strong> Constraint propagation</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/region-inference/lifetime-parameters.html"><strong aria-hidden="true">69.4.2.</strong> Lifetime parameters</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/region-inference/member-constraints.html"><strong aria-hidden="true">69.4.3.</strong> Member constraints</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/region-inference/placeholders-and-universes.html"><strong aria-hidden="true">69.4.4.</strong> Placeholders and universes</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/region-inference/closure-constraints.html"><strong aria-hidden="true">69.4.5.</strong> Closure constraints</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/region-inference/error-reporting.html"><strong aria-hidden="true">69.4.6.</strong> Error reporting</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="borrow-check/two-phase-borrows.html"><strong aria-hidden="true">69.5.</strong> Two-phase-borrows</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="closure.html"><strong aria-hidden="true">70.</strong> Closure capture inference</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="coroutine-closures.html"><strong aria-hidden="true">71.</strong> Async closures/&quot;coroutine-closures&quot;</a></span></li><li class="chapter-item "><li class="part-title">MIR to binaries</li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="part-5-intro.html"><strong aria-hidden="true">72.</strong> Prologue</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="mir/optimizations.html"><strong aria-hidden="true">73.</strong> MIR optimizations</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="mir/debugging.html"><strong aria-hidden="true">74.</strong> Debugging MIR</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="const-eval.html"><strong aria-hidden="true">75.</strong> Constant evaluation</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="const-eval/interpret.html"><strong aria-hidden="true">75.1.</strong> Interpreter</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="backend/monomorph.html"><strong aria-hidden="true">76.</strong> Monomorphization</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="backend/lowering-mir.html"><strong aria-hidden="true">77.</strong> Lowering MIR</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="backend/codegen.html"><strong aria-hidden="true">78.</strong> Code generation</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="backend/updating-llvm.html"><strong aria-hidden="true">78.1.</strong> Updating LLVM</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="backend/debugging.html"><strong aria-hidden="true">78.2.</strong> Debugging LLVM</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="backend/backend-agnostic.html"><strong aria-hidden="true">78.3.</strong> Backend Agnostic Codegen</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="backend/implicit-caller-location.html"><strong aria-hidden="true">78.4.</strong> Implicit caller location</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/intro.html"><strong aria-hidden="true">79.</strong> Debug Info</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/rust-codegen.html"><strong aria-hidden="true">79.1.</strong> Rust Codegen</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/llvm-codegen.html"><strong aria-hidden="true">79.2.</strong> LLVM Codegen</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/debugger-internals.html"><strong aria-hidden="true">79.3.</strong> Debugger Internals</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/lldb-internals.html"><strong aria-hidden="true">79.3.1.</strong> LLDB Internals</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/gdb-internals.html"><strong aria-hidden="true">79.3.2.</strong> GDB Internals</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/debugger-visualizers.html"><strong aria-hidden="true">79.4.</strong> Debugger Visualizers</a><a class="chapter-fold-toggle"><div>❱</div></a></span><ol class="section"><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/lldb-visualizers.html"><strong aria-hidden="true">79.4.1.</strong> LLDB - Python Providers</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/gdb-visualizers.html"><strong aria-hidden="true">79.4.2.</strong> GDB - Python Providers</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/natvis-visualizers.html"><strong aria-hidden="true">79.4.3.</strong> CDB - Natvis</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debuginfo/testing.html"><strong aria-hidden="true">79.5.</strong> Testing</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="debugging-support-in-rustc.html"><strong aria-hidden="true">79.6.</strong> (Lecture Notes) Debugging support in the Rust compiler</a></span></li></ol><li class="chapter-item "><span class="chapter-link-wrapper"><a href="backend/libs-and-metadata.html"><strong aria-hidden="true">80.</strong> Libraries and metadata</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="profile-guided-optimization.html"><strong aria-hidden="true">81.</strong> Profile-guided optimization</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="llvm-coverage-instrumentation.html"><strong aria-hidden="true">82.</strong> LLVM source-based code coverage</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="sanitizers.html"><strong aria-hidden="true">83.</strong> Sanitizers support</a></span></li><li class="chapter-item "><li class="spacer"></li></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="appendix/background.html">Appendix A: Background topics</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="appendix/glossary.html">Appendix B: Glossary</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="appendix/code-index.html">Appendix C: Code Index</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="appendix/compiler-lecture.html">Appendix D: Compiler Lecture Series</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="appendix/bibliography.html">Appendix E: Bibliography</a></span></li><li class="chapter-item "><span class="chapter-link-wrapper"><a href="appendix/humorust.html">Appendix Z: HumorRust</a></span></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split('#')[0].split('?')[0];
        if (current_page.endsWith('/')) {
            current_page += 'index.html';
        }
        const links = Array.prototype.slice.call(this.querySelectorAll('a'));
        const l = links.length;
        for (let i = 0; i < l; ++i) {
            const link = links[i];
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The 'index' page is supposed to alias the first chapter in the book.
            if (link.href === current_page
                || i === 0
                && path_to_root === ''
                && current_page.endsWith('/index.html')) {
                link.classList.add('active');
                let parent = link.parentElement;
                while (parent) {
                    if (parent.tagName === 'LI' && parent.classList.contains('chapter-item')) {
                        parent.classList.add('expanded');
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', e => {
            if (e.target.tagName === 'A') {
                const clientRect = e.target.getBoundingClientRect();
                const sidebarRect = this.getBoundingClientRect();
                sessionStorage.setItem('sidebar-scroll-offset', clientRect.top - sidebarRect.top);
            }
        }, { passive: true });
        const sidebarScrollOffset = sessionStorage.getItem('sidebar-scroll-offset');
        sessionStorage.removeItem('sidebar-scroll-offset');
        if (sidebarScrollOffset !== null) {
            // preserve sidebar scroll position when navigating via links within sidebar
            const activeSection = this.querySelector('.active');
            if (activeSection) {
                const clientRect = activeSection.getBoundingClientRect();
                const sidebarRect = this.getBoundingClientRect();
                const currentOffset = clientRect.top - sidebarRect.top;
                this.scrollTop += currentOffset - parseFloat(sidebarScrollOffset);
            }
        } else {
            // scroll sidebar to current active section when navigating via
            // 'next/previous chapter' buttons
            const activeSection = document.querySelector('#mdbook-sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        const sidebarAnchorToggles = document.querySelectorAll('.chapter-fold-toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(el => {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define('mdbook-sidebar-scrollbox', MDBookSidebarScrollbox);


// ---------------------------------------------------------------------------
// Support for dynamically adding headers to the sidebar.

(function() {
    // This is used to detect which direction the page has scrolled since the
    // last scroll event.
    let lastKnownScrollPosition = 0;
    // This is the threshold in px from the top of the screen where it will
    // consider a header the "current" header when scrolling down.
    const defaultDownThreshold = 150;
    // Same as defaultDownThreshold, except when scrolling up.
    const defaultUpThreshold = 300;
    // The threshold is a virtual horizontal line on the screen where it
    // considers the "current" header to be above the line. The threshold is
    // modified dynamically to handle headers that are near the bottom of the
    // screen, and to slightly offset the behavior when scrolling up vs down.
    let threshold = defaultDownThreshold;
    // This is used to disable updates while scrolling. This is needed when
    // clicking the header in the sidebar, which triggers a scroll event. It
    // is somewhat finicky to detect when the scroll has finished, so this
    // uses a relatively dumb system of disabling scroll updates for a short
    // time after the click.
    let disableScroll = false;
    // Array of header elements on the page.
    let headers;
    // Array of li elements that are initially collapsed headers in the sidebar.
    // I'm not sure why eslint seems to have a false positive here.
    // eslint-disable-next-line prefer-const
    let headerToggles = [];
    // This is a debugging tool for the threshold which you can enable in the console.
    let thresholdDebug = false;

    // Updates the threshold based on the scroll position.
    function updateThreshold() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // The number of pixels below the viewport, at most documentHeight.
        // This is used to push the threshold down to the bottom of the page
        // as the user scrolls towards the bottom.
        const pixelsBelow = Math.max(0, documentHeight - (scrollTop + windowHeight));
        // The number of pixels above the viewport, at least defaultDownThreshold.
        // Similar to pixelsBelow, this is used to push the threshold back towards
        // the top when reaching the top of the page.
        const pixelsAbove = Math.max(0, defaultDownThreshold - scrollTop);
        // How much the threshold should be offset once it gets close to the
        // bottom of the page.
        const bottomAdd = Math.max(0, windowHeight - pixelsBelow - defaultDownThreshold);
        let adjustedBottomAdd = bottomAdd;

        // Adjusts bottomAdd for a small document. The calculation above
        // assumes the document is at least twice the windowheight in size. If
        // it is less than that, then bottomAdd needs to be shrunk
        // proportional to the difference in size.
        if (documentHeight < windowHeight * 2) {
            const maxPixelsBelow = documentHeight - windowHeight;
            const t = 1 - pixelsBelow / Math.max(1, maxPixelsBelow);
            const clamp = Math.max(0, Math.min(1, t));
            adjustedBottomAdd *= clamp;
        }

        let scrollingDown = true;
        if (scrollTop < lastKnownScrollPosition) {
            scrollingDown = false;
        }

        if (scrollingDown) {
            // When scrolling down, move the threshold up towards the default
            // downwards threshold position. If near the bottom of the page,
            // adjustedBottomAdd will offset the threshold towards the bottom
            // of the page.
            const amountScrolledDown = scrollTop - lastKnownScrollPosition;
            const adjustedDefault = defaultDownThreshold + adjustedBottomAdd;
            threshold = Math.max(adjustedDefault, threshold - amountScrolledDown);
        } else {
            // When scrolling up, move the threshold down towards the default
            // upwards threshold position. If near the bottom of the page,
            // quickly transition the threshold back up where it normally
            // belongs.
            const amountScrolledUp = lastKnownScrollPosition - scrollTop;
            const adjustedDefault = defaultUpThreshold - pixelsAbove
                + Math.max(0, adjustedBottomAdd - defaultDownThreshold);
            threshold = Math.min(adjustedDefault, threshold + amountScrolledUp);
        }

        if (documentHeight <= windowHeight) {
            threshold = 0;
        }

        if (thresholdDebug) {
            const id = 'mdbook-threshold-debug-data';
            let data = document.getElementById(id);
            if (data === null) {
                data = document.createElement('div');
                data.id = id;
                data.style.cssText = `
                    position: fixed;
                    top: 50px;
                    right: 10px;
                    background-color: 0xeeeeee;
                    z-index: 9999;
                    pointer-events: none;
                `;
                document.body.appendChild(data);
            }
            data.innerHTML = `
                <table>
                  <tr><td>documentHeight</td><td>${documentHeight.toFixed(1)}</td></tr>
                  <tr><td>windowHeight</td><td>${windowHeight.toFixed(1)}</td></tr>
                  <tr><td>scrollTop</td><td>${scrollTop.toFixed(1)}</td></tr>
                  <tr><td>pixelsAbove</td><td>${pixelsAbove.toFixed(1)}</td></tr>
                  <tr><td>pixelsBelow</td><td>${pixelsBelow.toFixed(1)}</td></tr>
                  <tr><td>bottomAdd</td><td>${bottomAdd.toFixed(1)}</td></tr>
                  <tr><td>adjustedBottomAdd</td><td>${adjustedBottomAdd.toFixed(1)}</td></tr>
                  <tr><td>scrollingDown</td><td>${scrollingDown}</td></tr>
                  <tr><td>threshold</td><td>${threshold.toFixed(1)}</td></tr>
                </table>
            `;
            drawDebugLine();
        }

        lastKnownScrollPosition = scrollTop;
    }

    function drawDebugLine() {
        if (!document.body) {
            return;
        }
        const id = 'mdbook-threshold-debug-line';
        const existingLine = document.getElementById(id);
        if (existingLine) {
            existingLine.remove();
        }
        const line = document.createElement('div');
        line.id = id;
        line.style.cssText = `
            position: fixed;
            top: ${threshold}px;
            left: 0;
            width: 100vw;
            height: 2px;
            background-color: red;
            z-index: 9999;
            pointer-events: none;
        `;
        document.body.appendChild(line);
    }

    function mdbookEnableThresholdDebug() {
        thresholdDebug = true;
        updateThreshold();
        drawDebugLine();
    }

    window.mdbookEnableThresholdDebug = mdbookEnableThresholdDebug;

    // Updates which headers in the sidebar should be expanded. If the current
    // header is inside a collapsed group, then it, and all its parents should
    // be expanded.
    function updateHeaderExpanded(currentA) {
        // Add expanded to all header-item li ancestors.
        let current = currentA.parentElement;
        while (current) {
            if (current.tagName === 'LI' && current.classList.contains('header-item')) {
                current.classList.add('expanded');
            }
            current = current.parentElement;
        }
    }

    // Updates which header is marked as the "current" header in the sidebar.
    // This is done with a virtual Y threshold, where headers at or below
    // that line will be considered the current one.
    function updateCurrentHeader() {
        if (!headers || !headers.length) {
            return;
        }

        // Reset the classes, which will be rebuilt below.
        const els = document.getElementsByClassName('current-header');
        for (const el of els) {
            el.classList.remove('current-header');
        }
        for (const toggle of headerToggles) {
            toggle.classList.remove('expanded');
        }

        // Find the last header that is above the threshold.
        let lastHeader = null;
        for (const header of headers) {
            const rect = header.getBoundingClientRect();
            if (rect.top <= threshold) {
                lastHeader = header;
            } else {
                break;
            }
        }
        if (lastHeader === null) {
            lastHeader = headers[0];
            const rect = lastHeader.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (rect.top >= windowHeight) {
                return;
            }
        }

        // Get the anchor in the summary.
        const href = '#' + lastHeader.id;
        const a = [...document.querySelectorAll('.header-in-summary')]
            .find(element => element.getAttribute('href') === href);
        if (!a) {
            return;
        }

        a.classList.add('current-header');

        updateHeaderExpanded(a);
    }

    // Updates which header is "current" based on the threshold line.
    function reloadCurrentHeader() {
        if (disableScroll) {
            return;
        }
        updateThreshold();
        updateCurrentHeader();
    }


    // When clicking on a header in the sidebar, this adjusts the threshold so
    // that it is located next to the header. This is so that header becomes
    // "current".
    function headerThresholdClick(event) {
        // See disableScroll description why this is done.
        disableScroll = true;
        setTimeout(() => {
            disableScroll = false;
        }, 100);
        // requestAnimationFrame is used to delay the update of the "current"
        // header until after the scroll is done, and the header is in the new
        // position.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Closest is needed because if it has child elements like <code>.
                const a = event.target.closest('a');
                const href = a.getAttribute('href');
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    threshold = targetElement.getBoundingClientRect().bottom;
                    updateCurrentHeader();
                }
            });
        });
    }

    // Takes the nodes from the given head and copies them over to the
    // destination, along with some filtering.
    function filterHeader(source, dest) {
        const clone = source.cloneNode(true);
        clone.querySelectorAll('mark').forEach(mark => {
            mark.replaceWith(...mark.childNodes);
        });
        dest.append(...clone.childNodes);
    }

    // Scans page for headers and adds them to the sidebar.
    document.addEventListener('DOMContentLoaded', function() {
        const activeSection = document.querySelector('#mdbook-sidebar .active');
        if (activeSection === null) {
            return;
        }

        const main = document.getElementsByTagName('main')[0];
        headers = Array.from(main.querySelectorAll('h2, h3, h4, h5, h6'))
            .filter(h => h.id !== '' && h.children.length && h.children[0].tagName === 'A');

        if (headers.length === 0) {
            return;
        }

        // Build a tree of headers in the sidebar.

        const stack = [];

        const firstLevel = parseInt(headers[0].tagName.charAt(1));
        for (let i = 1; i < firstLevel; i++) {
            const ol = document.createElement('ol');
            ol.classList.add('section');
            if (stack.length > 0) {
                stack[stack.length - 1].ol.appendChild(ol);
            }
            stack.push({level: i + 1, ol: ol});
        }

        // The level where it will start folding deeply nested headers.
        const foldLevel = 3;

        for (let i = 0; i < headers.length; i++) {
            const header = headers[i];
            const level = parseInt(header.tagName.charAt(1));

            const currentLevel = stack[stack.length - 1].level;
            if (level > currentLevel) {
                // Begin nesting to this level.
                for (let nextLevel = currentLevel + 1; nextLevel <= level; nextLevel++) {
                    const ol = document.createElement('ol');
                    ol.classList.add('section');
                    const last = stack[stack.length - 1];
                    const lastChild = last.ol.lastChild;
                    // Handle the case where jumping more than one nesting
                    // level, which doesn't have a list item to place this new
                    // list inside of.
                    if (lastChild) {
                        lastChild.appendChild(ol);
                    } else {
                        last.ol.appendChild(ol);
                    }
                    stack.push({level: nextLevel, ol: ol});
                }
            } else if (level < currentLevel) {
                while (stack.length > 1 && stack[stack.length - 1].level > level) {
                    stack.pop();
                }
            }

            const li = document.createElement('li');
            li.classList.add('header-item');
            li.classList.add('expanded');
            if (level < foldLevel) {
                li.classList.add('expanded');
            }
            const span = document.createElement('span');
            span.classList.add('chapter-link-wrapper');
            const a = document.createElement('a');
            span.appendChild(a);
            a.href = '#' + header.id;
            a.classList.add('header-in-summary');
            filterHeader(header.children[0], a);
            a.addEventListener('click', headerThresholdClick);
            const nextHeader = headers[i + 1];
            if (nextHeader !== undefined) {
                const nextLevel = parseInt(nextHeader.tagName.charAt(1));
                if (nextLevel > level && level >= foldLevel) {
                    const toggle = document.createElement('a');
                    toggle.classList.add('chapter-fold-toggle');
                    toggle.classList.add('header-toggle');
                    toggle.addEventListener('click', () => {
                        li.classList.toggle('expanded');
                    });
                    const toggleDiv = document.createElement('div');
                    toggleDiv.textContent = '❱';
                    toggle.appendChild(toggleDiv);
                    span.appendChild(toggle);
                    headerToggles.push(li);
                }
            }
            li.appendChild(span);

            const currentParent = stack[stack.length - 1];
            currentParent.ol.appendChild(li);
        }

        const onThisPage = document.createElement('div');
        onThisPage.classList.add('on-this-page');
        onThisPage.append(stack[0].ol);
        const activeItemSpan = activeSection.parentElement;
        activeItemSpan.after(onThisPage);
    });

    document.addEventListener('DOMContentLoaded', reloadCurrentHeader);
    document.addEventListener('scroll', reloadCurrentHeader, { passive: true });
})();

