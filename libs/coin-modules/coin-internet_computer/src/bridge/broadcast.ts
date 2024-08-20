import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTxn } from "./bridge/bridgeHelpers/icpRosetta";
import { ICPOperationTypeListNeuron, Transaction } from "./types";
import { log } from "@ledgerhq/logs";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { signature, operation },
}) => {
  log("debug", "[broadcast] internet_computer start fn");

  const response = await broadcastTxn(signature);

  log("debug", "[broadcast] internet computer broadcast reponse", response);
  if (response.metadata.operations[0].type === ICPOperationTypeListNeuron) {
    const op = response.metadata.operations[0];
    return {
      ...operation,
      extra: {
        neurons: { fullNeurons: op.metadata?.full_neurons, neuronInfos: op.metadata?.neuron_infos },
      },
    };
  }

  return { ...operation };
};
