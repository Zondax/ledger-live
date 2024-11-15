import { AccountBridge } from "@ledgerhq/types-live";
import { ICPAccount, ICPAccountRaw, Transaction, TransactionStatus } from "./types";
import { NeuronsData } from "./neurons";
import { log } from "@ledgerhq/logs";

export const assignFromAccountRaw: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  ICPAccountRaw
>["assignFromAccountRaw"] = (accountRaw, account) => {
  log("debug", `[ICP](assignFromAccountRaw) deserializing neurons`);
  const { neurons, lastUpdated } = accountRaw.neuronsData;
  account.neurons = NeuronsData.deserialize(neurons, lastUpdated);
};
