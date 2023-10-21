import {
  AccountShapeInfo,
  GetAccountShape,
  mergeOps,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, Operation } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { firstValueFrom, from } from "rxjs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { startSpan } from "../../../performance";

import wallet, {
  Currency,
  Output,
  DerivationModes as WalletDerivationModes,
  Output as WalletOutput,
} from "../../bitcoin/wallet-btc";
import { BitcoinAccount, BitcoinOutput } from "../../bitcoin/types";
import { mapTxToOperations } from "../../bitcoin/logic";

import { decodeAccountId, encodeAccountId } from "../../../account";
import { withDevice } from "../../../hw/deviceAccess";
import { getPath } from "../utils";
import ZCashApp from "@zondax/ledger-zcash";
import BigNumber from "bignumber.js";

export const unimplemented: (name: string) => (params: any) => any = name => params => {
  throw new Error(`${name} for ZCash not implemented`);
};

export const signerContext = (deviceId: string, fn: (signer: ZCashApp) => any): any =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(new ZCashApp(transport)))));

function toWalletNetwork(id: string): "testnet" | "mainnet" {
  return getCryptoCurrencyById(id).isTestnetFor ? "testnet" : "mainnet";
}

// wallet-btc limitation: returns all transactions twice (for each side of the tx)
// so we need to deduplicate them...
const deduplicateOperations = (operations: (Operation | undefined)[]): Operation[] => {
  const seen = {};
  const out: Operation[] = [];
  let j = 0;

  for (const operation of operations) {
    if (operation) {
      if (seen[operation.id] !== 1) {
        seen[operation.id] = 1;
        out[j++] = operation;
      }
    }
  }

  return out;
};

// Map wallet-btc's Output to LL's BitcoinOutput
const fromWalletUtxo = (utxo: WalletOutput, changeAddresses: Set<string>): BitcoinOutput => {
  return {
    hash: utxo.output_hash,
    outputIndex: utxo.output_index,
    blockHeight: utxo.block_height,
    address: utxo.address,
    value: new BigNumber(utxo.value),
    rbf: utxo.rbf,
    isChange: changeAddresses.has(utxo.address),
  };
};

export const getAccountShape: GetAccountShape = async (info: AccountShapeInfo) => {
  let span: ReturnType<typeof startSpan>;
  const { currency, index, derivationPath, derivationMode, initialAccount, deviceId } = info;

  const rootPath = derivationPath.split("/", 2).join("/");
  const accountPath = `${rootPath}/${index}'`;

  const address = await retrieveAddress({ deviceId, accountPath }, initialAccount);
  const xpub = address; //FIXME: replace with proper xpub
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const walletNetwork = toWalletNetwork(currency.id);
  const walletDerivationMode = WalletDerivationModes.LEGACY; //default

  //let's generate an account in the btc-like wallet
  span = startSpan("sync", "generateAccount");
  const walletAccount =
    (initialAccount as BitcoinAccount)?.bitcoinResources?.walletAccount ||
    (await wallet.generateAccount(
      {
        xpub,
        path: rootPath,
        index,
        currency: <Currency>currency.id,
        network: walletNetwork,
        derivationMode: walletDerivationMode,
      },
      currency,
    ));
  span.finish();

  // do the sync stuff like btc
  const oldOperations = initialAccount?.operations || [];
  const [, currentBlock] = await Promise.all([
    wallet.syncAccount(walletAccount),
    walletAccount.xpub.explorer.getCurrentBlock(),
  ]);
  const blockHeight = currentBlock?.height;
  const balance = await wallet.getAccountBalance(walletAccount);
  span = startSpan("sync", "getAccountTransactions");
  const { txs: transactions } = await wallet.getAccountTransactions(walletAccount);
  span.finish();

  span = startSpan("sync", "getXpubAddresses");
  const accountAddresses: Set<string> = new Set<string>();
  const accountAddressesWithInfo = await walletAccount.xpub.getXpubAddresses();
  accountAddressesWithInfo.forEach(a => accountAddresses.add(a.address));
  span.finish();

  span = startSpan("sync", "getUniquesAddresses");
  const changeAddresses: Set<string> = new Set<string>();
  const changeAddressesWithInfo = walletAccount.xpub.storage.getUniquesAddresses({
    account: 1,
  });
  changeAddressesWithInfo.forEach(a => changeAddresses.add(a.address));
  span.finish();

  span = startSpan("sync", "mapTxToOperations");
  const newOperations = transactions
    ?.map(tx => mapTxToOperations(tx, currency.id, accountId, accountAddresses, changeAddresses))
    .flat();
  span.finish();

  span = startSpan("sync", "unify operations");
  const newUniqueOperations = deduplicateOperations(newOperations);
  const operations = mergeOps(oldOperations, newUniqueOperations);
  span.finish();

  span = startSpan("sync", "gather utxos");
  const rawUtxos = await wallet.getAccountUnspentUtxos(walletAccount);
  const utxos = rawUtxos.map(utxo => fromWalletUtxo(utxo, changeAddresses));
  span.finish();
  // done with sync

  log("debug", `Generation of account shape for ${address}`);

  return {
    id: accountId,
    xpub,
    balance,
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
    freshAddress: walletAccount.xpub.freshAddress,
    freshAddressPath: `${accountPath}/0/${walletAccount.xpub.freshAddressIndex}`,
    blockHeight,
    bitcoinResources: {
      utxos,
      walletAccount,
    },
  };
};

async function retrieveAddress(
  { deviceId, accountPath }: { deviceId?: string; accountPath: string },
  initialAccount?: Account,
): Promise<string> {
  const paramAddr = initialAccount ? decodeAccountId(initialAccount.id).xpubOrAddress : undefined;

  let generatedAddr: string | undefined;
  if (!paramAddr) {
    // Xpub not provided, generate it using the hwapp

    if (deviceId === undefined || deviceId === null) {
      throw new Error("deviceId required to generate the xpub");
    }
    generatedAddr = await signerContext(deviceId, async signer =>
      signer.getAddressAndPubKey(getPath(accountPath), true).then(res => res.address as string),
    );
  }

  return (paramAddr || generatedAddr)!!;
}
