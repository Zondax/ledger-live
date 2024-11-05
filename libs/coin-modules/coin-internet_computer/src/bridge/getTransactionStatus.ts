import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import { getAddress, validateAddress, validateMemo } from "./bridge/bridgeHelpers/addresses";
import { Transaction, TransactionStatus } from "./types";
import { InvalidMemoICP, NotEnoughTransferAmount } from "./errors";
import { ICP_MIN_STAKING_AMOUNT } from "./consts";

export const getTransactionStatus: AccountBridge<Transaction>["getTransactionStatus"] = async (
  account,
  transaction,
) => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = account;
  const { address } = getAddress(account);
  const { recipient, useAllAmount } = transaction;
  let { amount } = transaction;

  if (!recipient) {
    errors.recipient = new RecipientRequired();
  } else if (!(await validateAddress(recipient)).isValid) {
    errors.recipient = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  } else if (recipient.toLowerCase() === address.toLowerCase()) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!(await validateAddress(address)).isValid) {
    errors.sender = new InvalidAddress("", {
      currencyName: account.currency.name,
    });
  }

  if (!validateMemo(transaction.memo).isValid) {
    errors.transaction = new InvalidMemoICP();
  }

  // This is also be true if topup existing neuron and amount is less than min staking amount
  // TODO: Check if this is the best way to check for topup
  if (transaction.type === "create_neuron") {
    warnings.staking = new Error(
      "This operation will transfer the amount to a new neuron. Upon successful confirmation, the neuron will be available for further operations.",
    );
    if (transaction.amount.lt(ICP_MIN_STAKING_AMOUNT)) {
      errors.amount = new NotEnoughTransferAmount();
    }
  }

  if (transaction.type === "increase_stake") {
    warnings.staking = new Error(
      "This operation will transfer the amount to increase the stake of an existing neuron.",
    );
  }

  // This is the worst case scenario (the tx won't cost more than this value)
  const estimatedFees = transaction.fees;

  let totalSpent: BigNumber;

  if (useAllAmount) {
    totalSpent = account.spendableBalance;
    amount = totalSpent.minus(estimatedFees);
    if (amount.lte(0) || totalSpent.gt(balance)) {
      errors.amount = new NotEnoughBalance();
    }
  } else {
    totalSpent = amount.plus(estimatedFees);
    if (amount.eq(0)) {
      errors.amount = new AmountRequired();
    } else if (totalSpent.gt(account.spendableBalance)) {
      errors.amount = new NotEnoughBalance();
    }
  }

  // log("debug", "[getTransactionStatus] finish fn");

  return {
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  };
};
