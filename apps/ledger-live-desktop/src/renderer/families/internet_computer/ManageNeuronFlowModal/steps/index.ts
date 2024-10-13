import { useMemo } from "react";
// import { useTranslation } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import { StepProps, St } from "../types";

// You'll need to create these components
import StepConfirmation from "./Confirmation";
import StepManage from "./Manage";

export function useSteps(): St[] {
  //   const { t } = useTranslation();
  return useMemo<St[]>(
    () => [
      {
        id: "device",
        // label: t("internet_computer.manageNeuron.steps.device.title"),
        label: "Device",
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        noScroll: true,
      },
      {
        id: "manage",
        // label: t("internet_computer.manageNeuron.steps.manage.title"),
        label: "Manage",
        component: StepManage,
        onBack: ({ transitionTo }: StepProps) => transitionTo("device"),
      },
      //   {
      //     id: "fund",
      //     label: t("internet_computer.manageNeuron.steps.fund.title"),
      //     component: StepFund,
      //     onBack: ({ transitionTo }: StepProps) => transitionTo("manage"),
      //   },
      {
        id: "confirmation",
        // label: t("internet_computer.manageNeuron.steps.confirmation.title"),
        label: "Confirmation",
        component: StepConfirmation,
        onBack: ({ transitionTo }: StepProps) => transitionTo("fund"),
      },
    ],
    [],
  );
}
