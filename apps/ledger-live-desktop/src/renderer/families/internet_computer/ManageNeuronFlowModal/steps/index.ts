import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepListNeuron, { StepListNeuronFooter } from "./ListNeuron";
import { StepProps, St } from "../types";
import StepManage from "./Manage";
import StepConfirmation from "../../components/Confirmation";
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
        id: "listNeuron",
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
      {
        id: "manageAction",
        label: "Manage neuron action",
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        excludeFromBreadcrumb: true,
        noScroll: true,
      },
      {
        id: "confirmation",
        label: "Confirmation",
        component: StepConfirmation as React.ComponentType<StepProps>,
        footer: StepListNeuronFooter,
        onBack: ({ transitionTo }: StepProps) => {
          transitionTo("listNeuron");
        },
      },
    ],
    [t],
  );
}
