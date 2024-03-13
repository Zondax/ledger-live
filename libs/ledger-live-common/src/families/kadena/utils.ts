import { Account, Address } from "@ledgerhq/types-live";

export const isNoErrorReturnCode = (code: number): boolean => code === 0x9000;

export const getPath = (path: string): string =>
  path && path.substring(0, 2) !== "m/" ? `m/${path}` : path;

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export const validateAddress = (address: string): boolean => {
  address = address.startsWith("k:") ? address.substring(2) : address;
  if (!address.match(/[0-9A-Fa-f]{64}/g)) {
    return false;
  }

  return true;
};
