import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import { Text } from "@ledgerhq/native-ui";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useTheme } from "@react-navigation/native";
import { BigNumber } from "bignumber.js";
import { formatAddress } from "LLM/features/Accounts/utils/formatAddress";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Circle from "~/components/Circle";
import CounterValue from "~/components/CounterValue";
import LText from "~/components/LText";
import ArrowRight from "~/icons/ArrowRight";
import { rgba } from "../../../colors";
import { getNeuronStateDisplay } from "../utils";

type Props = {
  neuron: ICPNeuron;
  currency: Currency;
  onPress: () => void;
  isLast?: boolean;
};

export default function NeuronRow({ neuron, currency, onPress, isLast = false }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const neuronId = neuron.id?.[0]?.id?.toString() || "-";
  const stake = new BigNumber(neuron.cached_neuron_stake_e8s?.toString() || "0");
  const { label: stateLabel, color: stateColor } = getNeuronStateDisplay(neuron);

  return (
    <TouchableOpacity
      style={[
        styles.row,
        styles.wrapper,
        !isLast ? { ...styles.borderBottom, borderBottomColor: colors.lightGrey } : undefined,
      ]}
      onPress={onPress}
    >
      <View style={styles.icon}>
        <Circle size={42} bg={rgba(colors.primary, 0.2)}>
          <LText semiBold style={{ fontSize: 16, color: colors.primary }}>
            N
          </LText>
        </Circle>
      </View>

      <View style={styles.nameWrapper}>
        <Text variant="body" fontWeight="semiBold" numberOfLines={1}>
          {formatAddress(neuronId)}
        </Text>

        <View style={styles.row}>
          <Text variant="small" color={stateColor}>
            {stateLabel}
          </Text>
        </View>
      </View>

      <View style={styles.rightWrapper}>
        <Text variant="body" fontWeight="semiBold">
          <CounterValue
            currency={currency}
            showCode
            value={stake}
            alwaysShowSign={false}
            withPlaceholder
          />
        </Text>

        <View style={styles.row}>
          <Text variant="small" color="live">
            {t("common.seeMore")}
          </Text>
          <ArrowRight color={colors.live} size={14} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  rightWrapper: {
    alignItems: "flex-end",
  },
});
