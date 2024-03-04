import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";

export const estimateMaxSpendable = async (_arg: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}) => {
  return new BigNumber(0);
};

export default estimateMaxSpendable;
