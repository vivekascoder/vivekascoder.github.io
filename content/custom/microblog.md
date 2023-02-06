+++
title = "🦠 Microblog"
date = 2023-01-20
path = "microblog"
+++

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
