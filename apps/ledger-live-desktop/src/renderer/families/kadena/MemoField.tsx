import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/kadena/types";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import Input from "~/renderer/components/Input";

const MemoField = ({
  onChange,
  account,
  transaction,
  status,
}: {
  onChange: (a: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
}) => {
  invariant(transaction.family === "kadena", "Memo: Kadena family expected");

  const { t } = useTranslation();

  const bridge = getAccountBridge(account);

  const onMemoFieldChange = useCallback(
    (value: string) => {
      if (value !== "") onChange(bridge.updateTransaction(transaction, { memo: value }));
      else onChange(bridge.updateTransaction(transaction, { memo: undefined }));
    },
    [onChange, transaction, bridge],
  );

  // We use transaction as an error here.
  // on the ledger-live mobile
  return (
    <Input
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      // value={transaction.memo ?? ""}
      placeholder={t("families.kadena.memoPlaceholder")}
      onChange={onMemoFieldChange}
      spellCheck="false"
    />
  );
};

export default MemoField;
