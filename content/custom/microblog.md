+++
title = "🦠 Microblog"
date = 2023-01-20
path = "microblog"
+++

> This is a place to keep my microjournal. Personal opinions, plz don't get offended anon.

## 📅 2023-18-05

Struggling with double downing on work, having fun. Managing life in general. IDK what to do.

## 📅 2023-13-05
<img src="https://pbs.twimg.com/media/Fv8Oj2UWwAA2dm6?format=jpg&name=large" width="400">


## 📅 2023-05-05

This is awesome looks like you can have -ve gas fee on Sui if the storage rebate is greater than the sum of computation cost and the storage fee.

```rust
/// Subtract the gas balance of \p gas_object by \p amount.
/// This function should never fail, since we checked that the budget is always
/// less than balance, and the amount is capped at the budget.
pub fn deduct_gas(gas_object: &mut Object, charge_or_rebate: i64) {
    // The object must be a gas coin as we have checked in transaction handle phase.
    let gas_coin = gas_object.data.try_as_move_mut().unwrap();
    let balance = gas_coin.get_coin_value_unsafe();
    let new_balance = if charge_or_rebate < 0 {
        balance + (-charge_or_rebate as u64)
    } else {
        assert!(balance >= charge_or_rebate as u64);
        balance - charge_or_rebate as u64
    };
    gas_coin.set_coin_value_unsafe(new_balance)
}
```

Source: 

https://github.com/MystenLabs/sui/blob/d56e02c5b170a55261921e7c163d477b0bde3f3d/crates/sui-types/src/gas_model/gas_v2.rs#L492-L503

Storage rebate is subtracted when you delete some objects from the chain.

## 📅 2023-04-30

Hmm, sometimes you don't rely on humans but they'll be there to help you. I'm too fortunate to have those friends around me. I would try to do the same for others. 

And again don't bother trying to fix things which you don't have any control over.

I should work hard and have fun really hard, but IDK it always comes at the expense of other's.

## 📅 2023-04-29

I think I might go for the college farewell, still having second thougts though. 

It's always a good idea to not rely on other humans, again and again I've struggled whenever I've tried depending on others.

Thinking about things which you don't have control over is utter waste of time.

## 📅 2023-04-26
Finally finished that issue with indexer, need to get my life in order ugh so much things that needs to be done. 

**A term that can describe college pretty well?**

> Circle Jerk

Not able to graduate from my college doesn't seem to be a distant possibility because I don't give a flying fuck.

I failed in 2 subjects last sem, and I couldn't care less about it. Still remember the first day I went there and trust me when I say it, it's utter waste of time. It's only a place to socialize. Didn't mean to sound rude but that's what I truly feel.

I should prolly stay anon. here and write whatever I want.

Absolutely in love with "Queen" band. "Bohemian Rhapsody" being one of my fav. classical rock.

## 📅 2023-04-24

Felling pretty productive today, finally after so long. Gotta finish all the work.

## 📅 2023-04-24

**It's 2:09 AM**
Getting bored at my place, should have done something fun this weeekend, But IG it's allright (IG). Toooooo booooored.

Allright so sui has a very wierd arcitecture for smart contracts. Everything is an object, and since objects are unique every data structure is an NFT.

It differs a lot from Aptos, although Aptos is also intriducing objects especially for their NFT standard. Another cool thing, Sui doesn't have an official NFT standard.

So in order to implement capabilities in you module/smart contracts on Sui you'll need to have this pattern.

```move
module examples::item {
    struct AdminCap has key { id: UID }
    struct Item has key, store { id: UID, name: String }
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx))
    }

    public entry fun create_and_send(
        _: &AdminCap, name: vector<u8>, to: address, ctx: &mut TxContext
    ) {
        transfer::transfer(Item {
            id: object::new(ctx),
            name: string::utf8(name)
        }, to)
    }
}
```

If you don't have `AdminCap` in your address, you won't be able to pass `create_and_send` and hense call it.

## 📅 2023-04-23

**🤷** Just like my hairs, my whole life is falling apart.

**✍️** Need to finish some work on Sui ASAP.

**🏖️** And why the fuck is it so difficult to find a good apartment?


## 📅 2023-04-02

I finished Kafka on the shore today, it was deifnitely a good and addictive read. I am glad that guy forced me to read it as I was not much of a fiction reader. Let's see what's next.

## 📅 2023-03-28

First month of being digital nomad: [https://www.reddit.com/r/digitalnomad/comments/11aufmy/staying_in_jaipur_india_as_a_firsttime_digital/](https://www.reddit.com/r/digitalnomad/comments/11aufmy/staying_in_jaipur_india_as_a_firsttime_digital/)

Second month of being digital nomad: 
[https://www.reddit.com/r/digitalnomad/comments/1234n5w/the_second_month_of_being_a_digital_nomad_in_india/?utm_source=share&utm_medium=ios_app&utm_name=ioscss&utm_content=2&utm_term=3](https://www.reddit.com/r/digitalnomad/comments/1234n5w/the_second_month_of_being_a_digital_nomad_in_india/?utm_source=share&utm_medium=ios_app&utm_name=ioscss&utm_content=2&utm_term=3)

## 📅 2023-03-21
Need to get back on track with my projects. I've been procrastinating a lot lately. I need to get back to my routine. Been doing a lot of traveling lately, it's fun.

## 📅 2023-02-07
IG, I can prolly dance if I am drunk enough.

I did have some updates on `meelf`.

- It can serve different routes.
- With raw text only RN.

I made the repo private for now because I am very noob at rust and don't want other people to see my bad rust skills.

I wrote this log from my phone’s browser and it wasn't so painful.


## 📅 2023-02-02
I am thinking to maybe write a blog/static site generator in something like `leptos`. But got a lot of pending projects to do, primarily trying to work `meelf` and learn how to design simple web server. 

## 📅 2023-01-30
I'll be working on `meelf` a simple web server written in rust to create backend for `ye-todo`, wonder if I should stream while building it.

## 📅 2023-01-29

Still can't figure out how to get rid of creating clones outside of the closures.

```rs
let updated_todo_title = use_state(|| "".to_string());
let selected_todo = use_context::<UseStateHandle<SelectedTodo>>().unwrap();
let cloned_selected_todo = (*selected_todo).clone();
let cloned_updated_todo_title = (*updated_todo_title).clone();
let a = updated_todo_title.clone();
let b = updated_todo_title.clone();

use_effect_with_deps(
    move |_| {
        log!("Changed!");
        let value = match cloned_selected_todo.todo {
            Some(todo) => todo.title,
            None => "".to_string(),
        };

        b.clone().set(value);
    },
    (selected_todo.clone()),
);
```

There must be some way to ergonomically do this. Let's try to figure it out.

```rs
// God, please save me from this mess.
let update_todo_title_cloned_selected_todo = (*selected_todo).clone();
let update_todo_title_cloned_updated_todo_title = (*updated_todo_title).clone();
let handle_toggle_clone = handle_toggle.clone();

let update_todo_title = dispatch.reduce_mut_callback(move |todo_state| {
    let selected_todo = update_todo_title_cloned_selected_todo.clone();
    let updated_todo_title = update_todo_title_cloned_updated_todo_title.clone();
    let todo = selected_todo.todo.unwrap();

    todo_state.todos = todo_state
        .todos
        .iter()
        .map(|t| {
            if t.id == todo.id {
                Todo {
                    id: t.id,
                    title: updated_todo_title.clone(),
                    completed: t.completed,
                }
            } else {
                t.clone()
            }
        })
        .collect();

    // Hide the dialog
    handle_toggle_clone
        .clone()
        .emit(MouseEvent::new("click").unwrap());

    // Update in local storage
    local_storage::update_todo_title(todo.id, updated_todo_title.clone()).unwrap();
});
```

## 📅 2023-01-28

Trying to write a simple TODO app with [Yew](https://yew.rs) and realizing that I'm very bad at rust.

## 📅 2023-01-28

```rust
#[derive(Clone, Debug)]
struct Node {
    name: String,
}

fn main() {
    let nodes = vec![Node {
        name: "vivek".to_owned(),
    }];
    // Add a new element into this vec.
    let new_nodes: Vec<Node> = nodes
        .iter()
        .cloned()
        .chain(Some(Node {
            name: "some".to_owned(),
        }))
        .collect();
    println!("Hello, world! {:?}", new_nodes);
}
```

## 📅 2023-01-27

This is my simple setup where I code.

<img src="/img/setup.jpg" width="350" />

## 📅 2023-01-26

Started using
`⌥ + d` to directly go to the defination without using mouse and doing `⌘ + click` on the word. It's a very useful shortcut.

## 📅 2023-01-21

I'm happy cause I managed to wake up at the perfect time and feeling relatively better now. :)

## 📅 2023-01-20

For a few day I've been feeling very sleepy all day because of my fucked up sleeping schedule. Trying to fix it. I think I am more productive during late night upto 2 AM and in the late morning. So now I trying to sleep at max 3AM and wake up around 11AM. Let's hope it'll fix my sleeping schedule.

BTW this page looks like better way to write microblog than twitter. Although RN it's just a single markdown page, I'm thinking to make a folder and render that into a single page.

<img src="/img/mic.png" width="400">

And a script to generate microblog post for that day, example. But I'm gonna try the current format out and see how it goes.

```bash
./microblog create
# And for just posting a small tweet.
./microblog post "Hello World"
```

## 📅 2023-01-20

![gif](/img/pepe.gif)

Added microblog section on my site, the purpose of this page is to write micro, digestable information around anything I'm doing. I'll try to keep it updated as much as possible. It gonna be kinda like my twitter feed.
Sometimes, you'll find random shit in here too just like my tweets.
