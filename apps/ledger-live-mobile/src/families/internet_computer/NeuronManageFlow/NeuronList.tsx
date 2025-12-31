import { getAccountCurrency, getMainAccount } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import type { ICPAccount, ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { Button, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { TrackScreen, track } from "~/analytics";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { accountScreenSelector } from "~/reducers/accounts";
import NeuronRow from "../Staking/NeuronRow";
import { formatLastSyncDate } from "../utils";
import type { InternetComputerNeuronManageFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronList
  >
>;

export default function NeuronList({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount) as ICPAccount;
  const bridge = getAccountBridge(account);
  const neurons = mainAccount.neurons?.fullNeurons || [];
  const currency = getAccountCurrency(mainAccount);
  const lastUpdatedMSecs = mainAccount.neurons?.lastUpdatedMSecs;

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

  const onSelectNeuron = useCallback(
    (neuron: ICPNeuron) => {
      const neuronId = neuron.id?.[0]?.id?.toString();
      if (!neuronId) return;

      navigation.navigate(ScreenName.InternetComputerNeuronManage, {
        ...route.params,
        neuronId,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ICPNeuron; index: number }) => (
      <NeuronRow
        neuron={item}
        currency={currency}
        onPress={() => onSelectNeuron(item)}
        isLast={index === neurons.length - 1}
      />
    ),
    [currency, neurons.length, onSelectNeuron],
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
});
