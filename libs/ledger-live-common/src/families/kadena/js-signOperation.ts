import { SignOperationFnSignature } from "@ledgerhq/types-live";
import { KadenaOperation, Transaction } from "./types";
import { withDevice } from "../../hw/deviceAccess";
import { Observable } from "rxjs";
import BigNumber from "bignumber.js";
import Kadena, {
  BuildTransactionResult,
  TransferCrossChainTxParams,
  TransferTxParams,
} from "hw-app-kda";
import { fetchCoinDetailsForAccount } from "./api/network";
import { KDA_NETWORK } from "./consts";
import invariant from "invariant";
import { getAddress, kdaToBaseUnit } from "./utils";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

export const signOperation: SignOperationFnSignature<Transaction> = ({
  account,
  deviceId,
  transaction,
}) =>
  withDevice(deviceId)(
    transport =>
      new Observable(o => {
        async function main() {
          // log("debug", "[signOperation] start fn");

          const { recipient, amount, fees, receiverChainId, senderChainId } = transaction;
          const { id: accountId } = account;
          const { address, derivationPath } = getAddress(account);

          const coinDetails = await fetchCoinDetailsForAccount(address, [
            transaction.receiverChainId.toString(),
          ]);

          o.next({
            type: "device-signature-requested",
          });

          const kadena = new Kadena(transport as any);

          let buildTxnRes: BuildTransactionResult;

          const creationTimeStamp = Date.now();
          const txnTTLSecs = 1200;
          const transferCommons: TransferTxParams | TransferCrossChainTxParams = {
            amount: kdaToBaseUnit(amount).toFixed(),
            chainId: senderChainId,
            network: KDA_NETWORK,
            recipient,
            path: derivationPath,
            creationTime: Math.floor(creationTimeStamp / 1000),
            ttl: txnTTLSecs.toString(),
          };
          if (transaction.senderChainId === transaction.receiverChainId) {
            if (coinDetails[transaction.receiverChainId]) {
              buildTxnRes = await kadena.signTransferTx({
                ...transferCommons,
              });
            } else {
              buildTxnRes = await kadena.signTransferCreateTx({
                ...transferCommons,
              });
            }
          } else {
            buildTxnRes = await kadena.signTransferCrossChainTx({
              ...transferCommons,
              recipient_chainId: transaction.receiverChainId,
            });
          }

          invariant(buildTxnRes, "transferCmd is required");

          const { hash } = buildTxnRes.pact_command;

          o.next({
            type: "device-signature-granted",
          });

          const operation: KadenaOperation = {
            id: encodeOperationId(accountId, hash, "OUT"),
            hash,
            type: "OUT",
            senders: [address],
            recipients: [recipient],
            accountId,
            value: new BigNumber(amount),
            fee: new BigNumber(fees),
            blockHash: null,
            blockHeight: null,
            date: new Date(creationTimeStamp),
            extra: {
              receiverChainId,
              senderChainId,
            },
          };

          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature: buildTxnRes.pact_command.sigs[0].sig,
              expirationDate: new Date(creationTimeStamp + txnTTLSecs * 1000),
              rawData: { pact_command: buildTxnRes.pact_command },
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
