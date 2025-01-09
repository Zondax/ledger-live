import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "../components/Body";
import { StepId } from "../common/types";
import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";

export type Props = {
  account: ICPAccount;
  refresh?: boolean;
};

export default function RefreshVotingPowerModal({ refresh = false }: Props) {
  const [stepId, setStepId] = useState<StepId>(refresh ? "device" : "confirmation");
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
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      render={({ onClose, data }) => (
        <Body
          account={data.account}
          refresh={refresh}
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={onChange}
          modalName={modalName}
        />
      )}
    />
  );
}
