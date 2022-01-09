---
title: "Simple DEX on Tezos"
---

## Program

```python
import smartpy as sp
fa12 = sp.io.import_script_from_url("https://smartpy.io/templates/FA1.2.py")


class Token(fa12.FA12):
    """ Test FA1.2 Token """
    pass


class StableSwap(sp.Contract):
    def __init__(self, _token_address, _lp_address):
        self.init(
            invariant=sp.nat(0),
            tez_pool=sp.mutez(0),
            token_pool=sp.nat(0),
            token_address=_token_address,
            lp_address=_lp_address,
        )

    def transfer_tokens(self, from_, to, amount):
        """ Utility Function to transfer FA1.2 Tokens."""
        sp.verify(amount > sp.nat(0), 'INSUFFICIENT_TOKENS[transfer_token]')
        transfer_type = sp.TRecord(
            from_=sp.TAddress,
            to_=sp.TAddress,
            value=sp.TNt
        ).layout(("from_ as from", ("to_ as to", "value")))
        transfer_data = sp.record(from_=from_, to_=to, value=amount)
        token_contract = sp.contract(
            transfer_type,
            self.data.token_address,
            "transfer"
        ).open_some()
        sp.transfer(transfer_data, sp.mutez(0), token_contract)

    def transfer_tez(self, to_, amount: sp.TMutez):
        """ Utility function to transfer tezos. """
        sp.send(to_, amount, message="SENDING_TEZ")

    def mint_lp(self, amount):
        """Mint `amount` LP tokens to `sp.sender` account."""
        transfet_type = sp.TRecord(
            address=sp.TAddress,
            value=sp.TNat,
        )
        transfer_value = sp.record(
            address=sp.sender,
            value=amount,
        )
        contract = sp.contract(
            transfet_type,
            self.data.lp_address,
            'mint'
        ).open_some()
        sp.transfer(transfer_value, sp.mutez(0), contract)

    def burn_lp(self, amount):
        """ Burn `amount` LP Tokens. """
        transfet_type = sp.TRecord(
            address=sp.TAddress,
            value=sp.TNat,
        )
        transfer_value = sp.record(
            address=sp.sender,
            value=amount,
        )
        contract = sp.contract(
            transfet_type,
            self.data.lp_address,
            'burn'
        ).open_some()
        sp.transfer(transfer_value, sp.mutez(0), contract)


    @sp.entry_point
    def initialize_enchange(self, token_amount):
        # We just take the sp.amount and then transfer the tokens based on that.
        sp.if ((self.data.token_pool == sp.nat(0)) & (self.data.tez_pool == sp.mutez(0))):
            tez_amount = sp.amount
            sp.verify(token_amount > sp.nat(10), message="NOT_ENOUGH_TOKEN")
            sp.verify((tez_amount > sp.mutez(1)), message="NOT_EMOUGH_TEZ")

            self.data.tez_pool = tez_amount
            self.data.token_pool = token_amount
            self.data.invariant = token_amount * \
                sp.utils.mutez_to_nat(tez_amount)

            self.transfer_tokens(
                from_=sp.sender,
                to=sp.self_address,
                amount=token_amount
            )
        sp.else:
            sp.failwith('ALREADY_INITIALIZED')

    @sp.entry_point
    def invest_liquidity(self):
        sp.verify(sp.amount > sp.mutez(0), message="NOT_ENOUGH_TOKEN")

        total_liquidity = sp.utils.mutez_to_nat(self.data.tez_pool) + self.data.token_pool
        token_amount = sp.utils.mutez_to_nat(sp.amount) * self.data.token_pool / sp.utils.mutez_to_nat(self.data.tez_pool)
        liquidity_minted = sp.utils.mutez_to_nat(sp.amount) * total_liquidity / sp.utils.mutez_to_nat(self.data.tez_pool)
        sp.trace({"liquidity_minted": liquidity_minted})
        # Mint `liquidity_minted` LP tokens to the `sp.sender`
        self.mint_lp(liquidity_minted)

        self.data.tez_pool += sp.amount
        self.data.token_pool += token_amount
        self.data.invariant = sp.utils.mutez_to_nat(self.data.tez_pool) * self.data.token_pool

        self.transfer_tokens(
            from_=sp.sender,
            to=sp.self_address,
            amount=token_amount
        )

    @sp.entry_point
    def divest_liquidity(self, lp_amount: sp.TNat):
        """ Burn LP and give back the liquidity """
        sp.verify(lp_amount > sp.nat(0), 'INVALID_AMOUNT')
        total_liquidity = sp.utils.mutez_to_nat(self.data.tez_pool) + self.data.token_pool

        tez_out = sp.utils.mutez_to_nat(self.data.tez_pool) * lp_amount / total_liquidity
        token_out = self.data.token_pool * lp_amount / total_liquidity

        self.data.tez_pool = self.data.tez_pool - sp.utils.nat_to_mutez(token_out)
        self.data.token_pool = sp.as_nat(self.data.token_pool - token_out)
        self.data.invariant = self.data.token_pool * sp.utils.mutez_to_nat(self.data.tez_pool)

        sp.if tez_out > sp.nat(0):
            self.transfer_tez(to_=sp.sender, amount=sp.utils.nat_to_mutez(tez_out))

        sp.if token_out > sp.nat(0):
            self.transfer_tokens(
                from_=sp.self_address,
                to=sp.sender,
                amount=token_out
            )
        sp.else:
            sp.failwith('NOT_ENOUG_TOKENS')

    @sp.entry_point
    def tez_to_token(self):
        sp.verify(sp.amount > sp.mutez(0), message="NOT_ENOUGH_TEZ")
        tez_in_nat = sp.utils.mutez_to_nat(sp.amount)
        new_tez_pool = self.data.tez_pool + sp.amount
        new_token_pool = sp.local('new_token_pool', sp.nat(0))
        new_token_pool.value = self.data.invariant / sp.utils.mutez_to_nat(new_tez_pool)
        token_out = sp.local('token_out', sp.as_nat(self.data.token_pool - new_token_pool.value))
        self.data.tez_pool = new_tez_pool
        self.data.token_pool = new_token_pool.value
        self.data.invariant = self.data.token_pool * sp.utils.mutez_to_nat(self.data.tez_pool)

        sp.if token_out.value > sp.nat(0):
            self.transfer_tokens(
                from_=sp.self_address,
                to=sp.sender,
                amount=token_out.value
            )

    @sp.entry_point
    def token_to_tez(self, params):
        sp.set_type(params, sp.TRecord(token_amount=sp.TNat))
        sp.verify(params.token_amount > sp.nat(0), message="NOT_ENOUGH_TOKEN")
        new_token_pool = self.data.token_pool + params.token_amount
        new_tez_pool = self.data.invariant / new_token_pool
        self.data.tez_pool = sp.utils.nat_to_mutez(new_tez_pool)
        self.data.token_pool = new_token_pool
        self.data.invariant = new_token_pool * new_tez_pool

        # Transfer `token_amount` to this contract's address
        self.transfer_tokens(
            from_=sp.sender,
            to=sp.self_address,
            amount=params.token_amount
        )

        tez_out = self.data.tez_pool - sp.utils.nat_to_mutez(new_tez_pool)
        # Transfer the swapped tezos.
        self.transfer_tez(to_=sp.sender, amount=tez_out)


@sp.add_test(name="Dex Tests")
def test():
    token_admin = sp.test_account("Token Admin")
    alice = sp.test_account("Alice")
    bob = sp.test_account("Bob")
    scenario = sp.test_scenario()

    token_metadata = {
        "decimals": "9",
        "name": "A Token",
        "symbol": "AT",
        "icon": 'https://smartpy.io/static/img/logo-only.svg'
    }
    lp_token_metadata = {
        "decimals": "6",
        "name": "LP Token",
        "symbol": "LPT",
        "icon": 'https://smartpy.io/static/img/logo-only.svg'
    }
    contract_metadata = {
        "": "ipfs://QmaiAUj1FFNGYTu8rLBjc3eeN9cSKwaF8EGMBNDmhzPNFd",
    }
    lp_contract_metadata = {
        "": "ipfs://QmaiAUj1FFNGYTu8rLBjc3eeN9cSKwaF8EGMBNDmhzPNFd",
    }
    token = Token(
        token_admin.address,
        config=fa12.FA12_config(support_upgradable_metadata=True),
        token_metadata=token_metadata,
        contract_metadata=contract_metadata
    )
    scenario += token

    # lp = Token(
    #     token_admin.address,
    #     config=fa12.FA12_config(support_upgradable_metadata=True),
    #     token_metadata=token_metadata,
    #     contract_metadata=contract_metadata
    # )
    # scenario += token

    stable_swap = StableSwap(_token_address=token.address, _lp_address=sp.address('KT1-LP'))
    scenario += stable_swap

    token.mint(
        address=alice.address,
        value=sp.nat(200_000 * 10 ** 6)
    ).run(sender=token_admin)
    token.mint(
        address=bob.address,
        value=sp.nat(200_000 * 10 ** 6)
    ).run(sender=token_admin)

    # Initialize the exchange.
    # Approve to spend by stable_swap address
    token.approve(
        sp.record(
            spender=stable_swap.address,
            value=sp.nat(100_000 * 10 ** 6)
        )
    ).run(sender=alice)
    stable_swap.initialize_enchange(sp.nat(100_000 * 10 ** 6)).run(
        sender=alice,
        amount=sp.mutez(100_000 * 10 ** 6)
    )

    # Approving again to provide liquidity.
    # token.approve(sp.record(spender=stable_swap.address, value=sp.nat(100))).run(sender=bob)
    # stable_swap.invest_liquidity(sp.record(token_amount=sp.nat(100))).run(sender=bob, amount=sp.mutez(10000000))

    # # Swap 10 tokens in xtz
    # stable_swap.token_to_tez(sp.record(token_amount=sp.nat(1))).run(sender=alice)

    # stable_swap.tez_to_token().run(sender=bob, amount=sp.mutez(1000))
    # stable_swap.tez_to_token().run(sender=bob, amount=sp.mutez(1000))

    # token.approve(sp.record(spender=stable_swap.address, value=sp.nat(1000))).run(sender=bob)
    # stable_swap.token_to_tez(token_amount=sp.nat(1000)).run(sender=bob)

    # token.approve(sp.record(spender=stable_swap.address, value=sp.nat(1000))).run(sender=alice)
    # stable_swap.token_to_tez(token_amount=sp.nat(1000)).run(sender=alice)

    # token.approve(sp.record(spender=stable_swap.address, value=sp.nat(1000))).run(sender=alice)
    # stable_swap.token_to_tez(token_amount=sp.nat(1000)).run(sender=alice)

    # token.approve(sp.record(spender=stable_swap.address, value=sp.nat(1000))).run(sender=alice)
    # stable_swap.token_to_tez(token_amount=sp.nat(1000)).run(sender=alice)

    token.approve(sp.record(spender=stable_swap.address, value=sp.nat(10000 * 10 ** 6))).run(sender=bob)
    stable_swap.invest_liquidity().run(sender=bob, amount=sp.mutez(1000 * 10 ** 6))
    stable_swap.divest_liquidity(sp.nat(100)).run(sender=bob)

```
