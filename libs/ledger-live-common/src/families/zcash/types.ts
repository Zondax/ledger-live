import {
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

type FamilyType = "zcash";

export type FeeItem = {
  key: string;
  speed: string;
  feePerByte: BigNumber;
};
export type FeeItems = {
  items: FeeItem[];
  defaultFeePerByte: BigNumber;
  relayFee?: number;
};
export type NetworkInfo = {
  family: FamilyType;
  feeItems: FeeItems;
};

export type InputInfo = {
  address: string;
  value: BigNumber;
  previousTxHash: string;
  previousOutputIndex: number;
  outp: string;
};

export type OutputInfo = {
  outputIndex: number;
  address: string;
  isChange: boolean;
  value: BigNumber;
  hash?: string;
  blockHeight?: number;
};

//TODO: add zcash-specific details
export type Transaction = TransactionCommon & {
  family: FamilyType;
} & Partial<{
    feePerByte: BigNumber;
    networkInfo: NetworkInfo;
    inputs: InputInfo[];
    outputs: OutputInfo[];
  }>;

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
