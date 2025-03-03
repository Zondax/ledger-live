import { ICPAccount } from "../types";
import { fromNullable } from "@dfinity/utils";
import { getTimeUntil } from "./utils";
import {
  LAST_SYNC_THRESHOLD_IN_DAYS,
  SECONDS_IN_HALF_YEAR,
  VOTING_POWER_REFRESH_THRESHOLD_IN_DAYS,
} from "../consts";

const votingPowerNeedsRefresh = (
  account: ICPAccount,
): {
  needsRefresh: boolean;
  minDays: number;
} => {
  let minDays = Number.MAX_SAFE_INTEGER;
  for (const neuron of account.neurons.fullNeurons) {
    const votingPowerNextRefresh = fromNullable(
      neuron.neuronInfo.voting_power_refreshed_timestamp_seconds,
    );
    if (!votingPowerNextRefresh) continue;

    const { days } = getTimeUntil(Number(votingPowerNextRefresh));
    minDays = Math.min(minDays, days);
  }

  return {
    needsRefresh: minDays <= VOTING_POWER_REFRESH_THRESHOLD_IN_DAYS,
    minDays,
  };
};

type BannerState =
  | "confirm_following"
  | "sync_neurons"
  | "lock_neurons"
  | "add_followees"
  | "stake_icp";
interface getBannerStateReturn {
  state: BannerState;
  data?: {
    days: number;
    minutes: number;
  };
}
export const getBannerState = (account: ICPAccount): getBannerStateReturn => {
  // Check Neuron Periodic Confirmation (Priority 1)
  const { needsRefresh, minDays } = votingPowerNeedsRefresh(account);
  if (needsRefresh) {
    return {
      state: "confirm_following",
      data: {
        days: minDays,
        minutes: 0,
      },
    };
  }

  // Check Last Time Neurons Sync (Priority 2)
  const lastSync = account.neurons.lastUpdatedMSecs;
  const { days, minutes } = getTimeUntil(lastSync);
  if (lastSync && days > LAST_SYNC_THRESHOLD_IN_DAYS) {
    return {
      state: "sync_neurons",
      data: {
        days,
        minutes,
      },
    };
  }

  // Check Lock Neurons (Priority 3)
  const hasUnlockedNeurons = account.neurons.fullNeurons.some(
    neuron => neuron.neuronInfo.dissolve_delay_seconds <= SECONDS_IN_HALF_YEAR,
  );
  if (hasUnlockedNeurons) {
    return {
      state: "lock_neurons",
    };
  }

  // Check Add Followees (Priority 4)
  const hasNeuronsWithoutFollowees = account.neurons.fullNeurons.some(
    neuron => neuron.followees.length === 0,
  );
  if (hasNeuronsWithoutFollowees) {
    return {
      state: "add_followees",
    };
  }

  // Check Stake ICP (Priority 5)
  if (account.balance.gt(1)) {
    return {
      state: "stake_icp",
    };
  }

  // No banner needed
  return {
    state: "sync_neurons",
  };
};
