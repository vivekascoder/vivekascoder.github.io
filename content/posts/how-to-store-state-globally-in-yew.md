+++
title = "How to store state globally in Yew."
description = "Using yewdux to make life easier."
date = 2023-01-30
[taxonomies]
tags = ["rust", "wasm", "yew", "webdev"]
+++

## Installing Yewdux
Yewdux is react equivelent to Redux for Yew projects.
```
cargo add yewdux
```

## Creating global state.

```rs
use yewdux::store::Store;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Todo {
    pub id: i32,
    pub title: String,
    pub completed: bool,
}
```

## Use this state in your components.

### How to update the state in use_effect?

```rs
let (todo_state, dispatch) = use_store::<TodoState>();

use_effect_with_deps(
    move |_| {
        let dispatch = use_effect_dispatch.clone();
        let todos = local_storage::get_todos_from_localstorage();
        dispatch.clone().set(TodoState { todos });
    },
    (),
);
```

### Creating callbacks from the dispatch.
```rs
let create_todo = dispatch.reduce_mut_callback(move |todo_state| {
    let now = js_sys::Date::get_milliseconds(&js_sys::Date::new_0()) as i32;
    let todo = Todo {
        id: now,
        title: value.clone().to_string(),
        completed: false,
    };
    todo_state.todos = todo_state
        .todos
        .iter()
        .cloned()
        .chain(Some(todo.clone()))
        .collect();
    local_storage::insert_todo_to_localstorage(todo.clone()).unwrap();
    value.set(String::from(""));
});
```

### An example to use the state.
```rs
...
{for todo_state.todos.iter().map(|todo| {
    html! {
        <li style={"margin-bottom: 0.3rem"}>
            <button onclick={on_todo_delete}>{"🗑️"}</button>
            <button onclick={on_todo_update}>{"✏️"}</button>
            <input type="checkbox" checked={todo.completed} onchange={on_todo_select}/>
            <span style={"margin-right: 1rem;"}>
                {&todo.title}
            </span>
        </li>
    }
})}
...
```



