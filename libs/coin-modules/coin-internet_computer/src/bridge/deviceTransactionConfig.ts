import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { log } from "@ledgerhq/logs";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import type { CommonDeviceTransactionField } from "@ledgerhq/coin-framework/transaction/common";

import { Transaction, TransactionStatus } from "../types";
import { getTimeUntil, methodToString } from "../common-logic/utils";

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

  if (transaction.neuronId) {
    fields.push({
      type: "text",
      label: "Neuron Id",
      value: transaction.neuronId ?? "0",
    });

    if (transaction.type === "stake_maturity") {
      fields.push({
        type: "text",
        label: "Percentage to Stake",
        value: transaction.percentageToStake ?? "100",
      });
    }

    if (transaction.type === "remove_hot_key") {
      fields.push({
        type: "text",
        label: "Principal",
        value: transaction.hotKeyToRemove ?? "",
      });
    }

    if (transaction.type === "auto_stake_maturity") {
      fields.push({
        type: "text",
        label: "Auto Stake",
        value: transaction.autoStakeMaturity ? "true" : "false",
      });
    }

    if (transaction.type === "spawn_neuron") {
      fields.push({
        type: "text",
        label: "Controller",
        value: "self",
      });
    }

    if (transaction.type === "disburse") {
      fields.push({
        type: "text",
        label: "Disburse To",
        value: "Self",
      });
    }

    if (transaction.type === "increase_dissolve_delay") {
      const additionalDelay = getTimeUntil(Number(transaction.additionalDissolveDelay));
      fields.push({
        type: "text",
        label: "Additional Delay",
        value: `${additionalDelay.days}d ${additionalDelay.hours}h ${additionalDelay.minutes}m ${additionalDelay.seconds}s`,
      });
    }
  }

  if (transaction.amount.gt(0)) {
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

  if (transaction.memo && transaction.memo !== "0") {
    fields.push({
      type: "text",
      label: "Memo",
      value: transaction.memo,
    });
  }
  log("debug", `Transaction config ${JSON.stringify(fields)}`);

  return fields;
}

export default getDeviceTransactionConfig;
