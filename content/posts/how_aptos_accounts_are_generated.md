+++
title = "How are accounts on Aptos generated."
description = "Let's generate some Aptos accounts with python."
date = 2022-11-06

[taxonomies]
tags = ["aptos", "blockchain", "python"]
+++

## Accounts on Aptos

Accounts on Aptos are ed25519 key pair and the authentication key is sha3_256 hash of public key concat with `0x00`.

## How to generate addresses with python

```py
import ed25519
from Crypto.Hash import SHA3_256

# Generate new ed25519 pair
privKey, pubKey = ed25519.create_keypair()

# Create Auth Key by sha3_256(publi_key | 0x00)
auth_key = SHA3_256.new(bytearray.fromhex(pubKey.to_ascii(encoding="hex").decode() + "00"))

print(
    "Private Key: ", privKey.to_ascii(encoding="hex"),
    "Public Key: ", pubKey.to_ascii(encoding="hex"),
    "Auth Key: ", auth_key.hexdigest(),
    sep="\n"
)
```

<!--
## Info on transaction

So let's take a look at how transactions are submitted to the blockchain, I'll basically walk you through some code snippets from the typescript SDK that will walk you through lifecycle of transactions.

### How does a transaction get submitted to the node?

1. You create a raw transaction.
`RawTransaction` needs to have the following

2. You sign the transaction with your private key.
3. You submit the transaction to the node. -->
