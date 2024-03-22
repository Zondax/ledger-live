import Kadena from "hw-app-kda";
import { log } from "@ledgerhq/logs";

import type { SignMessage, Result } from "../../hw/signMessage/types";
import { getPath } from "./utils";
// import { ICP_SEND_TXN_TYPE } from "./consts";

const signMessage: SignMessage = async (transport, account, { message }): Promise<Result> => {
  log("debug", "start signMessage process");

  const kadena = new Kadena(transport as any);

  if (!message) throw new Error("Message cannot be empty");
  if (typeof message !== "string") throw new Error("Message must be a string");

  const r = await kadena.signTransaction(getPath(account.freshAddressPath), message);

  if (!r.signature) {
    throw Error("Signing failed");
  }

  return {
    rsv: {
      r: "",
      s: "",
      v: 0,
    },
    signature: Buffer.from(r.signature).toString("hex"),
  };
};

export default { signMessage };
