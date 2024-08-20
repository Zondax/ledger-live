import {
  ICPAccount,
  InternetComputerOperation,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { LLDCoinFamily } from "../types";
import accountHeaderManageActions from "./AccountHeaderManageActions";
import operationDetails from "./operationDetails";
import AccountSubHeader from "./AccountSubHeader";
import sendAmountFields from "./SendAmountFields";

const family: LLDCoinFamily<ICPAccount, Transaction, TransactionStatus, InternetComputerOperation> =
  {
    operationDetails,
    AccountSubHeader,
    sendAmountFields,
    accountHeaderManageActions,
  };

export default family;
