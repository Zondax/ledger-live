import { TransactionCommon, TransactionCommonRaw, TransactionStatusCommon, TransactionStatusCommonRaw } from "@ledgerhq/types-live";

type FamilyType = "zcash";

//TODO: add zcash-specific details
export type Transaction = TransactionCommon & {
    family: FamilyType;
};


export type TransactionRaw = TransactionCommonRaw & {
    family: FamilyType;
};

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;
