# Usage

This feature is work-in-progress, and not ready for usage. The instructions here are for contributors, or people interested in following the latest progress.
We currently work on launching the following Rust kernel on the GPU. To follow along, copy it to a `src/lib.rs` file.

```rust
#![feature(abi_gpu_kernel)]
#![no_std]

#[panic_handler]
fn panic(_: &core::panic::PanicInfo) -> ! {
    loop {}
}

#[unsafe(no_mangle)]
#[inline(never)]
fn main() {
    let mut x = [3.0; 256];
    //if cfg!(target_os = "linux") {
    #[cfg(target_os = "linux")]
    {
        kernel_1(&mut x);
    }
    core::hint::black_box(&x);
}

#[cfg(target_os = "linux")]
#[unsafe(no_mangle)]
#[inline(never)]
pub fn kernel_1(x: &mut [f32; 256]) {
    x[0] = 21.0;
    //for i in 0..256 {
    //    x[i] = 21.0;
    //}
}

#[cfg(not(target_os = "linux"))]
#[unsafe(no_mangle)]
#[inline(never)]
pub extern "gpu-kernel" fn kernel_2(x: &mut [f32; 256]) {
    x[0] = 21.0;
    //for i in 0..256 {
    //    x[i] = 21.0;
    //}
}
```


## Usage for memory transfer
It is important to use a clang compiler build on the same llvm as rustc. Just calling clang without the full path will likely use your system clang, which probably will be incompatible.
```
/absolute/path/to/rust/build/x86_64-unknown-linux-gnu/stage1/bin/rustc +offload --edition=2024 --crate-type cdylib src/lib.rs --emit=llvm-ir  -O -C lto=fat -Cpanic=abort -Zoffload=Enable
/absolute/path/to/rust/build/x86_64-unknown-linux-gnu/llvm/bin/clang++ -fopenmp --offload-arch=native -g  -O3 lib.ll -o main -save-temps
LIBOMPTARGET_INFO=-1  ./main
```
The first step will generate a `main.ll` file, which has enough instructions to cause the offload runtime to move data to and from a gpu.
The second step will use clang as the compilation driver to compile our IR file down to a working binary. Only a very small Rust subset will work out of the box here.
In the last step you can run your binary, if all went well you will see a data transfer being reported:
```
omptarget device 0 info: Entering OpenMP data region with being_mapper at unknown:0:0 with 1 arguments:
omptarget device 0 info: tofrom(unknown)[1024]
omptarget device 0 info: Creating new map entry with HstPtrBase=0x00007fffffff9540, HstPtrBegin=0x00007fffffff9540, TgtAllocBegin=0x0000155547200000, TgtPtrBegin=0x0000155547200000, Size=1024, DynRefCount=1, HoldRefCount=0, Name=unknown
omptarget device 0 info: Copying data from host to device, HstPtr=0x00007fffffff9540, TgtPtr=0x0000155547200000, Size=1024, Name=unknown
omptarget device 0 info: OpenMP Host-Device pointer mappings after block at unknown:0:0:
omptarget device 0 info: Host Ptr           Target Ptr         Size (B) DynRefCount HoldRefCount Declaration
omptarget device 0 info: 0x00007fffffff9540 0x0000155547200000 1024     1           0            unknown at unknown:0:0
// some other output
omptarget device 0 info: Exiting OpenMP data region with end_mapper at unknown:0:0 with 1 arguments:
omptarget device 0 info: tofrom(unknown)[1024]
omptarget device 0 info: Mapping exists with HstPtrBegin=0x00007fffffff9540, TgtPtrBegin=0x0000155547200000, Size=1024, DynRefCount=0 (decremented, delayed deletion), HoldRefCount=0
omptarget device 0 info: Copying data from device to host, TgtPtr=0x0000155547200000, HstPtr=0x00007fffffff9540, Size=1024, Name=unknown
omptarget device 0 info: Removing map entry with HstPtrBegin=0x00007fffffff9540, TgtPtrBegin=0x0000155547200000, Size=1024, Name=unknown
```

## Usage for gpu kernel launches
This feature is not fully implemented yet. We recommend to check out the following PR for experiments: https://github.com/rust-lang/rust/pull/142696
It allows compiling Rust code to a GPU and to inspect the IR, but it will not yet launch it. In a follow-up PR we will automate this step and unite it with the usage above.
```
RUSTFLAGS="-Ctarget-cpu=gfx90a" cargo +offload build -Zunstable-options -r --target amdgcn-amd-amdhsa -Zbuild-std=core
```
You will need to adjust the target-cpu to match your local GPU. 
