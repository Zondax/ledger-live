import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { AccountBridge } from "@ledgerhq/types-live";
import {
  getAddress,
  validateAddress,
  validateMemo,
  validatePrincipal,
} from "../bridge/bridgeHelpers/addresses";
import {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import {
  ICPDissolveDelayGTMax,
  ICPDissolveDelayLTCurrent,
  ICPDissolveDelayLTMin,
  InvalidMemoICP,
  ICPNeuronNotFound,
  NotEnoughTransferAmount,
  InvalidHotKey,
  HotKeyAlreadyExists,
} from "../errors";
import {
  ICP_FEES,
  ICP_MIN_STAKING_AMOUNT,
  MAX_DISSOLVE_DELAY,
  MIN_DISSOLVE_DELAY,
} from "../consts";
import { getNeuronDissolveDurationSeconds } from "../neurons";

export const getTransactionStatus: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  InternetComputerOperation,
  ICPAccountRaw
>["getTransactionStatus"] = async (account, transaction) => {
  const errors: TransactionStatus["errors"] = {};
  const warnings: TransactionStatus["warnings"] = {};

  const { balance } = account;
  const { address } = getAddress(account);
  const { recipient, useAllAmount, type, neuronId, dissolveDelay: dissolveDelayStr } = transaction;
  let { amount } = transaction;
  const neuron = account.neurons.fullNeurons.find(
    neuron => neuron.id[0]?.id.toString() === neuronId,
  );

  if (type === "set_dissolve_delay" && !!dissolveDelayStr) {
    const dissolveDelay = new BigNumber(dissolveDelayStr);

    if (!neuron) {
      errors.neuron = new ICPNeuronNotFound();
    } else {
      const currentDissolveDelay = BigNumber(getNeuronDissolveDurationSeconds(neuron).toString());
      if (BigNumber(dissolveDelay).lt(currentDissolveDelay)) {
        errors.dissolveDelay = new ICPDissolveDelayLTCurrent();
      }
    }
    if (dissolveDelay.lt(MIN_DISSOLVE_DELAY)) {
      errors.dissolveDelay = new ICPDissolveDelayLTMin(undefined, {
        min: "182.5 days",
      });
    } else if (dissolveDelay.gt(MAX_DISSOLVE_DELAY)) {
      errors.dissolveDelay = new ICPDissolveDelayGTMax(undefined, {
        max: "8 years",
      });
    }
  }

  if (type === "split_neuron") {
    if (!neuron) {
      errors.neuron = new ICPNeuronNotFound();
    } else {
      if (BigNumber(neuron.cached_neuron_stake_e8s.toString()).lt(amount.plus(ICP_FEES))) {
        errors.splitNeuron = new NotEnoughBalance();
      }
      if (BigNumber(amount).lte(ICP_MIN_STAKING_AMOUNT)) {
        errors.splitNeuron = new NotEnoughTransferAmount("", {
          purpose: "neuron split",
          amount:
            BigNumber(ICP_MIN_STAKING_AMOUNT)
              .div(10 ** account.currency.units[0].magnitude)
              .toString() +
            " " +
            account.currency.ticker,
        });
      }
    }
  }

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
      errors.amount = new NotEnoughTransferAmount("", {
        purpose: "stake",
        amount:
          BigNumber(ICP_MIN_STAKING_AMOUNT)
            .div(10 ** account.currency.units[0].magnitude)
            .toString() +
          " " +
          account.currency.ticker,
      });
    }
  }

  if (transaction.type === "increase_stake") {
    warnings.staking = new Error(
      "This operation will transfer the amount to increase the stake of an existing neuron.",
    );
  }

  if (transaction.type === "add_hot_key" && transaction.hotKeyToAdd) {
    if (!validatePrincipal(transaction.hotKeyToAdd).isValid) {
      errors.addHotKey = new InvalidHotKey();
    }

    if (neuron?.hot_keys.map(hotKey => hotKey.toString()).includes(transaction.hotKeyToAdd)) {
      errors.addHotKey = new HotKeyAlreadyExists();
    }
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
