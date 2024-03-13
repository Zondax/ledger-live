import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { fetchBalances } from "./api/network";
import { KDA_FEES } from "./consts";
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

  const balances = await fetchBalances(getAddress(account).address);

  const fees = new BigNumber(KDA_FEES);

  return BigNumber(balances[transaction.senderChainId]).minus(fees);
};

export default estimateMaxSpendable;
