import { AccountBridge } from "@ledgerhq/types-live";
import { ICPAccount, ICPAccountRaw, Transaction, TransactionStatus } from "../types";
import { log } from "@ledgerhq/logs";

export const assignToAccountRaw: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  ICPAccountRaw
>["assignToAccountRaw"] = (account, accountRaw) => {
  log("debug", `[ICP](assignToAccountRaw) serializing neurons`);
  const { neurons } = account.neurons.serialize();
  accountRaw.neuronsData = {
    neurons,
    lastUpdated: account.neurons.lastUpdated,
  };
};
