import {
  KadenaOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/kadena/types";
import { Account } from "@ledgerhq/types-live";
import { LLDCoinFamily } from "../types";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";
import operationDetails from "./operationDetails";

const family: LLDCoinFamily<Account, Transaction, TransactionStatus, KadenaOperation> = {
  operationDetails,
  AccountSubHeader,
  sendAmountFields,
};

export default family;
