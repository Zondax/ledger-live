import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
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
  const bridge = getAccountBridge(account);

  const onSenderChainIdValueChange = useCallback(
    (senderChainIdValue: String) => {
      onChange(bridge.updateTransaction(transaction, { senderChainId: Number(senderChainIdValue) }));
    },
    [onChange, transaction, bridge],
    );

  const onReceiverChainIdValueChange = useCallback(
    (receiverChainIdValue: String) => {
      onChange(bridge.updateTransaction(transaction, { receiverChainId: Number(receiverChainIdValue) }));
    },
    [onChange, transaction, bridge],
    );

  return (
    <Box flow={1}>
      <Box mb={10} horizontal grow alignItems="center" justifyContent="space-between">
        <Box ml={0} grow={1}>
          <Label>
              <span>
                Sender chain ID
              </span>
          </Label>
        <Input
          type="number"
          min={0}
          max={99}
          defaultValue={0}
          onChange={onSenderChainIdValueChange}
        />
        </Box>
        <Box ml={0} grow={1} />
        <Box ml={0} grow={1}>
          <Label>
              <span>
                Receiver chain ID
              </span>
          </Label>
        <Input
          type="number"
          min={0}
          max={99}
          defaultValue={0}
          onChange={onReceiverChainIdValueChange}
        />
        </Box>
      </Box>
    </Box>
  );
};

export default {
  component: Root,
  fields: ["senderChainId", "receiverChainId", "transaction"],
};
