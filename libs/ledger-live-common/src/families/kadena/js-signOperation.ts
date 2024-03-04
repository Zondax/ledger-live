import { Operation, SignOperationFnSignature } from "@ledgerhq/types-live";
import { Transaction } from "./types";
import { withDevice } from "../../hw/deviceAccess";
import { Observable } from "rxjs";
import BigNumber from "bignumber.js";

export const signOperation: SignOperationFnSignature<Transaction> = ({
  //   _account,
  deviceId,
  //   _transaction,
}) =>
  withDevice(deviceId)(
    _transport =>
      new Observable(o => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          o.next({
            type: "device-signature-requested",
          });

          o.next({
            type: "device-signature-granted",
          });

          const operation: Operation = {
            id: "",
            hash: "",
            type: "OUT",
            senders: [],
            recipients: [],
            accountId: "",
            value: new BigNumber(0),
            fee: new BigNumber(0),
            blockHash: null,
            blockHeight: null,
            date: new Date(),
            extra: {},
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: "",
              expirationDate: new Date(),
            },
          });
        }

        main().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

export default signOperation;
