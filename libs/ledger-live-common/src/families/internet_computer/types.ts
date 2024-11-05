// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-internet_computer/types/index";
import { Neuron } from "@dfinity/nns/dist/candid/governance";
import {
  Account,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

type FamilyType = "internet_computer";
export interface ICPAccount extends Account {}

type ICPTransactionType = "list_neurons" | "increase_stake" | "create_neuron" | "disburse" | "send";
export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  type: ICPTransactionType;
  neuronAccount?: string;
  neuronId?: string;
  memo?: string;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  type: ICPTransactionType;
  fees: string;
  memo?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type InternetComputerOperation = Operation<InternetComputerOperationExtra>;

export type ICPNeuron = Neuron;
export type InternetComputerOperationExtra = {
  memo?: string;
  createdNeuronId?: string;
};

export const ICPOperationTypeListNeuron = "LIST_NEURONS";
