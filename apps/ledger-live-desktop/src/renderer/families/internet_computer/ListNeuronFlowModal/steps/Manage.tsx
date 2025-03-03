import React, { useCallback } from "react";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import Button from "~/renderer/components/Button";
import { useDispatch } from "react-redux";
import { StepProps } from "../types";
import { CopiableField } from "~/renderer/drawers/NFTViewerDrawer/CopiableField";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
// import { closeModal, openModal } from "~/renderer/actions/modals";
import BigNumber from "bignumber.js";
import Text from "~/renderer/components/Text";
import { Divider } from "@ledgerhq/react-ui";
import {
  getNeuronDissolveDuration,
  getTimeUntil,
} from "@ledgerhq/live-common/families/internet_computer/utils";
import { closeModal } from "~/renderer/actions/modals";
import {
  ManageModalElementWithIcon,
  ManageModalElement,
  ManageModalSection,
} from "../../components/ManageModalComponents";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";

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
  width: 100%;
`;

export default function StepManage({
  account,
  manageNeuronIndex,
  neurons,
  onChangeTransaction,
  transitionTo,
  openModal,
  setLastManageAction,
}: StepProps) {
  const currencyId = account.currency.id;
  const dispatch = useDispatch();
  const unit = account.currency.units[0];
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const neuronId = neuron.id[0]?.id.toString() ?? "";
  const timeUntilActive = getTimeUntil(
    Number(neuron.neuronInfo.voting_power_refreshed_timestamp_seconds[0]),
  );

  const onClickIncreaseStake = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(closeModal("MODAL_ICP_LIST_NEURONS"));
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        onConfirmationHandler: () =>
          dispatch(
            openModal("MODAL_ICP_LIST_NEURONS", {
              account,
              lastManageAction: "increase_stake",
              neuronIndex: manageNeuronIndex,
              stepId: "confirmation",
            }),
          ),
        account,
        transaction: {
          ...initTx,
          neuronAccountIdentifier: neuron.accountIdentifier,
          neuronId: neuron.id[0]?.id.toString(),
          type: "increase_stake",
        },
      }),
    );
  }, [account, dispatch, openModal, neuron, manageNeuronIndex]);

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
    setLastManageAction("disburse");
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

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

  const onClickStartStopDissolving = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    const action = neuron.dissolveState === "Dissolving" ? "stop_dissolving" : "start_dissolving";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
      }),
    );
    setLastManageAction(action);
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

  const onClickStakeMaturity = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: "stake_maturity",
      }),
    );
    setLastManageAction("stake_maturity");
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

  const onClickSpawnNeuron = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: "spawn_neuron",
      }),
    );
    setLastManageAction("spawn_neuron");
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction]);

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
          <Box style={{ alignItems: "center" }}>
            <Box horizontal alignItems="center" mb={2}>
              <Text ff="Inter|SemiBold" fontSize={8}>
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
                Voting Power:
              </Text>
              <Text ff="Inter|SemiBold" fontSize={4}>
                <FormattedVal
                  val={Number(neuron.neuronInfo.voting_power.toString())}
                  unit={unit}
                  color="palette.text.shade100"
                />
              </Text>
            </Box>
          </Box>
        </Section>

        <Divider my={6} width={"100%"} />

        {/* Voting Power Section */}
        <ManageModalSection
          title="Voting Power"
          value={
            <FormattedVal
              color="palette.text.shade100"
              val={Number(neuron.neuronInfo.voting_power.toString())}
              unit={unit}
            />
          }
        >
          <ManageModalElementWithIcon
            label="ICP Staked"
            action={[
              {
                label: "Increase Stake",
                onClick: onClickIncreaseStake,
              },
            ]}
            value={
              <FormattedVal
                color="palette.text.shade100"
                val={Number(neuron.cached_neuron_stake_e8s.toString())}
                unit={unit}
                showCode
              />
            }
          />
          <ManageModalElementWithIcon
            // TODO: add age bonus
            label={"Age bonus: +0%"}
            valueTooltip="Your neuron can be locked, unlocked or dissolving. In a locked state, it is accruing age bonus, while its dissolve delay stays constant. If the neuron is in a dissolving state, its age bonus is set to 0, while dissolve delay decreases with time. After dissolve delay reaches 0, the neuron is unlocked, and ICP held in it can be sent to any ICP account."
            action={[
              {
                label:
                  neuron.dissolveState === "Unlocked"
                    ? "Disburse"
                    : neuron.dissolveState === "Dissolving"
                      ? "Stop Dissolving"
                      : "Start Dissolving",
                onClick:
                  neuron.dissolveState === "Unlocked"
                    ? onClickDisburseStake
                    : onClickStartStopDissolving,
              },
            ]}
            value={neuron.dissolveState}
          />
          <ManageModalElementWithIcon
            // TODO: add dissolve delay bonus
            label={"Dissolve delay bonus: +100%"}
            valueTooltip="Dissolve delay is the minimum amount of time you have to wait for the neuron to unlock, and ICP to be available again. If your neuron is dissolving, your ICP will be available in 7 years, 365 days."
            action={[
              {
                label: "Increase Delay",
                onClick: () => console.log("increase dissolve delay"),
              },
            ]}
            value={`Dissolve Delay: ${getNeuronDissolveDuration(neuron)}`}
          />
          <ManageModalElementWithIcon
            label={`${timeUntilActive.days} days, ${timeUntilActive.hours} hours to confirm following`}
            valueTooltip="ICP neurons that are inactive for 6 months start missing voting rewards. To avoid missing rewards, vote manually, edit, or confirm your following."
            action={[
              {
                label: "Confirm Following",
                onClick: () => onClickConfirmFollowing(neuron),
              },
            ]}
            // TODO: get correct status
            value={"Active neuron"}
          />
        </ManageModalSection>

        <Divider my={6} width={"100%"} />

        {/* Maturity Section */}
        <ManageModalSection
          title="Maturity"
          description="Earn rewards by voting on proposals and/or following active neurons."
          value={
            <FormattedVal
              color="palette.text.shade100"
              val={
                Number(neuron.staked_maturity_e8s_equivalent) +
                Number(neuron.maturity_e8s_equivalent)
              }
              unit={unit}
              showCode
            />
          }
        >
          <ManageModalElementWithIcon
            label="Staked"
            labelTooltip="Staked maturity contributes to the neuron's voting power, but cannot be spawned into a new neuron."
            value={
              <FormattedVal
                color="palette.text.shade100"
                val={Number(neuron.staked_maturity_e8s_equivalent)}
                unit={unit}
                showCode
              />
            }
          />
          <ManageModalElementWithIcon
            label="Available"
            labelTooltip="Available maturity can be staked, or burned to spawn a neuron containing an amount of ICP that is subject to a non-deterministic process, called maturity modulation."
            action={[
              {
                label: "Stake",
                onClick: onClickStakeMaturity,
              },
              {
                label: "Spawn Neuron",
                onClick: onClickSpawnNeuron,
              },
            ]}
            value={
              <FormattedVal
                color="palette.text.shade100"
                val={Number(neuron.maturity_e8s_equivalent)}
                unit={unit}
                showCode
              />
            }
          />
        </ManageModalSection>

        <Divider />

        <Divider my={6} width={"100%"} />

        {/* Advanced Details Section */}
        <ManageModalSection title="Advanced Details & Settings">
          <ManageModalElement label="Neuron ID" value={neuronId} />
          <ManageModalElement
            label="Date Created"
            value={new Date(Number(neuron.created_timestamp_seconds) * 1000).toLocaleString(
              "en-US",
              {
                dateStyle: "medium",
                timeStyle: "short",
              },
            )}
          />
          <ManageModalElement
            label="Dissolve Date"
            value={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          />
          <ManageModalElement label="Last Maturity Distribution" value="Never" />
        </ManageModalSection>

        {/* Following Section */}
        {/* <Section>
          <SectionTitle>Following</SectionTitle>
          <InfoGrid>
            <InfoRow>
              <SubTitle>DFINITY Foundation</SubTitle>
              <Text ff="Inter|SemiBold" fontSize={4}>
                All Except Governance, and SNS & Neurons&apos; Fund
              </Text>
            </InfoRow>
          </InfoGrid>
          <ButtonGroup>
            <Button primary small onClick={() => console.log("follow neurons")}>
              #Follow Neurons
            </Button>
          </ButtonGroup>
        </Section> */}
      </Container>
    );
  }
  return null;
}
