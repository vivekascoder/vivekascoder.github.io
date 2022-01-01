---
title: "Limit Orders for DEX"
---

## What are Limit Orders ?

Limit order is a request to buy or sell (swap) assets on DEX with predetermined
prizes, the order will only be executed when the price of the asset reached the
desired value. The order can have a exiration time, like if the expiration is
of 1 day then if the price doesn't reached the desired value, the trade order
will be canceled.

## How do Limit Order Works ?

### What I've understood by reading the docs.

Since it's a way to add request for trade at a specific price, we'll need to
have a oracle service that will constantly watch the price on the DEX and then
see if we reached some desired price for some value, if it's the case we'll
execute the trade.

```
+------------------+
|                  |-----------+
|                  |           |
|   PLENTY DEX     |           |
|                  |           |
+------------------+           |
                         +-----|------------------+
                         |                        |
                         |                        |
                         |  Limit Order Oracle    |
                         |       Contract         |
                         |                        |
                         |                        |
                         +-----|------------------+
     +----------+              |
     |          |              |
     | USER     |--------------+
     +----------+
```

### What I've learned by reading existing implementation.

### Chainlink Keepers

Let's talk about chainlink keepers, it's an oracle that help you to trigger the
functions of smart contract.

A keeper compatible contract has two impotrant methods namely `checkUpKeep` and
`performUpKeep`. The first method is executed offchian by the chainlink keeper
nodes and see if a particular condition is met and if it's the case then we'll
execute the second method and take some LINK from you as a gas fee to call the
`performUpKeep` method with the argument retuned from the `checkUpKeep` i.e `performData`.

```solidity
function checkUpkeep(
  bytes calldata checkData
)
  external
  returns (
    bool upkeepNeeded,
    bytes memory performData
  );

```

For example:

```solidity
function checkUpkeep(bytes calldata checkData) public view returns(bool, bytes memory) {
  address wallet = abi.decode(checkData, (address));
  return (wallet.balance < 1 ether, bytes(""));
}

function performUpkeep(bytes calldata performData) external {
  address[] memory wallets = abi.decode(performData, (address[]));
  for (uint256 i = 0; i < wallets.length; i++) {
    payable(wallets[i]).transfer(1 ether);
  }
}
```

## How to code Limit Orders ?

![Flow Diagram](/notes/images/2021-12-31-18-56-00.png)

## 🌈 References

- https://docs.sushi.com/products/limit-order-v2
- https://github.com/1inch/limit-order-protocol
- [Signing and Verifying Data in Ethereum](https://ethereum.stackexchange.com/questions/90625/how-to-sign-and-verify-data-with-ethereumjs-utils)
- [Signing and Verifying data in Smartpy](https://smartpy.io/docs/types/signatures/)
- [Signing data in Taquito using user's private key](https://tezostaquito.io/docs/signing/)
- [Chainlink Keepers](https://docs.chain.link/docs/chainlink-keepers/compatible-contracts/#performdata)
- [Uniswap Range Orders](https://docs.uniswap.org/protocol/concepts/V3-overview/range-orders)
