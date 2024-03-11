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
  fees: BigNumber;
  senderChainId: number;
  receiverChainId: number;
};

export type KadenaOperation = Operation<KadenaOperationExtra>;

interface KadenaOperationExtra {
  senderChainId: number;
  receiverChainId: number;
}

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  senderChainId: number;
  receiverChainId: number;
  fees: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
