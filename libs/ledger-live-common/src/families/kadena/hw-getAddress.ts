import Kadena from "hw-app-kda";
import { log } from "@ledgerhq/logs";

import type { Resolver } from "../../hw/getAddress/types";
import { getPath } from "./utils";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "start getAddress process");

  const kadena = new Kadena(transport as any);

  try {
    const r = verify
      ? await kadena.verifyAddress(getPath(path))
      : await kadena.getPublicKey(getPath(path));

    const pubKeyStr = Buffer.from(r.publicKey).toString("hex");

    return {
      path,
      publicKey: pubKeyStr,
      address: `k:${pubKeyStr}`,
    };
  } catch (e) {
    log("debug", "getAddress process error " + String(e));
    throw e;
  }
};

export default resolver;
