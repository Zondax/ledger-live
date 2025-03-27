import { ICPAccount, ICPNeuron } from "../types";
import { fromNullable } from "@dfinity/utils";
import { getTimeUntil, nowInSeconds } from "./utils";
import {
  LAST_SYNC_THRESHOLD_IN_DAYS,
  MIN_DISSOLVE_DELAY,
  SECONDS_IN_HALF_YEAR,
  SECONDS_IN_HOUR,
  VOTING_POWER_REFRESH_THRESHOLD_IN_DAYS,
} from "../consts";
import { getNeuronDissolveDurationSeconds } from "../neurons";

const votingPowerNeedsRefresh = (
  account: ICPAccount,
): {
  needsRefresh: boolean;
  minDays: number;
  minMinutes: number;
} => {
  let minDays = Number.MAX_SAFE_INTEGER;
  let minMinutes = Number.MAX_SAFE_INTEGER;
  for (const neuron of account.neurons.fullNeurons) {
    const votingPowerNextRefresh = fromNullable(
      neuron.neuronInfo.voting_power_refreshed_timestamp_seconds,
    );
    if (!votingPowerNextRefresh) continue;
    if (votingPowerNextRefresh < nowInSeconds()) {
      return {
        needsRefresh: true,
        minDays: 0,
        minMinutes: 0,
      };
    }

    const { days, minutes } = getTimeUntil(Number(votingPowerNextRefresh));
    minDays = Math.min(minDays, days);
    minMinutes = Math.min(minMinutes, minutes);
  }

  return {
    needsRefresh: minDays <= VOTING_POWER_REFRESH_THRESHOLD_IN_DAYS,
    minDays,
    minMinutes,
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
  const { needsRefresh, minDays, minMinutes } = votingPowerNeedsRefresh(account);
  if (needsRefresh) {
    return {
      state: "confirm_following",
      data: {
        days: minDays,
        minutes: minMinutes,
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

export const getMinDissolveDelay = (neuron: ICPNeuron) => {
  const currentDissolveDelay = getNeuronDissolveDurationSeconds(neuron);
  return Math.max(MIN_DISSOLVE_DELAY, Number(currentDissolveDelay) + SECONDS_IN_HOUR);
};
