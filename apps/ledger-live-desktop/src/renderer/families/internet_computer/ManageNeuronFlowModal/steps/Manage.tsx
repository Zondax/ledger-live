import React, { useCallback } from "react";
// import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import WarnBox from "~/renderer/components/WarnBox";
import Button from "~/renderer/components/Button";
import { useDispatch } from "react-redux";
import TableContainer from "~/renderer/components/TableContainer";
import { StepProps } from "../types";
import { CopiableField } from "~/renderer/drawers/NFTViewerDrawer/CopiableField";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { closeModal, openModal } from "~/renderer/actions/modals";
export default function StepManage({ account, neuron }: StepProps) {
  //   const { t } = useTranslation();
  const currencyId = account.currency.id;
  const dispatch = useDispatch();
  const unit = account.currency.units[0];
  const onClickIncreaseStake = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(closeModal("MODAL_ICP_MANAGE_NEURON"));
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        transaction: {
          ...initTx,
          neuronAccount: Buffer.from(neuron.account).toString("hex"),
          type: "increase_stake",
        },
      }),
    );
  }, [account, dispatch, neuron]);
  // const locale = useSelector(localeSelector);
  // const unit = useAccountUnit(account);
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
        <TableContainer width="90%">
          <WarnBox>{"You can manage your neurons here."}</WarnBox>
          <Box padding={"1rem"} horizontal justifyContent="space-between">
            <Box ff="Inter|SemiBold" fontSize={4}>
              Neuron ID
            </Box>
            <Box ff="Inter|SemiBold" fontSize={4}>
              Staked Amount
            </Box>
            <Box></Box>
          </Box>
          <Box key={neuron.id[0]?.id}>
            <Box padding={"1rem"} horizontal justifyContent="space-between" alignItems={"center"}>
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
              <Button primary onClick={onClickIncreaseStake}>
                {"Increase stake"}
              </Button>
            </Box>
          </Box>
        </TableContainer>
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
