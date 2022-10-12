+++
title = "LOG1: Experimenting with Aptos, Sui."
date = 2022-10-11
+++

## What is move lang ?

Move lang is a language inspired by Rust, domain specific language for smart contracts on blockchains like Aptos, Sui, 0L, Starcoin, potentially all EVM chains as well. Sounds really intersting is'nt it? Before going any furthure you can take a look at the snippet below that shows yout the syntax of move lang.

```move
module test_move::store {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    struct Store has key, store {
        id: UID,
        value: vector<u8>,
    }

    fun init(ctx: &mut TxContext) {
        let s = Store {
            id: object::new(ctx),
            // Bytes array.
            value: vector<u8>[34,56],
        };
        transfer::transfer(s, tx_context::sender(ctx));
    }

    public fun mutate(store: &mut Store, val: vector<u8>, _ctx: &TxContext) {
        store.value = val;
    }
}
```

Yeah I know it looks a bit like rust, infact as I mentioned it's inspired by rust lang. It has rust's most important feature like borrow checking built into that that makes it more safer for writing smart contracts.
If you want to use their typescript SDK to interact with Sui blockchain the following link might help.

[https://github.com/MystenLabs/sui/blob/main/sdk/typescript/README.md](https://github.com/MystenLabs/sui/blob/main/sdk/typescript/README.md
)

If you want to use sui web wallet to sign transaction and interact with the objects / contracts you'll find the following link useful.

[https://github.com/MystenLabs/sui/blob/main/apps/wallet/examples/demo-nft-dapp/pages/index.js](https://github.com/MystenLabs/sui/blob/main/apps/wallet/examples/demo-nft-dapp/pages/index.js)

