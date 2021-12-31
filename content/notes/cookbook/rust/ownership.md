---
title: "Ownership in Rust"
---

## Program

```rust
// Learning about ownership in rust.

fn main() {
    let mut s = String::from("Hello World");

    // Appending to `s`.
    s.push_str(";");
    let s2 = s;

    println!("{}", s2);

    // To create deep copy use .clone()
    let s3 = s2.clone();
    println!("{}", s2);
    println!("{}", s3);
}
```
