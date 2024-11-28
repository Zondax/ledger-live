import { Observable } from "rxjs";
import { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAddress } from "./bridge/bridgeHelpers/addresses";
import { buildOptimisticSendOperation as buildOptimisticOperation } from "./buildOptimisticOperation";
import { withDevice } from "../../hw/deviceAccess";
import { ICPAccount, Transaction } from "./types";
import { derivePrincipalFromPubkey, getPath, pubkeyToDer } from "./utils";
import ICP from "@zondax/ledger-icp";
import { log } from "@ledgerhq/logs";
import { AccountIdentifier } from "@dfinity/ledger-icp";
import { idlFactory as idlFactoryLedger } from "./idlFactoryLedger";
import { idlFactory as idlFactoryGovernanceOld } from "./idlFactoryGovernanceOld";
import { idlFactory as idlFactoryGovernance } from "./idlFactoryGovernance";
import { IDL } from "@dfinity/candid";
import invariant from "invariant";
import { Principal } from "@dfinity/principal";
import {
  Cbor,
  Expiry,
  ReadRequest,
  ReadRequestType,
  requestIdOf,
  SubmitRequestType,
} from "@dfinity/agent";
import {
  DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS,
  ICP_FEES,
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
} from "./consts";
import Transport from "@ledgerhq/hw-transport";
import { hashTransaction } from "./bridge/bridgeHelpers/hash";
import { toNullable } from "@dfinity/utils";

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

export interface NeuronCommandRawRequest<T extends DisburseCommand | ConfigureOperationCommand> {
  id: [{ id: bigint }];
  command: T[];
  neuron_id_or_subaccount: [];
}

interface DisburseCommand {
  Disburse: { to_account: string[]; amount: [{ e8s: bigint }] };
}

interface ConfigureOperationCommand {
  Configure: {
    operation: [{ StartDissolving: object } | { StopDissolving: object }];
  };
}

interface ListNeuronsRawRequest {
  include_public_neurons_in_full_neurons: [boolean] | [];
  neuron_ids: BigUint64Array;
  include_empty_neurons_readable_by_caller: [boolean] | [];
  include_neurons_readable_by_caller: boolean;
}

const createUnsignedListNeuronsTransaction = (
  account: Account,
): { unsignedTransaction: UnsignedTransaction; listNeuronsRawRequest: ListNeuronsRawRequest } => {
  const listNeuronsRawRequest: ListNeuronsRawRequest = {
    include_public_neurons_in_full_neurons: toNullable(false),
    neuron_ids: BigUint64Array.from([]),
    include_empty_neurons_readable_by_caller: toNullable(true),
    include_neurons_readable_by_caller: true,
  };

  const p = idlFactoryGovernanceOld({ IDL })._fields.find(f => f[0] === "list_neurons");
  invariant(p, "[ICP](createUnsignedListNeuronsTransaction) Method not found");
  const args = IDL.encode(p[1].argTypes, [listNeuronsRawRequest]);

  invariant(account.xpub, "[ICP](createUnsignedListNeuronsTransaction) Account xpub is required");
  const canisterID = Principal.from(MAINNET_GOVERNANCE_CANISTER_ID);
  const unsignedTransaction: UnsignedTransaction = {
    request_type: SubmitRequestType.Call,
    canister_id: canisterID,
    method_name: "list_neurons",
    arg: args,
    sender: derivePrincipalFromPubkey(account.xpub),
    ingress_expiry: new Expiry(DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS),
  };

  return { unsignedTransaction, listNeuronsRawRequest };
};

// Generic function to create an unsigned transaction for a neuron command
const createUnsignedNeuronCommandTransaction = (
  transaction: Transaction,
  account: Account,
): {
  unsignedTransaction: UnsignedTransaction;
  neuronCommandRawRequest: NeuronCommandRawRequest<DisburseCommand | ConfigureOperationCommand>;
} => {
  const { neuronId, amount } = transaction;
  invariant(neuronId, "[ICP](createUnsignedNeuronCommandTransaction) Neuron ID is required");

  const rawCommand: NeuronCommandRawRequest<DisburseCommand | ConfigureOperationCommand> = {
    id: [{ id: BigInt(neuronId) }],
    neuron_id_or_subaccount: [],
    command: [],
  };

  switch (transaction.type) {
    case "disburse":
      rawCommand.command = [
        {
          Disburse: {
            to_account: [],
            amount: [{ e8s: BigInt(amount.toString()) }],
          },
        },
      ];
      break;
    case "start_dissolving":
      rawCommand.command = [
        {
          Configure: { operation: [{ StartDissolving: {} }] },
        },
      ];
      break;
    case "stop_dissolving":
      rawCommand.command = [
        {
          Configure: { operation: [{ StopDissolving: {} }] },
        },
      ];
      break;
  }

  const disburseIDLMethod = idlFactoryGovernance({ IDL })._fields.find(
    f => f[0] === "manage_neuron",
  );
  invariant(disburseIDLMethod, "[ICP](createUnsignedNeuronCommandTransaction) Method not found");
  const args = IDL.encode(disburseIDLMethod[1].argTypes, [rawCommand]);

  const canisterID = Principal.from(MAINNET_GOVERNANCE_CANISTER_ID);
  invariant(account.xpub, "[ICP](createUnsignedTransaction) Account xpub is required");
  const unsignedTransaction: UnsignedTransaction = {
    request_type: SubmitRequestType.Call,
    canister_id: canisterID,
    method_name: "manage_neuron",
    arg: args,
    sender: derivePrincipalFromPubkey(account.xpub),
    ingress_expiry: new Expiry(DEFAULT_INGRESS_EXPIRY_DELTA_IN_MSECS),
  };

  return { unsignedTransaction, neuronCommandRawRequest: rawCommand };
};

const createUnsignedSendTransaction = (
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

  const transferIDLMethod = idlFactoryLedger({ IDL })._fields.find(f => f[0] === "transfer");
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

const signICPTransaction = async (
  unsignedTxn: UnsignedTransaction,
  derivationPath: string,
  transport: Transport,
  account: Account,
  isCreateNeuron: boolean,
) => {
  const icp = new ICP(transport);
  const blob = Cbor.encode({ content: unsignedTxn });
  log("debug", "[signICPTransaction] blob", Buffer.from(blob).toString("hex"));
  const signatures = await icp.sign(derivationPath, Buffer.from(blob), isCreateNeuron ? 1 : 0);

  invariant(signatures.signatureRS, "[ICP](signICPTransaction) Signature not found");
  invariant(account.xpub, "[ICP](signICPTransaction) Account xpub is required");
  return {
    signature: Buffer.from(signatures.signatureRS).toString("hex"),
    callBody: {
      content: unsignedTxn,
      sender_pubkey: pubkeyToDer(account.xpub),
      sender_sig: signatures.signatureRS,
    },
  };
};

const createReadStateRequest = async (body: UnsignedTransaction) => {
  const requestId = await requestIdOf(body);
  const paths = [[new TextEncoder().encode("request_status"), requestId]];
  const readStateBody: ReadRequest = {
    request_type: ReadRequestType.ReadState,
    paths,
    ingress_expiry: body.ingress_expiry,
    sender: body.sender,
  };
  return {
    readStateBody,
    requestId,
  };
};

const signUpdateICPTransaction = async (
  unsignedTxn: UnsignedTransaction,
  derivationPath: string,
  transport: Transport,
  account: Account,
) => {
  const icp = new ICP(transport);
  const { requestId, readStateBody } = await createReadStateRequest(unsignedTxn);

  const signatures = await icp.signUpdateCall(
    derivationPath,
    Buffer.from(Cbor.encode({ content: unsignedTxn })),
    Buffer.from(Cbor.encode({ content: readStateBody })),
    0,
  );

  invariant(account.xpub, "[ICP](signUpdateICPTransaction) Account xpub is required");
  invariant(
    signatures.RequestSignatureRS,
    "[ICP](signUpdateICPTransaction) Request signature not found",
  );
  invariant(
    signatures.StatusReadSignatureRS,
    "[ICP](signUpdateICPTransaction) Status read signature not found",
  );

  return {
    signature: Buffer.from(signatures.RequestSignatureRS).toString("hex"),
    requestId,
    readStateBody: {
      content: readStateBody,
      sender_pubkey: pubkeyToDer(account.xpub),
      sender_sig: signatures.StatusReadSignatureRS,
    },
    callBody: {
      content: unsignedTxn,
      sender_pubkey: pubkeyToDer(account.xpub),
      sender_sig: signatures.RequestSignatureRS,
    },
  };
};

export const signOperation: AccountBridge<Transaction, ICPAccount>["signOperation"] = ({
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

          invariant(account.xpub, "[ICP](signOperation) Account xpub is required");
          const { derivationPath } = getAddress(account);
          let unsignedTransaction: UnsignedTransaction;
          let transferRawRequest: TransferRawRequest | undefined;
          if (transaction.type === "list_neurons") {
            ({ unsignedTransaction } = createUnsignedListNeuronsTransaction(account));
          } else if (
            transaction.type === "disburse" ||
            transaction.type === "start_dissolving" ||
            transaction.type === "stop_dissolving"
          ) {
            ({ unsignedTransaction } = createUnsignedNeuronCommandTransaction(
              transaction,
              account,
            ));
          } else {
            ({ unsignedTransaction, transferRawRequest } = createUnsignedSendTransaction(
              transaction,
              account,
            ));
          }

          o.next({
            type: "device-signature-requested",
          });

          let signature: string = "";
          let encodedSignedCallBlob: string = "";
          let encodedSignedReadStateBlob: string = "";
          let requestId: string = "";
          if (transaction.type === "list_neurons") {
            const res = await signUpdateICPTransaction(
              unsignedTransaction,
              getPath(derivationPath),
              transport,
              account,
            );
            signature = res.signature;
            encodedSignedCallBlob = Buffer.from(Cbor.encode(res.callBody)).toString("hex");
            encodedSignedReadStateBlob = Buffer.from(Cbor.encode(res.readStateBody)).toString(
              "hex",
            );
            requestId = Buffer.from(res.requestId).toString("hex");
          } else {
            const res = await signICPTransaction(
              unsignedTransaction,
              getPath(derivationPath),
              transport,
              account,
              transaction.type === "create_neuron",
            );
            signature = res.signature;
            encodedSignedCallBlob = Buffer.from(Cbor.encode(res.callBody)).toString("hex");
          }
          invariant(signature, "[ICP](signOperation) Signature not found");

          o.next({
            type: "device-signature-granted",
          });

          const hash = transferRawRequest
            ? hashTransaction({
                from: account.freshAddress,
                to: transaction.recipient,
                amount: transferRawRequest.amount.e8s,
                fee: transferRawRequest.fee.e8s,
                memo: transferRawRequest.memo,
                created_at_time: transferRawRequest.created_at_time[0]["timestamp_nanos"],
              })
            : undefined;

          const operation = await buildOptimisticOperation(account, transaction, hash);

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
              rawData: {
                encodedSignedCallBlob,
                encodedSignedReadStateBlob,
                requestId,
                methodName: transaction.type,
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
