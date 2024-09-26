import { GetAccountShape } from "../../../../bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "../../../../account";
import { fetchBalance, fetchBlockHeight, fetchTxns } from "./api";
import flatMap from "lodash/flatMap";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { ICP_FEES } from "../../consts";
import { encodeOperationId } from "../../../../operation";
import { deriveAddressFromPubkey, normalizeEpochTimestamp } from "../../utils";
import { TransactionWithId } from "@dfinity/ledger-icp/dist/candid/index";
import { InternetComputerOperation } from "../../types";
import invariant from "invariant";
import { hashTransaction } from "./hash";

export const getAccountShape: GetAccountShape = async info => {
  const { currency, derivationMode, rest = {}, initialAccount } = info;
  const publicKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(publicKey, "publicKey is required");

  // deriving address from public key
  const address = deriveAddressFromPubkey(publicKey);
  invariant(address, "address is required");

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  // log("debug", `Generation account shape for ${address}`);

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalance(address);

  const txns = await fetchTxns(address);
  const result: Partial<Account> = {
    id: accountId,
    balance,
    spendableBalance: balance,
    operations: flatMap(txns, mapTxToOps(accountId, address)),
    blockHeight: blockHeight.toNumber(),
    operationsCount: txns.length,
    xpub: publicKey,
  };

  return result;
};

function reconciliatePublicKey(publicKey?: string, initialAccount?: Account): string {
  if (publicKey) return publicKey;
  if (initialAccount) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    return xpubOrAddress;
  }
  throw new Error("publicKey wasn't properly restored");
}

const mapTxToOps = (accountId: string, address: string, fee = ICP_FEES) => {
  return (txInfo: TransactionWithId): InternetComputerOperation[] => {
    const { transaction: txn } = txInfo;
    const ops: InternetComputerOperation[] = [];

    const timeStamp = txn.timestamp[0]?.timestamp_nanos ?? Date.now();
    let amount, fromAccount, toAccount, hash;
    if ("Transfer" in txn.operation) {
      amount = BigNumber(txn.operation.Transfer.amount.e8s.toString());
      fromAccount = txn.operation.Transfer.from;
      toAccount = txn.operation.Transfer.to;
      hash = hashTransaction({
        from: fromAccount,
        to: toAccount,
        amount: txn.operation.Transfer.amount.e8s,
        fee: txn.operation.Transfer.fee.e8s,
        memo: txn.memo,
        created_at_time: txn.created_at_time[0]?.timestamp_nanos ?? BigInt(0),
      });
    }

    // TODO: calculate block height, block hash
    const blockHeight = Number(txInfo.id);
    const blockHash = "";

    const memo = txInfo.transaction.memo.toString();

    const date = new Date(normalizeEpochTimestamp(timeStamp.toString()));
    const value = amount.abs();
    const feeToUse = BigNumber(fee);

    const isSending = address === fromAccount;
    const isReceiving = address === toAccount;

    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash,
        type: "OUT",
        value: value.plus(feeToUse),
        fee: feeToUse,
        blockHeight,
        blockHash,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          memo,
        },
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value,
        fee: feeToUse,
        blockHeight,
        blockHash,
        accountId,
        senders: [fromAccount],
        recipients: [toAccount],
        date,
        extra: {
          memo,
        },
      });
    }

    return ops;
  };
};
