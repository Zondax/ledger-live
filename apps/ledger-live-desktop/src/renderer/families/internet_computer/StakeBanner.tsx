import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { AccountBanner } from "~/renderer/screens/account/AccountBanner";
import React, { useCallback } from "react";
import { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

const StakeBanner: React.FC<{ account: ICPAccount }> = ({ account }) => {
  const dispatch = useDispatch();
  const stakeAccountBanner = useFeature("stakeAccountBanner");
  const state = {
    display: true,
    hasNeurons: account.neurons.fullNeurons.length > 0,
  };
  const { display, hasNeurons } = state;
  const onClickManageNeurons = useCallback(() => {
    if (account.type !== "Account") return;
    dispatch(
      openModal("MODAL_ICP_LIST_NEURONS", {
        account,
        refresh: false,
      }),
    );
  }, [account, dispatch]);

  const onClickStakeIcp = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    dispatch(
      openModal("MODAL_SEND", {
        stepId: "amount",
        account,
        transaction: {
          ...initTx,
          type: "create_neuron",
        },
      }),
    );
  }, [account, dispatch]);

  if (!stakeAccountBanner?.enabled) return null;
  if (!display) return null;

  const title = hasNeurons ? "Manage your ICP neurons" : "Create an ICP neuron";
  const description = hasNeurons
    ? "Adjust voting power, merge neurons, or modify dissolve delay to maximize your rewards. This is essential to maximize your rewards."
    : `Stake your ${account.currency.ticker} and earn rewards by participating in governance of the Internet Computer.`;
  const cta = hasNeurons ? "Manage neurons" : "Stake now";
  const linkText = "Learn more...";
  const linkUrl =
    "https://internetcomputer.org/docs/current/developer-docs/daos/nns/concepts/neurons/staking-voting-rewards";

  return (
    <AccountBanner
      title={title}
      description={description}
      cta={cta}
      onClick={hasNeurons ? onClickManageNeurons : onClickStakeIcp}
      display={true}
      linkText={linkText}
      linkUrl={linkUrl}
    />
  );
};

export default StakeBanner;
