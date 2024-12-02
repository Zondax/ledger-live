// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-internet_computer/consts";
export const ICP_SEND_TXN_TYPE = 0;
export const ICP_LIST_NEURONS_TXN_TYPE = 1;

// ICP Canister Ids
export const MAINNET_LEDGER_CANISTER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const MAINNET_GOVERNANCE_CANISTER_ID = "rrkah-fqaaa-aaaaa-aaaaq-cai";
export const MAINNET_INDEX_CANISTER_ID = "q3fc5-haaaa-aaaaa-aaahq-cai";
export const DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS = 5 * 60 * 1000;

// API limits
export const FETCH_TXNS_LIMIT = 100;

// Max ICP fees
export const ICP_FEES = 1e4;

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
