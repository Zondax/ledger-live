import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React, { useCallback, useState } from "react";
import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getBannerState } from "@ledgerhq/live-common/families/internet_computer/utils";

const StakeBanner: React.FC<{ account: ICPAccount }> = ({ account }) => {
  const dispatch = useDispatch();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const [bannerState, setBannerState] = useState(getBannerState(account));

  const updateBanner = useCallback(() => {
    setBannerState(getBannerState(account));
  }, [account]);

  const onClickManageNeurons = useCallback(
    (refresh = false) => {
      if (account.type !== "Account") return;
      dispatch(
        openModal("MODAL_ICP_LIST_NEURONS", {
          account,
          refresh,
        }),
      );
      updateBanner();
    },
    [account, dispatch, updateBanner],
  );

  const onClickStakeIcp = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        account,
        onConfirmationHandler: () =>
          dispatch(openModal("MODAL_ICP_LIST_NEURONS", { account, refresh: true })),
        transaction: {
          ...initTx,
          type: "create_neuron",
        },
      }),
    );
    updateBanner();
  }, [account, dispatch, updateBanner]);

  const onClickConfirmFollowing = useCallback(() => {
    dispatch(
      openModal("MODAL_ICP_REFRESH_VOTING_POWER", {
        account,
      }),
    );
    updateBanner();
  }, [account, dispatch, updateBanner]);

  if (!stakeAccountBanner?.enabled) return null;
  const { state, data } = bannerState;

  const bannerContent = {
    confirm_following: {
      title: "Confirm Your Following",
      description: `Your neuron's following needs to be confirmed in ${data?.days} days`,
      cta: "Confirm Following",
      action: onClickConfirmFollowing,
    },
    sync_neurons: {
      title: "Sync Your Staked ICP",
      description: data
        ? `Your staked ICP has last been synced ${data.days} days and ${data.minutes} minutes ago. If you want to see the latest details, we recommend you sync often.`
        : "We recommend syncing your neurons to see the latest details",
      cta: "Sync Neurons",
      action: () => onClickManageNeurons(true),
    },
    lock_neurons: {
      title: "Lock Neurons",
      description:
        "One or more of your neurons are not locked. If you don't lock them you can't get rewards. This is because neurons earn rewards by participating in the governance of ICP, and only neurons locked more than six months are eligible to vote.",
      cta: "Manage Neurons",
      action: () => onClickManageNeurons(false),
    },
    add_followees: {
      title: "Add Followees",
      description:
        "One or more of your neurons have no followees. Without followees you might not get rewards. To get rewards, neurons must vote directly (for example, with NNS Dapp) or follow neurons that do.",
      cta: "Manage Neurons",
      action: () => onClickManageNeurons(false),
    },
    stake_icp: {
      title: "Stake ICP",
      description: "Stake ICP and gain rewards by participating in its governance.",
      cta: "Stake ICP",
      action: () => onClickStakeIcp(),
    },
  };

  const content = bannerContent[state];

  return (
    <AccountBanner
      title={content.title}
      description={content.description}
      cta={content.cta}
      onClick={content.action}
      display={true}
      linkText="Learn more..."
      linkUrl="https://internetcomputer.org/docs/current/developer-docs/daos/nns/concepts/neurons/staking-voting-rewards"
    />
  );
};

export default StakeBanner;
