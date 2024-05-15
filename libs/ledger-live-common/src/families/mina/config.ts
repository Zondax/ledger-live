import { CurrencyLiveConfigDefinition } from "../../config";

const minaConfig: CurrencyLiveConfigDefinition = {
  config_currency_mina: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_MINA_ROSETTA_NODE: "https://rosetta-devnet.minaprotocol.network",
      },
    },
  },
};

export { minaConfig };
