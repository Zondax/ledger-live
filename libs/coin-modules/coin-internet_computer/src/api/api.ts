import { log } from "@ledgerhq/logs";
import { MAINNET_LEDGER_CANISTER_ID } from "../../consts";
import {
  HttpAgent,
  Actor,
  Cbor,
  Certificate,
  bufFromBufLike,
  lookupResultToBuffer,
} from "@dfinity/agent";
import { idlFactory } from "../../idlFactoryLedger";
import { AccountIdentifier, IndexCanister } from "@dfinity/ledger-icp";
import BigNumber from "bignumber.js";
import { Principal } from "@dfinity/principal";

const getAgent = async () => {
  return await HttpAgent.create({ host: "https://ic0.app/" });
};

const getIndexCanister = async () => {
  const canister = IndexCanister.create({
    agent: await getAgent(),
  });

  return canister;
};

// const getLedgerCanister = async () => {
//   const canister = LedgerCanister.create({
//     agent: await HttpAgent.create({ host: "https://ic0.app/" }),
//   });

//   return canister;
// };

export const fetchBlockHeight = async (): Promise<BigNumber> => {
  const agent = await getAgent();
  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId: MAINNET_LEDGER_CANISTER_ID,
  });

  const res: any = await actor.query_blocks({ start: 0, length: 1 });

  return BigNumber(res.chain_length.toString());
};

export const broadcastTxn = async (
  payload: Buffer,
  canisterId: string,
  type: "call" | "read_state",
) => {
  log("debug", `[ICP] Broadcasting ${type} to ${canisterId}, body: ${payload.toString("hex")}`);
  const res = await fetch(`https://ic0.app/api/v2/canister/${canisterId}/${type}`, {
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
  for (let i = 0; i < 5; i++) {
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
  const canister = await getIndexCanister();
  const addressObj = AccountIdentifier.fromHex(address);
  log("debug", `[ICP] Fetching balance for ${address}`);
  const data = await canister.accountBalance({ certified: false, accountIdentifier: addressObj });
  log("debug", `[ICP] Balance: ${data}`);
  return BigNumber(data.toString());
};

export const fetchTxns = async (address: string) => {
  const accountIdentifier = AccountIdentifier.fromHex(address);
  const canister = await getIndexCanister();
  const response = await canister.getTransactions({
    certified: false,
    accountIdentifier,
    maxResults: BigInt(10000),
  });

  const filteredResponse = response.transactions.filter(
    (tx: any) => tx.transaction.operation.Transfer !== undefined,
  );

  return filteredResponse.sort((a, b) => {
    const timestamp1 = a.transaction.timestamp[0]?.timestamp_nanos;
    const timestamp2 = b.transaction.timestamp[0]?.timestamp_nanos;
    if (timestamp1 && timestamp2) {
      return timestamp1 > timestamp2 ? -1 : 1;
    }
    return 1;
  });
};
