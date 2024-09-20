import { Observable } from "rxjs";
import { AccountBridge } from "@ledgerhq/types-live";
import { getAddress } from "./bridge/bridgeHelpers/addresses";
import { buildOptimisticSendOperation as buildOptimisticOperation } from "./buildOptimisticOperation";
import { withDevice } from "../../hw/deviceAccess";
import { Transaction } from "./types";
import { getPath } from "./utils";
import { log } from "@ledgerhq/logs";

export const signOperation: AccountBridge<Transaction>["signOperation"] = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          log("debug", "[signOperation] icp start fn");
          log("debug", "[signOperation] transaction", transaction);

          const { xpub } = account;
          const { derivationPath } = getAddress(account);

          o.next({
            type: "device-signature-requested",
          });

          let signedTxn: string;
          // if (transaction.type === "list") {
          //   const res = await signICPListNeuronsTransaction({
          //     unsignedTxn,
          //     transport,
          //     path: getPath(derivationPath),
          //     payloads,
          //     pubkey: xpub ?? "",
          //   });
          //   signedTxn = res.signedTxn;
          // } else {
          const res = await signICPSendTransaction({
            unsignedTxn,
            transport,
            path: getPath(derivationPath),
            payloads,
            pubkey: xpub ?? "",
          });
          signedTxn = res.signedTxn;
          // }

          o.next({
            type: "device-signature-granted",
          });

          const { hash } = await getTxnMetadata(signedTxn);
          const operation = await buildOptimisticOperation(account, transaction, hash);

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: signedTxn,
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );
