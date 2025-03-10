import { NeuronInfo, Neuron as NNSNeuron } from "@dfinity/nns/dist/candid/governance";
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
import { NeuronsData } from "../neurons";

type FamilyType = "internet_computer";
export interface ICPAccount extends Account {
  neurons: NeuronsData;
}

export interface ICPAccountRaw extends AccountRaw {
  neuronsData: {
    fullNeurons: string;
    neuronInfos: string;
    lastUpdated: number;
  };
}

export type ICPTransactionType =
  | "start_dissolving"
  | "stop_dissolving"
  | "list_neurons"
  | "increase_stake"
  | "create_neuron"
  | "disburse"
  | "send"
  | "spawn_neuron"
  | "stake_maturity"
  | "refresh_voting_power"
  | "increase_dissolve_delay"
  | "auto_stake_maturity"
  | "spawn_neuron_from_maturity"
  | "set_auto_stake_maturity"
  | "set_dissolve_delay"
  | "remove_hot_key"
  | "split_neuron";

export type Transaction = TransactionCommon & {
  family: FamilyType;
  fees: BigNumber;
  memo?: string;
  type: ICPTransactionType;
  neuronAccountIdentifier?: string;
  neuronId?: string;
  percentageToStake?: string;
  percentageToSpawn?: string;
  dissolveDelay?: string;
  additionalDissolveDelay?: string;
  autoStakeMaturity?: boolean;
  hotKeyToRemove?: string;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  fees: string;
  memo?: string;
  type: ICPTransactionType;
  neuronAccountIdentifier?: string;
  neuronId?: string;
  percentageToStake?: string;
  percentageToSpawn?: string;
  dissolveDelay?: string;
  additionalDissolveDelay?: string;
  autoStakeMaturity?: boolean;
  hotKeyToRemove?: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type InternetComputerOperation = Operation<InternetComputerOperationExtra>;

export type InternetComputerOperationExtra = {
  memo: string | undefined;
  createdNeuronId?: string;
  neurons?: NeuronsData;
  methodName?: string;
};

export interface ICPNeuron extends NNSNeuron {
  accountIdentifier: string;
  dissolveState: "Unlocked" | "Locked" | "Dissolving" | "Unknown" | "Spawning";
  dissolveDelaySeconds: string;
  whenDissolvedTimestampSeconds: string;
  modFollowees: {
    [neuronId: string]: string[];
  };

  neuronInfo: NeuronInfo;
}

export const ICPOperationTypeListNeuron = "LIST_NEURONS";
