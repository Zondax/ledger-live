import { Account, AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import BigNumber from "bignumber.js";
import { getMainAccount } from "../../account";

import wallet, { getWalletAccount } from "../bitcoin/wallet-btc";
import { getAccountNetworkInfo } from "../bitcoin/getAccountNetworkInfo";

async function estimateMaxSpendable({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction | null | undefined;
}): Promise<BigNumber> {
  const mainAccount = getMainAccount(account, parentAccount);
  const walletAccount = getWalletAccount(mainAccount);

  let feePerByte = transaction?.feePerByte;
  if (!feePerByte) {
    const networkInfo = await getAccountNetworkInfo(mainAccount);
    feePerByte = networkInfo.feeItems.defaultFeePerByte;
  }

  const maxSpendable = await wallet.estimateAccountMaxSpendable(
    walletAccount,
    feePerByte.toNumber(), //!\ wallet-btc handles fees as JS number
    [],
    transaction ? [transaction.recipient] : [],
  );

  return maxSpendable.lt(0) ? new BigNumber(0) : maxSpendable;
}

export default estimateMaxSpendable;
