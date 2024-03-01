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
  chainId: string;
};

export type CasperOperation = Operation<CasperOperationExtra>;

interface CasperOperationExtra {
  chainId: string;
}

export type TransactionRaw = TransactionCommonRaw & {
  family: FamilyType;
  chainId: string;
  fees: string;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
