import {
  Account,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

type FamilyType = "kadena";

export type KadenaAccount = Account;

export type Transaction = TransactionCommon & {
  family: FamilyType;
  gasLimit: BigNumber;
  gasPrice: BigNumber;
  senderChainId: number;
  receiverChainId?: number;
  isFinished?: boolean; // Indicates if the transaction is confirmed, used specifically for cross-chain transfers
};

export type KadenaOperation = Operation<KadenaOperationExtra>;

export interface KadenaOperationExtra {
  senderChainId: number;
  receiverChainId?: number;
  isFinished?: boolean; // Indicates if the transaction is confirmed, used specifically for cross-chain transfers
}

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  senderChainId: number;
  receiverChainId?: number;
  gasLimit: string;
  gasPrice: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
