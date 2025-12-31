import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button } from "@ledgerhq/native-ui";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import { TrackScreen } from "~/analytics";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";
import { getNeuronStateInfo, getDissolveDelayDisplay } from "../utils";
import type { InternetComputerNeuronManageFlowParamList } from "./types";
import type { NeuronActionType } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronManage
  >
>;

export default function NeuronManage({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const neurons = mainAccount.neurons?.fullNeurons || [];
  const unit = useAccountUnit(account);
  const { neuronId } = route.params;

  const neuron = useMemo(
    () => neurons.find(n => n.id?.[0]?.id?.toString() === neuronId),
    [neurons, neuronId],
  );

  const stake = useMemo(
    () => new BigNumber(neuron?.cached_neuron_stake_e8s?.toString() || "0"),
    [neuron],
  );

  const maturity = useMemo(
    () => new BigNumber(neuron?.maturity_e8s_equivalent?.toString() || "0"),
    [neuron],
  );

  const {
    label: stateLabel,
    canDisburse,
    canStartDissolving,
    canStopDissolving,
    canSetDissolveDelay,
    canSplitNeuron,
  } = useMemo(
    () =>
      neuron
        ? getNeuronStateInfo(neuron)
        : {
            label: "-",
            canDisburse: false,
            canStartDissolving: false,
            canStopDissolving: false,
            canSetDissolveDelay: false,
            canSplitNeuron: false,
          },
    [neuron],
  );

  // Check if neuron has maturity for spawn/stake maturity actions
  const hasMaturity = maturity.gt(0);

  // Check if neuron has hot keys
  const hasHotKeys = useMemo(() => {
    return neuron?.hot_keys && neuron.hot_keys.length > 0;
  }, [neuron]);

  const dissolveDelay = useMemo(() => (neuron ? getDissolveDelayDisplay(neuron) : "-"), [neuron]);

  const onAction = useCallback(
    (actionType: NeuronActionType) => {
      // Route to special screens for actions that need custom inputs
      switch (actionType) {
        case "set_dissolve_delay":
          navigation.navigate(ScreenName.InternetComputerNeuronSetDissolveDelay, {
            ...route.params,
          });
          break;
        case "add_hot_key":
          navigation.navigate(ScreenName.InternetComputerNeuronAddHotKey, {
            ...route.params,
          });
          break;
        case "stake_maturity":
          navigation.navigate(ScreenName.InternetComputerNeuronStakeMaturity, {
            ...route.params,
          });
          break;
        case "remove_hot_key":
          navigation.navigate(ScreenName.InternetComputerNeuronRemoveHotKey, {
            ...route.params,
          });
          break;
        case "follow":
          navigation.navigate(ScreenName.InternetComputerNeuronFollowSelectTopic, {
            ...route.params,
          });
          break;
        default:
          navigation.navigate(ScreenName.InternetComputerNeuronAction, {
            ...route.params,
            actionType,
          });
      }
    },
    [navigation, route.params],
  );

  if (!neuron) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey="icp.neuronManage.manage.notFound" />
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="NeuronManage"
        flow="manage"
        action="neuron_management"
        currency="internet_computer"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="small" color="neutral.c70">
            <Trans i18nKey="icp.neuronManage.manage.neuronId" />
          </Text>
          <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
            {formatAddress(neuronId)}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text variant="body" color="neutral.c70">
              <Trans i18nKey="icp.neuronManage.manage.stake" />
            </Text>
            <Text variant="body" fontWeight="semiBold">
              {formatCurrencyUnit(unit, stake, { showCode: true })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" color="neutral.c70">
              <Trans i18nKey="icp.neuronManage.manage.status" />
            </Text>
            <Text
              variant="body"
              fontWeight="semiBold"
              color={
                stateLabel === "Dissolved"
                  ? "success.c50"
                  : stateLabel === "Dissolving"
                    ? "warning.c50"
                    : "neutral.c100"
              }
            >
              {stateLabel}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" color="neutral.c70">
              <Trans i18nKey="icp.neuronManage.manage.dissolveDelay" />
            </Text>
            <Text variant="body" fontWeight="semiBold">
              {dissolveDelay}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text variant="body" color="neutral.c70">
              <Trans i18nKey="icp.neuronManage.manage.maturity" />
            </Text>
            <Text variant="body" fontWeight="semiBold">
              {formatCurrencyUnit(unit, maturity, { showCode: true })}
            </Text>
          </View>
        </View>

        <View style={styles.actionsSection}>
          <Text variant="h5" fontWeight="semiBold" mb={4}>
            <Trans i18nKey="icp.neuronManage.manage.actions" />
          </Text>

          <Button
            type="main"
            onPress={() => onAction("increase_stake")}
            mb={3}
            testID="icp-neuron-increase-stake"
          >
            <Trans i18nKey="icp.neuronManage.actions.increaseStake" />
          </Button>

          {canStartDissolving && (
            <Button
              type="shade"
              outline
              onPress={() => onAction("start_dissolving")}
              mb={3}
              testID="icp-neuron-start-dissolving"
            >
              <Trans i18nKey="icp.neuronManage.actions.startDissolving" />
            </Button>
          )}

          {canStopDissolving && (
            <Button
              type="shade"
              outline
              onPress={() => onAction("stop_dissolving")}
              mb={3}
              testID="icp-neuron-stop-dissolving"
            >
              <Trans i18nKey="icp.neuronManage.actions.stopDissolving" />
            </Button>
          )}

          {canDisburse && (
            <Button
              type="color"
              backgroundColor="success.c50"
              onPress={() => onAction("disburse")}
              mb={3}
              testID="icp-neuron-disburse"
            >
              <Trans i18nKey="icp.neuronManage.actions.disburse" />
            </Button>
          )}

          {canSetDissolveDelay && (
            <Button
              type="shade"
              outline
              onPress={() => onAction("set_dissolve_delay")}
              mb={3}
              testID="icp-neuron-set-dissolve-delay"
            >
              <Trans i18nKey="icp.neuronManage.actions.setDissolveDelay" />
            </Button>
          )}

          {canSplitNeuron && (
            <Button
              type="shade"
              outline
              onPress={() => onAction("split_neuron")}
              mb={3}
              testID="icp-neuron-split"
            >
              <Trans i18nKey="icp.neuronManage.actions.splitNeuron" />
            </Button>
          )}

          {hasMaturity && (
            <>
              <Button
                type="shade"
                outline
                onPress={() => onAction("stake_maturity")}
                mb={3}
                testID="icp-neuron-stake-maturity"
              >
                <Trans i18nKey="icp.neuronManage.actions.stakeMaturity" />
              </Button>

              <Button
                type="shade"
                outline
                onPress={() => onAction("spawn_neuron")}
                mb={3}
                testID="icp-neuron-spawn"
              >
                <Trans i18nKey="icp.neuronManage.actions.spawnNeuron" />
              </Button>
            </>
          )}

          <Button
            type="shade"
            outline
            onPress={() => onAction("add_hot_key")}
            mb={3}
            testID="icp-neuron-add-hotkey"
          >
            <Trans i18nKey="icp.neuronManage.actions.addHotKey" />
          </Button>

          {hasHotKeys && (
            <Button
              type="shade"
              outline
              onPress={() => onAction("remove_hot_key")}
              mb={3}
              testID="icp-neuron-remove-hotkey"
            >
              <Trans i18nKey="icp.neuronManage.actions.removeHotKey" />
            </Button>
          )}

          <Button
            type="shade"
            outline
            onPress={() => onAction("follow")}
            mb={3}
            testID="icp-neuron-follow"
          >
            <Trans i18nKey="icp.neuronManage.actions.follow" />
          </Button>

          <Button
            type="shade"
            outline
            onPress={() => onAction("refresh_voting_power")}
            mb={3}
            testID="icp-neuron-refresh-voting-power"
          >
            <Trans i18nKey="icp.neuronManage.actions.refreshVotingPower" />
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  infoCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  actionsSection: {
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
