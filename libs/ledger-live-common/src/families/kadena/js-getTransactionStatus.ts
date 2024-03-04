import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "./types";

export const getTransactionStatus = async (
  a: Account,
  t: Transaction,
): Promise<TransactionStatus> => {
  return {
    amount: t.amount,
    errors: {},
    warnings: {},
    estimatedFees: t.fees,
    totalSpent: t.amount.plus(t.fees),
  };
};

export default getTransactionStatus;
