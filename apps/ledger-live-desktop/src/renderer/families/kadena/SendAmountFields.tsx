import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/kadena/types";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";

const Root = (props: {
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  onChange: (a: Transaction) => void;
  trackProperties?: object;
}) => {
  return (
    <Box flow={1}>
      <Box
        horizontal
        alignItems="center"
        justifyContent="space-between"
        style={{ width: "50%", paddingRight: 28 }}
      >
        <Label>
          <LabelInfoTooltip text={<Trans i18nKey="families.kadena.memoWarningText" />}>
            <span>
              <Trans i18nKey="families.kadena.memo" />
            </span>
          </LabelInfoTooltip>
        </Label>
      </Box>
      <Box pr={2} pl={2} mb={15} horizontal alignItems="center" justifyContent="space-between">
        <Box grow={1}>
          {/* <MemoField {...props} /> */}
        </Box>
      </Box>
    </Box>
  );
};

export default {
  component: Root,
  // Transaction is used here to prevent user to forward
  fields: ["memo", "transaction"],
};
