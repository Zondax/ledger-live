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
import TableContainer from "~/renderer/components/TableContainer";
import { StepProps } from "../types";
import { CopiableField } from "~/renderer/drawers/NFTViewerDrawer/CopiableField";
import { useDispatch } from "react-redux";
import { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { closeModal, openModal } from "~/renderer/actions/modals";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
export default function StepConfirmation({
  account,
  optimisticOperation,
  error,
  signed,
}: StepProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currencyId = account.currency.id;
  const unit = account.currency.units[0];
  const onClickManage = useCallback(
    (neuron: ICPNeuron) => {
      console.log("neuron", neuron);
      if (account.type !== "Account" || !neuron) return;
      dispatch(closeModal("MODAL_ICP_LIST_NEURONS"));
      dispatch(
        openModal("MODAL_ICP_MANAGE_NEURON", {
          account,
          neuron,
        }),
      );
    },
    [account, dispatch],
  );
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
          <Box maxHeight={"300px"} overflow={"scroll"}>
            {optimisticOperation.extra.neurons?.fullNeurons
              .sort((a, b) => Number(b.cached_neuron_stake_e8s) - Number(a.cached_neuron_stake_e8s))
              .map(neuron => (
                <Box key={neuron.id[0]?.id}>
                  <Box
                    padding={"1rem"}
                    horizontal
                    justifyContent="space-between"
                    alignItems={"center"}
                  >
                    <Box ff="Inter|SemiBold" fontSize={4}>
                      <CopiableField value={`${neuron.id[0]?.id}`}>
                        {neuron.id[0]?.id.toString()}
                      </CopiableField>
                    </Box>
                    <Box ff="Inter|Regular" fontSize={3}>
                      <FormattedVal
                        val={Number(neuron.cached_neuron_stake_e8s)}
                        unit={unit}
                        style={{
                          textAlign: "center",
                          minWidth: 120,
                        }}
                        showCode
                        fontSize={4}
                        color="palette.text.white"
                      />
                    </Box>
                    <Button primary onClick={() => onClickManage(neuron)}>
                      {"Manage"}
                    </Button>
                  </Box>
                </Box>
              ))}
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
  const dispatch = useDispatch();
  const onClickCreate = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(closeModal("MODAL_ICP_LIST_NEURONS"));
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        transaction: {
          ...initTx,
          type: "create_neuron",
        },
      }),
    );
  }, [account, dispatch]);
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
        onClick={onClickCreate}
      >
        {"Create New"}
      </Button>
    </Box>
  );
}
