import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./Confirmation";
import { StepProps, St } from "../types";
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
        component: StepConfirmation,
        footer: StepConfirmationFooter,
        onBack: ({ transitionTo }: StepProps) => transitionTo("device"),
        noScroll: true,
      },
    ],
    [t],
  );
}
