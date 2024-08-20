import { Account } from "@ledgerhq/types-live";
import { Transaction } from "../../../types";
import { constructionInvoke, getICPRosettaNetworkIdentifier } from "../../../api";
import {
  ICPRosettaConstructionCombineRequest,
  ICPRosettaConstructionCombineResponse,
  ICPRosettaConstructionHashRequest,
  ICPRosettaConstructionHashResponse,
  ICPRosettaConstructionPayloadsRequest,
  ICPRosettaConstructionPayloadsResponse,
  ICPRosettaConstructionSubmitRequest,
  ICPRosettaConstructionSubmitResponse,
  ICPRosettaConstructionDeriveRequest,
  ICPRosettaConstructionDeriveResponse,
  ICPRosettaICPRosettaOperation,
} from "./types";
import {
  ingressExpiry,
  generateSendOperations,
  generateSignaturesPayload,
  generateListNeuronsOperations,
} from "./utils";
import {
  CallRequest,
  Cbor,
  ReadRequest,
  ReadRequestType,
  ReadStateRequest,
  RequestId,
  requestIdOf,
} from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import BigNumber from "bignumber.js";
import { ICP_SEND_TXN_TYPE } from "../../../consts";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { ICPSigner } from "../../../types";

export const getUnsignedSendTransaction = async (
  transaction: Transaction,
  account: Account,
): Promise<{
  unsignedTxn: string;
  payloads: ICPRosettaConstructionPayloadsResponse["payloads"];
}> => {
  let ops: ICPRosettaICPRosettaOperation[];
  if (transaction.type === "list") {
    ops = generateListNeuronsOperations(transaction, account);
  } else {
    ops = generateSendOperations(transaction, account);
  }
  const pubkeys = [
    {
      hex_bytes: account.xpub ?? "",
      curve_type: "secp256k1",
    },
  ];

  const reqOpts: ICPRosettaConstructionPayloadsRequest = {
    ...getICPRosettaNetworkIdentifier(),
    operations: ops,
    public_keys: pubkeys,
  };
  if (transaction.type !== "list") {
    reqOpts.metadata = {
      memo: parseInt(transaction.memo ?? "0"),
    };
  }
  const { payloads, unsigned_transaction } = await constructionInvoke<
    ICPRosettaConstructionPayloadsRequest,
    ICPRosettaConstructionPayloadsResponse
  >(reqOpts, "payloads");

  return { unsignedTxn: unsigned_transaction, payloads };
};

export const createReadStatePaths = (requestId: RequestId) => [
  [new TextEncoder().encode("request_status"), requestId],
];

function createReadStateRequest(body: CallRequest): {
  readStateBody: ReadStateRequest;
  requestId: RequestId;
} {
  const requestId = requestIdOf(body);
  const readStateBody: ReadRequest = {
    // Can't import ReadRequestType as value from @dfinity/agent because it's const enum
    request_type: "read_state" as ReadRequestType.ReadState,
    paths: createReadStatePaths(requestId),
    ingress_expiry: body.ingress_expiry,
    sender: body.sender,
  };
  return {
    readStateBody,
    requestId,
  };
}

export const signICPListNeuronsTransaction = async ({
  unsignedTxn,
  transport,
  path,
  payloads,
  pubkey,
}: {
  unsignedTxn: string;
  transport: Transport;
  path: string;
  payloads: ICPRosettaConstructionPayloadsResponse["payloads"];
  pubkey: string;
}): Promise<{
  signatures: { txnSig: string; readSig: string };
  signedTxn: string;
}> => {
  const icp = new ICP(transport);
  const decodedTxn: any = Cbor.decode(Buffer.from(unsignedTxn, "hex"));
  const txnReqFromCbor = decodedTxn.updates[0][1];
  const expiry = new ingressExpiry(BigNumber(decodedTxn.ingress_expiries[0].toString()));

  const mainPayload = {
    content: {
      request_type: "call",
      canister_id: Principal.fromUint8Array(txnReqFromCbor.canister_id),
      method_name: txnReqFromCbor.method_name,
      arg: txnReqFromCbor.arg,
      sender: Principal.fromUint8Array(txnReqFromCbor.sender),
      ingress_expiry: expiry,
    },
  };

  const readStatePayload = {
    content: createReadStateRequest(mainPayload.content as any).readStateBody,
  };

  const signedTxnRes = await icp.signUpdateCall(
    path,
    Buffer.from(Cbor.encode(mainPayload)),
    Buffer.from(Cbor.encode(readStatePayload)),
    0,
  );
  isError(signedTxnRes);

  const txnSig = Buffer.from(signedTxnRes.RequestSignatureRS ?? "").toString("hex");
  const readSig = Buffer.from(signedTxnRes.StatusReadSignatureRS ?? "").toString("hex");

  const result = {
    signatures: {
      readSig,
      txnSig,
    },
  };

  const signaturesPayload = generateSignaturesPayload(result.signatures, payloads, pubkey);

  const { signed_transaction: signedTxn } = await constructionInvoke<
    ICPRosettaConstructionCombineRequest,
    ICPRosettaConstructionCombineResponse
  >(
    {
      ...getICPRosettaNetworkIdentifier(),
      signatures: signaturesPayload,
      unsigned_transaction: unsignedTxn,
    },
    "combine",
  );

  return { ...result, signedTxn };
};

export const signICPSendTransaction = async ({
  unsignedTxn,
  path,
  payloads,
  pubkey,
}: {
  signerContext: SignerContext<ICPSigner>;
  deviceId: string;
  unsignedTxn: string;
  path: string;
  payloads: ICPRosettaConstructionPayloadsResponse["payloads"];
  pubkey: string;
}): Promise<{
  signatures: { txnSig: string; readSig: string };
  signedTxn: string;
}> => {
  const decodedTxn: any = Cbor.decode(Buffer.from(unsignedTxn, "hex"));
  const txnReqFromCbor = decodedTxn.updates[0][1];
  const expiry = new ingressExpiry(BigNumber(decodedTxn.ingress_expiries[0].toString()));

  const submitReq = {
    request_type: "call",
    canister_id: Principal.fromUint8Array(txnReqFromCbor.canister_id),
    method_name: txnReqFromCbor.method_name,
    arg: txnReqFromCbor.arg,
    sender: Principal.fromUint8Array(txnReqFromCbor.sender),
    ingress_expiry: expiry,
  };

  const txnBlobToSign = Cbor.encode({
    content: submitReq,
  });

  const { r } = await signerContext(deviceId, async signer => {
    const r = await signer.sign(path, Buffer.from(txnBlobToSign), ICP_SEND_TXN_TYPE);
    return { r };
  });

  const result = {
    signatures: {
      readSig: "",
      txnSig: Buffer.from(r.signatureRS ?? "").toString("hex"),
    },
  };

  const signaturesPayload = generateSignaturesPayload(result.signatures, payloads, pubkey);

  const { signed_transaction: signedTxn } = await constructionInvoke<
    ICPRosettaConstructionCombineRequest,
    ICPRosettaConstructionCombineResponse
  >(
    {
      ...getICPRosettaNetworkIdentifier(),
      signatures: signaturesPayload,
      unsigned_transaction: unsignedTxn,
    },
    "combine",
  );

  return { ...result, signedTxn };
};

export const getTxnMetadata = async (signedTxn: string): Promise<{ hash: string }> => {
  const {
    transaction_identifier: { hash },
  } = await constructionInvoke<
    ICPRosettaConstructionHashRequest,
    ICPRosettaConstructionHashResponse
  >({ ...getICPRosettaNetworkIdentifier(), signed_transaction: signedTxn }, "hash");

  return { hash };
};

export const getTxnExpirationDate = (_unsignedTxn: string): Date => {
  return new Date();
};

export const broadcastTxn = async (signedTxn: string) => {
  return await constructionInvoke<
    ICPRosettaConstructionSubmitRequest,
    ICPRosettaConstructionSubmitResponse
  >({ ...getICPRosettaNetworkIdentifier(), signed_transaction: signedTxn }, "submit");
};

export const deriveAddressFromPubkey = async (pubkey: string) => {
  const res = await constructionInvoke<
    ICPRosettaConstructionDeriveRequest,
    ICPRosettaConstructionDeriveResponse
  >(
    {
      ...getICPRosettaNetworkIdentifier(),
      public_key: { curve_type: "secp256k1", hex_bytes: pubkey },
    },
    "derive",
  );

  return res.account_identifier.address;
};
