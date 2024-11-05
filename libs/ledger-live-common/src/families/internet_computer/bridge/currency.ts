import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { getPreloadStrategy, hydrate, preload } from "../preload";
import { getAccountShape } from "./bridgeHelpers/account";
import { CurrencyBridge } from "@ledgerhq/types-live";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  getPreloadStrategy,
  preload,
  hydrate,
  scanAccounts,
};
