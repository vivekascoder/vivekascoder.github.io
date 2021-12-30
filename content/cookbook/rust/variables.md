---
title: "Variables in Rust"
---

## Program

```rust
/**
Learning variables in rust
**/

const MAGIC_NUMBER: u32 = 30 * 40 * 89;

fn main() {
    let mut x = 5;
    println!("The value of x is {} ", x);

    x = 80;
    println!("The value got changed. It's {} now.", x);

    println!("Our magic constant is {} ", MAGIC_NUMBER);

    // Shadowing.
    let y = 5;

    let y = y + 1;

    {
        let y = y * 2;
        println!("The value of y in the inner scope is {} ", y);
    }

    println!("The value of y is {}", y);
}
```
