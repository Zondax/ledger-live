import { AccountBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getTransactionStatus } from "../getTransactionStatus";
import { prepareTransaction } from "../prepareTransaction";
import { ICPAccount, ICPAccountRaw, Transaction, TransactionStatus } from "../types";
import { getAccountShape } from "./bridgeHelpers/account";
import { createTransaction } from "../createTransaction";
import { assignToAccountRaw } from "../assignToAccountRaw";
import { signOperation } from "../signOperation";
import { broadcast } from "../broadcast";
import { assignFromAccountRaw } from "../assignFromAccountRaw";

const sync = makeSync({ getAccountShape });
const receive = makeAccountBridgeReceive();

export const accountBridge: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  ICPAccountRaw
> = {
  sync,
  updateTransaction: defaultUpdateTransaction,
  assignToAccountRaw,
  assignFromAccountRaw,
  createTransaction,
  prepareTransaction,
  getTransactionStatus,
  estimateMaxSpendable,
  receive,
  signOperation,
  broadcast,
};
