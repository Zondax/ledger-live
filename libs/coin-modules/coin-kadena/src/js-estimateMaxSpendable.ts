import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { fetchCoinDetailsForAccount } from "./api/network";
import { KDA_FEES } from "./constants";
import { getAddress } from "./utils";

export const estimateMaxSpendable = async ({
  account,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  if (!transaction) {
    return new BigNumber(0);
  }

  if (account.type !== "Account") {
    return new BigNumber(0);
  }

  const balance = await fetchCoinDetailsForAccount(getAddress(account).address, [
    transaction.senderChainId.toString(),
  ]);
  if (balance[transaction.senderChainId] === undefined) {
    return new BigNumber(0);
  }

  const fees = KDA_FEES;

  const estimate = BigNumber(balance[transaction.senderChainId]).minus(fees);

  return estimate.lt(0) ? new BigNumber(0) : estimate;
};

export default estimateMaxSpendable;
