import { AccountBridge, SignOperationFnSignature } from "@ledgerhq/types-live";
import { Transaction } from "../types";

import { getAccountShape, unimplemented } from "./utils";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";

import signOperation from "../js-signOperation";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import prepareTransaction from "../js-prepareTransaction";

const sync = makeSync({ getAccountShape });

const receive = makeAccountBridgeReceive();

export const accountBridge: AccountBridge<Transaction> = {
  sync,
  createTransaction: unimplemented("createTransaction"),
  updateTransaction: unimplemented("updateTransaction"),
  prepareTransaction,
  getTransactionStatus: unimplemented("getTransactionStatus"),
  estimateMaxSpendable,
  broadcast: unimplemented("broadcast"),
  receive,
  signOperation,
};
