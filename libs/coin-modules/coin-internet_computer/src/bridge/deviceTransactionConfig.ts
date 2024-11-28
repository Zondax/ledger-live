import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";

import { Transaction, TransactionStatus } from "../types";
import { methodToString } from "../common-logic/utils";

const currency = getCryptoCurrencyById("internet_computer");

function getDeviceTransactionConfig({
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
  status: TransactionStatus;
}): Array<CommonDeviceTransactionField> {
  const fields: Array<CommonDeviceTransactionField> = [];
  fields.push({
    type: "text",
    label: "Transaction Type",
    value: methodToString(transaction.type),
  });

  if (
    transaction.type === "disburse" ||
    transaction.type === "start_dissolving" ||
    transaction.type === "stop_dissolving"
  ) {
    fields.push({
      type: "text",
      label: "Neuron Id",
      value: transaction.neuronId ?? "0",
    });

    if (transaction.type === "disburse") {
      fields.push({
        type: "text",
        label: "Disburse To",
        value: "Self",
      });
    }
  }

  if (
    transaction.type === "send" ||
    transaction.type === "create_neuron" ||
    transaction.type === "increase_stake" ||
    transaction.type === "disburse"
  ) {
    fields.push({
      type: "text",
      label: "Amount (ICP)",
      value: formatCurrencyUnit(currency.units[0], transaction.amount, {
        showCode: false,
        disableRounding: true,
      }),
    });
    fields.push({
      type: "text",
      label: "Maximum fee (ICP)",
      value: formatCurrencyUnit(currency.units[0], transaction.fees, {
        showCode: false,
        disableRounding: true,
      }),
    });
  }

  if (transaction.type !== "list_neurons" && transaction.type !== "disburse") {
    fields.push({
      type: "text",
      label: "Memo",
      value: transaction.memo ?? "0",
    });
  }
  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
