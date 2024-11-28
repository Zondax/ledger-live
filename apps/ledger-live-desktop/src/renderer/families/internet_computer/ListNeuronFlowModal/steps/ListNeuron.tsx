import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { SyncOneAccountOnMount } from "@ledgerhq/live-common/bridge/react/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import WarnBox from "~/renderer/components/WarnBox";
import BroadcastErrorDisclaimer from "~/renderer/components/BroadcastErrorDisclaimer";
import Button from "~/renderer/components/Button";
import ErrorDisplay from "~/renderer/components/ErrorDisplay";
// import TableContainer from "~/renderer/components/TableContainer";
import { StepProps } from "../types";
import Text from "~/renderer/components/Text";
import {
  getNeuronDissolveState,
  NeuronState,
} from "@ledgerhq/live-common/families/internet_computer/neurons";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

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

const TableContainer = styled(Box)`
  width: 500px;
`;
const HeaderRow = styled(Box)`
  padding: 8px 16px;
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
`;
const ScrollableContent = styled(Box)`
  max-height: 240px;
  overflow-y: auto;
`;
const NeuronRow = styled(Box)`
  padding: 12px 16px;
  cursor: pointer;
  &:hover {
    background: ${p => p.theme.colors.palette.background.default};
  }
`;
const Cell = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 3,
}))``;

export default function StepListNeuron({
  account,
  error,
  signed,
  neurons,
  setManageNeuronIndex,
  transitionTo,
}: StepProps) {
  const { t } = useTranslation();
  const currencyId = account.currency.id;
  const unit = account.currency.units[0];

  // neuron properties
  const neuronStates = neurons.fullNeurons.map(neuron => getNeuronDissolveState(neuron));

  const onClickManage = useCallback(
    (index: number) => {
      if (account.type !== "Account") return;
      setManageNeuronIndex(index);
      transitionTo("manage");
    },
    [account.type, transitionTo, setManageNeuronIndex],
  );
  // const locale = useSelector(localeSelector);
  // const unit = useAccountUnit(account);
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
        {neurons.fullNeurons.length ? (
          <Box>
            <TableContainer>
              <HeaderRow horizontal>
                <Cell flex={2.5}>Neurons</Cell>
                <Cell flex={1}>Stake</Cell>
                <Cell flex={1}>Maturity</Cell>
                <Cell flex={1.5}>Dissolve Delay</Cell>
                <Cell flex={1}>State</Cell>
              </HeaderRow>
              <ScrollableContent>
                {neurons.fullNeurons
                  .filter(neuron => neuron.cached_neuron_stake_e8s.toString() !== "0")
                  .map((neuron, index) => (
                    <NeuronRow
                      key={neuron.id[0]?.id}
                      horizontal
                      alignItems="center"
                      onClick={() => onClickManage(index)}
                    >
                      <Cell flex={2.5}>
                        <Text ff="Inter|SemiBold" fontSize={3}>
                          {neuron.id[0]?.id.toString()}
                        </Text>
                      </Cell>
                      <Cell flex={1}>
                        <FormattedVal
                          val={Number(neuron.cached_neuron_stake_e8s)}
                          unit={unit}
                          showCode
                          fontSize={3}
                        />
                      </Cell>
                      <Cell flex={1} textAlign="center">
                        {/* TODO: get maturity data */}
                        <FormattedVal
                          color="palette.text.shade100"
                          val={
                            Number(neuron.staked_maturity_e8s_equivalent[0] ?? 0) +
                            Number(neuron.maturity_e8s_equivalent)
                          }
                          unit={unit}
                          showCode
                        />
                      </Cell>
                      <Cell flex={1.5} textAlign="center">
                        {/* TODO: get dissolve delay data */}
                        <Text ff="Inter|Regular" fontSize={3}>
                          7 days
                        </Text>
                      </Cell>
                      <Cell flex={1}>
                        {/* TODO: get state data */}
                        <Text ff="Inter|Regular" fontSize={3}>
                          {neuronStates[index] === NeuronState.Locked ? "Locked" : "Dissolving"}
                        </Text>
                      </Cell>
                    </NeuronRow>
                  ))}
              </ScrollableContent>
            </TableContainer>
          </Box>
        ) : (
          <Box>
            <WarnBox>
              {
                "No neurons found, try syncing existing neurons created through NNS dapp or stake to create new neurons."
              }
            </WarnBox>
          </Box>
        )}
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

export function StepListNeuronFooter({
  account,
  onClose,
  error,
  transitionTo,
  neurons,
  onChangeTransaction,
}: StepProps) {
  const { t } = useTranslation();
  const currencyName = account.currency.name;
  const onClickSync = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        type: "list_neurons",
      }),
    );
    transitionTo("device");
  }, [account, onChangeTransaction, transitionTo]);
  return (
    <Box width="100%" horizontal alignItems="center" justifyContent="space-between">
      <Box ff="Inter|SemiBold" fontSize={4} color="palette.text.shade60">
        {`Last Synced: ${new Date(neurons.lastUpdated).toLocaleString()}`}
      </Box>
      <Box horizontal>
        <Button ml={2} onClick={onClose}>
          {t("common.close")}
        </Button>
        <Button
          primary
          disabled={!!error}
          ml={2}
          event={`Manage Neurons ${currencyName} Flow Step 3 Sync Neurons Clicked`}
          onClick={onClickSync}
        >
          {"Sync"}
        </Button>
      </Box>
    </Box>
  );
}
