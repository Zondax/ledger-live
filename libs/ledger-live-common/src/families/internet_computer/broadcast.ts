import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTxn, pollForReadState } from "./bridge/bridgeHelpers/api";
import { GovernanceCanister } from "@dfinity/nns";
import { InternetComputerOperation, Transaction } from "./types";
import { ListNeuronsResponse } from "@dfinity/nns/dist/candid/governance";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "./consts";
import { idlFactory as idlFactoryGovernance } from "./idlFactoryGovernanceOld";
import { IDL } from "@dfinity/candid";
import { derivePrincipalFromPubkey } from "./utils";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  account,
  signedOperation: { operation, rawData },
}) => {
  log("debug", "[broadcast] internet_computer start fn");

  invariant(rawData, "[ICP](broadcast) rawData not found");
  invariant(rawData.encodedSignedCallBlob, "[ICP](broadcast) encodedSignedCallBlob not found");

  if (rawData.methodName === "list_neurons") {
    await broadcastTxn(
      Buffer.from(rawData.encodedSignedCallBlob as string, "hex"),
      MAINNET_GOVERNANCE_CANISTER_ID,
      "call",
    );
  } else {
    await broadcastTxn(
      Buffer.from(rawData.encodedSignedCallBlob as string, "hex"),
      MAINNET_LEDGER_CANISTER_ID,
      "call",
    );
  }

  if (rawData.encodedSignedReadStateBlob && rawData.requestId && rawData.methodName) {
    const reply = await pollForReadState(
      Buffer.from(rawData.encodedSignedReadStateBlob as string, "hex"),
      MAINNET_GOVERNANCE_CANISTER_ID,
      rawData.requestId as string,
    );

    const listNeuronsIdlFunc = idlFactoryGovernance({ IDL })._fields.find(
      func => func[0] === rawData.methodName,
    );

    const [listNeuronsResponse]: [ListNeuronsResponse] = IDL.decode(
      listNeuronsIdlFunc[1].retTypes,
      reply,
    ) as any;

    return {
      ...operation,
      extra: {
        neurons: {
          fullNeurons: listNeuronsResponse.full_neurons,
        },
      },
    } as InternetComputerOperation;
  }

  if (rawData.methodName === "create_neuron") {
    invariant(account.xpub, "[ICP](broadcast) xpub not found");
    const govCanister = GovernanceCanister.create();
    const memo = (operation as InternetComputerOperation).extra.memo;
    invariant(memo, "[ICP](broadcast) memo not found");

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
