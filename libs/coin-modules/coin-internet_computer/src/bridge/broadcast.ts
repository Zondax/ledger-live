import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTxn, pollForReadState } from "./bridge/bridgeHelpers/api";
import { GovernanceCanister } from "@dfinity/nns";
import { ICPAccount, InternetComputerOperation, Transaction } from "./types";
import { ListNeuronsResponse } from "@dfinity/nns/dist/candid/governance";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "./consts";
import { idlFactory as idlFactoryGovernance } from "./idlFactoryGovernanceOld";
import { IDL } from "@dfinity/candid";
import { derivePrincipalFromPubkey } from "./utils";
import { NeuronsData } from "./neurons";

// Interface to structure raw data for broadcasting transactions
interface BroadcastRawData {
  encodedSignedCallBlob: string;
  encodedSignedReadStateBlob: string;
  requestId: string;
  methodName: Transaction["type"];
}

// Main broadcast function for handling Internet Computer transactions
export const broadcast: AccountBridge<Transaction, ICPAccount>["broadcast"] = async ({
  account,
  signedOperation: { operation, rawData },
}) => {
  log("debug", "[broadcast] Internet Computer transaction broadcast initiated");

  // Type assertion and validation for rawData
  const rawDataTyped = rawData as unknown as BroadcastRawData;
  invariant(rawDataTyped, "[ICP](broadcast) Missing rawData");
  invariant(rawDataTyped.encodedSignedCallBlob, "[ICP](broadcast) Missing encodedSignedCallBlob");

  // Logic for different transaction types
  switch (rawDataTyped.methodName) {
    case "list_neurons":
    case "start_dissolving":
    case "stop_dissolving":
    case "disburse":
      await broadcastTxn(
        Buffer.from(rawDataTyped.encodedSignedCallBlob, "hex"),
        MAINNET_GOVERNANCE_CANISTER_ID,
        "call",
      );
      break;

    case "send":
    case "create_neuron":
      await broadcastTxn(
        Buffer.from(rawDataTyped.encodedSignedCallBlob, "hex"),
        MAINNET_LEDGER_CANISTER_ID,
        "call",
      );
      break;
  }

  // Synchronizing neurons if "list_neurons" is called
  if (
    rawDataTyped.encodedSignedReadStateBlob &&
    rawDataTyped.requestId &&
    rawDataTyped.methodName === "list_neurons"
  ) {
    const reply = await pollForReadState(
      Buffer.from(rawDataTyped.encodedSignedReadStateBlob, "hex"),
      MAINNET_GOVERNANCE_CANISTER_ID,
      rawDataTyped.requestId,
    );

    const listNeuronsIdlFunc = idlFactoryGovernance({ IDL })._fields.find(
      func => func[0] === rawDataTyped.methodName,
    );

    const [listNeuronsResponse]: [ListNeuronsResponse] = IDL.decode(
      listNeuronsIdlFunc[1].retTypes,
      reply,
    ) as any;

    const neurons = new NeuronsData(listNeuronsResponse.full_neurons, Date.now());
    return {
      ...operation,
      extra: {
        neurons,
      },
    } as InternetComputerOperation;
  }

  // Additional step for neuron creation
  if (rawDataTyped.methodName === "create_neuron") {
    invariant(account.xpub, "[ICP](broadcast) Missing account xpub");
    const govCanister = GovernanceCanister.create();
    const memo = (operation as InternetComputerOperation).extra.memo;
    invariant(memo, "[ICP](broadcast) Missing memo");

    const neuronId = await govCanister.claimOrRefreshNeuronFromAccount({
      memo: BigInt(memo),
      controller: derivePrincipalFromPubkey(account.xpub),
    });

    return {
      ...operation,
      extra: {
        createdNeuronId: neuronId?.toString(),
      },
    } as InternetComputerOperation;
  }

  return operation;
};
