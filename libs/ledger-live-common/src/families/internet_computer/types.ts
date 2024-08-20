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
  type?: "list";
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

export type InternetComputerOperationExtra = {
  memo?: string;
  neurons?: {
    fullNeurons: FullNeuron[];
    neuronInfos: {
      [key: string]: NeuronInfo;
    };
  };
};

export const ICPOperationTypeListNeuron = "LIST_NEURONS";

type NeuronId = {
  id: number;
};

type NeuronFollowees = {
  [key: string]: {
    followees: NeuronId[];
  };
};

type NeuronDissolveState = {
  WhenDissolvedTimestampSeconds: number;
};

export type FullNeuron = {
  account: number[];
  aging_since_timestamp_seconds: number;
  auto_stake_maturity: boolean | null;
  cached_neuron_stake_e8s: number;
  controller: string;
  created_timestamp_seconds: number;
  dissolve_state: NeuronDissolveState;
  followees: NeuronFollowees;
  hot_keys: string[];
  id: NeuronId;
  joined_community_fund_timestamp_seconds: number | null;
  known_neuron_data: any | null;
  kyc_verified: boolean;
  maturity_e8s_equivalent: number;
  neuron_fees_e8s: number;
  neuron_type: any | null;
  not_for_profit: boolean;
  recent_ballots: any[];
  spawn_at_timestamp_seconds: number | null;
  staked_maturity_e8s_equivalent: number | null;
  transfer: any | null;
};

export type NeuronInfo = {
  age_seconds: number;
  created_timestamp_seconds: number;
  dissolve_delay_seconds: number;
  joined_community_fund_timestamp_seconds: number | null;
  known_neuron_data: any | null;
  neuron_type: any | null;
  recent_ballots: any[];
  retrieved_at_timestamp_seconds: number;
  stake_e8s: number;
  state: number;
  voting_power: number;
};
