// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-internet_computer/types/index";
import { Neuron } from "@dfinity/nns/dist/candid/governance";
import { Neuron as NNSNeuron } from "@dfinity/nns/dist/candid/governance";
import {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { NeuronsData } from "./neurons";

type FamilyType = "internet_computer";
export interface ICPAccount extends Account {
  neurons: NeuronsData;
}

export interface ICPAccountRaw extends AccountRaw {
  neuronsData: {
    neurons: string;
    lastUpdated: number;
  };
}

type ICPTransactionType =
  | "start_dissolving"
  | "stop_dissolving"
  | "list_neurons"
  | "increase_stake"
  | "create_neuron"
  | "disburse"
  | "send"
  | "spawn_neuron"
  | "stake_maturity";
export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  type: ICPTransactionType;
  neuronAccountIdentifier?: string;
  neuronId?: string;
  percentageToStake?: string;
  percentageToSpawn?: string;
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

export type InternetComputerOperationExtra = {
  memo?: string;
  createdNeuronId?: string;
  neurons?: NeuronsData;
  methodName?: string;
};

export interface ICPNeuron extends NNSNeuron {
  accountIdentifier: string;
  dissolveState: "Unlocked" | "Locked" | "Dissolving" | "Unknown";
  votingPower: BigNumber;
  dissolveDelaySeconds: string;
  whenDissolvedTimestampSeconds: string;
}

export const ICPOperationTypeListNeuron = "LIST_NEURONS";
