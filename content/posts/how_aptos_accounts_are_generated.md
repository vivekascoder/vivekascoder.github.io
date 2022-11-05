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
