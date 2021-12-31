---
title: "Datatypes in Rust"
---

## Program

```rust
/**
Learning about various data types in rust.
**/
use std::io;

fn main() {
    println!("Learning data types.");
    let a: u16 = 34;
    let b: i16 = -34;
    println!("a and b are {} and {}", a, b);

    let b: u8 = b'B';
    println!("b byte is {}", b);

    // Floats
    let f: f32 = 45.60002;
    println!("f is {}", f);

    // Bools
    let is_logged_in: bool = false;
    println!("Logged In: {}", is_logged_in);

    // Chars
    let c: char = '👋';
    println!("Char is {}", c);


    // Compound Data types
    // Tuples
    let tup: (i32, f64, u8) = (500, 4.5, 6);
    println!("Tuple is {}, {}, {}", tup.0, tup.1, tup.2);

    // Arrays
    let _a: [i32; 4] = [34,56,67,87];
    let months = ["January", "February", "March", "April", "May", "June", "July",
                "August", "September", "October", "November", "December"];
    println!("Months: {}", months[0]);

    let mut index = String::new();

    io::stdin()
        .read_line(&mut index)
        .expect("FAILED_TO_READ_LINE");

    let index: usize = index
        .trim()
        .parse()
        .expect("INDEX_NOT_NUMBER");

    let el = months[index];

    println!("The month at {} is {}", index, el);


}
```
