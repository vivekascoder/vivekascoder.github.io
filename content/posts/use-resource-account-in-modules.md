+++
title = "Simple pattern to use resource account in move modules on Aptos"
description = "Today we'll see how to simply use resource account in your move modules."
date = 2022-10-26
+++

## Code

```move
module resource_account::resource {
    use std::signer;
    use std::option;
    use aptos_framework::account;

    struct AdminResourceAccountInfo has key{
        resource_signer_cap: account::SignerCapability,
        signed_by: option::Option<address>
    }

    fun init_module(account: &signer) {
        let (_resource, resource_signer_cap) = account::create_resource_account(account, b"SEED");
        move_to(account, AdminResourceAccountInfo {
            resource_signer_cap,
            signed_by: option::none()
        });
    }

    fun sign_with_resource_account(account: &signer) acquires AdminResourceAccountInfo {
        let resource_signer_cap = borrow_global_mut<AdminResourceAccountInfo>(signer::address_of(account));
        let resource_signer = account::create_signer_with_capability(&resource_signer_cap.resource_signer_cap);

        // Use resource_signer for whatever you want.
        resource_signer_cap.signed_by = option::some<address>(signer::address_of(&resource_signer));
    }
}
```

If you see this error then it's most prolly because you're trying to use a resource account that already exists.

```
package size 1466 bytes
{
  "Error": "Simulation failed with status: Move abort in 0x1::account: 0x8000f"
}
```
