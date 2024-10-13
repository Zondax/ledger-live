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
export type ICPAccount = Account;

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  type?: "list_neurons" | "increase_stake" | "create_neuron";
  neuronAccount?: string;
  memo?: string;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
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
  neurons?: {
    fullNeurons: Neuron[];
  };
};

export const ICPOperationTypeListNeuron = "LIST_NEURONS";
