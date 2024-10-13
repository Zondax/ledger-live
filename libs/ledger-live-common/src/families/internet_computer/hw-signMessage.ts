import ICP, { ResponseSign } from "@zondax/ledger-icp";
import { log } from "@ledgerhq/logs";

import type { SignMessage, Result } from "../../hw/signMessage/types";
import { getBufferFromString, getPath, isError } from "./utils";

function bufferToArrayBuffer(buffer: Buffer): Buffer {
  const sig = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return Buffer.from(sig);
}

const signMessage: SignMessage = async (transport, account, { message }): Promise<Result> => {
  log("debug", "start signMessage process");

  const icp = new ICP(transport as any);

  if (!message) throw new Error("Message cannot be empty");
  if (typeof message !== "string") throw new Error("Message must be a string");

  const r: ResponseSign = await icp.sign(
    getPath(account.freshAddressPath),
    getBufferFromString(message),
    0,
  );
  isError(r);
  if (!r.signatureRS) {
    throw Error("Signing failed");
  }

  return {
    rsv: {
      r: "",
      s: "",
      v: 0,
    },
    signature: bufferToArrayBuffer(r.signatureRS).toString("hex"),
  };
};

export default { signMessage };
