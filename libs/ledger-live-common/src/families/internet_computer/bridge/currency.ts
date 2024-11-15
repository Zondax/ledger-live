import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { getAccountShape } from "./bridgeHelpers/account";
import { CurrencyBridge } from "@ledgerhq/types-live";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  hydrate: () => {},
  preload: () => Promise.resolve(undefined),
  scanAccounts,
};
