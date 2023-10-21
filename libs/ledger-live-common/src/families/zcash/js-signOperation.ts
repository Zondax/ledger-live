import { Operation, SignOperationFnSignature } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { log } from "@ledgerhq/logs";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import BigNumber from "bignumber.js";

import {
  InitData,
  OUTPUT_PATH,
  SPEND_PATH,
  ZcashBuilderBridge,
  get_inittx_data,
} from "@zondax/zcashtools";
import type { TinData, ToutData, TransparentOutputInfo } from "@zondax/zcashtools/build/native";

import { getWalletAccount } from "../bitcoin/wallet-btc";

import { Transaction } from "./types";
import { signerContext } from "./bridge/utils";
import { isError, getPathComponents } from "./utils";

const signOperation: SignOperationFnSignature<Transaction> = ({ account, deviceId, transaction }) =>
  signerContext(
    deviceId,
    hwApp =>
      new Observable(o => {
        async function signOp() {
          const { currency } = account;
          const walletAccount = getWalletAccount(account);
          log("hw", `signTransaction ${currency.id} for account ${account.id}`);

          const builder = new ZcashBuilderBridge(1000);

          let tx_input_data: InitData = { t_in: [], t_out: [], s_spend: [], s_output: [] };
          for (let i in transaction.inputs!!) {
            const tin = transaction.inputs[i];
            let value = {
              address: tin.address,
              value: tin.value.toNumber(),
              path: Uint32Array.from(getPathComponents(walletAccount.params.path)),
            } as TinData;
            builder.add_transparent_input({
              outp: tin.outp,
              value: value.value,
              address: tin.address,
              pk: tin.address, //FIXME: replace with public key
            });
            tx_input_data.t_in[i] = value;
          }

          for (let i in transaction.outputs!!) {
            const tout = transaction.outputs[i];
            let value = { address: tout.address, value: tout.value.toNumber() } as ToutData;
            builder.add_transparent_output(value as TransparentOutputInfo);
            tx_input_data.t_out[i] = value;
          }

          const initdata = get_inittx_data(tx_input_data);
          const initTxRes = await hwApp.inittx(initdata);
          isError(initTxRes);

          const blobToSign = builder.build(SPEND_PATH, OUTPUT_PATH, 5);
          o.next({ type: "device-signature-requested" });
          const signRes = await hwApp.checkandsign(blobToSign, 5);
          isError(signRes);

          let transparent_sigs: string[] = [];
          for (let i in tx_input_data.t_in) {
            o.next({ type: "device-streaming", progress: i, total: tx_input_data.t_in.length });
            const sigRes = await hwApp.extracttranssig();
            isError(sigRes);
            transparent_sigs[i] = sigRes.sig_raw;
          }

          o.next({ type: "device-signature-granted" });
          const signature = builder.add_signatures({ transparent_sigs, spend_sigs: [] });

          // Build the optimistic operation
          const operation: Operation = {
            id: encodeOperationId(account.id, "", "OUT"),
            hash: "", // Will be resolved in broadcast()
            type: "OUT",
            value: new BigNumber(transaction.amount).plus(1000),
            fee: new BigNumber(1000),
            blockHash: null,
            blockHeight: null,
            senders: Array.from(tx_input_data.t_in.map(tin => tin.address)),
            recipients: Array.from(tx_input_data.t_out.map(tout => tout.address)),
            accountId: account.id,
            date: new Date(),
            extra: {},
          };
          o.next({
            type: "signed",
            signedOperation: {
              operation,
              signature,
            },
          });
        }

        signOp().then(
          () => o.complete(),
          e => o.error(e),
        );
      }),
  );

export default signOperation;
