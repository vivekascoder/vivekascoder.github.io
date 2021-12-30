---
title: "Onchain Game in Tezos using Random Number Oracle."
author: "Vivek Kumar"
date: "2020-12-17"
tags:
  - Tezos
  - Blockchain
  - Oracle
---

# Write a Game on Tezos using Random Number Oracle

## What is Random Number Oracle?

The random number oracle [Random Number Oracle](https://github.com/asbjornenge/tezos-randomizer) is a oracle that generate seed for the random number called entropy off chain using [Randomizer Service](https://github.com/asbjornenge/tezos-randomizer-service) off-chain. This entropy is combined with the timestamp to yield a truly random number.

The entropy here is generated using `Math.random()` in JavaScript. Take a look at the snippet from the [Randomizer Service](https://github.com/asbjornenge/tezos-randomizer-service).

```js
function genRandomNumber() {
  return Math.floor(Math.random() * (MAX - MIN + 1) + MIN);
}
```

Then `taquito` is used to set this entropy into the main oracle contract after regular interval of times using `setTimeOut`.

```js
export async function setEntropy() {
  let contract = await toolkit.contract.at(CONTRACT_ADDRESS);
  let rn = genRandomNumber();
  let op = await contract.methods.setEntropy(rn).send();
  await op.confirmation(1);
  return op.hash;
}
const setEntropyLoop = async () => {
  try {
    const hash = await setEntropy();
  } catch (e) {
    console.log(`FAIL`, e.message);
  }
  setTimeout(setEntropyLoop, INTERVAL * 1000);
};
```

Then we can use `getRandomBetween()` from the actual oracle contract to get the random number.

```py
@sp.onchain_view()
def getRandomBetween(self, params):
    nat = self.hash_to_nat(sp.sha256(sp.pack(sp.now) + self.data.entropy))
    __from = params._to - params._from + 1
    rnd = nat % sp.as_nat(__from)
    res = rnd + params._from
    sp.result(res)
```

This is how the random number generator oracle works.

## Write contract for the game.

Let's create the Mockup for the Oracle contract to test, because while testing the
onchain views you need to have a contract that has that view. We've also imported smartpy and created a variable to store the oracle address that we'll use later.

```py
import smartpy as sp
ORACLE_ADDRESS=sp.address("KT1F3yK7z7AsYvLdHwiJmFnM8thtTHeuZWTf")

class OracleMockup(sp.Contract):
    def __init__(self):
        self.init()

    @sp.onchain_view()
    def getRandomBetween(self, params):
        sp.set_type(params, sp.TRecord(_from=sp.TNat, _to=sp.TNat))
        sp.result(sp.nat(20))
```

### How will our game work ?

Any user can call `createGame(_name, _money, _user1, _user2)` to create a new game with `_money` as the amount of tezos an user has to pay to play, `_user1` and `_user2` are the two users that will be playing the game and `_name` is the name of the game.

After creating the game users can call `joinGame(_name)` to join the game by paying `_money` amount of tezos.

After both the players paid the money, anyone of them can call `playGame(_name)` to play the game which will call the oracle for the random number and based on that the winner will be decided.

### Storage of the game contract

The storage consist of two things, first thing is the `oracleAddress` which is the address of the oracle contract and second thing is the `matches` which is a mapping of the game name to the game information. Take a look below to see the code.

```py
self.init(
    oracleAddress=_oracleAddress,
    matches = sp.big_map(
        l = {},
        tkey=sp.TString,
        tvalue=sp.TRecord(
            money=sp.TMutez,
            user1=sp.TAddress,
            user1Paid=sp.TBool,
            user2=sp.TAddress,
            user2Paid=sp.TBool,
            winner=sp.TOption(sp.TAddress),
        )
    )
)
```

The various entrypoints are as follows.

1. Create Game entry point

```py
@sp.entry_point
def createMatch(self, _name, _money, _user1, _user2):
    matchData = sp.local('matchData', sp.record(
            money=_money,
            user1=_user1,
            user1Paid=False,
            user2=_user2,
            user2Paid=False,
            winner=sp.none
        ))
    self.data.matches[_name] = matchData.value
```

2. Pay Match Fee entry point
   The players of a specific match will call this entry point to pay the match fee.

```py
@sp.entry_point
def payMatchFee(self, _name):
    sp.verify(self.data.matches.contains(_name), 'MATCH_DOES_NOT_EXIST')
    sp.verify(sp.amount == self.data.matches[_name].money, 'NOT_REQUIRED_MONEY')

    sp.if self.data.matches[_name].user1 == sp.sender:
        self.data.matches[_name].user1Paid = True
    sp.else:
        # if the sender who sent the transaction is not user1 then
        # he must be user2, otherwise we'll raise an error.
        sp.verify(self.data.matches[_name].user2 == sp.sender, 'USER_NOT_IN_GAME')
        self.data.matches[_name].user2Paid = True
```

3. Play Match entry point
   This will be called by any one of the players of the game to play the game. It will call the call the oracle contract to get the random number and based on that the winner will be decided.

```py
@sp.entry_point
def playGame(self, _name):
    sp.verify(self.data.matches.contains(_name), 'MATCH_DOES_NOT_EXIST')
    sp.verify(
        (self.data.matches[_name].user1 == sp.sender) |
        'USER_NOT_IN_GAME'
    )
    sp.verify(
        (self.data.matches[_name].user1Paid == sp.bool(True)) &
        (self.data.matches[_name].user2Paid == sp.bool(True)),
        'USERS_HAVE_NOT_PAID_MONEY'
    )

    # Calculate winnerAmount
    winnerAmount = sp.local('winnerAmount',
        sp.utils.nat_to_mutez(
            sp.utils.mutez_to_nat(self.data.matches[_name].money) * 2
        )
    )

    # Call the oracle and get the random no and end the
    # game give all the money to one user.
    randomNo = sp.view(
            "getRandomBetween",
            self.data.oracleAddress,
            sp.record(_from=sp.nat(1), _to=sp.nat(100)),
            sp.TNat
        ).open_some('WRONG_ORACLE_CONTRACT')

    sp.if randomNo <= sp.nat(50):
        # User1 won
        self.data.matches[_name].winner = sp.some(self.data.matches[_name].user1)
        sp.send(self.data.matches[_name].user1, winnerAmount.value)
    sp.else:
        # User2 won
        self.data.matches[_name].winner = sp.some(self.data.matches[_name].user2)
        sp.send(self.data.matches[_name].user2, winnerAmount.value)
```

You can now test this contract with the help of Mockup contract that we've created.

```py
sp.add_compilation_target("Compile", RandomFeeder(_oracleAddress=ORACLE_ADDRESS))

@sp.add_test(name="Test RandomFeeder")
def test():
    scenario = sp.test_scenario()
    user1 = sp.test_account("User1")
    user2 = sp.test_account("User2")

    oracle = OracleMockup()
    r = RandomFeeder(_oracleAddress=oracle.address)

    scenario += r
    scenario += oracle
    gameName = "game"
    r.createMatch(sp.record(_name=gameName, _money=sp.mutez(500000), _user1=user1.address, _user2=user2.address)).run(sender=user1)

    r.payMatchFee(gameName).run(sender=user1.address, amount=sp.mutez(500000))
    r.payMatchFee(gameName).run(sender=user2.address, amount=sp.mutez(500000))
    r.playGame(gameName).run(sender=user1)
```

### Deploying the contract.

You can directly deploy the contract with smartpy cli with these steps.

1. Compiling the contract.

```bash
smartpy compile ./game.py ./output --html
```

2. For deploying the contract.

```bash
smartpy originate-contract \
    --code ./output/Compile/step_000_cont_0_contract.tz \
    --storage ./output/Compile/step_000_cont_0_storage.tz \
    --rpc https://hangzhounet.smartpy.io/
```

Now, you can use the better-call.dev to interact with this contract.

### How to build the UI ?

Well, you can use the `taquito` library to create it, I haven't done that for this tutorial but you can take it as an exercise. In case you completed it you can share it on twitter and tag me `@vivekascoder`. :)
