+++
title = "Generate pseudo random numbers in move on Aptos."
description = "Use not so random for normal work."
date = 2022-10-31

[taxonomies]
tags = ["move", "aptos", "sui", "smart contracts", "blockchain"]
+++

This is very similar to casting a `keccak256` hash into an `uint256`.

## Code

```move
module pseudo_random::random {
    use aptos_std::aptos_hash;
    use std::debug;

    const E_WTF_DUDE: u64 = 0;

    public fun get_random_number(hash: vector<u8>): u64 {
        let a = aptos_hash::sip_hash(hash);
        debug::print(&a);
        a
    }
    public fun get_random_between(hash: vector<u8>, low: u64, high: u64): u64 {
        assert!(high > low, E_WTF_DUDE);
        let range = high - low;
        let a = aptos_hash::sip_hash(hash);
        let b = low + (a % range);
        debug::print(&b);
        return low + (a % range)
    }
    #[test()]
    public fun test() {
        get_random_between(aptos_hash::keccak256(b"This is seed"), 100, 1000);
    }
}
```

Use this instead, it's better https://github.com/pentagonxyz/movemate/blob/main/aptos/sources/pseudorandom.move
