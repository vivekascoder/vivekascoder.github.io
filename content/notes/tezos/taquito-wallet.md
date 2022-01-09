---
title: "How to use taquito + Beacon Wallet"
---

## Program

```js
import { TezosToolkit } from "@taquito/taquito";
import { BeaconWallet } from "@taquito/beacon-wallet";
import config from "../config";
import { OpKind } from "@taquito/taquito";

const preferredNetwork = "hangzhounet";
const options = {
  name: "NFT",
  iconUrl: "https://tezostaquito.io/img/favicon.png",
  preferredNetwork: preferredNetwork,
};
const rpcURL = "https://hangzhounet.smartpy.io";
const wallet = new BeaconWallet(options);

const getActiveAccount = async () => {
  return await wallet.client.getActiveAccount();
};

const connectWallet = async () => {
  let account = await wallet.client.getActiveAccount();

  if (!account) {
    await wallet.requestPermissions({
      network: { type: preferredNetwork },
    });
    account = await wallet.client.getActiveAccount();
  }
  return { success: true, wallet: account.address };
};

const disconnectWallet = async () => {
  await wallet.disconnect();
  return { success: true, wallet: null };
};

const checkIfWalletConnected = async (wallet) => {
  try {
    const activeAccount = await wallet.client.getActiveAccount();
    if (!activeAccount) {
      await wallet.client.requestPermissions({
        type: { network: preferredNetwork },
      });
    }
    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};

export const changeName = async (name) => {
  const response = await checkIfWalletConnected(wallet);

  if (response.success) {
    const tezos = new TezosToolkit(rpcURL);
    tezos.setWalletProvider(wallet);
    const contract = await tezos.wallet.at(config.contractAddress);
    const operation = await contract.methods.default(name).send();
    const result = await operation.confirmation();
    console.log(result);
  }
};

export const mintNFT = async (quantity) => {
  const tezos = new TezosToolkit(rpcURL);
  tezos.setWalletProvider(wallet);

  const contract = await tezos.wallet.at(config.contractAddress);

  let microTransactions = [];
  for (let i = 0; i < quantity; i++) {
    microTransactions.push({
      kind: OpKind.TRANSACTION,
      ...contract.methods.mint(i).toTransferParams(),
      amount: 3000000,
      mutez: true,
    });
  }

  const batch = await tezos.wallet.batch(microTransactions);
  const batchOp = await batch.send();
  console.log("Operation hash:", batchOp);
  let hash = batchOp.opHash;
  await batchOp.confirmation();
  return {
    success: true,
    hash: hash,
  };
};

export {
  connectWallet,
  disconnectWallet,
  getActiveAccount,
  checkIfWalletConnected,
};
```
