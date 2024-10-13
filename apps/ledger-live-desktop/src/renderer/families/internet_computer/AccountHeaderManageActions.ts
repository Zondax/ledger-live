import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { useCallback } from "react";
// import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";

type Props = {
  account: ICPAccount;
  parentAccount: ICPAccount | undefined | null;
  source?: string;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  // const { t } = useTranslation();
  const dispatch = useDispatch();
  const onClick = useCallback(() => {
    if (account.type !== "Account") return;
    dispatch(
      openModal("MODAL_ICP_LIST_NEURONS", {
        account,
      }),
    );
  }, [account, dispatch]);
  if (parentAccount) return null;
  const disabledLabel = "disabled label text";
  return [
    {
      key: "manage-neurons",
      onClick: onClick,
      icon: IconCoins,
      label: "Manage Neurons",
      tooltip: disabledLabel,
      event: "button_clicked2",
      eventProperties: {
        button: "Manage Neurons",
      },
      accountActionsTestId: "manage-neurons-button-icp",
    },
  ];
};

export default AccountHeaderActions;
