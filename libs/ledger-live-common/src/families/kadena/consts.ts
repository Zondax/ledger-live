import BigNumber from "bignumber.js";

// TODO: remove this when we have a proper way to handle this
export const KDA_DECIMALS = 12;
export const KDA_FEES = BigNumber(0.0001).times(10 ** KDA_DECIMALS);

export const KDA_NETWORK = "testnet04";
export const KDA_CHAINWEB_VER = "0.0";
