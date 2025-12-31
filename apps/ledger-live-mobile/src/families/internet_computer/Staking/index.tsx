import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  ICP_FEES,
  ICP_MIN_STAKING_AMOUNT,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import type { ICPAccount, ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { Account } from "@ledgerhq/types-live";
import { useNavigation, useTheme } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BigNumber } from "bignumber.js";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import Circle from "~/components/Circle";
import type { IconProps } from "~/components/DelegationDrawer";
import DelegationDrawer from "~/components/DelegationDrawer";
import LText from "~/components/LText";
import { NavigatorName, ScreenName } from "~/const";
import IlluRewards from "~/icons/images/Rewards";
import UndelegateIcon from "~/icons/Undelegate";
import { urls } from "~/utils/urls";
import { rgba } from "../../../colors";
import { getDissolveDelayDisplay, getNeuronStateDisplay } from "../utils";
import LabelRight from "./LabelRight";
import NeuronRow from "./NeuronRow";
import StakeBanners from "./StakeBanners";

type Props = {
  account: Account;
};

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function StakingPositions({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account) as ICPAccount;
  const neurons = mainAccount.neurons?.fullNeurons || [];
  const currency = getAccountCurrency(mainAccount);
  const unit = useAccountUnit(account);
  const navigation = useNavigation();

  const [selectedNeuron, setSelectedNeuron] = useState<ICPNeuron | null>(null);

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: string;
      screen?: string;
      params?: { [key: string]: unknown };
    }) => {
      setSelectedNeuron(null);
      (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onStake = useCallback(() => {
    onNavigate({
      route: NavigatorName.InternetComputerStakingFlow,
      screen:
        neurons.length > 0
          ? ScreenName.InternetComputerStakingAmount
          : ScreenName.InternetComputerStakingStarted,
    });
  }, [onNavigate, neurons.length]);

  const onManageNeuron = useCallback(() => {
    if (!selectedNeuron) return;
    const neuronId = selectedNeuron.id?.[0]?.id?.toString();
    if (!neuronId) return;

    onNavigate({
      route: NavigatorName.InternetComputerNeuronManageFlow,
      screen: ScreenName.InternetComputerNeuronManage,
      params: {
        neuronId,
      },
    });
  }, [onNavigate, selectedNeuron]);

  const onCloseDrawer = useCallback(() => setSelectedNeuron(null), []);

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    if (!selectedNeuron) return [];

    const neuronId = selectedNeuron.id?.[0]?.id?.toString() || "-";
    const maturity = new BigNumber(selectedNeuron.maturity_e8s_equivalent?.toString() || "0");
    const { label: stateLabel, color: stateColor } = getNeuronStateDisplay(selectedNeuron);
    const dissolveDelay = getDissolveDelayDisplay(selectedNeuron);

    return [
      {
        label: t("icp.staking.drawer.neuronId"),
        Component: (
          <LText numberOfLines={1} semiBold ellipsizeMode="middle" style={styles.valueText}>
            {formatAddress(neuronId)}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.status"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText} color={stateColor}>
            {stateLabel}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.dissolveDelay"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {dissolveDelay}
          </LText>
        ),
      },
      {
        label: t("icp.staking.drawer.maturity"),
        Component: (
          <LText numberOfLines={1} semiBold style={styles.valueText}>
            {formatCurrencyUnit(unit, maturity, { showCode: true })}
          </LText>
        ),
      },
    ];
  }, [selectedNeuron, t, unit]);

  const actions = useMemo<DelegationDrawerActions>(() => {
    if (!selectedNeuron) return [];

    return [
      {
        label: t("icp.staking.actions.manage"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <UndelegateIcon color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: onManageNeuron,
        event: "ICPStakingActionManage",
      },
    ];
  }, [selectedNeuron, t, onManageNeuron, colors.primary]);

  const canStakeMore = useMemo(() => {
    const spendable = mainAccount.spendableBalance.minus(ICP_FEES);
    return spendable.gte(ICP_MIN_STAKING_AMOUNT);
  }, [mainAccount.spendableBalance]);

  const stakingDisabled = !canStakeMore;

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={!!selectedNeuron && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <Circle size={size} bg={rgba(colors.primary, 0.2)}>
            <LText semiBold style={{ fontSize: size / 3 }}>
              N
            </LText>
          </Circle>
        )}
        amount={
          selectedNeuron
            ? new BigNumber(selectedNeuron.cached_neuron_stake_e8s?.toString() || "0")
            : new BigNumber(0)
        }
        data={data}
        actions={actions}
      />

      {neurons.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("icp.staking.emptyState.description", {
            name: account.currency.name,
          })}
          infoUrl={urls.internetComputer.stakingRewards}
          infoTitle={t("icp.staking.emptyState.learnMore")}
          onPress={onStake}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("icp.staking.sectionLabel")}
            RightComponent={<LabelRight disabled={stakingDisabled} onPress={onStake} />}
          />
          {neurons.map((neuron, i) => (
            <View key={neuron.id?.[0]?.id?.toString() || i} style={styles.neuronsWrapper}>
              <NeuronRow
                neuron={neuron}
                currency={currency}
                onPress={() => setSelectedNeuron(neuron)}
                isLast={i === neurons.length - 1}
              />
            </View>
          ))}
          <StakeBanners account={mainAccount} />
        </View>
      )}
    </View>
  );
}

export default function ICPStakingPositions(props: Props) {
  const { account } = props as { account: ICPAccount };
  if (!account.neurons) return null;
  return <StakingPositions account={account} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  wrapper: {
    marginBottom: 16,
  },
  neuronsWrapper: {
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
});
