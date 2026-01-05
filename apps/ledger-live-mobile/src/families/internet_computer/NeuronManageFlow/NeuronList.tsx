import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { ICPAccount, ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { Button, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import React, { useCallback, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen, track } from "~/analytics";
import Circle from "~/components/Circle";
import type { IconProps } from "~/components/DelegationDrawer";
import DelegationDrawer from "~/components/DelegationDrawer";
import LText from "~/components/LText";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import Clock from "~/icons/Clock";
import Coins from "~/icons/Coins";
import Pause from "~/icons/Pause";
import Plus from "~/icons/Plus";
import UndelegateIcon from "~/icons/Undelegate";
import Vote from "~/icons/Vote";
import Withdraw from "~/icons/Withdraw";
import { accountScreenSelector } from "~/reducers/accounts";
import { rgba } from "../../../colors";
import NeuronRow from "../Staking/NeuronRow";
import { formatLastSyncDate, getDissolveDelayDisplay, getNeuronStateDisplay, getNeuronStateInfo } from "../utils";
import type { InternetComputerNeuronManageFlowParamList, NeuronActionType } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronList
  >
>;

type DelegationDrawerProps = React.ComponentProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

export default function NeuronList({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const neurons = mainAccount.neurons?.fullNeurons || [];
  const currency = getAccountCurrency(mainAccount);
  const unit = useAccountUnit(account);
  const lastUpdatedMSecs = mainAccount.neurons?.lastUpdatedMSecs;

  const [selectedNeuron, setSelectedNeuron] = useState<ICPNeuron | null>(null);

  // Create list_neurons transaction for sync
  const { transaction, status } = useBridgeTransaction(() => {
    const tx = bridge.createTransaction(mainAccount);
    return {
      account,
      transaction: bridge.updateTransaction(tx, {
        type: "list_neurons",
      }),
    };
  });

  const onSync = useCallback(() => {
    track("buttonClicked", { button: "sync_neurons", currency: "ICP" });
    if (!transaction) return;

    // Navigate to device selection to sign list_neurons transaction
    navigation.navigate(ScreenName.InternetComputerNeuronSelectDevice, {
      ...route.params,
      transaction,
      status,
    });
  }, [navigation, route.params, transaction, status]);

  const onClose = useCallback(() => {
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
  }, [navigation]);

  const onCloseDrawer = useCallback(() => setSelectedNeuron(null), []);

  const onNeuronAction = useCallback(
    (actionType: NeuronActionType) => {
      if (!selectedNeuron) return;
      const neuronId = selectedNeuron.id?.[0]?.id?.toString();
      if (!neuronId) return;

      setSelectedNeuron(null);

      const baseParams = { ...route.params, neuronId };

      switch (actionType) {
        case "set_dissolve_delay":
          navigation.navigate(ScreenName.InternetComputerNeuronSetDissolveDelay, baseParams);
          break;
        case "add_hot_key":
          navigation.navigate(ScreenName.InternetComputerNeuronAddHotKey, baseParams);
          break;
        case "stake_maturity":
          navigation.navigate(ScreenName.InternetComputerNeuronStakeMaturity, baseParams);
          break;
        case "remove_hot_key":
          navigation.navigate(ScreenName.InternetComputerNeuronRemoveHotKey, baseParams);
          break;
        case "follow":
          navigation.navigate(ScreenName.InternetComputerNeuronFollowSelectTopic, baseParams);
          break;
        default:
          navigation.navigate(ScreenName.InternetComputerNeuronAction, {
            ...baseParams,
            actionType,
          });
      }
    },
    [navigation, route.params, selectedNeuron],
  );

  const drawerData = useMemo<DelegationDrawerProps["data"]>(() => {
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

    const {
      canDisburse,
      canStartDissolving,
      canStopDissolving,
      canSetDissolveDelay,
      canSplitNeuron,
    } = getNeuronStateInfo(selectedNeuron);

    const maturity = new BigNumber(selectedNeuron.maturity_e8s_equivalent?.toString() || "0");
    const hasMaturity = maturity.gt(0);
    const hasHotKeys = selectedNeuron.hot_keys && selectedNeuron.hot_keys.length > 0;
    const iconSize = 24;

    const actionsList: DelegationDrawerActions = [
      {
        label: t("icp.neuronManage.actions.increaseStake"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Plus size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("increase_stake"),
        event: "ICPNeuronActionIncreaseStake",
      },
    ];

    if (canStartDissolving) {
      actionsList.push({
        label: t("icp.neuronManage.actions.startDissolving"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Clock size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("start_dissolving"),
        event: "ICPNeuronActionStartDissolving",
      });
    }

    if (canStopDissolving) {
      actionsList.push({
        label: t("icp.neuronManage.actions.stopDissolving"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Pause size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("stop_dissolving"),
        event: "ICPNeuronActionStopDissolving",
      });
    }

    if (canDisburse) {
      actionsList.push({
        label: t("icp.neuronManage.actions.disburse"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.green, 0.2)}>
            <Withdraw size={iconSize} color={colors.green} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("disburse"),
        event: "ICPNeuronActionDisburse",
      });
    }

    if (canSetDissolveDelay) {
      actionsList.push({
        label: t("icp.neuronManage.actions.setDissolveDelay"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Clock size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("set_dissolve_delay"),
        event: "ICPNeuronActionSetDissolveDelay",
      });
    }

    if (canSplitNeuron) {
      actionsList.push({
        label: t("icp.neuronManage.actions.splitNeuron"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <UndelegateIcon size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("split_neuron"),
        event: "ICPNeuronActionSplitNeuron",
      });
    }

    if (hasMaturity) {
      actionsList.push({
        label: t("icp.neuronManage.actions.stakeMaturity"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Coins size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("stake_maturity"),
        event: "ICPNeuronActionStakeMaturity",
      });

      actionsList.push({
        label: t("icp.neuronManage.actions.spawnNeuron"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <Plus size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("spawn_neuron"),
        event: "ICPNeuronActionSpawnNeuron",
      });
    }

    actionsList.push({
      label: t("icp.neuronManage.actions.addHotKey"),
      Icon: (props: IconProps) => (
        <Circle {...props} bg={rgba(colors.primary, 0.2)}>
          <Plus size={iconSize} color={colors.primary} />
        </Circle>
      ),
      disabled: false,
      onPress: () => onNeuronAction("add_hot_key"),
      event: "ICPNeuronActionAddHotKey",
    });

    if (hasHotKeys) {
      actionsList.push({
        label: t("icp.neuronManage.actions.removeHotKey"),
        Icon: (props: IconProps) => (
          <Circle {...props} bg={rgba(colors.primary, 0.2)}>
            <UndelegateIcon size={iconSize} color={colors.primary} />
          </Circle>
        ),
        disabled: false,
        onPress: () => onNeuronAction("remove_hot_key"),
        event: "ICPNeuronActionRemoveHotKey",
      });
    }

    actionsList.push({
      label: t("icp.neuronManage.actions.follow"),
      Icon: (props: IconProps) => (
        <Circle {...props} bg={rgba(colors.primary, 0.2)}>
          <Vote size={iconSize} color={colors.primary} />
        </Circle>
      ),
      disabled: false,
      onPress: () => onNeuronAction("follow"),
      event: "ICPNeuronActionFollow",
    });

    actionsList.push({
      label: t("icp.neuronManage.actions.refreshVotingPower"),
      Icon: (props: IconProps) => (
        <Circle {...props} bg={rgba(colors.primary, 0.2)}>
          <Vote size={iconSize} color={colors.primary} />
        </Circle>
      ),
      disabled: false,
      onPress: () => onNeuronAction("refresh_voting_power"),
      event: "ICPNeuronActionRefreshVotingPower",
    });

    return actionsList;
  }, [selectedNeuron, t, onNeuronAction, colors.primary, colors.green]);

  const renderItem = useCallback(
    ({ item, index }: { item: ICPNeuron; index: number }) => (
      <NeuronRow
        neuron={item}
        currency={currency}
        onPress={() => setSelectedNeuron(item)}
        isLast={index === neurons.length - 1}
      />
    ),
    [currency, neurons.length],
  );

  const keyExtractor = useCallback(
    (item: ICPNeuron, index: number) => item.id?.[0]?.id?.toString() || index.toString(),
    [],
  );

  // Sort neurons by stake amount (highest first)
  const sortedNeurons = useMemo(
    () =>
      [...neurons].sort(
        (a, b) => Number(b.cached_neuron_stake_e8s) - Number(a.cached_neuron_stake_e8s),
      ),
    [neurons],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <DelegationDrawer
        isOpen={!!selectedNeuron && drawerData.length > 0}
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
        data={drawerData}
        actions={actions}
      />

      <TrackScreen
        category="ICP Neuron Management"
        name="NeuronList"
        flow="manage"
        action="neuron_management"
        currency="internet_computer"
      />

      {neurons.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyStateCard, { backgroundColor: colors.card }]}>
            <Text variant="body" color="neutral.c80" textAlign="center" mt={4}>
              <Trans i18nKey="icp.neuronManage.list.emptyDescription" />
            </Text>
          </View>

          <View style={styles.lastSyncContainer}>
            <Text variant="small" color="neutral.c60">
              <Trans i18nKey="icp.neuronManage.list.lastSync" />:{" "}
              {formatLastSyncDate(lastUpdatedMSecs, t("icp.neuronManage.list.lastSyncNever"))}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button type="shade" outline onPress={onClose} style={styles.button}>
              <Trans i18nKey="common.close" />
            </Button>
            <Button type="main" onPress={onSync} style={styles.button}>
              <Trans i18nKey="icp.neuronManage.list.sync" />
            </Button>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text variant="h5" fontWeight="semiBold">
              <Trans i18nKey="icp.neuronManage.list.subtitle" />
            </Text>
            <Text variant="body" color="neutral.c70" mt={2}>
              <Trans i18nKey="icp.neuronManage.list.description" />
            </Text>
          </View>

          <FlatList
            data={sortedNeurons}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />

          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text variant="small" color="neutral.c60">
              <Trans i18nKey="icp.neuronManage.list.lastSync" />:{" "}
              {formatLastSyncDate(lastUpdatedMSecs, t("icp.neuronManage.list.lastSyncNever"))}
            </Text>
            <Button type="shade" size="small" onPress={onSync}>
              <Trans i18nKey="icp.neuronManage.list.sync" />
            </Button>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyStateContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: "center",
  },
  emptyStateCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  lastSyncContainer: {
    marginTop: 24,
    alignItems: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  valueText: {
    fontSize: 14,
  },
});
