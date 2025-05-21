import { log } from "@ledgerhq/logs";
import { Account } from "@ledgerhq/types-live";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";

export const getAddress = (
  a: Account,
): {
  address: string;
  derivationPath: string;
} => ({ address: a.freshAddress, derivationPath: a.freshAddressPath });

export const validatePrincipal = (principal: string): { isValid: boolean } => {
  try {
    Principal.fromText(principal);
    return { isValid: true };
  } catch (e) {
    return { isValid: false };
  }
};
export async function validateAddress(address: string): Promise<{ isValid: boolean }> {
  try {
    const accId = AccountIdentifier.fromHex(address);
    if (!accId) {
      throw new Error("Invalid address, account identifier could not be created.");
    }
    return { isValid: true };
  } catch (e) {
    if (e instanceof Error) {
      log("error", e.message ?? "Failed to validate address");
    } else {
      log("error", "Failed to validate address");
    }
    return { isValid: false };
  }
}

export function validateMemo(memo?: string): { isValid: boolean } {
  try {
    const res = BigInt(memo ?? 0);

    if (res < 0) {
      return { isValid: false };
    }
    return { isValid: true };
  } catch (e) {
    if (e instanceof Error) {
      log("error", e.message ?? "Failed to validate memo");
    } else {
      log("error", "Failed to validate memo");
    }
    return { isValid: false };
  }
}
