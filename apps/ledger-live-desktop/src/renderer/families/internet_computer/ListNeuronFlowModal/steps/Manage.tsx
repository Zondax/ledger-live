import React, { useCallback } from "react";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import WarnBox from "~/renderer/components/WarnBox";
import Button from "~/renderer/components/Button";
import { useDispatch } from "react-redux";
import { StepProps } from "../types";
import { CopiableField } from "~/renderer/drawers/NFTViewerDrawer/CopiableField";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { closeModal, openModal } from "~/renderer/actions/modals";
import BigNumber from "bignumber.js";
import Text from "~/renderer/components/Text";
import {
  getNeuronDissolveState,
  NeuronState,
} from "@ledgerhq/live-common/families/internet_computer/neurons";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  grow: true,
  color: "palette.text.shade100",
  padding: "24px",
}))`
  max-width: 800px;
`;

const Section = styled(Box)`
  background: ${p => p.theme.colors.palette.background.paper};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  width: 100%;
`;

const SectionTitle = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 5,
  color: "palette.text.shade100",
}))`
  margin-bottom: 16px;
`;

const SubTitle = styled(Text).attrs(() => ({
  ff: "Inter|Medium",
  fontSize: 3,
  color: "palette.text.shade60",
}))`
  margin-bottom: 8px;
`;

const ButtonGroup = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-start;
  flex-direction: row;
`;

const InfoGrid = styled(Box)`
  display: flex;
  flex-direction: row;
  gap: 8px;
  margin-bottom: 8px;
`;

const InfoRow = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${p => p.theme.colors.palette.background.default};
  border-radius: 4px;

  > *:first-child {
    color: ${p => p.theme.colors.palette.text.shade60};
  }
`;

export default function StepManage({
  account,
  manageNeuronIndex,
  neurons,
  onChangeTransaction,
  transitionTo,
}: StepProps) {
  const currencyId = account.currency.id;
  const dispatch = useDispatch();
  const unit = account.currency.units[0];
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const neuronState = getNeuronDissolveState(neuron);
  const neuronId = neuron.id[0]?.id.toString() ?? "";

  const onClickIncreaseStake = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(closeModal("MODAL_ICP_LIST_NEURONS"));
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        account,
        transaction: {
          ...initTx,
          neuronAccount: Buffer.from(neuron.account).toString("hex"),
          type: "increase_stake",
        },
      }),
    );
  }, [account, dispatch, neuron]);

  const onClickDisburseStake = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        amount: new BigNumber(neuron.cached_neuron_stake_e8s.toString()),
        type: "disburse",
      }),
    );
    transitionTo("device");
  }, [account, onChangeTransaction, transitionTo, neuron]);

  const onClickStartStopDissolving = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: neuronState === NeuronState.Dissolving ? "stop_dissolving" : "start_dissolving",
      }),
    );
    transitionTo("device");
  }, [account, onChangeTransaction, transitionTo, neuron, neuronState]);

  if (neuron) {
    return (
      <Container>
        <TrackPage
          category="Manage Neurons ICP Flow"
          name="Step Manage"
          flow="stake"
          action="manageNeuron"
          currency={currencyId}
        />

        {/* Header Section */}
        <Section>
          <Box mb={2}>
            <Box horizontal alignItems="center" mb={1}>
              <Text ff="Inter|SemiBold" fontSize={6}>
                <FormattedVal val={Number(neuron.cached_neuron_stake_e8s)} unit={unit} showCode />
              </Text>
            </Box>
            <Box horizontal alignItems="center">
              <Text ff="Inter|Regular" fontSize={3} color="palette.text.shade60" mr={2}>
                Neuron ID:
              </Text>
              <CopiableField value={neuronId}>
                <Text ff="Inter|SemiBold" fontSize={4}>
                  {neuronId}
                </Text>
              </CopiableField>
            </Box>
            <Box horizontal alignItems="center">
              <Text ff="Inter|Regular" fontSize={3} color="palette.text.shade60" mr={2}>
                Neuron Account:
              </Text>
              <CopiableField value={neuron.accountIdentifier}>
                <Text ff="Inter|SemiBold" fontSize={4}>
                  {`${neuron.accountIdentifier.slice(0, 8)}...${neuron.accountIdentifier.slice(-8)}`}
                </Text>
              </CopiableField>
            </Box>
            <Box horizontal alignItems="center" mt={2}>
              <Text ff="Inter|Regular" fontSize={3} color="palette.text.shade60" mr={2}>
                Voting Power:
              </Text>
              <Text ff="Inter|SemiBold" fontSize={4}>
                None
              </Text>
            </Box>
          </Box>
          <ButtonGroup>
            <Button primary small onClick={onClickIncreaseStake}>
              Increase Stake
            </Button>
            <Button inverted small onClick={onClickDisburseStake}>
              Disburse Stake
            </Button>
          </ButtonGroup>
        </Section>

        {/* Dissolve Status Section */}
        <Section>
          <SectionTitle>Dissolve Status</SectionTitle>
          <InfoGrid>
            <InfoRow>
              <Text ff="Inter|Medium" fontSize={3}>
                State
              </Text>
              <Text ff="Inter|SemiBold" fontSize={4}>
                {neuronState === NeuronState.Locked ? "Locked" : "Dissolving"}
              </Text>
            </InfoRow>
            <InfoRow>
              <Text ff="Inter|Medium" fontSize={3}>
                Dissolve Delay
              </Text>
              <Text ff="Inter|SemiBold" fontSize={4}>
                7 days
              </Text>
            </InfoRow>
          </InfoGrid>
          <ButtonGroup>
            <Button primary small onClick={onClickStartStopDissolving}>
              {neuronState === NeuronState.Dissolving ? "Stop Dissolving" : "Start Dissolving"}
            </Button>
            <Button primary small onClick={() => console.log("increase dissolve delay")}>
              Increase Delay
            </Button>
          </ButtonGroup>
        </Section>

        {/* Maturity Section */}
        <Section>
          <SectionTitle>Maturity</SectionTitle>
          <SubTitle>Earn rewards by voting on proposals and/or following active neurons.</SubTitle>
          <InfoGrid>
            <InfoRow>
              <SubTitle>Staked</SubTitle>
              <Text ff="Inter|SemiBold" fontSize={4}>
                <FormattedVal
                  color="palette.text.shade100"
                  val={Number(neuron.staked_maturity_e8s_equivalent)}
                  unit={unit}
                  showCode
                />
              </Text>
            </InfoRow>
            <InfoRow>
              <SubTitle>Available</SubTitle>
              <Text ff="Inter|SemiBold" fontSize={4}>
                <FormattedVal
                  color="palette.text.shade100"
                  val={Number(neuron.maturity_e8s_equivalent)}
                  unit={unit}
                  showCode
                />
              </Text>
            </InfoRow>
          </InfoGrid>
          <ButtonGroup>
            <Button primary small onClick={() => console.log("stake maturity")}>
              Stake Maturity
            </Button>
            <Button primary small onClick={() => console.log("spawn neuron")}>
              Spawn Neuron
            </Button>
          </ButtonGroup>
        </Section>

        {/* Advanced Details Section */}
        <Section>
          <SectionTitle>Advanced Details & Settings</SectionTitle>
          <InfoGrid>
            <InfoRow>
              <SubTitle>Date Created</SubTitle>
              <Text ff="Inter|SemiBold" fontSize={4}>
                {new Date().toLocaleDateString()}
              </Text>
            </InfoRow>
            <InfoRow>
              <SubTitle>Dissolve Date</SubTitle>
              <Text ff="Inter|SemiBold" fontSize={4}>
                {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </Text>
            </InfoRow>
            <InfoRow>
              <SubTitle>Last Maturity Distribution</SubTitle>
              <Text ff="Inter|SemiBold" fontSize={4}>
                Never
              </Text>
            </InfoRow>
          </InfoGrid>
          <ButtonGroup>
            <Button primary small onClick={() => console.log("split neuron")}>
              Split Neuron
            </Button>
          </ButtonGroup>
        </Section>

        {neuronState !== NeuronState.Dissolving && (
          <WarnBox>
            <Text ff="Inter|Medium" fontSize={3}>
              ℹ️ The dissolve delay must be at least 6 months for the neuron to have voting power
            </Text>
          </WarnBox>
        )}
      </Container>
    );
  }
  return null;
}
