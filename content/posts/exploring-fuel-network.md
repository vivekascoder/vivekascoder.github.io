+++
title = "Exploring Fuel Network."
description = "Join me in the quest of finding new and interesting web3 projects to build next billion dollar financial tools. Today, let's dive into fuel network."
date = 2022-10-14
+++

## Intro

Aptos is a layer 2 modular execution layer for ethereum.

## Why are we scaling ethereum using layer 2.

It always feel like ethereum is that layer 1 blockchain that everyone's trying so hard to scale but it's fundamentally meant to be slow. Shouldn't we try to put a lot of effort in improving the base layer instead of figuring out million ways to come up with various layer 2 and sidechain to scale it.

## Simplest smart contract development lifecycle on Fuel network.

Install the fuel core and other utilities from fuel blockchain that are needed for development.

```bash
# Install forc and fuel core.
cargo install forc fuel-core

# Sway Formatter
cargo install forc-fmt

# Block Explorer
cargo install forc-explore

# Sway Language Server
cargo install forc-lsp
```

Install a vscode extension for sway lang.

https://marketplace.visualstudio.com/items?itemName=FuelLabs.sway-vscode-plugin

### Writing a simple contract that increment a variable.

```sway
contract;

storage {
    counter: u64 = 0,
}

abi Counter {
    #[storage(read, write)]
    fn increment();

    #[storage(read)]
    fn count() -> u64;
}

impl Counter for Contract {
    #[storage(read, write)]
    fn increment() {
        storage.counter = storage.counter + 1;
    }

    #[storage(read)]
    fn count() -> u64 {
        storage.counter
    }
}
```

## Creating an account using `forc-wallet`

Read the docs to learn more about it [https://github.com/FuelLabs/forc-wallet#forc-wallet](https://github.com/FuelLabs/forc-wallet#forc-wallet) and use [https://faucet-beta-1.fuel.network/](https://faucet-beta-1.fuel.network/) for faucet to get some test ether on fuel network.

## Deploy the contract using the following command.

```bash
forc deploy --url https://node-beta-1.fuel.network/graphql --gas-price 1
```

Also you'll have to sign the transaction and then provide the signed transaction so use the following comand.

```bash
forc wallet sign <transaction-id> 0
```

### Building simplest frontend.

Create a simple react app using CRA, then install `fuels`, `typechain-target-fuels`, then type the following command to generate types from your abi from compiled contracts. Make sure to adjust directoris according to your file structure.

```bash
npx fuelchain --target=fuels --out-dir=./src/contracts ../counter/out/debug/*-abi.json
```

You'll need to create a demo account to sign this transation so use the `fuels` module to do it.

```js
const { Wallet } = require("fuels");

const wallet = Wallet.generate();

console.log("address", wallet.address.toString());
console.log("private key", wallet.privateKey);
```

Then use this in `App.tsx` to get the counter and update it.

```tsx
import { Wallet } from "fuels";
import { useEffect, useState } from "react";

import { CounterAbi__factory } from "../src/contracts";
const CONTRACT_ID =
  "0x5c3db2421a155265b7e415ab9c406ff4664bcad29fd99990b55e315832325beb";
const WALLET_SECRET = "<a-private-key-goes-here>";
const wallet = new Wallet(
  WALLET_SECRET,
  "https://node-beta-1.fuel.network/graphql"
);
const contract = CounterAbi__factory.connect(CONTRACT_ID, wallet);

export default function App() {
  const [counter, setCounter] = useState<number>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      console.log("Setting value");
      const { value } = await contract.functions.count().get();
      setCounter(Number(value));
    })();
  }, []);
  async function increment() {
    // a loading state
    setLoading(true);
    // Creates a transactions to call the increment function
    // because it creates a TX and updates the contract state this requires the wallet to have enough coins to cover the costs and also to sign the Transaction
    try {
      await contract.functions.increment().txParams({ gasPrice: 1 }).call();
      const { value } = await contract.functions.count().get();
      setCounter(Number(value));
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <h1>Fuel me ⛽️</h1>

      <p>Wallet: {wallet.address.toString()}</p>

      <br />

      <p>
        <strong>Counter:</strong> {counter}
      </p>
      <div>
        <button disabled={loading} onClick={increment}>
          {loading ? "Incrementing..." : "Increment"}
        </button>
      </div>
    </>
  );
}
```

That's it, you got a gist of how to work on fuel network, BTW I did this on a stream as well you can check that [here](https://www.youtube.com/watch?v=Ok3RmB_D658) and you can follow my twitch account and join me on the quest of finding amazing web3 tools to write the next billion dollar financial tools.
