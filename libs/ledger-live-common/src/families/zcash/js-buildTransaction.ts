import { Account } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { FeeNotLoaded } from "@ledgerhq/errors";

import { Transaction } from "./types";

import wallet, { DeepFirst, TransactionInfo, getWalletAccount } from "../bitcoin/wallet-btc";

export async function buildTransaction(
  account: Account,
  transaction: Transaction,
): Promise<TransactionInfo> {
  const { feePerByte, recipient } = transaction;

  if (!feePerByte) {
    throw new FeeNotLoaded();
  }
  const walletAccount = getWalletAccount(account);

  //default
  const utxoPickingStrategy = new DeepFirst(
    walletAccount.xpub.crypto,
    walletAccount.xpub.derivationMode,
    [],
  );

  const maxSpendable = await wallet.estimateAccountMaxSpendable(
    walletAccount,
    feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    [],
    [recipient],
  );

  log("zcash", "building transaction", transaction);

  const txInfo = await wallet.buildAccountTx({
    fromAccount: walletAccount,
    dest: transaction.recipient,
    amount: transaction.useAllAmount ? maxSpendable : transaction.amount,
    feePerByte: feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    utxoPickingStrategy,
    sequence: 0,
  });

  log("zcash", "txInfo", txInfo);

  return txInfo;
}
