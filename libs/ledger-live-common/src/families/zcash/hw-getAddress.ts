import ZCashApp from "@zondax/ledger-zcash";
import { log } from "@ledgerhq/logs";
import { Resolver } from "../../hw/getAddress/types";
import { getPath, isError } from "./utils";

const resolver: Resolver = async (transport, { path, verify }) => {
  log("debug", "start getAddress process");

  const app = new ZCashApp(transport);

  const r = verify
    ? await app.showAddressAndPubKey(getPath(path), true)
    : await app.getAddressAndPubKey(getPath(path), true);

  isError(r);
  if (!r.address || !r.address_raw) {
    throw Error("Failed to get address from device");
  }

  return {
    path,
    address: r.address,
    publicKey: r.address_raw.toString("hex"),
  };
};

export default resolver;
