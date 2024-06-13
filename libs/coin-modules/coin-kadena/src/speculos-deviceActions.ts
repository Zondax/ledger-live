// import type { DeviceAction } from "@ledgerhq/coin-framework/bot/types";
// import type { Transaction } from "./types";
// import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
// import { deviceActionFlow } from "@ledgerhq/coin-framework/bot/specs";
 
// const expectedAmount = ({ account, status }) =>
//   formatCurrencyUnit(account.unit, status.amount, {
//     disableRounding: true,
//   }) + " KDA";
 
// const acceptTransaction: DeviceAction<Transaction, any> = deviceActionFlow({
//   steps: [
//     {
//       title: "Starting Balance",
//       button: "Rr",
//       expectedValue: expectedAmount,
//     },
//     {
//       title: "Send",
//       button: "Rr",
//       expectedValue: expectedAmount,
//     },
//     {
//       title: "Fee",
//       button: "Rr",
//       expectedValue: ({ account, status }) =>
//         formatCurrencyUnit(account.unit, status.estimatedFees, {
//           disableRounding: true,
//         }) + " KDA",
//     },
//     {
//       title: "Destination",
//       button: "Rr",
//       expectedValue: ({ transaction }) => transaction.recipient,
//     },
//     {
//       title: "Accept",
//       button: "LRlr",
//     },
//   ],
// });
 
// export default { acceptTransaction };