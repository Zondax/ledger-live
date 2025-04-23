import { Topic } from "@dfinity/nns";

// ICP Rosetta ids
export const ICP_BLK_NAME_ROSETTA = "Internet Computer";
export const ICP_NET_ID_ROSETTA = "00000000000000020101";

export const ICP_SEND_TXN_TYPE = 0;
export const ICP_LIST_NEURONS_TXN_TYPE = 1;

// ICP Canister Ids
export const MAINNET_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const MAINNET_GOVERNANCE_CANISTER_ID = "rrkah-fqaaa-aaaaa-aaaaq-cai";
// export const MAINNET_INDEX_CANISTER_ID = "qhbym-qaaaa-aaaaa-aaafq-cai";
export const MAINNET_INDEX_CANISTER_ID = "q3fc5-haaaa-aaaaa-aaahq-cai";
export const DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS = 5 * 60 * 1000;

// API limits
export const FETCH_TXNS_LIMIT = 100;

// Max ICP fees
export const ICP_FEES = 1e4;

// Voting power refresh threshold
export const VOTING_POWER_REFRESH_THRESHOLD_IN_DAYS = 300;

// Last sync threshold
export const LAST_SYNC_THRESHOLD_IN_DAYS = 14;

// Min ICP Staking amount
export const ICP_MIN_STAKING_AMOUNT = 1e8;

// Max Memo value on ICP network
export const MAX_MEMO_VALUE = Number.MAX_SAFE_INTEGER;

// Bonus constants
export const MAX_DISSOLVE_DELAY_BONUS = 1; // = +100%
export const MAX_AGE_BONUS = 0.25; // = +25%

// Time constants
export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;
export const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * MINUTES_IN_HOUR;
export const SECONDS_IN_DAY = SECONDS_IN_HOUR * HOURS_IN_DAY;
export const SECONDS_IN_YEAR = ((4 * 365 + 1) * SECONDS_IN_DAY) / 4;
export const SECONDS_IN_HALF_YEAR = SECONDS_IN_YEAR / 2;
export const SECONDS_IN_FOUR_YEARS = SECONDS_IN_YEAR * 4;
export const SECONDS_IN_EIGHT_YEARS = SECONDS_IN_YEAR * 8;

// Dissolve delay constants
export const MIN_DISSOLVE_DELAY = SECONDS_IN_HALF_YEAR;
export const MAX_DISSOLVE_DELAY = SECONDS_IN_EIGHT_YEARS;

// NeuronIds
export const KNOWN_NEURON_IDS: Record<string, string> = {
  "27": "DFINITY Foundation",
  "12093733865587997066": "Aviate Labs",
};

// Topics name same as 'getTopicTitle' in ../common-logic/neuron.ts
export const KNOWN_TOPICS = {
  [Topic.Governance]: "Governance",
  [Topic.SnsAndCommunityFund]: "SNS & Neurons' Fund",
  [Topic.Unspecified]: "Unspecified",
  [Topic.ApiBoundaryNodeManagement]: "API Boundary Node Management",
  [Topic.NodeAdmin]: "Node Admin",
  [Topic.NeuronManagement]: "Neuron Management",
  [Topic.ExchangeRate]: "Exchange Rate",
  [Topic.NetworkEconomics]: "Network Economics",
  [Topic.ParticipantManagement]: "Participant Management",
  [Topic.SubnetManagement]: "Subnet Management",
  [Topic.NetworkCanisterManagement]: "Network Canister Management",
  [Topic.Kyc]: "KYC",
  [Topic.NodeProviderRewards]: "Node Provider Rewards",
  [Topic.IcOsVersionDeployment]: "IC OS Version Deployment",
  [Topic.IcOsVersionElection]: "IC OS Version Election",
  [Topic.SubnetRental]: "Subnet Rental",
  [Topic.ProtocolCanisterManagement]: "Protocol Canister Management",
  [Topic.ServiceNervousSystemManagement]: "Service Nervous System Management",
};
