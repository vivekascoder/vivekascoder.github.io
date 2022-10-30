+++
title = "Learn Move on Aptos by building a Vault protocol."
description = "In this article we'll see how to build a simple Vault where you can stake and unstake tokens and get LP tokens in return."
date = 2022-10-22

[taxonomies]
tags = ["move", "aptos", "sui", "smart contracts", "blockchain"]
+++

## Introduction

Aptos is a layer 1 protocol which can provide very high throughput for your DAPPs, It can offer a max TPS of 160K (curtesy of block-stm) and a blocktime of 300ms. It was previously knows as Libra, Diem. It uses Move as it's programming language to write contracts. Move is a DSL based on rust just like sway on fuel.

## Installation

To install aptos cli: [https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli#download-precompiled-binary](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli#download-precompiled-binary)

To install move and move-analyzer: [https://github.com/move-language/move/tree/main/language/documentation/tutorial#Step0](https://github.com/move-language/move/tree/main/language/documentation/tutorial#Step0)

## What's a vault?

It's a simple DEFI protocol where you provide in liquidity in terms of a token and we store it for you in return you get some amount of LP tokens that represents your share in the pool.

If you want to know a simple implementation in solidity refer to this link: [https://solidity-by-example.org/defi/vault/](https://solidity-by-example.org/defi/vault/)

![Vault](/2022-10-22-16-08-14.png)
Source: [https://www.youtube.com/watch?v=k7WNibJOBXE&t=327s](https://www.youtube.com/watch?v=k7WNibJOBXE&t=327s)

## Creating a new move project.

Create a new folder and the create a new move project using aptos cli.

```bash
mkdir move_vault
cd move_vault
aptos move init --name move_vault
```

### Basic structure of a move module.

```
module move_vault::Vault {
    public fun sq(val: u64): u64 {
        val * val
    }

    public entry fun do_something(val: u64): u64 {
        sq(val)
    }
}
```

If you are familier with rust this might look a bit familier, this module has one entry function (which can be callable outside the module) and a public function for us to help with some complex calculation (computing the square of a number).

## Writing Vault module.

Let's import the important stuff that we'll need to create a Vault module.

```move
module aptos_vault::Vault {
    use std::string;
    use std::signer;
    use std::option;

    use aptos_framework::coin;
    use aptos_framework::account;
    use aptos_framework::aptos_coin::{AptosCoin};

    const ENOT_INIT: u64 = 0;
    const ENOT_ENOUGH_LP: u64 = 1;
    const ENOT_DEPLOYER_ADDRESS: u64 = 2;
...
```

Aptos framework offers a lot of move modules to make our life easy, The syntax of imports and declaring constansts is very similar to rust.

Let's declare some resource struct that we'll use to store data, resource struct are a way to store data on the blockchain.

```move
...
    struct LP has key {}

    struct VaultInfo has key {
        mint_cap: coin::MintCapability<LP>,
        burn_cap: coin::BurnCapability<LP>,
        total_staked: u64,
        resource: address,
        resource_cap: account::SignerCapability
    }
```

To learn more about the type abilities (`has store`, `has key`, `has drop`) take a look at this documentation on type abilities [https://diem.github.io/move/abilities.html](https://diem.github.io/move/abilities.html)

The way data is stored on Aptos is v. different to what happens on EVM based chains, to understand this take a look at the image below that shows the difference between EVM and Aptos blockchain data.

![](/2022-10-22-16-21-12.png)
In solidity contracts store the data but in Aptos data (resource struct) are stored in global state and move modules are stored inside a user's address.
![](/2022-10-22-16-22-33.png)

Let's write the module constructor which will be executed during the deployment of the module and this is the place where we'll create a new token (LP token) which is used to represent user's ownership in the pool.

```move


module aptos_vault::VaultV2 {
    use std::string;
    use std::signer;
    use std::option;

    use aptos_framework::coin;
    use aptos_framework::account;
    use aptos_framework::aptos_coin::{AptosCoin};

    const ENOT_INIT: u64 = 0;
    const ENOT_ENOUGH_LP: u64 = 1;
    const ENOT_DEPLOYER_ADDRESS: u64 = 2;

    struct LP has key {}

    struct VaultInfo has key {
        mint_cap: coin::MintCapability<LP>,
        burn_cap: coin::BurnCapability<LP>,
        total_staked: u64,
        resource_cap: account::SignerCapability
    }

    /// Constructor
    fun init_module(sender: &signer) {
        // Only owner can create admin.
        assert!(signer::address_of(sender) == @aptos_vault, ENOT_DEPLOYER_ADDRESS);

        // Create a resource account to hold the funds.
        let (resource, resource_cap) = account::create_resource_account(sender, x"01");
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<LP>(
            sender,
            string::utf8(b"LP Token"),
            string::utf8(b"LP"),
            18,
            false
        );

        // We don't need to freeze the tokens.
        coin::destroy_freeze_cap(freeze_cap);

        // Register the resource account.
        coin::register<LP>(sender);
        coin::register<AptosCoin>(&resource);
        // coin::register<LP>(&resource);

        move_to(sender, VaultInfo {
            mint_cap: mint_cap,
            burn_cap: burn_cap,
            total_staked: 0,
            resource_cap: resource_cap
        });
    }

    /// Signet deposits `amount` amount of LP into the vault.
    /// LP tokens to mint = (token_amount / total_staked_amount) * total_lp_supply
    public entry fun deposit(sender: &signer, amount: u64) acquires VaultInfo {
        let sender_addr = signer::address_of(sender);
        assert!(exists<VaultInfo>(@aptos_vault), ENOT_INIT);

        let vault_info = borrow_global_mut<VaultInfo>(@aptos_vault);
        let resource_signer = account::create_signer_with_capability(&vault_info.resource_cap);
        let resource_addr = signer::address_of(&resource_signer);
        // Deposite some amount of tokens and mint shares.
        coin::transfer<AptosCoin>(sender, resource_addr, amount);

        vault_info.total_staked = vault_info.total_staked + amount;

        // Mint shares
        let shares_to_mint: u64;
        let supply = coin::supply<LP>();
        let total_lp_supply = if (option::is_some(&supply)) option::extract(&mut supply) else 0;

        if (total_lp_supply == 0) {
            shares_to_mint = amount;
        } else {
            shares_to_mint = (amount * (total_lp_supply as u64)) / vault_info.total_staked;
        };
        coin::deposit<LP>(sender_addr, coin::mint<LP>(shares_to_mint, &vault_info.mint_cap));
    }

    /// Withdraw some amount of AptosCoin based on total_staked of LP token.
    public entry fun withdraw(sender: &signer, shares: u64) acquires VaultInfo{
        let sender_addr = signer::address_of(sender);
        assert!(exists<VaultInfo>(@aptos_vault), ENOT_INIT);

        let vault_info = borrow_global_mut<VaultInfo>(@aptos_vault);

        // Make sure resource sender's account has enough LP tokens.
        assert!(coin::balance<LP>(sender_addr) >= shares, ENOT_ENOUGH_LP);

        // Burn LP tokens of user
        let supply = coin::supply<LP>();
        let total_lp_supply = if (option::is_some(&supply)) option::extract(&mut supply) else 0;
        let amount_to_give = shares * vault_info.total_staked / (total_lp_supply as u64);

        coin::burn<LP>(coin::withdraw<LP>(sender, shares), &vault_info.burn_cap);

        // Transfer the locked AptosCoin from the resource account.
        let resource_account_from_cap: signer = account::create_signer_with_capability(&vault_info.resource_cap);
        coin::transfer<AptosCoin>(&resource_account_from_cap, sender_addr, amount_to_give);

        // Update the info in the VaultInfo.
        vault_info.total_staked = vault_info.total_staked - shares;
    }

    /// Admin can add more amount into the pool thus increasing the total_staked amount
    /// but the shares are still same to user's will be able to claim more amount of `AptosCoin` back
    /// than their investments.
    public entry fun add_funds_to_vault(sender: &signer, amount: u64) acquires VaultInfo {
        let sender_addr = signer::address_of(sender);
        // Only owner can create admin.
        assert!(sender_addr == @aptos_vault, ENOT_DEPLOYER_ADDRESS);
        assert!(exists<VaultInfo>(sender_addr), ENOT_INIT);

        let vault_info = borrow_global_mut<VaultInfo>(sender_addr);
        let resource_signer = account::create_signer_with_capability(&vault_info.resource_cap);
        let resource_addr = signer::address_of(&resource_signer);
        coin::transfer<AptosCoin>(sender, resource_addr, amount);

        // Update the `total_staked` value
        vault_info.total_staked = vault_info.total_staked + amount;
    }

    /// Admin can remove funds and invest somewhere else.
    public entry fun remove_funds_from_vault(sender: &signer, amount: u64) acquires VaultInfo {
        let sender_addr = signer::address_of(sender);
        // Only owner can create admin.
        assert!(sender_addr == @aptos_vault, ENOT_DEPLOYER_ADDRESS);
        assert!(exists<VaultInfo>(sender_addr), ENOT_INIT);

        let vault_info = borrow_global_mut<VaultInfo>(sender_addr);
        let resource_signer = account::create_signer_with_capability(&vault_info.resource_cap);

        coin::transfer<AptosCoin>(&resource_signer, @aptos_vault, amount);
        // Update the `total_staked` value
        vault_info.total_staked = vault_info.total_staked - amount;
    }

    #[test_only]
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin;
    // use aptos_framework::resource_account;
    // use aptos_framework::aggregator_factory;

    #[test_only]
    struct FakeCoin {}

    #[test_only]
    struct FakeCoinCapabilities has key {
        mint_cap: coin::MintCapability<FakeCoin>
    }

    #[test_only]
    const ENOT_CORRECT_MINT_AMOUNT: u64 = 10;
    const ENOT_COIN_INITIALIZED: u64 = 11;
    const ENOT_CAPABILITIES: u64 = 12;

    #[test_only]
    struct AptosCoinCapabilities has key {
        mint_cap: coin::MintCapability<AptosCoin>,
    }

    #[test_only]
    public(friend) fun store_aptos_coin_mint_cap(aptos_framework: &signer, mint_cap: coin::MintCapability<AptosCoin>) {
        // system_addresses::assert_aptos_framework(aptos_framework);
        move_to(aptos_framework, AptosCoinCapabilities { mint_cap })
    }


    #[test_only]
    public fun test_aptos_coin(
        aptos_framework: &signer
    ) {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        store_aptos_coin_mint_cap(aptos_framework, mint_cap);
        coin::destroy_burn_cap<AptosCoin>(burn_cap);
    }

    #[test(aptos_framework = @aptos_framework, a = @0xAAAA)]
    public fun test_fake_aptos_mint_works(aptos_framework: &signer, a: &signer) {
        let a_addr = signer::address_of(a);

        aptos_account::create_account(a_addr);
        test_aptos_coin(aptos_framework);

        aptos_coin::mint(aptos_framework, a_addr, 100);
        assert!(coin::balance<AptosCoin>(a_addr) == 100, ENOT_CORRECT_MINT_AMOUNT);
    }

    #[test(aptos_framework = @aptos_framework, a = @aptos_vault)]
    public fun test_init_module_works(aptos_framework: &signer, a: &signer) acquires VaultInfo {
        let a_addr = signer::address_of(a);

        aptos_account::create_account(a_addr);
        test_aptos_coin(aptos_framework);

        aptos_coin::mint(aptos_framework, a_addr, 100);
        assert!(coin::balance<AptosCoin>(a_addr) == 100, ENOT_CORRECT_MINT_AMOUNT);
        init_module(a);

        // Register for LP token
        deposit(a, 100);
    }
}
```

TO BE DONE...
EXPLANATION TBD...
