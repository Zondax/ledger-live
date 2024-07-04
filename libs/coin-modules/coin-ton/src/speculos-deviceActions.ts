import {
  SpeculosButton,
  deviceActionFlow,
  formatDeviceAmount,
} from "@ledgerhq/coin-framework/bot/specs";
import type { DeviceAction, State } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { BotScenario } from "./utils";

export const generateDeviceActionFlow = (
  scenario: BotScenario,
): DeviceAction<Transaction, State<Transaction>> => {
  const data: Parameters<typeof deviceActionFlow<Transaction>>[0] = {
    steps: [
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "To",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction }) =>
          transaction.useAllAmount
            ? "ALL YOUR TONs"
            : formatDeviceAmount(account.currency, transaction.amount),
      },
      {
        title: "Comment",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.comment.text,
      },
      {
        title: "Approve",
        button: SpeculosButton.BOTH,
      },
    ],
  };
  return deviceActionFlow(data);
};

export const generateDeviceActionFlowNanos = (
  scenario: BotScenario,
): DeviceAction<Transaction, State<Transaction>> => {

  const data: Parameters<typeof deviceActionFlow<Transaction>>[0] = {
    steps: [
      {
        title: "Review",
        button: SpeculosButton.RIGHT,
      },
      {
        title: "To (1/3)",
        button: SpeculosButton.RIGHT,
        // expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "To (2/3)",
        button: SpeculosButton.RIGHT,
        // expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "To (3/3)",
        button: SpeculosButton.RIGHT,
        // expectedValue: ({ transaction }) => transaction.recipient,
      },
      {
        title: "Amount",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ account, transaction }) =>
          transaction.useAllAmount
            ? "ALL YOUR TONs"
            : formatDeviceAmount(account.currency, transaction.amount),
      },
      {
        title: "Comment",
        button: SpeculosButton.RIGHT,
        expectedValue: ({ transaction }) => transaction.comment.text,
      },
      {
        title: "Approve",
        button: SpeculosButton.BOTH,
      },
    ],
  };

  return deviceActionFlow(data);
};