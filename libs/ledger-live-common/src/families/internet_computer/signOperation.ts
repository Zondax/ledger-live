import { Observable } from "rxjs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAddress } from "./bridge/bridgeHelpers/addresses";
import { buildOptimisticSendOperation as buildOptimisticOperation } from "./buildOptimisticOperation";
import { withDevice } from "../../hw/deviceAccess";
import { Transaction } from "./types";
import { derivePrincipalFromPubkey, getPath } from "./utils";
import ICP from "@zondax/ledger-icp";
import { log } from "@ledgerhq/logs";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { idlFactory } from "./idlFactory";
import { IDL } from "@dfinity/candid";
import invariant from "invariant";
import { Principal } from "@dfinity/principal";
import { Cbor, Expiry, SubmitRequestType } from "@dfinity/agent";
import {
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
  ICP_FEES,
  MAINNET_LEDGER_CANISTER_ID,
} from "./consts";
import Transport from "@ledgerhq/hw-transport";
import { hashTransaction } from "./bridge/bridgeHelpers/hash";
import { Secp256k1PublicKey } from "@dfinity/identity-secp256k1";

interface UnsignedTransaction {
  request_type: SubmitRequestType;
  canister_id: Principal;
  method_name: string;
  arg: ArrayBuffer;
  sender: Principal;
  ingress_expiry: Expiry;
}

interface TransferRawRequest {
  to: Uint8Array;
  amount: { e8s: bigint };
  memo: bigint;
  fee: { e8s: bigint };
  created_at_time: [{ timestamp_nanos: bigint }];
  from_subaccount: [];
}

const createUnsignedTransaction = (
  transaction: Transaction,
  account: Account,
): { unsignedTransaction: UnsignedTransaction; transferRawRequest: TransferRawRequest } => {
  const toAccount = AccountIdentifier.fromHex(transaction.recipient);

  const transferRawRequest: TransferRawRequest = {
    to: toAccount.toUint8Array(),
    amount: { e8s: BigInt(transaction.amount.toString()) },
    memo: BigInt(transaction.memo ?? 0),
    fee: { e8s: BigInt(ICP_FEES) },
    created_at_time: [{ timestamp_nanos: BigInt(new Date().getTime() * 1000000) }],
    from_subaccount: [],
  };

  const transferIDLMethod = idlFactory({ IDL })._fields.find(f => f[0] === "transfer");
  invariant(transferIDLMethod, "[ICP](createUnsignedTransaction) Method not found");
  const args = IDL.encode(transferIDLMethod[1].argTypes, [transferRawRequest]);

  const canisterID = Principal.from(MAINNET_LEDGER_CANISTER_ID);
  invariant(account.xpub, "[ICP](createUnsignedTransaction) Account xpub is required");
  const unsignedTransaction: UnsignedTransaction = {
    request_type: SubmitRequestType.Call,
    canister_id: canisterID,
    method_name: "transfer",
    arg: args,
    sender: derivePrincipalFromPubkey(account.xpub),
    ingress_expiry: new Expiry(DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS),
  };

  return { unsignedTransaction, transferRawRequest };
};

const signICPSendTransaction = async (
  unsignedTxn: UnsignedTransaction,
  derivationPath: string,
  transport: Transport,
) => {
  const icp = new ICP(transport);
  const blob = Cbor.encode({ content: unsignedTxn });
  log("debug", "[signICPSendTransaction] blob", Buffer.from(blob).toString("hex"));
  const signatures = await icp.sign(derivationPath, Buffer.from(blob), 0);

  invariant(signatures.signatureRS, "[ICP](signICPSendTransaction) Signature not found");
  return Buffer.from(signatures.signatureRS).toString("hex");
};

export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          log("debug", "[signOperation] icp start fn");
          log("debug", "[signOperation] transaction", transaction);

          const { derivationPath } = getAddress(account);
          const { unsignedTransaction, transferRawRequest } = createUnsignedTransaction(
            transaction,
            account,
          );

          o.next({
            type: "device-signature-requested",
          });

          // if (transaction.type === "list") {
          //   const res = await signICPListNeuronsTransaction({
          //     unsignedTxn,
          //     transport,
          //     path: getPath(derivationPath),
          //     payloads,
          //     pubkey: xpub ?? "",
          //   });
          //   signedTxn = res.signedTxn;
          // } else {
          const signature = await signICPSendTransaction(
            unsignedTransaction,
            getPath(derivationPath),
            transport,
          );

          o.next({
            type: "device-signature-granted",
          });

          const hash = hashTransaction({
            from: account.freshAddress,
            to: transaction.recipient,
            amount: transferRawRequest.amount.e8s,
            fee: transferRawRequest.fee.e8s,
            memo: transferRawRequest.memo,
            created_at_time: transferRawRequest.created_at_time[0]["timestamp_nanos"],
          });

          const operation = await buildOptimisticOperation(account, transaction, hash);
          invariant(account.xpub, "[ICP](signOperation) Account xpub is required");
          const cborPayload = Cbor.encode({
            content: unsignedTransaction,
            sender_pubkey: Secp256k1PublicKey.fromRaw(
              new Uint8Array(Buffer.from(account.xpub, "hex")),
            ).toDer(),
            sender_sig: Buffer.from(signature, "hex"),
          });

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
              rawData: {
                encodedSignedBlob: Buffer.from(cborPayload).toString("hex"),
              },
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );
