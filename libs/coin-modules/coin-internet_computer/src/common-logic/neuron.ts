import { ICPAccount } from "../types";
import {
  fromNullable,
  derivePrincipalFromPubkey,
  getTimeUntil,
} from "@zondax/ledger-live-icp/utils";

import {
  ICP_FEES,
  ICP_MIN_STAKING_AMOUNT,
  LAST_SYNC_THRESHOLD_IN_DAYS,
  MIN_DISSOLVE_DELAY,
  SECONDS_IN_HALF_YEAR,
  SECONDS_IN_HOUR,
} from "../consts";

import {
  getDissolveDelayMultiplier,
  getNeuronDissolveDurationSeconds,
  ICPNeuron,
  votingPowerNeedsRefresh,
} from "@zondax/ledger-live-icp/neurons";
import BigNumber from "bignumber.js";
import invariant from "invariant";

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
    hours: number;
    minutes: number;
  };
}
export const getBannerState = (account: ICPAccount): getBannerStateReturn => {
  // Check Neuron Periodic Confirmation (Priority 1)
  const { needsRefresh, minDays, minHours, minMinutes } = votingPowerNeedsRefresh(
    account.neurons.fullNeurons,
  );
  if (needsRefresh) {
    return {
      state: "confirm_following",
      data: {
        days: minDays,
        hours: minHours,
        minutes: minMinutes,
      },
    };
  }

  // Check Last Time Neurons Sync (Priority 2)
  const lastSync = account.neurons.lastUpdatedMSecs;
  const { days, hours, minutes } = getTimeUntil(lastSync / 1000);
  if (lastSync && days > LAST_SYNC_THRESHOLD_IN_DAYS) {
    return {
      state: "sync_neurons",
      data: {
        days,
        hours,
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

export const getNeuronDissolveDelayBonus = (neuron: ICPNeuron) => {
  const dissolveDelay = getNeuronDissolveDurationSeconds(neuron);
  if (dissolveDelay < SECONDS_IN_HALF_YEAR) {
    return 0;
  }

  const multiplier = getDissolveDelayMultiplier(BigInt(dissolveDelay));
  return Math.round((multiplier + Number.EPSILON - 1) * 100);
};

export const canSplitNeuron = (neuron: ICPNeuron) => {
  return neuron.cached_neuron_stake_e8s > BigInt(2 * ICP_MIN_STAKING_AMOUNT + ICP_FEES);
};

export const canSpawnNeuron = (neuron: ICPNeuron) => {
  return neuron.maturity_e8s_equivalent > BigInt(ICP_MIN_STAKING_AMOUNT);
};

export const canStakeMaturity = (neuron: ICPNeuron) => {
  return neuron.maturity_e8s_equivalent > BigInt(0);
};

export const maxAllowedSplitAmount = (neuron: ICPNeuron) => {
  return BigNumber(neuron.cached_neuron_stake_e8s.toString()).minus(ICP_MIN_STAKING_AMOUNT);
};

export const isDeviceControlledNeuron = (neuron: ICPNeuron, account: ICPAccount) => {
  invariant(account.xpub, "[ICP](isDeviceControlledNeuron) account.xpub is required");

  const principal = derivePrincipalFromPubkey(account.xpub);
  const controller = fromNullable(neuron.controller);
  invariant(controller, "[ICP](isDeviceControlledNeuron) controller is required");

  return controller.toString() === principal.toString();
};

export {
  neuronPotentialVotingPower,
  getNeuronDissolveDuration,
  getSecondsTillVotingPowerExpires,
  getNeuronVotingPower,
  getNeuronAgeBonus,
} from "@zondax/ledger-live-icp/neurons";
