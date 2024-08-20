import { OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "../../operation";
import { ICPAccount, InternetComputerOperation, Transaction } from "./types";
import { getAddress } from "./bridge/bridgeHelpers/addresses";

export const buildOptimisticSendOperation = async (
  account: ICPAccount,
  transaction: Transaction,
  hash: string,
  operationType: OperationType = "OUT",
): Promise<InternetComputerOperation> => {
  const { id: accountId } = account;
  const { recipient, amount } = transaction;
  const { address } = getAddress(account);

  if (transaction.type === "list") {
    operationType = "NONE";
  }

  return {
    id: encodeOperationId(accountId, hash, operationType),
    hash,
    type: operationType,
    senders: [address],
    recipients: [recipient],
    accountId,
    value: amount.plus(transaction.fees),
    fee: transaction.fees,
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {
      memo: transaction.memo,
    },
  };
};
