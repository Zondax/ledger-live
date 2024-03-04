import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { defaultUpdateTransaction, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getAccountShape } from "../js-synchronisation";
import { createTransaction, prepareTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import {
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "../serialization";

import { makeScanAccounts } from "../../../bridge/jsHelpers";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};

const receive = makeAccountBridgeReceive();
const sync = makeSync({ getAccountShape });

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
  getTransactionStatus,
  sync,
  prepareTransaction,
  signOperation,
  receive,
  broadcast,
  assignFromAccountRaw,
  assignToAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
export default {
  currencyBridge,
  accountBridge,
};
