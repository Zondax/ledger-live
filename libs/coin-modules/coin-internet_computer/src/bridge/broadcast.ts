import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTxn, pollForReadState, getAgent } from "../api";
import { GovernanceCanister } from "@dfinity/nns";
import {
  ICPAccount,
  ICPAccountRaw,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "../types";
import { ListNeuronsResponse } from "@dfinity/nns/dist/candid/governance";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";
import { MAINNET_GOVERNANCE_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID } from "../consts";
import { idlFactory as idlFactoryGovernance } from "@dfinity/nns/dist/candid/governance.idl";
import { IDL } from "@dfinity/candid";
import { derivePrincipalFromPubkey } from "../common-logic/utils";
import { NeuronsData } from "../neurons";

// Interface to structure raw data for broadcasting transactions
interface BroadcastRawData {
  encodedSignedCallBlob: string;
  encodedSignedReadStateBlob: string;
  requestId: string;
  methodName: Transaction["type"];
  neuronId?: string;
}

// Main broadcast function for handling Internet Computer transactions
export const broadcast: AccountBridge<
  Transaction,
  ICPAccount,
  TransactionStatus,
  ICPAccountRaw
>["broadcast"] = async ({ account, signedOperation: { operation, rawData } }) => {
  log("debug", "[broadcast] Internet Computer transaction broadcast initiated");

  // Type assertion and validation for rawData
  const rawDataTyped = rawData as unknown as BroadcastRawData;
  invariant(rawDataTyped, "[ICP](broadcast) Missing rawData");
  invariant(rawDataTyped.encodedSignedCallBlob, "[ICP](broadcast) Missing encodedSignedCallBlob");
  invariant(operation.extra, "[ICP](broadcast) Missing operation extra");

  // Logic for different transaction types
  switch (rawDataTyped.methodName) {
    case "list_neurons":
    case "start_dissolving":
    case "stop_dissolving":
    case "disburse":
    case "refresh_voting_power":
    case "stake_maturity":
    case "spawn_neuron":
    case "increase_dissolve_delay":
    case "set_dissolve_delay":
    case "split_neuron":
    case "remove_hot_key":
    case "auto_stake_maturity":
    case "follow":
      await broadcastTxn(
        Buffer.from(rawDataTyped.encodedSignedCallBlob, "hex"),
        MAINNET_GOVERNANCE_CANISTER_ID,
        "call",
      );
      break;

    case "send":
    case "increase_stake":
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

    invariant(
      listNeuronsIdlFunc,
      `[ICP](broadcast) Missing listNeuronsIdlFunc with methodName: ${rawDataTyped.methodName}`,
    );
    const [listNeuronsResponse]: [ListNeuronsResponse] = IDL.decode(
      listNeuronsIdlFunc[1].retTypes,
      reply,
    ) as any;

    const neurons = new NeuronsData(
      listNeuronsResponse.full_neurons,
      listNeuronsResponse.neuron_infos,
      Date.now(),
    );
    return {
      ...operation,
      extra: {
        ...operation.extra,
        neurons,
      },
    } as InternetComputerOperation;
  }

  // Additional logic post-transaction broadcast
  // Additional step for neuron creation
  if (rawDataTyped.methodName === "create_neuron") {
    invariant(account.xpub, `[ICP](broadcast-${rawDataTyped.methodName}) Missing account xpub`);

    const agent = await getAgent();
    const govCanister = GovernanceCanister.create({ agent });

    const memo = (operation as InternetComputerOperation).extra.memo;
    invariant(memo, "[ICP](broadcast) Missing memo");

    log("debug", `[ICP](broadcast) Claiming or refreshing neuron with memo: ${memo}`);
    // try this 3 times with increasing delay
    let neuronId: bigint | undefined = undefined;
    for (let i = 0; i < 3; i++) {
      try {
        neuronId = await govCanister.claimOrRefreshNeuronFromAccount({
          memo: BigInt(memo),
          controller: derivePrincipalFromPubkey(account.xpub),
        });
        break;
      } catch (e) {
        log("error", `[ICP](broadcast) Error claiming or refreshing neuron: ${e}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    invariant(neuronId, `[ICP](broadcast) Failed to claim or refresh neuron with memo: ${memo}`);
    return {
      ...operation,
      extra: {
        ...operation.extra,
        createdNeuronId: neuronId?.toString(),
      },
    } as InternetComputerOperation;
  }

  // Additional step for neuron stake increase
  if (rawDataTyped.methodName === "increase_stake") {
    invariant(account.xpub, `[ICP](broadcast-${rawDataTyped.methodName}) Missing account xpub`);

    const agent = await getAgent();
    const govCanister = GovernanceCanister.create({ agent });

    invariant(
      rawDataTyped.neuronId,
      `[ICP](broadcast-${rawDataTyped.methodName}) Missing neuronId`,
    );

    await govCanister.claimOrRefreshNeuron({
      neuronId: BigInt(rawDataTyped.neuronId),
      by: undefined,
    });
  }

  return operation;
};
