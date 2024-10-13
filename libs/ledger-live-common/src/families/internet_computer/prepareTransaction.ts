import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import { getAddress, validateAddress } from "./bridge/bridgeHelpers/addresses";
import { AccountIdentifier, principalToAccountIdentifier, SubAccount } from "@dfinity/ledger-icp";
import { Principal } from "@dfinity/principal";
import { MAINNET_GOVERNANCE_CANISTER_ID } from "./consts";
import { randomBytes } from "crypto";
import invariant from "invariant";
import {
  arrayOfNumberToUint8Array,
  asciiStringToByteArray,
  uint8ArrayToBigInt,
} from "@dfinity/utils";
import { sha256 } from "@noble/hashes/sha256";
import { derivePrincipalFromPubkey } from "./utils";

const getNeuronStakeSubAccountBytes = (nonce: Uint8Array, principal: Principal): Uint8Array => {
  const padding = asciiStringToByteArray("neuron-stake");

  const shaObj = sha256.create();
  shaObj.update(
    arrayOfNumberToUint8Array([0x0c, ...padding, ...principal.toUint8Array(), ...nonce]),
  );
  return shaObj.digest();
};

export const prepareTransaction: AccountBridge<Transaction>["prepareTransaction"] = async (
  account,
  transaction,
) => {
  // log("debug", "[prepareTransaction] start fn");

  const { address } = getAddress(account);
  const { recipient } = transaction;

  let amount = transaction.amount;
  if (recipient && address) {
    // log("debug", "[prepareTransaction] fetching estimated fees");

    if ((await validateAddress(recipient)).isValid && (await validateAddress(address)).isValid) {
      if (transaction.useAllAmount) {
        amount = account.spendableBalance.minus(transaction.fees);
        return { ...transaction, amount };
      }
    }
  }

  if (transaction.neuronAccount && transaction.type === "increase_stake") {
    const neuronAccount = Buffer.from(transaction.neuronAccount, "hex");
    const neuronAccountIdentifier = principalToAccountIdentifier(
      Principal.from(MAINNET_GOVERNANCE_CANISTER_ID),
      Uint8Array.from(neuronAccount),
    );

    return { ...transaction, recipient: neuronAccountIdentifier };
  }

  if (transaction.type === "create_neuron" && transaction.recipient === "" && !transaction.memo) {
    const nonceBytes = new Uint8Array(randomBytes(8));
    const nonce = uint8ArrayToBigInt(nonceBytes);

    invariant(account.xpub, "[ICP](prepareTransaction) Xpub not found");
    const toSubAccount = SubAccount.fromBytes(
      getNeuronStakeSubAccountBytes(nonceBytes, derivePrincipalFromPubkey(account.xpub)),
    );

    invariant(toSubAccount instanceof SubAccount, "subaccount cannot be created");

    const subAccountIdentifier = AccountIdentifier.fromPrincipal({
      principal: Principal.from(MAINNET_GOVERNANCE_CANISTER_ID),
      subAccount: toSubAccount,
    });

    return { ...transaction, recipient: subAccountIdentifier.toHex(), memo: nonce.toString() };
  }

  // log("debug", "[prepareTransaction] finish fn");
  return transaction;
};
