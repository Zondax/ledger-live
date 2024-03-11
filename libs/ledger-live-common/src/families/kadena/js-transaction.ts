import BigNumber from "bignumber.js";
import { Transaction } from "./types";
import { Account } from "@ledgerhq/types-live";

export const createTransaction = (): Transaction => {
  // log("debug", "[createTransaction] creating base tx");
  return {
    family: "kadena",
    amount: new BigNumber(0),
    fees: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    receiverChainId: 0,
    senderChainId: 0,
  };
};

export const prepareTransaction = async (a: Account, t: Transaction): Promise<Transaction> => {
  // log("debug", "[prepareTransaction] start fn");

  //   const { address } = getAddress(a);
  //   const { recipient } = t;

  //   let amount: BigNumber = t.amount;
  //   if (recipient && address) {
  //     // log("debug", "[prepareTransaction] fetching estimated fees");

  //     if ((await validateAddress(recipient)).isValid && (await validateAddress(address)).isValid) {
  //       if (t.useAllAmount) {
  //         amount = a.spendableBalance.minus(t.fees);
  //         return { ...t, amount };
  //       }
  //     }
  //   }

  // log("debug", "[prepareTransaction] finish fn");
  return t;
};
