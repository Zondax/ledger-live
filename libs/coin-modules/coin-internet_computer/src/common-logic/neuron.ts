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
  const filteredNeurons = account.neurons.fullNeurons.filter(
    neuron => getNeuronVotingPower(neuron) > 0,
  );

  for (const neuron of filteredNeurons) {
    const secondsTillVotingPowerExpires = getSecondsTillVotingPowerExpires(neuron);
    if (secondsTillVotingPowerExpires <= 0) {
      return {
        needsRefresh: true,
        minDays: 0,
        minMinutes: 0,
      };
    }

    const { days, minutes } = getTimeUntil(secondsTillVotingPowerExpires);
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
  const { days, minutes } = getTimeUntil(lastSync / 1000);
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
    neuron => neuron.dissolveState === "Unlocked",
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

export const getSecondsTillVotingPowerExpires = (neuron: ICPNeuron) => {
  const votingPowerLastRefresh = fromNullable(
    neuron.neuronInfo.voting_power_refreshed_timestamp_seconds,
  );

  if (!votingPowerLastRefresh) {
    return 0;
  }

  const timeNow = nowInSeconds();
  const timeSinceLastRefresh = timeNow - Number(votingPowerLastRefresh);

  return SECONDS_IN_HALF_YEAR - timeSinceLastRefresh;
};

export const getNeuronVotingPower = (neuron: ICPNeuron) => {
  if (getNeuronDissolveDurationSeconds(neuron) < SECONDS_IN_HALF_YEAR) {
    return 0;
  }

  return Number(neuron.neuronInfo.voting_power);
};

export const getNeuronAgeBonus = (neuron: ICPNeuron) => {
  if (getNeuronDissolveDurationSeconds(neuron) < SECONDS_IN_HALF_YEAR) {
    return 0;
  }

  return 0;
};

export const getNeuronDissolveDelayBonus = (neuron: ICPNeuron) => {
  if (getNeuronDissolveDurationSeconds(neuron) < SECONDS_IN_HALF_YEAR) {
    return 0;
  }

  return 0;
};
