import { Account, TransactionCommon } from "@ledgerhq/types-live";
import type { OutputInfo, Transaction } from "./types";

import { getAccountNetworkInfo } from "../bitcoin/getAccountNetworkInfo";
import { inferFeePerByte } from "../bitcoin/logic";
import BigNumber from "bignumber.js";

import type { Transaction as BTCTransaction } from "../bitcoin/types";
import { buildTransaction } from "./js-buildTransaction";

async function prepareTransaction(a: Account, t: Transaction): Promise<Transaction> {
  let networkInfo = t.networkInfo;

  if (!networkInfo) {
    const info = await getAccountNetworkInfo(a);
    networkInfo = {
      ...info,
      family: "zcash",
    };
  }

  const reduced_tx = t as TransactionCommon & { feePerByte: BigNumber | null | undefined };
  const btc_like_tx = reduced_tx as BTCTransaction;
  const feePerByte = inferFeePerByte(btc_like_tx, { ...networkInfo, family: "bitcoin" });

  if (
    (t.networkInfo === networkInfo &&
      (feePerByte === t.feePerByte || feePerByte.eq(t.feePerByte || 0))) ||
    t.feesStrategy === "custom"
  ) {
    // nothing changed
    return t;
  }

  const walletTx = await buildTransaction(a, t);

  let inputs = walletTx.inputs.map(i => {
    let outp = Buffer.concat([Buffer.from(i.output_hash, "hex"), Buffer.alloc(4)]);
    outp.writeUint32LE(i.output_index, outp.length - 4);

    return {
      address: i.address,
      value: new BigNumber(i.value),
      outp: outp.toString("hex"),
      previousTxHash: i.output_hash,
      previousOutputIndex: i.output_index,
    };
  });
  let outputs = walletTx.outputs.map(o => {
    return {
      outputIndex: walletTx.outputs.indexOf(o),
      address: o.address,
      isChange: o.isChange,
      value: new BigNumber(o.value),
      hash: null as string | null,
      blockHeight: null as number | null,
    } as OutputInfo;
  });

  return {
    ...t,
    inputs,
    outputs,
    networkInfo,
    feePerByte,
  };
}

export default prepareTransaction;
