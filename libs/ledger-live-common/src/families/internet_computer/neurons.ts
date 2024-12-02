import { IDL } from "@dfinity/candid";
import { Neuron as NNSNeuron } from "@dfinity/nns/dist/candid/governance";
import { ICPNeuron } from "./types";
import { principalToAccountIdentifier } from "@dfinity/ledger-icp";
import { fromNullable, secondsToDuration } from "@dfinity/utils";
import { Principal } from "@dfinity/principal";
import {
  MAINNET_GOVERNANCE_CANISTER_ID,
  MAX_AGE_BONUS,
  MAX_DISSOLVE_DELAY_BONUS,
  SECONDS_IN_EIGHT_YEARS,
  SECONDS_IN_FOUR_YEARS,
  SECONDS_IN_HALF_YEAR,
} from "./consts";
import { Neuron, DissolveState } from "@dfinity/nns/dist/candid/governance";
import { nowInSeconds } from "./utils";
import BigNumber from "bignumber.js";

const NeuronId = IDL.Record({ id: IDL.Nat64 });
const BallotInfo = IDL.Record({
  vote: IDL.Int32,
  proposal_id: IDL.Opt(NeuronId),
});
const DissolveState = IDL.Variant({
  DissolveDelaySeconds: IDL.Nat64,
  WhenDissolvedTimestampSeconds: IDL.Nat64,
});
const Followees = IDL.Record({ followees: IDL.Vec(NeuronId) });
const NeuronStakeTransfer = IDL.Record({
  to_subaccount: IDL.Vec(IDL.Nat8),
  neuron_stake_e8s: IDL.Nat64,
  from: IDL.Opt(IDL.Principal),
  memo: IDL.Nat64,
  from_subaccount: IDL.Vec(IDL.Nat8),
  transfer_timestamp: IDL.Nat64,
  block_height: IDL.Nat64,
});
const KnownNeuronData = IDL.Record({
  name: IDL.Text,
  description: IDL.Opt(IDL.Text),
});
const Neuron = IDL.Record({
  id: IDL.Opt(NeuronId),
  staked_maturity_e8s_equivalent: IDL.Opt(IDL.Nat64),
  controller: IDL.Opt(IDL.Principal),
  recent_ballots: IDL.Vec(BallotInfo),
  kyc_verified: IDL.Bool,
  neuron_type: IDL.Opt(IDL.Int32),
  not_for_profit: IDL.Bool,
  maturity_e8s_equivalent: IDL.Nat64,
  cached_neuron_stake_e8s: IDL.Nat64,
  created_timestamp_seconds: IDL.Nat64,
  auto_stake_maturity: IDL.Opt(IDL.Bool),
  aging_since_timestamp_seconds: IDL.Nat64,
  hot_keys: IDL.Vec(IDL.Principal),
  account: IDL.Vec(IDL.Nat8),
  joined_community_fund_timestamp_seconds: IDL.Opt(IDL.Nat64),
  dissolve_state: IDL.Opt(DissolveState),
  followees: IDL.Vec(IDL.Tuple(IDL.Int32, Followees)),
  neuron_fees_e8s: IDL.Nat64,
  transfer: IDL.Opt(NeuronStakeTransfer),
  known_neuron_data: IDL.Opt(KnownNeuronData),
  spawn_at_timestamp_seconds: IDL.Opt(IDL.Nat64),
});
const Neurons = IDL.Vec(Neuron);

export class NeuronsData {
  fullNeurons: ICPNeuron[];
  lastUpdated: number;

  // calculated values
  totalStaked: BigNumber;
  totalMaturity: BigNumber;
  totalMaturityStaked: BigNumber;

  constructor(neurons: Neuron[], lastUpdated: number) {
    this.fullNeurons = neurons.map(neuron => {
      const dissolveState = fromNullable(neuron.dissolve_state);
      const dissolveDelaySeconds =
        dissolveState && "DissolveDelaySeconds" in dissolveState
          ? dissolveState.DissolveDelaySeconds.toString()
          : "0";
      const whenDissolvedTimestampSeconds =
        dissolveState && "WhenDissolvedTimestampSeconds" in dissolveState
          ? dissolveState.WhenDissolvedTimestampSeconds.toString()
          : "0";
      return {
        ...neuron,
        accountIdentifier: principalToAccountIdentifier(
          Principal.from(MAINNET_GOVERNANCE_CANISTER_ID),
          Uint8Array.from(neuron.account),
        ),
        dissolveState: getNeuronDissolveState(dissolveState),
        votingPower: neuronVotingPower({ neuron }),
        dissolveDelaySeconds,
        whenDissolvedTimestampSeconds,
      };
    });
    this.totalStaked = BigNumber(0);
    this.totalMaturity = BigNumber(0);
    this.totalMaturityStaked = BigNumber(0);
    this.lastUpdated = lastUpdated;

    this.fullNeurons.forEach(neuron => {
      this.totalStaked = this.totalStaked.plus(
        BigNumber(neuron.cached_neuron_stake_e8s.toString()),
      );
      this.totalMaturity = this.totalMaturity.plus(
        BigNumber(neuron.maturity_e8s_equivalent.toString()),
      );
      this.totalMaturityStaked = this.totalMaturityStaked.plus(
        BigNumber(neuron.staked_maturity_e8s_equivalent[0]?.toString() ?? "0"),
      );
    });
  }

  serialize() {
    const encoded = IDL.encode([Neurons], [this.fullNeurons]);
    return {
      neurons: Buffer.from(encoded).toString("hex"),
    };
  }

  public static empty() {
    return new NeuronsData([], Date.now());
  }

  public static deserialize(data: string, lastUpdated?: number) {
    const encoded = new Uint8Array(Buffer.from(data, "hex"));
    const [fullNeurons]: any = IDL.decode([Neurons], encoded);
    return new NeuronsData(fullNeurons, lastUpdated ?? Date.now());
  }
}

/**
 * Calculation of the voting power of a neuron.
 *
 * If neuron's dissolve delay is less than 6 months, the voting power is 0.
 *
 * Else:
 * votingPower = (stake + staked maturity) * dissolve_delay_bonus * age_bonus
 * dissolve_delay_bonus = 1 + (dissolve_delay_multiplier * neuron dissolve delay / 8 years)
 * age_bonus = 1 + (age_multiplier * ageSeconds / 4 years)
 *
 * dissolve_delay_multiplier is 1 in NNS
 * age_multiplier is 0.25 in NNS
 *
 * ageSeconds is capped at 4 years
 * neuron dissolve delay is capped at 8 years
 *
 * Reference: https://internetcomputer.org/docs/current/tokenomics/sns/rewards#recap-on-nns-voting-rewards
 */
export const neuronVotingPower = ({ neuron }: { neuron: NNSNeuron }): BigNumber => {
  const dissolveState = fromNullable(neuron.dissolve_state);
  if (dissolveState === undefined) {
    return BigNumber(0);
  }
  let dissolveDelay =
    "DissolveDelaySeconds" in dissolveState
      ? BigInt(dissolveState.DissolveDelaySeconds)
      : BigInt(0);

  dissolveDelay =
    "WhenDissolvedTimestampSeconds" in dissolveState
      ? BigInt(
          BigNumber(dissolveState.WhenDissolvedTimestampSeconds.toString())
            .minus(nowInSeconds())
            .abs()
            .toString(),
        )
      : dissolveDelay;

  const cachedNeuronStakeE8s = BigInt(neuron.cached_neuron_stake_e8s);
  const stakedMaturityE8s = BigInt(neuron.staked_maturity_e8s_equivalent?.[0] ?? 0);
  const stakeE8s = cachedNeuronStakeE8s + stakedMaturityE8s;
  const votingPowerBigInt = votingPower({
    stakeE8s,
    dissolveDelay,
    ageSeconds: BigInt(neuron.aging_since_timestamp_seconds),
  });

  return BigNumber(votingPowerBigInt.toString());
};

// Calculates the bonus multiplier for an amount (such as dissolve delay or age)
// which results in bonus eligibility which scales linearly from 1 to
// `maxBonus`. For example for dissolve delay, the values
//   amount: 4 years
//   amountForMaxBonus: 8 years
//   maxBonus: 1
// Would mean that there is a maximum bonus of 1 = 100% (which means a
// multiplier of 2) but with a dissolve delay of 4 years out of a maximum of
// 8 years, the bonus would be 50%, which means a multiplier of 1.5.
// So in this case the return value would be 1.5.
export const bonusMultiplier = ({
  amount,
  amountForMaxBonus,
  maxBonus,
}: {
  amount: bigint;
  amountForMaxBonus: number;
  maxBonus: number;
}): number => {
  const bonusProportion =
    amountForMaxBonus === 0 ? 0 : Math.min(Number(amount), amountForMaxBonus) / amountForMaxBonus;
  return 1 + maxBonus * bonusProportion;
};

interface VotingPowerParams {
  // Neuron data
  dissolveDelay: bigint;
  stakeE8s: bigint;
  ageSeconds: bigint;
  // Params
  maxAgeBonus?: number;
  maxDissolveDelayBonus?: number;
  maxAgeSeconds?: number;
  maxDissolveDelaySeconds?: number;
  minDissolveDelaySeconds?: number;
}
/**
 * For now used only internally in this file.
 *
 * It might be useful to use it for SNS neurons.
 */
export const votingPower = ({
  stakeE8s,
  dissolveDelay,
  ageSeconds,
  maxAgeBonus = MAX_AGE_BONUS,
  maxDissolveDelayBonus = MAX_DISSOLVE_DELAY_BONUS,
  maxDissolveDelaySeconds = SECONDS_IN_EIGHT_YEARS,
  maxAgeSeconds = SECONDS_IN_FOUR_YEARS,
  minDissolveDelaySeconds = SECONDS_IN_HALF_YEAR,
}: VotingPowerParams): bigint => {
  if (dissolveDelay < minDissolveDelaySeconds) {
    return BigInt(0);
  }
  const dissolveDelayMultiplier = bonusMultiplier({
    amount: dissolveDelay,
    maxBonus: maxDissolveDelayBonus,
    amountForMaxBonus: maxDissolveDelaySeconds,
  });
  const ageMultiplier = bonusMultiplier({
    amount: ageSeconds,
    maxBonus: maxAgeBonus,
    amountForMaxBonus: maxAgeSeconds,
  });
  // We don't use dissolveDelayMultiplier and ageMultiplier directly because those are specific to NNS.
  // This function is generic and could be used for SNS.
  return BigInt(Math.round(Number(stakeE8s) * dissolveDelayMultiplier * ageMultiplier));
};

// https://github.com/dfinity/nns-dapp/blob/main/frontend/src/lib/utils/sns-neuron.utils.ts#L46
const getNeuronDissolveState = (dissolveState?: DissolveState) => {
  if (dissolveState === undefined) {
    return "Unlocked";
  }
  if ("DissolveDelaySeconds" in dissolveState) {
    return dissolveState.DissolveDelaySeconds.toString() === "0"
      ? // 0 = already dissolved (more info: https://gitlab.com/dfinity-lab/public/ic/-/blob/master/rs/nns/governance/src/governance.rs#L827)
        "Unlocked"
      : "Locked";
  }
  if ("WhenDissolvedTimestampSeconds" in dissolveState) {
    // In case `nowInSeconds` ever changes and doesn't return an integer we use Math.floor
    return dissolveState.WhenDissolvedTimestampSeconds < BigInt(Math.floor(nowInSeconds()))
      ? "Unlocked"
      : "Dissolving";
  }
  return "Unknown";
};

export const getNeuronDissolveDuration = (neuron: ICPNeuron) => {
  return secondsToDuration({
    seconds: BigInt(
      neuron.dissolveDelaySeconds === "0"
        ? BigInt(
            BigNumber(neuron.whenDissolvedTimestampSeconds).minus(nowInSeconds()).abs().toString(),
          )
        : BigInt(neuron.dissolveDelaySeconds),
    ),
  });
};
