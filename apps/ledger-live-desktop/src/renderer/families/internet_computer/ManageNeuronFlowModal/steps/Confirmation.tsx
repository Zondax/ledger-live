import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import WarnBox from "~/renderer/components/WarnBox";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import TableContainer from "~/renderer/components/TableContainer";
import { StepProps } from "../types";
export default function StepConfirmation({
  account,
  optimisticOperation,
  error,
  signed,
}: StepProps) {
  const { t } = useTranslation();
  const currencyId = account.currency.id;
  // const locale = useSelector(localeSelector);
  // const unit = useAccountUnit(account);
  if (optimisticOperation) {
    return (
      <Container>
        <TrackPage
          category="Manage Neurons ICP Flow"
          name="Step Confirmed"
          flow="stake"
          action="listNeurons"
          currency={currencyId}
        />
        <SyncOneAccountOnMount
          reason="transaction-flow-confirmation"
          priority={10}
          accountId={optimisticOperation.accountId}
        />
        <TableContainer width="90%">
          <WarnBox>
            {
              "The listed neurons may also contains the neurons created through NNS dap as well as disbursed neurons."
            }
          </WarnBox>
          <Box padding={"1rem"} horizontal justifyContent="space-between">
            <Box ff="Inter|SemiBold" fontSize={4}>
              Neuron ID
            </Box>
            <Box ff="Inter|SemiBold" fontSize={4}>
              Staked Amount
            </Box>
            <Box></Box>
          </Box>
        </TableContainer>
      </Container>
    );
  }
  if (error) {
    return (
      <Container shouldSpace={signed}>
        <TrackPage
          category="Undelegation Cosmos Flow"
          name="Step Confirmation Error"
          flow="stake"
          action="undelegation"
          currency={currencyId}
        />
        {signed ? (
          <BroadcastErrorDisclaimer
            title={t("cosmos.undelegation.flow.steps.confirmation.broadcastError")}
          />
        ) : null}
        <ErrorDisplay error={error} withExportLogs />
      </Container>
    );
  }
  return null;
}
const Container = styled(Box).attrs<{
  shouldSpace?: boolean;
}>(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
}))<{
  shouldSpace?: boolean;
}>`
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;
export function StepConfirmationFooter({ account, onClose, error }: StepProps) {
  const { t } = useTranslation();
  const currencyName = account.currency.name;
  return (
    <Box horizontal alignItems="right">
      <Button ml={2} onClick={onClose}>
        {t("common.close")}
      </Button>
      <Button
        primary
        disabled={!!error}
        ml={2}
        event={`Manage Neurons ${currencyName} Flow Step 3 Create Neuron Clicked`}
        onClick={() => console.log("create neurons")}
      >
        {"Create New"}
      </Button>
    </Box>
  );
}
