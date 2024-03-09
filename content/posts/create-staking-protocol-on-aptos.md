+++
title = "Create a staking protocol on Aptos for any coin."
description = "Learn how to build a staking protocol on Aptos with any coin you want."
date = 2024-03-09

[taxonomies]
tags = ["aptos", "DeFi", "blockchain", "move"]
+++

# Intro
Please use `Table<K, V>` instead of `SimpleMap<K, V>`.

# Code

```rust
/// In generics <S, R>, S represents the StakedCoin and R represents the RewardCoin.
module staking::staking_coin {
    use std::signer;
    use aptos_std::math64::{Self as math};
    use aptos_framework::timestamp;
    use aptos_framework::simple_map::{Self, SimpleMap};
    use aptos_framework::coin;
    use aptos_framework::account;

    ///
    /// Constants
    /// 

    const ONE_E_6: u64 = 1000000;

    const E_USER_DOES_NOT_HAVE_ENOUGH_STAKED_COINS: u64 = 0;
    const E_REWARD_AMOUNT_NOT_MORE_THAN_ZERO: u64 = 1;
    const E_CANT_STOP_IN_PAST: u64 = 2;
    const E_POOL_CREATOR_DOESNOT_HAVE_ENOUGH_REWARD_COIN: u64 = 2;
    const E_NOT_VALID_STAKE_AMOUNT: u64 = 3;
    const E_STAKER_DOESNOT_HAVE_ENOUGH_STAKE_COIN: u64 = 4;
    const E_NOT_VALID_UNSTAKE_AMOUNT: u64 = 5;
    const E_RESOURCE_DOES_NOT_OWN_ENOUGH_STAKE_COIN: u64 = 6;


    /// 
    /// Resources
    /// 

    struct StakingInfo<phantom StakingCoin, phantom RewardCoin> has key {
        signer_cap: account::SignerCapability,
        updateAt: u64,
        rewardRate: u64,
        finishAt: u64,
        rewardPerTokenStored: u64,
        totalSupply: u64,
        userRewardPerTokenPaid: SimpleMap<address, u64>,
        rewards: SimpleMap<address, u64>,
        balanceOf: SimpleMap<address, u64>
    }

    /// 
    /// Other Functions
    /// 
    
    fun get_signer(cap: &account::SignerCapability): signer {
        account::create_signer_with_capability(cap)
    }

    fun increase_balance<S, R>(staking_info: &mut StakingInfo<S, R>, addr: address, amount: u64) {
        if (simple_map::contains_key<address, u64>(&staking_info.balanceOf, &addr)) {
            let balance = simple_map::borrow_mut<address, u64>(&mut staking_info.balanceOf, &addr);
            *balance = *balance + amount;
        } else {
            simple_map::add<address, u64>(&mut staking_info.balanceOf, addr, amount);
        };
    }

    fun decrease_balance<S, R>(staking_info: &mut StakingInfo<S, R>, addr: address, amount: u64) {
        if (!simple_map::contains_key<address, u64>(&staking_info.balanceOf, &addr)) {
            simple_map::add<address, u64>(&mut staking_info.balanceOf, addr, 0);
        };
        let balance = simple_map::borrow_mut<address, u64>(&mut staking_info.balanceOf, &addr);
        assert!(amount <= *balance, E_USER_DOES_NOT_HAVE_ENOUGH_STAKED_COINS);
        *balance = *balance - amount;
    }

    fun rewardPerToken<S, R>(staking_info: &StakingInfo<S, R>): u64 {
        if (staking_info.totalSupply == 0) {
            staking_info.rewardPerTokenStored
        } else {
            let lastTimeRewardApplicable = math::min(timestamp::now_microseconds(), staking_info.finishAt);
            staking_info.rewardPerTokenStored + (staking_info.rewardRate * (lastTimeRewardApplicable - staking_info.updateAt) * ONE_E_6) / staking_info.totalSupply
        }
    }

    public fun earned<S, R>(staking_info: &StakingInfo<S, R>, addr: address): u64 {
        let userBalance = simple_map::borrow(&staking_info.balanceOf, &addr);
        let userRewards = simple_map::borrow(&staking_info.rewards, &addr);
        let userRewardPerTokenPaid = simple_map::borrow(&staking_info.userRewardPerTokenPaid, &addr);
        let rewardPerToken = rewardPerToken<S, R>(staking_info);
        *userRewards + (*userBalance * (rewardPerToken - *userRewardPerTokenPaid) / ONE_E_6)
    }

    fun updateRewards<S, R>(addr: address) acquires StakingInfo {
        let staking_info = borrow_global_mut<StakingInfo<S, R>>(@staking);

        if(!simple_map::contains_key<address, u64>(&staking_info.balanceOf, &addr)) {
            simple_map::add<address, u64>(&mut staking_info.balanceOf, addr, 0);
        };
        if(!simple_map::contains_key<address, u64>(&staking_info.rewards, &addr)) {
            simple_map::add<address, u64>(&mut staking_info.rewards, addr, 0);
        };
        if(!simple_map::contains_key<address, u64>(&staking_info.userRewardPerTokenPaid, &addr)) {
            simple_map::add<address, u64>(&mut staking_info.userRewardPerTokenPaid, addr, 0);
        };

        let earnedRewards = earned<S, R>(staking_info, addr);

        // Update `rewardPerTokenStored`.
        staking_info.rewardPerTokenStored = rewardPerToken(staking_info);
        staking_info.updateAt = math::min(timestamp::now_microseconds(), staking_info.finishAt);
    
        if (!simple_map::contains_key<address, u64>(&staking_info.rewards, &addr)) {
            simple_map::add<address, u64>(&mut staking_info.rewards, addr, 0);
        };

        // Store updated rewards of the user.
        let rewards = simple_map::borrow_mut<address, u64>(&mut staking_info.rewards, &addr);
        *rewards = earnedRewards
    }

    ///
    /// Entry Functions
    /// 
    
    /// Create a new StakingInfo
    /// `rewardAmount` is the amount of reward tokens to distribute.
    /// `finishAt` is the timestamp upto which rewards are distributed.
    public entry fun init_staking<S, R>(account: &signer, rewardAmount: u64, finishAt: u64) {
        let (resource, signer_cap) = account::create_resource_account(account, b"SEED_COIN");
        let now = timestamp::now_microseconds();

        assert!(rewardAmount > 0, E_REWARD_AMOUNT_NOT_MORE_THAN_ZERO);
        assert!(finishAt > now, E_CANT_STOP_IN_PAST);
        assert!(coin::balance<R>(signer::address_of(account)) >= rewardAmount, E_POOL_CREATOR_DOESNOT_HAVE_ENOUGH_REWARD_COIN);

        coin::register<S>(&resource);
        coin::register<R>(&resource);

        coin::transfer<R>(account, signer::address_of(&resource), rewardAmount);
        let rewardRate = rewardAmount / (finishAt - now);

        move_to(account, StakingInfo<S, R> {
            signer_cap: signer_cap,
            updateAt: 0,
            rewardRate: rewardRate,
            finishAt: finishAt,
            rewardPerTokenStored: 0,
            totalSupply: 0,
            userRewardPerTokenPaid: simple_map::create<address, u64>(),
            rewards: simple_map::create<address, u64>(),
            balanceOf: simple_map::create<address, u64>()
        });
    }
    
    /// Allows user to stake coins.
    public entry fun stake<S, R>(account: &signer, amount: u64) acquires StakingInfo {
        let addr = signer::address_of(account);

        // Update rewards upto now - 1 first.
        updateRewards<S, R>(addr);

        let staking_info = borrow_global_mut<StakingInfo<S, R>>(@staking);
        let resourse_signer = get_signer(&staking_info.signer_cap);
        let resource_addr = signer::address_of(&resourse_signer);

        assert!(amount > 0, E_NOT_VALID_STAKE_AMOUNT);
        assert!(coin::balance<S>(addr) >= amount, E_STAKER_DOESNOT_HAVE_ENOUGH_STAKE_COIN);

        coin::transfer<S>(account, resource_addr, amount);
        staking_info.totalSupply = staking_info.totalSupply + amount;

        increase_balance(staking_info, addr, amount);
    }

    /// Allows user to remove their staked coins.
    /// `amount` is the amount of staked token to remove.
    public entry fun unstake<S, R>(account: &signer, amount: u64) acquires StakingInfo {
        let addr = signer::address_of(account);

        // Update rewards upto now - 1 first.
        updateRewards<S, R>(addr);

        let staking_info = borrow_global_mut<StakingInfo<S, R>>(@staking);
        let resourse_signer = get_signer(&staking_info.signer_cap);
        let resource_addr = signer::address_of(&resourse_signer);

        assert!(amount > 0, E_NOT_VALID_UNSTAKE_AMOUNT);
        // Resource account should have enough balance.
        assert!(coin::balance<S>(resource_addr) >= amount, E_RESOURCE_DOES_NOT_OWN_ENOUGH_STAKE_COIN);

        coin::transfer<S>(&resourse_signer, addr, amount);
        // Decrease balance of user.
        decrease_balance<S, R>(staking_info, addr, amount);
        staking_info.totalSupply = staking_info.totalSupply - amount;
    }

    /// Allows user to claim their rewards.
    public entry fun claim<S, R>(account: &signer) acquires StakingInfo {
        let addr = signer::address_of(account);
        // Update rewards upto now - 1 first.
        updateRewards<S, R>(addr);

        let staking_info = borrow_global_mut<StakingInfo<S, R>>(@staking);
        let resourse_signer = get_signer(&staking_info.signer_cap);
        // let resource_addr = signer::address_of(&resourse_signer);
        let userRewards = simple_map::borrow_mut<address, u64>(&mut staking_info.rewards, &addr);

        if (*userRewards > 0) {
            coin::transfer<R>(&resourse_signer, addr, *userRewards);
            *userRewards = 0;
        }
    }
    
    #[test_only]
    use std::string;
    use std::debug;
    
    #[test_only]
    struct StakingCoin has key {}
    struct RewardCoin has key {}
    struct MintAbility<phantom C> has key {
        mint_cap: coin::MintCapability<C>
    }

    #[test_only]
    public(friend) fun initialize_coin<T>(account: &signer) {
        let (burn_cap, freeze_cap, mint_cap) = coin::initialize<T>(
            account,
            string::utf8(b"COIN"),
            string::utf8(b"COIN NAME"),
            8, /* decimals */
            true, /* monitor_supply */
        );
        coin::destroy_freeze_cap(freeze_cap);
        coin::destroy_burn_cap(burn_cap);

        move_to(account, MintAbility {mint_cap});
    }

    #[test_only]
    public fun mint<T>(tokner: &signer, to: address, amount: u64) acquires MintAbility {
        let mint_cap = borrow_global<MintAbility<T>>(signer::address_of(tokner));
        coin::deposit<T>(to, coin::mint<T>(amount, &mint_cap.mint_cap));
    }
    
    #[test(tokner=@staking, admin=@0xAB, staker=@0xAC, af=@0x1)]
    public fun test_staking(tokner: &signer, admin: &signer, af: &signer, staker: &signer) acquires MintAbility, StakingInfo {
        let finishAt = 1000;
        let admin_addr = signer::address_of(admin);
        let staker_addr = signer::address_of(staker);
        let tokner_addr = signer::address_of(tokner);

        // Start timestamp for test.
        timestamp::set_time_has_started_for_testing(af);

        // Create account for test.
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(staker_addr);
        account::create_account_for_test(tokner_addr);

        // Register coinstore
        coin::register<StakingCoin>(admin);
        coin::register<RewardCoin>(admin);
        coin::register<StakingCoin>(staker);
        coin::register<RewardCoin>(staker);
        coin::register<StakingCoin>(tokner);
        coin::register<RewardCoin>(tokner);

        // Init the coin
        initialize_coin<StakingCoin>(tokner);
        initialize_coin<RewardCoin>(tokner);

        // Mint some monney.
        mint<StakingCoin>(tokner, staker_addr, 1000);    
        mint<RewardCoin>(tokner, tokner_addr, 100000);

        // Create a staking pool.
        debug::print(&coin::balance<RewardCoin>(tokner_addr));
        init_staking<StakingCoin, RewardCoin>(tokner, 100000, finishAt);

        // Let's stake some monney.
        debug::print(&coin::balance<StakingCoin>(staker_addr));
        stake<StakingCoin, RewardCoin>(staker, 1000);
        debug::print(&coin::balance<StakingCoin>(staker_addr));

        timestamp::update_global_time_for_test(500);

        claim<StakingCoin, RewardCoin>(staker);
        debug::print(&coin::balance<RewardCoin>(staker_addr));

        unstake<StakingCoin, RewardCoin>(staker, 1000);
        debug::print(&coin::balance<StakingCoin>(staker_addr));
    }
}
```