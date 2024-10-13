import React, { useState, useCallback } from "react";
import Modal from "~/renderer/components/Modal";
import Body from "./Body";
import { StepId } from "./types";
import { ICPAccount, ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";

export type Props = {
  account: ICPAccount;
  neuron: ICPNeuron;
};

export default function ManageNeuronFlowModal({ account, neuron }: Props) {
  const [stepId, setStepId] = useState<StepId>("manage");
  const onHide = useCallback(() => {
    setStepId("manage");
  }, []);
  const onChange = useCallback((id: StepId) => {
    setStepId(id);
  }, []);
  const isModalLocked = ["device", "confirmation"].includes(stepId);
  return (
    <Modal
      name="MODAL_ICP_MANAGE_NEURON"
      centered
      onHide={onHide}
      preventBackdropClick={isModalLocked}
      render={({ onClose }) => (
        <Body
          account={account}
          stepId={stepId}
          onClose={onClose}
          onChangeStepId={onChange}
          data={{ neuron }}
        />
      )}
    />
  );
}
