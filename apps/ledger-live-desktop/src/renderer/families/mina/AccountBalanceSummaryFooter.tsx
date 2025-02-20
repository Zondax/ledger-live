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
import { MinaFamily } from "./types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const Wrapper = styled(Box).attrs(() => ({
  vertical: true,
  mt: 4,
}))`
  border-top: 1px solid ${p => p.theme.colors.palette.text.shade10};
`;

const DetailsWrapper = styled(Box).attrs(() => ({
  horizontal: true,
  p: 5,
  pb: 0,
  scroll: true,
}))``;

const BalanceDetail = styled(Box).attrs(() => ({
  flex: "0.33 0 auto",
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
}))``;

const AddressText = styled(Text).attrs(() => ({
  ff: "Inter|SemiBold",
  fontSize: 6,
  color: "palette.text.shade100",
}))`
  word-break: break-all;
`;

const AccountBalanceSummaryFooter: MinaFamily["AccountBalanceSummaryFooter"] = ({ account }) => {
  const discreet = useDiscreetMode();
  const locale = useSelector(localeSelector);
  const unit = useAccountUnit(account);

  if (account.type !== "Account") return null;

  const hasDelegation = account.minaResources?.stakingActive;
  if (!hasDelegation) return null;

  const stakedBalance = formatCurrencyUnit(unit, account.balance, {
    discreet,
    locale,
    showCode: true,
  });

  return (
    <Wrapper>
      <DetailsWrapper>
        <BalanceDetail>
          <ToolTip content="Name of the block producer you are delegating to">
            <TitleWrapper>
              <Title>Delegated to</Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>{account.minaResources?.delegateInfo?.identity_name}</AmountValue>
        </BalanceDetail>

        <BalanceDetail>
          <ToolTip content="Total amount of MINA currently staked with this validator">
            <TitleWrapper>
              <Title>Staked Balance</Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AmountValue>
            <Discreet>{stakedBalance}</Discreet>
          </AmountValue>
        </BalanceDetail>

        <BalanceDetail>
          <ToolTip content="Public address of the block producer you are delegating to">
            <TitleWrapper>
              <Title>Producer Address</Title>
              <InfoCircle size={13} />
            </TitleWrapper>
          </ToolTip>
          <AddressText>{account.minaResources?.delegateInfo?.public_key}</AddressText>
        </BalanceDetail>
      </DetailsWrapper>
    </Wrapper>
  );
};

export default AccountBalanceSummaryFooter;
