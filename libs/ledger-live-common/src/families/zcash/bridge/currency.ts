import { CurrencyBridge } from "@ledgerhq/types-live";
import { unimplemented } from "./utils";

export const currencyBridge: CurrencyBridge = {
  //stuff to load for bridge to work, like tokens or delegators
  preload: () => Promise.resolve({}),
  //reinject the preloaded data
  hydrate: () => {},
  scanAccounts: unimplemented("scanAccounts"),
};
