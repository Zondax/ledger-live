import { Account } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { buildTransaction } from "./js-buildTransaction";

export async function getFeesForTransaction({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<{ fees: BigNumber; txInputs: any; txOutputs: any }> {
  const walletTx = await buildTransaction(account, transaction);

  let txInputs = walletTx.inputs.map(i => {
    return {
      address: i.address,
      value: new BigNumber(i.value),
      previousTxHash: i.output_hash,
      previousOutputIndex: i.output_index,
    };
  });
  let txOutputs = walletTx.outputs.map(o => {
    return {
      outputIndex: walletTx.outputs.indexOf(o),
      address: o.address,
      isChange: o.isChange,
      value: new BigNumber(o.value),
      hash: undefined,
      blockHeight: undefined,
    };
  });
  return { fees: new BigNumber(1000), txInputs, txOutputs };
}
