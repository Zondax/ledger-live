import { BigNumber } from "bignumber.js";
import { MAX_MEMO_VALUE } from "../consts";
import { Secp256k1PublicKey } from "@dfinity/identity-secp256k1";
import { Principal } from "@dfinity/principal";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { log } from "@ledgerhq/logs";
import { DerEncodedPublicKey } from "@dfinity/agent";
import { InternetComputerOperation, Transaction } from "../types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { OperationType } from "@ledgerhq/types-live";

const validHexRegExp = new RegExp(/[0-9A-Fa-f]{6}/g);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/,
);

export const isNoErrorReturnCode = (code: number): boolean => code === 0x9000;

export const getPath = (path: string): string =>
  path && path.substr(0, 2) !== "m/" ? `m/${path}` : path;

export const isValidHex = (msg: string): boolean => validHexRegExp.test(msg);
export const isValidBase64 = (msg: string): boolean => validBase64RegExp.test(msg);

export const isError = (r: { returnCode: number; errorMessage?: string }): void => {
  if (!isNoErrorReturnCode(r.returnCode)) throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

export const methodToString = (method: Transaction["type"]): string => {
  switch (method) {
    case undefined:
      return "Send ICP";
    case "create_neuron":
      return "Stake Neuron";
    case "list_neurons":
      return "List Own Neurons";
    case "disburse":
      return "Disburse Neuron";
    case "stake_maturity":
      return "Stake Maturity";
    case "start_dissolving":
      return "Start Dissolving";
    case "stop_dissolving":
      return "Stop Dissolving";
    case "spawn_neuron":
      return "Spawn Neuron";
    default:
      return "Send ICP";
  }
};

export const getBufferFromString = (message: string): Buffer =>
  isValidHex(message)
    ? Buffer.from(message, "hex")
    : isValidBase64(message)
      ? Buffer.from(message, "base64")
      : Buffer.from(message);

export const normalizeEpochTimestamp = (timestamp: string): number => {
  return parseInt(timestamp.slice(0, 13));
};

function randomIntFromInterval(min: number, max: number): string {
  const minBig = new BigNumber(min);
  const maxBig = new BigNumber(max);

  const random = BigNumber.random().multipliedBy(maxBig.minus(minBig).plus(1)).plus(minBig);
  const randomInt = random.integerValue(BigNumber.ROUND_FLOOR);

  return randomInt.toString();
}

export function getRandomTransferID(): string {
  return randomIntFromInterval(0, MAX_MEMO_VALUE);
}

export const deriveAddressFromPubkey = (publicKey: string): string => {
  log("debug", `[ICP] Deriving address from public key: ${publicKey}`);
  const pubkey = Secp256k1PublicKey.fromRaw(new Uint8Array(Buffer.from(publicKey, "hex")));
  const principal = Principal.selfAuthenticating(new Uint8Array(pubkey.toDer()));
  log("debug", `[ICP] Derived principal: ${principal.toText()}`);
  const address = AccountIdentifier.fromPrincipal({ principal: principal });
  log("debug", `[ICP] Derived address: ${address.toHex()}`);

  return address.toHex();
};

export const derivePrincipalFromPubkey = (publicKey: string): Principal => {
  const pubkey = Secp256k1PublicKey.fromRaw(new Uint8Array(Buffer.from(publicKey, "hex")));
  return Principal.selfAuthenticating(new Uint8Array(pubkey.toDer()));
};

export const pubkeyToDer = (publicKey: string): DerEncodedPublicKey => {
  const pubkey = Secp256k1PublicKey.fromRaw(new Uint8Array(Buffer.from(publicKey, "hex")));
  return pubkey.toDer();
};

export const reassignOperationType = (
  operations: InternetComputerOperation[],
  neuronAddresses: string[],
) => {
  return operations.map(op => {
    if (neuronAddresses.includes(op.senders[0])) {
      const type: OperationType = "DISBURSE_NEURON";
      return { ...op, id: encodeOperationId(op.accountId, op.hash, type), type };
    }

    if (neuronAddresses.includes(op.recipients[0])) {
      const type: OperationType = BigNumber(op.extra.memo ?? "0").gt(0)
        ? "STAKE_NEURON"
        : "TOP_UP_NEURON";
      return { ...op, id: encodeOperationId(op.accountId, op.hash, type), type };
    }

    return op;
  });
};

export const nowInSeconds = (): number => Math.round(Date.now() / 1000);
