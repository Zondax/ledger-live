import { Neuron } from "@dfinity/nns/dist/candid/governance";
import { IDL } from "@dfinity/candid";

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
  fullNeurons: Neuron[];
  lastUpdated: number;

  constructor(fullNeurons: Neuron[], lastUpdated: number) {
    this.fullNeurons = fullNeurons;
    this.lastUpdated = lastUpdated;
  }

  serialize() {
    const encoded = IDL.encode([Neurons], [this.fullNeurons]);
    return {
      neurons: Buffer.from(encoded).toString("hex"),
    };
  }

  public static deserialize(data: string) {
    const encoded = new Uint8Array(Buffer.from(data, "hex"));
    const [fullNeurons]: any = IDL.decode([Neurons], encoded);
    return new NeuronsData(fullNeurons, Date.now());
  }
}
