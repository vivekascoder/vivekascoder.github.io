---
title: "Limit Orders for DEX"
---

## What are Limit Orders ?

Limit order is a request to buy or sell (swap) assets on DEX with predetermined prizes, the order will only be executed when the price of the asset reached the desired value. The order can have a exiration time, like if the expiration is of 1 day then if the price doesn't reached the desired value, the trade order will be canceled.

## How do Limit Order Works ?

### What I've understood by reading the docs.

Since it's a way to add request for trade at a specific price, we'll need to have a oracle service that will constantly watch the price on the DEX and then see if we reached some desired price for some value, if it's the case we'll execute the trade.

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

## How to code Limit Orders ?

## 🌈 References

- https://docs.sushi.com/products/limit-order-v2
- https://github.com/1inch/limit-order-protocol
