---
title: "Funcitons in Rust"
---

## Program

```rust
/**
Learning about rust functions.
**/

fn do_nothing() {
    println!("Still doing!");
}

fn main() {
    println!("Learning about rust functions.");
    do_nothing();
}
```

```rust
/**
Learning about rust functions.
**/

fn do_nothing() {
    println!("Still doing!");
}
fn give_me_square(x: i32) {
    println!("Square: {}", x*x);
}
fn is_odd(x: i32) -> bool {
    // if x % 2 == 0 {
    //     true
    // } else {
    //     false
    // }
    return if x % 2 == 0 { false } else {true};
}

fn calculate(x: i32, y: i32, c: char) -> i32 {
    if c == '+'  {
        return x + y;
    }
    else if c == '-' {
        return x - y;
    }
    else if c == '*' {
        return x * y;
    }
    else if c == '/' {
        return x / y;
    }
    else if c == '%' {
        return x % y;
    }
    else  {
        return -1;
    };
}


fn main() {
    println!("Learning about rust functions.");
    do_nothing();
    give_me_square(45);

    let y = {
        let x = 45;
        x + 1
    };
    println!("y is {}", y);
    println!("{}", is_odd(32));
    println!("{}", calculate(32, 54, '*'));
    learning_loops();
    while_loop();
    for_loop();
}

fn learning_loops() {
    let mut count = 0;
    'coming_up: loop {
        println!("count = {}", count);
        let mut remaining = 10;

        loop {
            println!("remaining = {}", remaining);
            if remaining == 9 {
                break;
            }
            if count == 2 {
                break 'coming_up;
            }
            remaining -= 1;
        }
        count += 1;
    }
    println!("Ent count = {}", count);
}

fn while_loop() {
    let mut number = 3;
    while number != 0 {
        println!("{}!", number);
        number -= 1;
    }
    println!("LIFT");
}

fn for_loop() {
    let a = [10, 20, 30, 40, 50];
    for el in a {
        println!("Value: {}", el);
    }

    for i in (1..10).rev() {
        println!("{}", i);
    }
}
```
