import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import { deviceActionFlow, SpeculosButton } from "@ledgerhq/coin-framework/bot/specs";
 
export const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
  steps: [
    {
      title: "Transfer",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "From (1/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "From (2/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (1/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "To (2/2)",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Amount",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Gas fees",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Sign Transaction",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Reject",
      button: SpeculosButton.RIGHT,
    },
    {
      title: "Confirm",
      button: SpeculosButton.BOTH,
    },
  ],
});