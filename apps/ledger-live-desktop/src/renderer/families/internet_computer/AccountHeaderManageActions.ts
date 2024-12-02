import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { TokenAccount } from "@ledgerhq/types-live";
import { useCallback } from "react";
// import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import IconCoins from "~/renderer/icons/Coins";
import IconUpdate from "~/renderer/icons/Update";

type Props = {
  account: ICPAccount | TokenAccount;
  parentAccount: ICPAccount | undefined | null;
  source?: string;
};

const AccountHeaderActions = ({ account, parentAccount }: Props) => {
  const dispatch = useDispatch();
  const onClickManageNeurons = useCallback(
    (refresh: boolean = false) => {
      if (account.type !== "Account") return;
      dispatch(
        openModal("MODAL_ICP_LIST_NEURONS", {
          account,
          refresh,
        }),
      );
    },
    [account, dispatch],
  );
  const onClickStakeIcp = useCallback(() => {
    if (parentAccount) return;
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        account,
        onConfirmationHandler: () => onClickManageNeurons(true),
        transaction: {
          ...initTx,
          type: "create_neuron",
        },
      }),
    );
  }, [account, dispatch, parentAccount, onClickManageNeurons]);

  if (parentAccount) return null;
  return [
    {
      key: "stake-icp",
      onClick: onClickStakeIcp,
      icon: IconCoins,
      label: "Stake ICP",
      tooltip: "Create neurons to stake ICP",
      event: "stake_icp_button_clicked",
      eventProperties: {
        button: "stake_icp_button",
      },
      accountActionsTestId: "stake-icp-button-icp",
    },
    {
      key: "manage-neurons",
      onClick: () => onClickManageNeurons(),
      icon: IconCoins,
      label: "Manage Neurons",
      tooltip: "Manage neurons for staking",
      event: "manage_neurons_dashboard_clicked",
      eventProperties: {
        button: "manage_neurons_button",
      },
      accountActionsTestId: "manage-neurons-button-icp",
    },
    {
      key: "sync-neurons",
      onClick: () => onClickManageNeurons(true),
      icon: IconUpdate,
      label: "Sync Neurons",
      tooltip: "Sync neurons for staking",
      event: "sync_neurons_dashboard_clicked",
      eventProperties: {
        button: "sync_neurons_button",
      },
      accountActionsTestId: "sync-neurons-button-icp",
    },
  ];
};

export default AccountHeaderActions;
