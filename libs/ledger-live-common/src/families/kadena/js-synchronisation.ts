import { encodeAccountId } from "../../account";
import { decodeAccountId } from "../../account";
import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { flatMap } from "lodash";
import { fetchBlockHeight, fetchBalances, fetchTransactions } from "./api/network";
import { GetTxnsResponse } from "./api/types";
import { KadenaOperation } from "./types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

const getAddressFromPublicKey = (pubkey: string): string => {
  return `k:${pubkey}`;
};

export const getAccountShape: GetAccountShape = async info => {
  const { initialAccount, currency, rest = {}, derivationMode } = info;
  // for bridge tests specifically the `rest` object is empty and therefore the publicKey is undefined
  // reconciliatePublicKey tries to get pubKey from rest object and then from accountId
  const pubKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(pubKey, "publicKey is required");

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: pubKey,
    derivationMode,
  });

  const address = getAddressFromPublicKey(pubKey);

  const blockHeight = await fetchBlockHeight();
  const balanceResp = await fetchBalances(address);
  const rawTxs = await fetchTransactions(address);
  // const mempoolTxs = await fetchFullMempoolTxs(address);

  let totalBalance = new BigNumber(0);
  for (const balance of balanceResp) {
    totalBalance = totalBalance.plus(balance.balances[0].value);
  }

  const balance = totalBalance;
  let spendableBalance = balance;
  // for (const tx of mempoolTxs) {
  //   spendableBalance = spendableBalance
  //     .minus(new BigNumber(tx.fee_rate))
  //     .minus(new BigNumber(tx.token_transfer.amount));
  // }

  const result: Partial<Account> = {
    id: accountId,
    xpub: pubKey,
    freshAddress: address,
    balance,
    spendableBalance,
    operations: flatMap(rawTxs, mapTxToOps(accountId, info.address)),
    blockHeight: blockHeight.current_block_identifier.index,
  };

  return result;
};

function reconciliatePublicKey(
  publicKey: string | undefined,
  initialAccount: Account | undefined,
): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

const mapTxToOps = (accountId: string, address: string) => {
  return (txInfo: GetTxnsResponse): KadenaOperation[] => {
    const ops: KadenaOperation[] = [];

    const { requestKey, blockTime, height, amount, fromAccount, toAccount, blockHash } = txInfo;

    if (txInfo.token !== "coin") return [];

    const hash = requestKey;

    const blockHeight = height;

    const date = new Date(blockTime);
    const value = new BigNumber(amount);

    const isSending = fromAccount === address;
    const isReceiving = toAccount === address;

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash,
        type: "OUT",
        value,
        fee: new BigNumber(0),
        blockHeight,
        blockHash,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          senderChainId: txInfo.chain,
          receiverChainId: txInfo.crossChainId ?? txInfo.chain,
        },
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value,
        fee: new BigNumber(0),
        blockHeight,
        blockHash,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          senderChainId: txInfo.chain,
          receiverChainId: txInfo.crossChainId ?? txInfo.chain,
        },
      });
    }

    return ops;
  };
};
