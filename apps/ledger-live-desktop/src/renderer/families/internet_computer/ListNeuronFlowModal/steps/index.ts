import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepListNeuron, { StepListNeuronFooter } from "./ListNeuron";
import { StepProps, St } from "../types";
import StepManage from "./Manage";
export function useSteps(): St[] {
  const { t } = useTranslation();
  return useMemo<St[]>(
    () => [
      {
        id: "device",
        label: t("cosmos.undelegation.flow.steps.device.title"),
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        noScroll: true,
      },
      {
        id: "confirmation",
        label: "Select neuron",
        component: StepListNeuron,
        footer: StepListNeuronFooter,
        noScroll: true,
      },
      {
        id: "manage",
        label: "Manage neuron",
        component: StepManage,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("confirmation");
        },
      },
    ],
    [t],
  );
}
