import React, { useCallback, useState } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { createStructuredSelector } from "reselect";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  ICPAccount,
  ICPNeuron,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { StepId, St } from "./types";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSteps } from "./steps";
import Stepper from "~/renderer/components/Stepper";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/SyncSkipUnderPriority";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import invariant from "invariant";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import logger from "~/renderer/logger";

type OwnProps = {
  account: ICPAccount;
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  data: {
    neuron: ICPNeuron;
  };
};

type StateProps = {
  device: Device | undefined | null;
  openModal: OpenModal;
};

type Props = OwnProps & StateProps;

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
});

const mapDispatchToProps = {
  openModal,
};

function Body({
  account: accountProp,
  stepId,
  onChangeStepId,
  data,
  onClose,
  openModal,
  device,
}: Props) {
  const dispatch = useDispatch();
  const [optimisticOperation, setOptimisticOperation] = useState<InternetComputerOperation | null>(
    null,
  );
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const {
    account,
    transaction,
    bridgeError,
    setTransaction,
    updateTransaction,
    bridgePending,
    status,
  } = useBridgeTransaction(() => {
    invariant(accountProp, "icp: account");
    const bridge = getAccountBridge(accountProp, undefined);
    const initTx = bridge.createTransaction(accountProp);
    const transaction = bridge.updateTransaction(initTx, {});
    return {
      account: accountProp,
      transaction,
    };
  });
  const steps = useSteps();
  const error = transactionError || bridgeError;
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("device");
  }, [onChangeStepId]);
  const handleStepChange = useCallback(({ id }: St) => onChangeStepId(id), [onChangeStepId]);

  const handleOperationBroadcasted = useCallback(
    (optimisticOperation: InternetComputerOperation) => {
      if (!account) return;
      dispatch(
        updateAccountWithUpdater(account.id, account =>
          addPendingOperation(account, optimisticOperation),
        ),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
    },
    [account, dispatch],
  );
  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const stepperProps = {
    title: "Manage Neurons",
    device,
    account,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["amount"].includes(stepId),
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose,
    error,
    status,
    optimisticOperation,
    openModal,
    neuron: data.neuron,
    setSigned,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    bridgePending,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalUndelegation" />
    </Stepper>
  );
}

const C = compose<React.ComponentType<OwnProps>>(connect(mapStateToProps, mapDispatchToProps))(
  Body,
);

export default C;
