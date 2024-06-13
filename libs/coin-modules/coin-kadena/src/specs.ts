// import expect from "expect";
// import invariant from "invariant";
// import type { AppSpec } from "@ledgerhq/coin-framework/bot/types";
// import type { Transaction } from "./types";
// import { Account } from "@ledgerhq/types-live";
// import { botTest, pickSiblings } from "@ledgerhq/coin-framework/bot/specs";
// import { isAccountEmpty } from "@ledgerhq/coin-framework/account/index";
// import {
//     getCryptoCurrencyById,
//     listTokensForCryptoCurrency,
//     parseCurrencyUnit,
//   } from "@ledgerhq/coin-framework/currencies/index";
// import { DeviceModelId } from "@ledgerhq/devices";

// const currency = getCryptoCurrencyById("kadena");
// // Minimum balance required for a new non-ASA account
// const minBalanceNewAccount = parseCurrencyUnit(currency.units[0], "1");
 
// // Ensure that, when the recipient corresponds to an empty account,
// // the amount to send is greater or equal to the required minimum
// // balance for such a recipient
// const checkSendableToEmptyAccount = (amount, recipient) => {
//   if (isAccountEmpty(recipient) && amount.lte(minBalanceNewAccount)) {
//     invariant(
//       amount.gt(minBalanceNewAccount),
//       "not enough funds to send to new account"
//     );
//   }
// };
 
// const kadena: AppSpec<Transaction> = {
//   name: "Kadena",
//   currency,
//   appQuery: {
//     model: DeviceModelId.nanoS,
//     appName: "kadena",
//   },
//   mutations: [
//     {
//       name: "move ~50%",
//       maxRun: 2,
//       transaction: ({ account, siblings, bridge, maxSpendable }) => {
//         const sibling = pickSiblings(siblings, 4);
//         const recipient = sibling.freshAddress;
 
//         let transaction = bridge.createTransaction(account);
 
//         let amount = spendableBalance
//           .div(1.9 + 0.2 * Math.random())
//           .integerValue();
 
//         checkSendableToEmptyAccount(amount, sibling);
 
//         const updates = [{ amount }, { recipient }];
//         return {
//           transaction,
//           updates,
//         };
//       },
//       test: ({ account, accountBeforeTransaction, operation }) => {
//         botTest("account balance decreased with operation value", () =>
//           expect(account.balance.toString()).toBe(
//             accountBeforeTransaction.balance.minus(operation.value).toString()
//           )
//         );
//       },
//     },
//   ],
// };
 
// export default { kadena };