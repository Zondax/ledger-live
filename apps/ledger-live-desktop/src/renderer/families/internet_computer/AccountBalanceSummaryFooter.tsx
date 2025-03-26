import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { localeSelector } from "~/renderer/reducers/settings";
import Discreet, { useDiscreetMode } from "~/renderer/components/Discreet";
import Box from "~/renderer/components/Box/Box";
import Text from "~/renderer/components/Text";
import InfoCircle from "~/renderer/icons/InfoCircle";
import ToolTip from "~/renderer/components/Tooltip";
import { InternetComputerFamily } from "./types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const Wrapper = styled(Box).attrs(() => ({
  horizontal: true,
  mt: 4,
  p: 5,
  pb: 0,
  scroll: true,
}))`
  border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;
const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0.25 0 auto",
  alignItems: "start",
  paddingRight: 20,
}))``;
const TitleWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  alignItems: "center",
  mb: 1,
}))``;
const Title = styled(Text).attrs(() => ({
  fontSize: 4,
  ff: "Inter|Medium",
  color: "palette.text.shade60",
}))`
  line-height: ${p => p.theme.space[4]}px;
  margin-right: ${p => p.theme.space[1]}px;
`;
const AmountValue = styled(Text).attrs(() => ({
  fontSize: 6,
  ff: "Inter|SemiBold",
  color: "palette.text.shade100",
}))<{ paddingRight?: number }>`
  ${p => p.paddingRight && `padding-right: ${p.paddingRight}px`};
`;

const AccountBalanceSummaryFooter: InternetComputerFamily["AccountBalanceSummaryFooter"] = ({
  account,
}) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  if (account.type !== "Account") return null;

  const { neurons } = account;

  const formatConfig = {
    alwaysShowSign: false,
    showCode: false,
    discreet,
    locale,
  };
  const stakedBalance = formatCurrencyUnit(unit, neurons.totalStaked, {
    ...formatConfig,
    showCode: true,
  });
  const maturityBalance = formatCurrencyUnit(
    unit,
    neurons.totalMaturity.plus(neurons.totalMaturityStaked),
    formatConfig,
  );
  const maturityStakedBalance = formatCurrencyUnit(unit, neurons.totalMaturityStaked, formatConfig);
  const maturityLiquidBalance = formatCurrencyUnit(unit, neurons.totalMaturity, formatConfig);

  return (
    <Wrapper>
      <Box style={{ display: "flex", flexDirection: "row", gap: 30 }}>
        {neurons.totalStaked.gt(0) && (
          <BalanceDetail>
            <ToolTip content="The total amount of ICP tokens currently staked in neurons. Staked ICP earns voting rewards and can be used for governance.">
              <TitleWrapper>
                <Title>Staked balance</Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{stakedBalance}</Discreet>
            </AmountValue>
          </BalanceDetail>
        )}
        {neurons.totalMaturity.gt(0) && (
          <BalanceDetail>
            <ToolTip content="The total accumulated rewards from staking, including both staked and liquid maturity. These rewards can be either staked again or claimed as liquid ICP.">
              <TitleWrapper>
                <Title>Total Maturity</Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{maturityBalance}</Discreet>
            </AmountValue>
          </BalanceDetail>
        )}
        {neurons.totalMaturityStaked.gt(0) && (
          <BalanceDetail>
            <ToolTip content="The portion of maturity rewards that has been automatically re-staked into neurons, continuing to earn additional rewards.">
              <TitleWrapper>
                <Title>Staked Maturity</Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{maturityStakedBalance}</Discreet>
            </AmountValue>
          </BalanceDetail>
        )}
        {neurons.totalMaturity.gt(0) && (
          <BalanceDetail>
            <ToolTip content="The portion of maturity rewards that is available to be claimed as liquid ICP tokens or can be staked into neurons.">
              <TitleWrapper>
                <Title>Liquid Maturity</Title>
                <InfoCircle size={13} />
              </TitleWrapper>
            </ToolTip>
            <AmountValue>
              <Discreet>{maturityLiquidBalance}</Discreet>
            </AmountValue>
          </BalanceDetail>
        )}
      </Box>
      {neurons.fullNeurons.length > 0 && (
        <Box
          ff="Inter|SemiBold"
          margin={"auto 0 auto auto"}
          fontSize={4}
          color="palette.text.shade60"
        >
          {`Last Synced: ${new Date(neurons.lastUpdatedMSecs).toLocaleString()}`}
        </Box>
      )}
    </Wrapper>
  );
};
export default AccountBalanceSummaryFooter;
