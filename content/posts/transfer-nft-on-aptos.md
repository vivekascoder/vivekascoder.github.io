+++
title = "Various ways to transfer NFTs on Aptos."
description = "Diving a bit into NFT standard of Aptos and various ways to transfer NFTs on using it."
date = 2023-01-19

[taxonomies]
tags = ["move", "aptos", "smart contracts"]
+++

## How to identify NFTs uniquely?

An NFT or Token can be uniquely identified using a struct called `TokenId` which is defined in `0x3::token`.

```move
struct TokenId has store, copy, drop {
    token_data_id: TokenDataId,
    property_version: u64,
}

struct TokenDataId has copy, drop, store {
    creator: address,
    collection: String,
    name: String,
}
```

So if you have access to 4 things i.e 
1. creator of collection.
2. name of the collection.
3. name of the token.
4. property version of the token.

You can uniquely identify the token by creating a token id out of it with an helper function.

```move
let token_id = token::create_token_id_raw(
    creator, 
    collection, 
    token_name, 
    property_version
);
```

## How to transfer NFTs?

1. Using `direct_transfer`.

This method is useful if you have access to the signer of receiver and sender. It doesn't require the receiver to do anything to receive the NFT as you'll see in other methods, the receiver either needs to claim the NFT or opt in for direct transfer.

```move
let token_id = token::create_token_id_raw(
    creator, 
    collection, 
    token_name, 
    property_version
);
token::direct_transfer(sender, receiver, token_id, 1); // 1 is the amount of NFT
```

2. Using `transfer_with_opt_in`.

This method is defined in `0x3::token` that allows you to transfer an NFT to an address that has opted in for direct transfer. This method is useful if you don't have access to the signer of receiver and sender. The receiver needs to opt in for direct transfer before you can transfer the NFT to them.

```move
public entry fun transfer_with_opt_in(
    from: &signer,
    creator: address,
    collection_name: String,
    token_name: String,
    token_property_version: u64,
    to: address,
    amount: u64,
) acquires TokenStore {
    ...
}
```

3. Using offer & claim.

The token standard also offers a module called `token_transfers` that contains the functionality to offer an NFT to someone and the other person can claim it. It doesn't involve for the other person to opt in for direct transfer. The receiver needs to claim the NFT before they can receive it.

```move
let token_id = token::create_token_id_raw(
    creator, 
    collection, 
    token_name, 
    property_version
);
token_transfers::offer(&sender, to_address, token_id, 1);
```
