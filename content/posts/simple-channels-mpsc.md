+++
title = "Simple channels example in rust using tokio::sync::mpsc."
description = "How to use tokio::sync::mpsc with a simple example."
date = 2023-05-21

[taxonomies]
tags = ["rust", "multithreading"]
+++

```rust
use anyhow::Context;
use log::info;
use std::result::Result::Ok;
use tokio::sync::mpsc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let (tx, mut rx) = mpsc::channel::<usize>(32);
    let urls: Vec<String> = vec![
        String::from("https://doc.rust-lang.org/book/ch16-02-message-passing.html"),
        String::from("https://github.com/belfz/mpsc-crypto-mining"),
        String::from("https://tokio.rs/tokio/tutorial/channels"),
    ];

    info!("[STARTING]");

    // Spawn a thread for each url.
    for url in urls {
        let tx = tx.clone();
        // Fetch the word count from the response
        tokio::spawn(async move {
            info!("[THREAD SPAWNED]: For url: {}", &url);
            let resp = reqwest::get(url)
                .await?
                .text()
                .await
                .context("Can't fetch the data")?;
            // Fetch the response
            tx.send(resp.len()).await?;
            Ok::<(), anyhow::Error>(())
        });
    }

    drop(tx);

    // Print the received data.
    while let Some(msg) = rx.recv().await {
        info!("Length of response: {}", msg);
    }

    Ok(())
}
```