import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "@ledgerhq/native-ui";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { formatLastSyncDate } from "../utils";

type Props = {
  lastUpdatedMSecs: number | undefined;
  lastSyncNeverText: string;
  onSync: () => void;
  onViewDetails?: () => void;
  onClose: () => void;
};

export default function SuccessFooter({
  lastUpdatedMSecs,
  lastSyncNeverText,
  onSync,
  onViewDetails,
  onClose,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      <View style={styles.syncInfo}>
        <Text variant="small" color="neutral.c70">
          <Trans i18nKey="icp.neuronManage.list.lastSync" />:{" "}
          {formatLastSyncDate(lastUpdatedMSecs, lastSyncNeverText)}
        </Text>
        <Button type="shade" size="small" onPress={onSync}>
          <Trans i18nKey="icp.neuronManage.list.sync" />
        </Button>
      </View>
      <View style={styles.buttons}>
        {onViewDetails && (
          <Button type="main" onPress={onViewDetails} mb={3}>
            <Trans i18nKey="send.validation.button.details" />
          </Button>
        )}
        <Button type={onViewDetails ? "default" : "main"} onPress={onClose}>
          <Trans i18nKey="common.close" />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  syncInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  buttons: {
    flexDirection: "column",
  },
});
