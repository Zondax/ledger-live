import { BroadcastFnSignature } from "@ledgerhq/types-live";

export const broadcast: BroadcastFnSignature = async ({ signedOperation: { operation } }) => {
  // log("debug", "[broadcast] start fn");

  //   await broadcastTxn(signature);

  const result = { ...operation };

  return result;
};

export default broadcast;
