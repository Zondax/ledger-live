import { log } from "@ledgerhq/logs";
import {
  FETCH_TXNS_LIMIT,
  MAINNET_INDEX_CANISTER_ID,
  // MAINNET_INDEX_CANISTER_ID,
  MAINNET_LEDGER_CANISTER_ID,
} from "../consts";
import { HttpAgent, Cbor, Certificate, bufFromBufLike, lookupResultToBuffer } from "@dfinity/agent";
import { idlFactory as ledgerIdlFactory } from "@dfinity/ledger-icp/dist/candid/ledger.idl";
import { idlFactory as indexIdlFactory } from "@dfinity/ledger-icp/dist/candid/index.idl";
import { GetAccountIdentifierTransactionsResponse, TransactionWithId } from "@dfinity/ledger-icp";
import BigNumber from "bignumber.js";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";
import { fromNullable } from "@dfinity/utils";
import invariant from "invariant";

const ICP_NETWORK_URL = "https://ic0.app";
export const getAgent = async () => {
  return await HttpAgent.create({ host: ICP_NETWORK_URL, shouldFetchRootKey: true });
};

export const fetchBlockHeight = async (): Promise<BigNumber> => {
  const canisterId = Principal.fromText(MAINNET_LEDGER_CANISTER_ID);
  const queryBlocksRawRequest = {
    start: BigInt(0),
    length: BigInt(1),
  };

  const queryBlocksIdlFunc = ledgerIdlFactory({ IDL })._fields.find(f => f[0] === "query_blocks");
  invariant(queryBlocksIdlFunc, "[ICP](fetchBlockHeight) Method not found");
  const queryBlocksargs = IDL.encode(queryBlocksIdlFunc[1].argTypes, [queryBlocksRawRequest]);

  const agent = await getAgent();
  const blockHeightRes = await agent.query(canisterId, {
    arg: queryBlocksargs,
    methodName: "query_blocks",
  });

  invariant(blockHeightRes.status === "replied", "[ICP](fetchBlockHeight) Query failed");

  const decodedIdl: [{ chain_length: bigint }] = IDL.decode(
    queryBlocksIdlFunc[1].retTypes,
    blockHeightRes.reply.arg,
  ) as any;
  const decoded = fromNullable(decodedIdl);
  invariant(decoded, "[ICP](fetchBlockHeight) Decoding failed");

  return BigNumber(decoded.chain_length.toString());
};

export const broadcastTxn = async (
  payload: Buffer,
  canisterId: string,
  type: "call" | "read_state",
) => {
  log("debug", `[ICP] Broadcasting ${type} to ${canisterId}, body: ${payload.toString("hex")}`);
  const res = await fetch(`${ICP_NETWORK_URL}/api/v2/canister/${canisterId}/${type}`, {
    body: payload,
    method: "POST",
    headers: {
      "Content-Type": "application/cbor",
    },
  });

  // If the status is not 2XX, throw an error
  if (res.status >= 400) {
    throw new Error(`Failed to broadcast transaction: ${res.text()}`);
  }

  return await res.arrayBuffer();
};

export const pollForReadState = async (payload: Buffer, canisterId: string, requestId: string) => {
  let reply: ArrayBuffer | undefined = undefined;
  for (let i = 0; i < 15; i++) {
    const readStateResponse = await broadcastTxn(payload, canisterId, "read_state");
    const readStateData: any = Cbor.decode(readStateResponse);
    const agent = await getAgent();
    // console.log("readStateData", readStateData);

    const encodedCertificate = readStateData.certificate;
    const cert = Uint8Array.from(Buffer.from(encodedCertificate, "hex"));
    const certificate = await Certificate.create({
      certificate: bufFromBufLike(cert),
      rootKey: agent.rootKey,
      maxAgeInMinutes: 100,
      canisterId: Principal.from(canisterId),
    });

    // console.log("requestId: ", Buffer.from(requestId).toString("hex"));
    const path = [
      new TextEncoder().encode("request_status"),
      Uint8Array.from(Buffer.from(requestId, "hex")),
    ];
    const status = new TextDecoder().decode(
      lookupResultToBuffer(certificate.lookup([...path, "status"])),
    );

    switch (status) {
      case "replied":
        reply = lookupResultToBuffer(certificate.lookup([...path, "reply"]));
        // console.log("reply: ", reply);
        break;
    }

    if (!reply) {
      // wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!reply) {
    throw new Error(`[ICP](pollForReadState) Reply not found`);
  }
  return reply;
};

export const fetchBalance = async (address: string): Promise<BigNumber> => {
  const agent = await getAgent();
  const indexCanister = Principal.fromText(MAINNET_INDEX_CANISTER_ID);
  const getBalanceIdlFunc = indexIdlFactory({ IDL })._fields.find(
    f => f[0] === "get_account_identifier_balance",
  );
  invariant(getBalanceIdlFunc, "[ICP](fetchBalance) Method not found");
  const getBalanceArgs = IDL.encode(getBalanceIdlFunc[1].argTypes, [address]);

  const balanceRes = await agent.query(indexCanister, {
    arg: getBalanceArgs,
    methodName: "get_account_identifier_balance",
  });

  if (balanceRes.status !== "replied") {
    log("debug", `[ICP](fetchBalance) Query failed: ${balanceRes.status}`);
    return BigNumber(0);
  }

  const decodedBalance = IDL.decode(getBalanceIdlFunc[1].retTypes, balanceRes.reply.arg) as any;
  const balance: bigint | undefined = fromNullable(decodedBalance);
  if (!balance) {
    return BigNumber(0);
  }

  return BigNumber(balance.toString());
};

export const fetchTxns = async (
  address: string,
  startBlockHeight: bigint,
  stopBlockHeight = BigInt(0),
): Promise<TransactionWithId[]> => {
  if (startBlockHeight <= stopBlockHeight) {
    return [];
  }

  const agent = await getAgent();
  const canisterId = Principal.fromText(MAINNET_INDEX_CANISTER_ID);
  const transactionsRawRequest = {
    account_identifier: address,
    start: [startBlockHeight],
    max_results: BigInt(FETCH_TXNS_LIMIT),
  };

  const getTransactionsIdlFunc = indexIdlFactory({ IDL })._fields.find(
    f => f[0] === "get_account_identifier_transactions",
  );
  invariant(getTransactionsIdlFunc, "[ICP](fetchTxns) Method not found");
  const getTransactionsArgs = IDL.encode(getTransactionsIdlFunc[1].argTypes, [
    transactionsRawRequest,
  ]);

  const transactionsRes = await agent.query(canisterId, {
    arg: getTransactionsArgs,
    methodName: "get_account_identifier_transactions",
  });

  invariant(transactionsRes.status === "replied", "[ICP](fetchTxns) Query failed");
  const decodedTransactions: [{ Ok: GetAccountIdentifierTransactionsResponse }] = IDL.decode(
    getTransactionsIdlFunc[1].retTypes,
    transactionsRes.reply.arg,
  ) as any;

  const response = fromNullable(decodedTransactions);
  invariant(response, "[ICP](fetchTxns) Decoding failed");

  if (response.Ok.transactions.length === 0) {
    return [];
  }

  const nextTxns = await fetchTxns(
    address,
    response.Ok.transactions.at(-1)?.id ?? BigInt(0),
    stopBlockHeight,
  );

  return [...response.Ok.transactions, ...nextTxns];
};
