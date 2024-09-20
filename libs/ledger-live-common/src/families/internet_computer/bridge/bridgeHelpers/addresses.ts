import { log } from "@ledgerhq/logs";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { MAX_MEMO_VALUE } from "../../consts";
import { AccountIdentifier } from "@dfinity/ledger-icp";

export const getAddress = (
  a: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: a.freshAddress, derivationPath: a.freshAddressPath });

export async function validateAddress(address: string): Promise<{ isValid: boolean }> {
  try {
    const accId = AccountIdentifier.fromHex(address);
    if (!accId) {
      throw new Error("Invalid address, account identifier could not be created.");
    }
    return { isValid: true };
  } catch (e: any) {
    log("error", e.message ?? "Failed to validate address");
    return { isValid: false };
  }
}

export function validateMemo(memo?: string): { isValid: boolean } {
  const res = BigNumber(memo ?? 0);

  if (res.isNaN() || res.lt(0) || res.gt(BigNumber(MAX_MEMO_VALUE))) {
    return { isValid: false };
  }

  return { isValid: true };
}
