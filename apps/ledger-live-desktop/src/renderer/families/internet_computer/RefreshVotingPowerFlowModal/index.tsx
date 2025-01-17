import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";

export type Props = {
  account: ICPAccount;
};

export default function RefreshVotingPowerModal() {
  const [stepId, setStepId] = useState<StepId>("confirmation");
  const onHide = useCallback(() => {
    setStepId("device");
  }, []);
  const onChange = useCallback((id: StepId) => {
    setStepId(id);
  }, []);
  const isModalLocked = ["device", "confirmation"].includes(stepId);
  const modalName = "MODAL_ICP_REFRESH_VOTING_POWER";
  return (
    <Modal
      name={modalName}
      centered
      width={800}
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      render={({ onClose, data }) => (
        <Body account={data.account} stepId={stepId} onClose={onClose} onChangeStepId={onChange} />
      )}
    />
  );
}
