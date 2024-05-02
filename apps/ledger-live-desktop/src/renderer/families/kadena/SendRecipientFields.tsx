import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import Label from "~/renderer/components/Label";
import LabelInfoTooltip from "~/renderer/components/LabelInfoTooltip";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/kadena/types";
import Input from "~/renderer/components/Input";
import { useTranslation } from "react-i18next";

type Props = {
  onChange: (t: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
};

const Root = ({ onChange, account, transaction, status }: Props) => {
  const { t } = useTranslation();

  return (
    <Box flow={1}>
      <Box mb={10} horizontal grow alignItems="center" justifyContent="space-between">
        <Box ml={0} grow={1}>
          <Label>
            <LabelInfoTooltip text={"ok"}>
              <span>
                Sender chain ID
              </span>
            </LabelInfoTooltip>
          </Label>
        <Input
          type="number"
          value={transaction.senderChainId.toString()}
          // placeholder={t("families.kadena.senderChainIdPlaceholder")}
        />
        </Box>
        <Box ml={0} grow={1} />
        <Box ml={0} grow={1}>
          <Label>
            <LabelInfoTooltip text={"ok"}>
              <span>
                Receiver chain ID
              </span>
            </LabelInfoTooltip>
          </Label>
        <Input
          type="number"
          value={transaction.receiverChainId.toString()}
          // placeholder={t("families.kadena.receiverChainIdPlaceholder")}
        />
        </Box>
      </Box>
    </Box>
  );
};

export default {
  component: Root,
  fields: ["senderChainId", "receiverChainId"],
};
