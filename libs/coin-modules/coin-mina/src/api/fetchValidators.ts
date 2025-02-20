import network from "@ledgerhq/live-network";

export interface ValidatorInfo {
  public_key: string;
  validator_logo: string;
  identity_name: string;
  fee: number;
  description: string;
  website: string;
  stake: string;
  delegations: number;
  blocks_created: number;
}

// TODO: Use definite URL
export const fetchValidators = async (): Promise<ValidatorInfo[]> => {
  const { data } = await network<ValidatorInfo[]>({
    method: "GET",
    url: "https://api.aurowallet.com/validators",
  });

  return data;
};
