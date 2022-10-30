+++
title = "Create a simple multisig in move lang."
description = "Learn a bit of move by writing a simple multisig wallet."
date = 2022-10-22

[taxonomies]
tags = ["move", "aptos", "sui", "smart contracts", "blockchain"]
+++

## Code

```move
/// A user can create multisig for himself.
/// Create Transaction.
/// Add people as
module multisig::Multisig {
    use std::signer;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{AptosCoin};
    use aptos_std::table;
    use aptos_framework::account::{Self, SignerCapability};

    const E_DOES_NOT_OWN_MULTISIG: u64 = 0;
    const E_CONFIRMATION_NOT_VALID: u64 = 1;
    const E_U_NOT_MULTISIG_ADMIN: u64 = 2;
    const E_NOT_ENOUGH_CONFIRMATION: u64 = 3;
    const E_RESOURCE_ACCOUNT_DOES_NOT_HAVE_ENOUGH_MONEY: u64 = 4;
    const E_ADDRESS_IS_NOT_ADMIN: u64 = 5;

    struct Transaction has store {
        amount: u64,
        to: address,
        executed: bool,
        confirmation: u64
    }

    struct MultiSig has key {
        signer_cap: SignerCapability,
        admins: vector<address>,
        transactions: table::Table<u64, Transaction>,
        tx_index: u64,
        confirmationNeeded: u64,
    }

    public entry fun create_multisig(acc: &signer, admins: vector<address>, confirmationNeeded: u64) {
        let acc_addr = signer::address_of(acc);
        let (_, resource_signer_cap) = account::create_resource_account(acc, b"SECRET_SEED");
        assert!(confirmationNeeded <= vector::length<address>(&admins), E_CONFIRMATION_NOT_VALID);
        move_to(acc, MultiSig {
            signer_cap: resource_signer_cap,
            admins: admins,
            transactions: table::new<u64, Transaction>(),
            tx_index: 0,
            confirmationNeeded: confirmationNeeded
        });
    }

    public entry fun add_admin(acc: &signer, admin: address) acquires MultiSig {
        let acc_addr = signer::address_of(acc);
        assert!(exists<MultiSig>(acc_addr), E_DOES_NOT_OWN_MULTISIG);

        let multi_sig = borrow_global_mut<MultiSig>(acc_addr);
        assert!(vector::contains<address>(&multi_sig.admins, &acc_addr), E_U_NOT_MULTISIG_ADMIN);
        vector::push_back<address>(&mut multi_sig.admins, admin);
    }

    public entry fun remove_admin(acc: &signer, admin: address) acquires MultiSig {
        let acc_addr = signer::address_of(acc);
        assert!(exists<MultiSig>(acc_addr), E_DOES_NOT_OWN_MULTISIG);

        let multi_sig = borrow_global_mut<MultiSig>(acc_addr);
        assert!(vector::contains<address>(&multi_sig.admins, &acc_addr), E_U_NOT_MULTISIG_ADMIN);
        let (status, admin_index) = vector::index_of<address>(&multi_sig.admins, &admin);
        assert!(status, E_ADDRESS_IS_NOT_ADMIN);
        vector::remove<address>(&mut multi_sig.admins, admin_index);
    }

    public entry fun create_transaction(
        acc: &signer,
        multisig_creator: address,
        amount: u64,
        to: address
    ) acquires MultiSig {
        let acc_addr = signer::address_of(acc);
        assert!(exists<MultiSig>(multisig_creator), E_DOES_NOT_OWN_MULTISIG);

        let multi_sig = borrow_global_mut<MultiSig>(multisig_creator);
        assert!(vector::contains<address>(&multi_sig.admins, &acc_addr), E_U_NOT_MULTISIG_ADMIN);

        let transaction = Transaction {
            amount: amount,
            to: to,
            executed: false,
            confirmation: 0
        };
        table::add<u64, Transaction>(&mut multi_sig.transactions, multi_sig.tx_index, transaction);
        multi_sig.tx_index = multi_sig.tx_index + 1;
    }

    public entry fun confirm_transaction(
        acc: &signer,
        multisig_creator: address,
        tx: u64
    ) acquires MultiSig {
        let acc_addr = signer::address_of(acc);
        assert!(exists<MultiSig>(multisig_creator), E_DOES_NOT_OWN_MULTISIG);

        let multi_sig = borrow_global_mut<MultiSig>(multisig_creator);
        assert!(vector::contains<address>(&multi_sig.admins, &acc_addr), E_U_NOT_MULTISIG_ADMIN);

        let transaction = table::borrow_mut<u64, Transaction>(&mut multi_sig.transactions, tx);
        transaction.confirmation = transaction.confirmation + 1;
    }

    public entry fun execute_transaction(
        acc: &signer,
        multisig_creator: address,
        tx: u64
    ) acquires MultiSig {
        let acc_addr = signer::address_of(acc);
        assert!(exists<MultiSig>(multisig_creator), E_DOES_NOT_OWN_MULTISIG);

        let multi_sig = borrow_global_mut<MultiSig>(multisig_creator);
        assert!(vector::contains<address>(&multi_sig.admins, &acc_addr), E_U_NOT_MULTISIG_ADMIN);

        let transaction = table::borrow_mut<u64, Transaction>(&mut multi_sig.transactions, tx);
        assert!(transaction.confirmation >= multi_sig.confirmationNeeded, E_NOT_ENOUGH_CONFIRMATION);

        let resource_signer = account::create_signer_with_capability(&multi_sig.signer_cap);

        assert!(
            coin::balance<AptosCoin>(signer::address_of(&resource_signer)) > transaction.amount,
            E_RESOURCE_ACCOUNT_DOES_NOT_HAVE_ENOUGH_MONEY
        );
        // Execute
        coin::transfer<AptosCoin>(&resource_signer, transaction.to, transaction.amount);
    }
}
```

More info will be added soon.
