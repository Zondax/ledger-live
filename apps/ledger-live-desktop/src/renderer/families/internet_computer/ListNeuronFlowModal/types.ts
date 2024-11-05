import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Step } from "~/renderer/components/Stepper";
import {
  Transaction,
  TransactionStatus,
  ICPAccount,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { OpenModal } from "~/renderer/actions/modals";
import { NeuronsData } from "@ledgerhq/live-common/families/internet_computer/neurons";
export type StepId = "device" | "confirmation";
export type StepProps = {
  transitionTo: (address: string) => void;
  device: Device | undefined | null;
  account: ICPAccount;
  parentAccount: never;
  onRetry: () => void;
  onClose: () => void;
  openModal: OpenModal;
  optimisticOperation: InternetComputerOperation | undefined;
  error: Error | undefined;
  signed: boolean;
  neurons: NeuronsData;
  transaction: Transaction | undefined | null;
  onStepChange: ({ id }: St) => void;
  status: TransactionStatus;
  onChangeTransaction: (tx: Transaction) => void;
  onUpdateTransaction: (a: (tx: Transaction) => Transaction) => void;
  onTransactionError: (error: Error) => void;
  onOperationBroadcasted: (operation: InternetComputerOperation) => void;
  setSigned: (signed: boolean) => void;
  bridgePending: boolean;
  validatorAddress: string;
};
export type St = Step<StepId, StepProps>;
