import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account } from "@ledgerhq/types-live";

export const getAccountShape: GetAccountShape = async _info => {
  const account: Partial<Account> = {};
  return account;
};
