import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

// const ADDRESS = 

export const kadena: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "kadena seed 1",
      apdus: `
      => 0002000015052c00008072020080000000800000000000000000
      <= 2015daab7d9ba9f8a465ffc4bfb33e68ca5e9f51ef0bab387284963129fe04ec3e9000
      `,
    },
  ],
  // accounts: [
  //   {
  //     raw: {
  //       id: `js:2:kadena:ADDR:`,
  //       seedIdentifier: ADDR,
  //       name: "MyCoin 1",
  //       derivationMode: "",
  //       index: 0,
  //       freshAddress: ADDR,
  //       freshAddressPath: "44'/354'/0'/0/0'",
  //       freshAddresses: [],
  //       blockHeight: 0,
  //       operations: [],
  //       pendingOperations: [],
  //       currencyId: "mycoin",
  //       unitMagnitude: 10,
  //       lastSyncDate: "",
  //       balance: "2111000",
  //     },
  //     transactions: [
  //       // HERE WE WILL INSERT OUR test
  //     ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    kadena,
  },
};