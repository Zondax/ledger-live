import React, { useCallback } from "react";
import styled from "styled-components";
import { Box, Text, Flex } from "@ledgerhq/react-ui";
import CheckCircle from "~/renderer/icons/CheckCircle";
import { StepProps } from "../types";
import TrackPage from "~/renderer/analytics/TrackPage";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import { colors } from "~/renderer/styles/theme";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
}))`
  width: 100%;
  justify-content: space-between;
  padding: 40px 20px;
`;

const SuccessIcon = styled(CheckCircle)`
  color: ${p => p.theme.colors.success.c100};
`;

const ActionText = styled(Text)`
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

export default function StepConfirmation({
  account,
  lastManageAction,
  transitionTo,
  error,
}: StepProps) {
  const currencyId = account.currency.id;
  const getActionText = useCallback(() => {
    if (lastManageAction === "increase_stake") {
      return "Increasing Stake";
    }
    return lastManageAction?.replace(/_/g, " ").toLowerCase();
  }, [lastManageAction]);

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!lastManageAction || lastManageAction === "list_neurons") {
    transitionTo("listNeuron");
    return null;
  }

  return (
    <Container>
      <TrackPage
        category="Manage Neurons ICP Flow"
        name="Step Success"
        flow="manage"
        action={lastManageAction}
        currency={currencyId}
      />
      <SyncOneAccountOnMount
        reason="neuron-management-confirmation"
        priority={10}
        accountId={account.id}
      />

      <Flex flexDirection="column" alignItems="center" flex={1} justifyContent="center">
        <SuccessIcon size={64} />

        <ActionText variant="large" mt={6} mb={2} color={colors.positiveGreen}>
          {getActionText()} was successful
        </ActionText>

        <Text variant="paragraph" color="neutral.c70" textAlign="center">
          Please synchronize your accounts to see the updated changes
        </Text>
      </Flex>
    </Container>
  );
}
