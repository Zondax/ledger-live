import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import { MinaFamily } from "./types";

const AccountHeaderActions: MinaFamily["accountHeaderManageActions"] = ({
  account,
  parentAccount,
}) => {
  const dispatch = useDispatch();
  const mainAccount = getMainAccount(account, parentAccount);
  const hasDelegation = mainAccount.minaResources?.stakingActive;

  const onClick = useCallback(() => {
    dispatch(
      openModal("MODAL_MINA_STAKE", {
        account: mainAccount,
      }),
    );
  }, [dispatch, mainAccount]);

  if (parentAccount) return null;

  return [
    {
      key: "Stake",
      onClick: onClick,
      icon: IconCoins,
      label: hasDelegation ? "Change Delegation" : "Earn",
      event: "button_clicked",
      eventProperties: {
        button: "stake",
      },
      accountActionsTestId: "stake-button",
    },
  ];
};

export default AccountHeaderActions;
