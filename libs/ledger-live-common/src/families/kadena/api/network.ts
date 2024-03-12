import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network/network";
import { log } from "@ledgerhq/logs";
import { AxiosRequestConfig, AxiosResponse, Method } from "axios";
import { KADENA_BLK_NAME_ROSETTA, KADENA_NET_ID_ROSETTA } from "../consts";
import { ChainId } from "@kadena/client";
import { GetTxnsResponse, KadenaRosettaAccountBalance, KadenaRosettaNetworkStatus } from "./types";

const getKadenaNodeURL = (subpath?: string): string => {
  const baseUrl = getEnv("API_KADENA_NODE_ENDPOINT");
  if (!baseUrl) throw new Error("API node base URL not available");

  return `${baseUrl}${subpath ?? ""}`;
};

const getKadenaIndexerURL = (subpath?: string): string => {
  const baseUrl = getEnv("API_KADENA_INDEXER_ENDPOINT");
  if (!baseUrl) throw new Error("API indexer base URL not available");

  return `${baseUrl}${subpath ?? ""}`;
};

const KadenaApiWrapper = async <T>(path: string, body: any, method: Method) => {
  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const opts: AxiosRequestConfig = {
    method,
    data: body,
    url: path,
  };
  const rawResponse = await network(opts);
  if (rawResponse && rawResponse.data && rawResponse.data.details?.error_message) {
    log("error", rawResponse.data.details?.error_message);
  }

  // We force data to this way as network func is not using the correct param type. Changing that func will generate errors in other implementations
  const { data, headers } = rawResponse as AxiosResponse<T>;

  log("http", path);
  return { data, headers };
};

const getRosettaNetworkIdentifier = (subNetId: ChainId = "0") => {
  return {
    network_identifier: {
      blockchain: KADENA_BLK_NAME_ROSETTA,
      network: KADENA_NET_ID_ROSETTA,
      sub_network_identifier: {
        network: subNetId,
      },
    },
  };
};

const getRosettaPath = (subPath: string): string => {
  return getKadenaNodeURL(`/rosetta/${subPath}`);
};

export const fetchBlockHeight = async () => {
  const res = await KadenaApiWrapper<KadenaRosettaNetworkStatus>(
    getRosettaPath("network/status"),
    {
      ...getRosettaNetworkIdentifier(),
    },
    "POST",
  );

  return res.data;
};

export const fetchBalances = async (address: string) => {
  const resPromises: Promise<{ data: KadenaRosettaAccountBalance }>[] = [];

  for (let i = 0; i < 20; i++) {
    resPromises.push(
      KadenaApiWrapper<KadenaRosettaAccountBalance>(
        getRosettaPath("account/balance"),
        {
          ...getRosettaNetworkIdentifier(i.toString() as ChainId),
          account_identifier: {
            address,
          },
        },
        "POST",
      ),
    );
  }

  const res = await Promise.all(resPromises);
  return res.map(r => r.data);
};

export const fetchTransactions = async (address: string) => {
  const url = getKadenaIndexerURL("/txs/account");
  const result: GetTxnsResponse[] = [];
  let next = "";

  for (;;) {
    let query = "";
    if (next === "") {
      query = `${url}/${address}?limit=100&token=coin`;
    } else {
      query = `${url}/${address}?next=${next}&limit=100&token=coin`;
    }

    const res = await KadenaApiWrapper<GetTxnsResponse[]>(query, {}, "GET");

    result.push(...res.data);

    const headers = res.headers;
    next = headers["Chainweb-Next"] ?? "";
    if (next == "") {
      break;
    }
  }

  return result;
};
