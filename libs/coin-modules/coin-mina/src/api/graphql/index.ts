import network from "@ledgerhq/live-network";
import { getCoinConfig } from "../../config";

const getGraphqlUrl = (): string => {
  const currencyConfig = getCoinConfig();
  // The url doesn't need a route, it's just the base url
  return `${currencyConfig.infra.API_MINA_GRAPHQL_NODE}`;
};

export interface FetchEpochInfoResponse {
  data: {
    daemonStatus: {
      consensusTimeNow: {
        epoch: string;
        slot: string;
        globalSlot: string;
        startTime: string;
        endTime: string;
      };
    };
  };
}
export const getEpochInfo = async (): Promise<FetchEpochInfoResponse> => {
  const { data } = await network<FetchEpochInfoResponse>({
    method: "POST",
    url: getGraphqlUrl(),
    data: {
      query: ` 
        query {
            daemonStatus {
              consensusTimeNow {
                epoch
                slot
                globalSlot
                startTime
                endTime
              }
            }
          }
      `,
    },
  });

  return data;
};

export interface FetchDelegateAccountResponse {
  data: {
    account: {
      delegateAccount: {
        publicKey: string;
      };
    } | null;
  };
}
export const getDelegateAccount = async (
  address: string,
): Promise<FetchDelegateAccountResponse> => {
  const { data } = await network<FetchDelegateAccountResponse>({
    method: "POST",
    url: getGraphqlUrl(),
    data: {
      query: `
        query {
          account(publicKey: "${address}"){
            delegateAccount{
              publicKey
            }
          }
        }
      `,
    },
  });

  return data;
};
