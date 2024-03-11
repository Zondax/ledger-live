export interface KadenaRosettaNetworkStatus {
  current_block_identifier: {
    hash: string;
    index: number;
  };
}

export interface KadenaRosettaAccountBalance {
  balances: [
    {
      currency: {
        decimals: 12;
        symbol: "KDA";
      };
      value: string;
    },
  ];
  block_identifier: {
    hash: string;
    index: number;
  };
}

export interface GetTxnsResponse {
  amount: string
  blockHash: string
  blockTime: string
  chain: number
  crossChainAccount?: string
  crossChainId?: number
  fromAccount: string
  height: number
  idx: number
  requestKey: string
  toAccount: string
  token: string
}