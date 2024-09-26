import { AccountBridge } from "@ledgerhq/types-live";
import { broadcastTxn } from "./bridge/bridgeHelpers/api";
import { Transaction } from "./types";
import { log } from "@ledgerhq/logs";
import invariant from "invariant";

export const broadcast: AccountBridge<Transaction>["broadcast"] = async ({
  signedOperation: { operation, rawData },
}) => {
  log("debug", "[broadcast] internet_computer start fn");

  invariant(rawData, "[ICP](broadcast) rawData not found");
  invariant(rawData.encodedSignedBlob, "[ICP](broadcast) encodedSignedBlob not found");

  await broadcastTxn(Buffer.from(rawData.encodedSignedBlob as string, "hex"));

  // log("debug", "[broadcast] internet computer broadcast reponse", response);
  // if (response.metadata.operations[0].type === ICPOperationTypeListNeuron) {
  //   const op = response.metadata.operations[0];
  //   return {
  //     ...operation,
  //     extra: {
  //       neurons: { fullNeurons: op.metadata?.full_neurons, neuronInfos: op.metadata?.neuron_infos },
  //     },
  //   };
  // }

  return operation;
};
