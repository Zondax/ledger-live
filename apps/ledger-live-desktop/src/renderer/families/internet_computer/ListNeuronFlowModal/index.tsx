import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import {
  ICPAccount,
  ICPTransactionType,
} from "@ledgerhq/live-common/families/internet_computer/types";

export type Props = {
  account: ICPAccount;
  refresh?: boolean;
  neuronIndex?: number;
  lastManageAction?: ICPTransactionType;
};

export default function ListNeuronsModal({
  refresh = false,
  lastManageAction,
  neuronIndex = 0,
}: Props) {
  const [stepId, setStepId] = useState<StepId>(refresh ? "device" : "confirmation");

  if (lastManageAction && stepId !== "success") {
    setStepId("success");
  }

  const onHide = useCallback(() => {
    setStepId("device");
  }, []);
  const onChange = useCallback((id: StepId) => {
    setStepId(id);
  }, []);
  const isModalLocked = ["device", "confirmation"].includes(stepId);
  const modalName = "MODAL_ICP_LIST_NEURONS";
  return (
    <Modal
      name={modalName}
      centered
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      width={stepId === "manage" || stepId === "confirmation" ? 800 : undefined}
      render={({ onClose, data }) => (
        <Body
          account={data.account}
          refresh={refresh}
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={onChange}
          neuronIndex={neuronIndex}
          lastManageAction={lastManageAction}
        />
      )}
    />
  );
}
