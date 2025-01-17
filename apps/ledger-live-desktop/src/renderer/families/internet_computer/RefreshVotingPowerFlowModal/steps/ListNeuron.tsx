import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import List from "../../components/List";
import { StepProps } from "../types";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";

interface ContainerProps {
  shouldSpace?: boolean;
}

const Container = styled(Box).attrs<ContainerProps>(() => ({
  alignItems: "center",
  grow: true,
}))<ContainerProps>`
  width: 100%;
  justify-content: ${p => (p.shouldSpace ? "space-between" : "center")};
`;

export default function StepListNeuron({
  account,
  error,
  signed,
  neurons,
  onChangeTransaction,
  transitionTo,
  needsRefresh,
  setNeedsRefresh,
}: StepProps) {
  const { t } = useTranslation();
  const currencyId = account.currency.id;
  const unit = account.currency.units[0];

  useEffect(() => {
    if (needsRefresh) {
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          type: "list_neurons",
        }),
      );
      setNeedsRefresh(false);
      transitionTo("device");
    }
  }, [needsRefresh, transitionTo, account, onChangeTransaction, setNeedsRefresh]);

  const onClickConfirmFollowing = useCallback(
    (neuron: ICPNeuron) => {
      if (account.type !== "Account") return;
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          type: "refresh_voting_power",
          neuronId: neuron.id[0]?.id.toString(),
        }),
      );
      transitionTo("device");
    },
    [account, onChangeTransaction, transitionTo],
  );

  if (neurons) {
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
          accountId={account.id}
        />
        <List
          neurons={neurons}
          modalName="MODAL_ICP_REFRESH_VOTING_POWER"
          unit={unit}
          onClickConfirmFollowing={onClickConfirmFollowing}
        />
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
