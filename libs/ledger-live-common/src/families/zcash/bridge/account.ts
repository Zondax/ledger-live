import { AccountBridge, SignOperationFnSignature } from "@ledgerhq/types-live";
import { Transaction } from "../types";

import { getAccountShape, unimplemented } from "./utils";
import { makeAccountBridgeReceive, makeSync } from "../../../bridge/jsHelpers";

const sync = makeSync({ getAccountShape });

const receive = makeAccountBridgeReceive();

export const accountBridge: AccountBridge<Transaction> = {
    sync,
    createTransaction: unimplemented("createTransaction"),
    updateTransaction: unimplemented("updateTransaction"),
    prepareTransaction: unimplemented("prepareTransaction"),
    getTransactionStatus: unimplemented("getTransactionStatus"),
    estimateMaxSpendable: unimplemented("estimateMaxSpendable"),
    broadcast: unimplemented("broadcast"),
    receive,
    signOperation: unimplemented("signOperation")
};
