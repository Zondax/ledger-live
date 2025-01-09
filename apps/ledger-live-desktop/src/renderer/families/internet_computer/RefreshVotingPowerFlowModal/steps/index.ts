import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepListNeuron from "../../components/ListNeuron";
import { StepProps, St } from "../../common/types";
export function useSteps(): St[] {
  const { t } = useTranslation();
  return useMemo<St[]>(
    () => [
      {
        id: "confirmation",
        label: "Neurons",
        component: StepListNeuron,
        noScroll: true,
      },
      {
        id: "device",
        label: t("cosmos.undelegation.flow.steps.device.title"),
        component: GenericStepConnectDevice as React.ComponentType<StepProps>,
        noScroll: true,
      },
    ],
    [t],
  );
}
