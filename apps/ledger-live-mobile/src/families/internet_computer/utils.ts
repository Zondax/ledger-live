import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";

/**
 * Neuron state information with display label and color
 */
export type NeuronStateDisplay = {
  label: string;
  color: string;
};

/**
 * Extended neuron state info with action permissions
 */
export type NeuronStateInfo = NeuronStateDisplay & {
  canDisburse: boolean;
  canStartDissolving: boolean;
  canStopDissolving: boolean;
  canSetDissolveDelay: boolean;
  canSplitNeuron: boolean;
};

/**
 * Get basic neuron state display info (label and color)
 */
export function getNeuronStateDisplay(neuron: ICPNeuron): NeuronStateDisplay {
  const dissolveState = neuron.dissolveState;
  if (!dissolveState) return { label: "Unknown", color: "grey" };

  switch (dissolveState) {
    case "Locked":
      return { label: "Locked", color: "darkBlue" };
    case "Dissolving":
      return { label: "Dissolving", color: "orange" };
    case "Unlocked":
      return { label: "Unlocked", color: "live" };
    case "Spawning":
      return { label: "Spawning", color: "orange" };
    default:
      return { label: "Unknown", color: "grey" };
  }
}

/**
 * Get extended neuron state info with action permissions
 */
export function getNeuronStateInfo(neuron: ICPNeuron): NeuronStateInfo {
  const baseState: NeuronStateInfo = {
    label: "Unknown",
    color: "grey",
    canDisburse: false,
    canStartDissolving: false,
    canStopDissolving: false,
    canSetDissolveDelay: false,
    canSplitNeuron: false,
  };

  const dissolveState = neuron.dissolveState;
  if (!dissolveState) return baseState;

  switch (dissolveState) {
    case "Locked":
      return {
        ...baseState,
        label: "Locked",
        color: "darkBlue",
        canStartDissolving: true,
        canSetDissolveDelay: true,
        canSplitNeuron: true,
      };
    case "Dissolving":
      return {
        ...baseState,
        label: "Dissolving",
        color: "orange",
        canStopDissolving: true,
        canSplitNeuron: true,
      };
    case "Unlocked":
      return {
        ...baseState,
        label: "Unlocked",
        color: "live",
        canDisburse: true,
      };
    case "Spawning":
      return {
        ...baseState,
        label: "Spawning",
        color: "orange",
      };
    default:
      return baseState;
  }
}

/**
 * Get dissolve delay display string
 */
export function getDissolveDelayDisplay(neuron: ICPNeuron): string {
  const state = neuron.dissolveState;
  if (!state) return "-";

  if (state === "Unlocked") {
    return "Ready to disburse";
  }

  return state;
}

/**
 * Format last sync date for display
 */
export function formatLastSyncDate(
  lastUpdatedMSecs: number | undefined,
  fallbackText: string,
): string {
  if (!lastUpdatedMSecs || lastUpdatedMSecs === 0) {
    return fallbackText;
  }
  const date = new Date(lastUpdatedMSecs);
  return date.toLocaleString();
}
