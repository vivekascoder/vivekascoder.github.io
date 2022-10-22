+++
title = "Create a Coin on Aptos using Move."
description = "Let's learn how to deploy a coin on Aptos using Move lang and interact with it."
date = 2022-10-22
+++

## Introduction

Aptos is a layer 1 protocol which can provide very high throughput for your DAPPs, It can offer a max TPS of 160K (curtesy of block-stm) and a blocktime of 300ms. It was previously knows as Libra, Diem. It uses Move as it's programming language to write contracts. Move is a DSL based on rust just like sway on fuel.

## Installation

To install aptos cli: [https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli#download-precompiled-binary](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli#download-precompiled-binary)

To install move and move-analyzer: [https://github.com/move-language/move/tree/main/language/documentation/tutorial#Step0](https://github.com/move-language/move/tree/main/language/documentation/tutorial#Step0)

If you want to get a gist of how Coin standard is defined in aptos, follow this tutorial [https://github.com/move-language/move/tree/main/language/documentation/tutorial](https://github.com/move-language/move/tree/main/language/documentation/tutorial).

## Creating a new move project.

Create a new folder and the create a new move project using aptos cli.

```bash
mkdir move_coin
cd move_coin
aptos move init --name move_coin
```

## Writing module

Import the necessary modules that we'll use to write the module and defined some error code that we will use.

```move
...
    use std::signer;
    use std::string;
    use aptos_framework::coin;

    const ENOT_ADMIN: u64 = 0;
    const E_ALREADY_HAS_CAPABILITY: u64 = 1;
    const E_DONT_HAVE_CAPABILITY: u64 = 2;
...
```

Let's define the resources for the coin and Coin capability the account that owns the capability resource will have access to call mint and burn functions which is going to be `@admin` in our case.

> Note that addresses with `@` front of them are named addresses defined in the Move.toml file.

This is how `Move.toml` looks like for this example.

```toml
[package]
name = 'coin'
version = '1.0.0'
upgrade_policy = "compatible"

[dependencies.AptosFramework]
git = 'https://github.com/aptos-labs/aptos-core.git'
rev = 'main'
subdir = 'aptos-move/framework/aptos-framework'

[addresses]
coin = "0x3"
admin = "0x3"
# admin = "YOU_ADDRESS_GOES_HERE"
# coin = "YOU_ADDRESS_GOES_HERE"
```

> Note: `upgrade_policy = "compatible"` allows us to upgrade the contract after it's deployed. To learn more about the upgradablity take a look at this page [https://aptos.dev/guides/move-guides/upgrading-move-code](https://aptos.dev/guides/move-guides/upgrading-move-code)

When you want to deploy/publish the move modules we'll uncomment the actual `admin` and `coin` addresses.

Let's write some helper functions that we'll need throughout the module.

```move
...
    public fun is_admin(addr: address) {
        assert!(addr == @admin, ENOT_ADMIN);
    }

    public fun have_coin_capabilities(addr: address) {
        assert!(exists<CoinCapabilities>(addr), E_DONT_HAVE_CAPABILITY);
    }
    public fun not_have_coin_capabilities(addr: address) {
        assert!(!exists<CoinCapabilities>(addr), E_ALREADY_HAS_CAPABILITY);
    }
...
```

These functions are self explanatory, `is_admin` checks if the passed address is admin or not, `have_coin_capabilities` if the address has the `CoinCapabilities` resource and `not_have_coin_capabilities` checks opposite of that.

Let's write module constructor which will only be executed once during the deployment of the module.

```move
...
    fun init_module(account: &signer) {
        let account_addr = signer::address_of(account);
        is_admin(account_addr);
        not_have_coin_capabilities(account_addr);

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<DogeCoin>(
            account,
            string::utf8(b"Doge Coin"),
            string::utf8(b"DOGE"),
            18,
            true
        );
        move_to(account, CoinCapabilities {mint_cap, burn_cap, freeze_cap});
...
```

It make sures that the `account` is admin, initializes a coin and move the `CoinCapability` resource to the `account` which is `@admin`.

Let's write an entry function to register `CoinInfo` and `CoinStore` to a particular address.

```move
...
    public entry fun register(account: &signer) {
        coin::register<DogeCoin>(account);
    }
...
```

Neat and simple. Let's move to the next step that allows admin to mint some tokens to an address.

```move
...
    public entry fun mint(account: &signer, user: address, amount: u64) acquires CoinCapabilities {
        let account_addr = signer::address_of(account);

        is_admin(account_addr);
        have_coin_capabilities(account_addr);

        let mint_cap = &borrow_global<CoinCapabilities>(account_addr).mint_cap;
        let coins = coin::mint<DogeCoin>(amount, mint_cap);
        coin::deposit<DogeCoin>(user, coins);
    }
...
```

Similarly let's write a function that will allow anyone to burn tokens, feel free to skip it if you don't want this feature.

```move
...
    public entry fun burn(coin: coin::Coin<DogeCoin>) acquires CoinCapabilities {
        let burn_cap = &borrow_global<CoinCapabilities>(@admin).burn_cap;
        coin::burn<DogeCoin>(coin, burn_cap);
    }
...
```

Boom, we're done with a bit of move code, this is how the complete module looks like.

```move
module coin::dogecoinV2 {
    use std::signer;
    use std::string;
    use aptos_framework::coin;

    const ENOT_ADMIN: u64 = 0;
    const E_ALREADY_HAS_CAPABILITY: u64 = 1;
    const E_DONT_HAVE_CAPABILITY: u64 = 2;

    struct DogeCoin has key {}

    struct CoinCapabilities has key {
        mint_cap: coin::MintCapability<DogeCoin>,
        burn_cap: coin::BurnCapability<DogeCoin>,
        freeze_cap: coin::FreezeCapability<DogeCoin>
    }

    public fun is_admin(addr: address) {
        assert!(addr == @admin, ENOT_ADMIN);
    }

    public fun have_coin_capabilities(addr: address) {
        assert!(exists<CoinCapabilities>(addr), E_DONT_HAVE_CAPABILITY);
    }
    public fun not_have_coin_capabilities(addr: address) {
        assert!(!exists<CoinCapabilities>(addr), E_ALREADY_HAS_CAPABILITY);
    }

    fun init_module(account: &signer) {
        let account_addr = signer::address_of(account);
        is_admin(account_addr);
        not_have_coin_capabilities(account_addr);

        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<DogeCoin>(
            account,
            string::utf8(b"Doge Coin"),
            string::utf8(b"DOGE"),
            18,
            true
        );
        move_to(account, CoinCapabilities {mint_cap, burn_cap, freeze_cap});
    }

    public entry fun mint(account: &signer, user: address, amount: u64) acquires CoinCapabilities {
        let account_addr = signer::address_of(account);

        is_admin(account_addr);
        have_coin_capabilities(account_addr);

        let mint_cap = &borrow_global<CoinCapabilities>(account_addr).mint_cap;
        let coins = coin::mint<DogeCoin>(amount, mint_cap);
        coin::deposit<DogeCoin>(user, coins);
    }

    public entry fun register(account: &signer) {
        coin::register<DogeCoin>(account);
    }

    public entry fun burn(coin: coin::Coin<DogeCoin>) acquires CoinCapabilities {
        let burn_cap = &borrow_global<CoinCapabilities>(@admin).burn_cap;
        coin::burn<DogeCoin>(coin, burn_cap);
    }
}
```

## Publishing the module.

To deploy the module, first type this command to generate an address that we can use to deploy using aptos cli.

```bash
aptos init
```

And airdrop some tokens from faucet for gas fee.

```bash
aptos account fund-with-faucet --account default
```

Now you'll get the info about thie address at the location `.aptos/config.yaml` in your root directory of the project, copy the address from it and paste it in the `[addresses]` section of `Move.toml`.

```toml
[package]
name = 'coin'
version = '1.0.0'
upgrade_policy = "compatible"

[dependencies.AptosFramework]
git = 'https://github.com/aptos-labs/aptos-core.git'
rev = 'main'
subdir = 'aptos-move/framework/aptos-framework'

[addresses]
admin = "0xb921408807cd2c075b63d6ea867485d4dc3e71e04ae3f4b86e8e328c73e10972"
coin = "0xb921408807cd2c075b63d6ea867485d4dc3e71e04ae3f4b86e8e328c73e10972"
```

> Make sure to replace `0xb921408807cd2c075b63d6ea867485d4dc3e71e04ae3f4b86e8e328c73e10972` with your own address.

To publish the module type the folowing command.

```bash
aptos move publish
```

> If you face some issue with gas use this flag `--max-gas 10000`.

Now you'll get info about the transaction, in my case it was.

```json
{
  "Result": {
    "transaction_hash": "0x16d355b37133cc5a356d41976d15a167807ee7f3c7c4c1b49af114565f803942",
    "gas_used": 8216,
    "gas_unit_price": 100,
    "sender": "b921408807cd2c075b63d6ea867485d4dc3e71e04ae3f4b86e8e328c73e10972",
    "sequence_number": 0,
    "success": true,
    "timestamp_us": 1666448024207169,
    "version": 20220068,
    "vm_status": "Executed successfully"
  }
}
```

You can see that the sender is the account that we've generated using `aptos init`. You can take a look at the transaction hash in the block explorer of Aptos network to know more about the transaction.

To interact with the funtions without writing a lot of client side code, you can use this [site](https://aptos-module-explorer.vercel.app/) that allows you to connect to your wallet and call any entry function from a module.

Import the account that you created from the cli by importing it's private key from the path `.aptos/config.yaml` and then connect wallet to this site.

Use the following information, make sure to replace my account with your account.
![](/2022-10-22-21-50-22.png)

Call the register method first and then mint some coins to your wallet.

![](/2022-10-22-21-51-55.png)

To mint fill your address and amount you want to mint and sign the transaction. You can see from the transaction info that you'll be credited with `0.1 DOGE`.

<center>
<img src="/2022-10-22-21-53-14.png" width="300" />
</center>

> Petra wallet might have some decimal issue?

And finally you have your token in your wallet.

<center>
<img src="/2022-10-22-21-54-57.png" width="300" />
</center>