import { AccountShapeInfo, GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "../../../account";
import { Account } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { firstValueFrom, from } from "rxjs";
import { withDevice } from "../../../hw/deviceAccess";
import ZCashApp from "@zondax/ledger-zcash";
import BigNumber from "bignumber.js";
import { getPath } from "../utils";

export const unimplemented: (name: string) => (params: any) => any = name => params => {
  throw new Error(`${name} for ZCash not implemented`);
};

const signerContext = (deviceId: string, fn: (signer: ZCashApp) => Promise<any>): Promise<any> =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(new ZCashApp(transport)))));

export const getAccountShape: GetAccountShape = async (info: AccountShapeInfo) => {
  const { address, currency, index, derivationPath, derivationMode, initialAccount, deviceId } =
    info;

  const rootPath = derivationPath.split("/", 2).join("/");
  const accountPath = `${rootPath}/${index}'`;

  const xpub = await retrieveXPub({ deviceId, accountPath }, initialAccount);
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: xpub,
    derivationMode,
  });

  log("debug", `Generation account shape for ${address}`);

  const result: Partial<Account> = {
    id: accountId,
    balance: BigNumber(0),
    spendableBalance: BigNumber(0),
    operations: [],
    operationsCount: 0,
    xpub,
  };

  return result;
};

async function retrieveXPub(
  { deviceId, accountPath }: { deviceId?: string; accountPath: string },
  initialAccount?: Account,
): Promise<string> {
  const paramXpub = initialAccount ? decodeAccountId(initialAccount.id).xpubOrAddress : undefined;

  let generatedXpub;
  if (!paramXpub) {
    // Xpub not provided, generate it using the hwapp

    if (deviceId === undefined || deviceId === null) {
      throw new Error("deviceId required to generate the xpub");
    }
    generatedXpub = await signerContext(deviceId, signer =>
      signer.getAddressAndPubKey(getPath(accountPath), true).then(res => res.address as string),
    );
  }

  return paramXpub || generatedXpub;
}
