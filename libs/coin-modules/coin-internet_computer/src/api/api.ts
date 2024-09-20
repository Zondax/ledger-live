import { log } from "@ledgerhq/logs";
import { MAINNET_LEDGER_CANISTER_ID } from "../../consts";
import { HttpAgent, Actor } from "@dfinity/agent";
import { idlFactory } from "@dfinity/ledger-icp/dist/candid/ledger.idl";
import { AccountIdentifier, IndexCanister } from "@dfinity/ledger-icp";
import BigNumber from "bignumber.js";

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
