import { Observable, Subject } from "rxjs";
import { log } from "@ledgerhq/logs";
import { NeuronsData } from "./neurons";
export interface ICPPreloadedData {
  neurons: NeuronsData;
}

const PRELOAD_MAX_AGE = 30 * 60 * 1000;
let currentPreloadedData: ICPPreloadedData = {
  neurons: new NeuronsData([], 0),
};

function fromHydratePreloadData(data: any): ICPPreloadedData {
  const hydratedData = Object.assign({}, currentPreloadedData);

  if (typeof data === "object" && typeof data.neurons === "string") {
    hydratedData.neurons = NeuronsData.deserialize(data.neurons);
  }

  return hydratedData;
}

const updates = new Subject<ICPPreloadedData>();

export function getCurrentICPPreloadData(): ICPPreloadedData {
  log("debug", "[getCurrentICPPreloadData] data", currentPreloadedData);
  return currentPreloadedData;
}

export function setICPPreloadData(data: ICPPreloadedData): void {
  currentPreloadedData = data;
  updates.next(data);
}

export function getICPPreloadDataUpdates(): Observable<ICPPreloadedData> {
  return updates.asObservable();
}

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

export const preload = async (): Promise<undefined> => undefined;

export const hydrate = (data: any): void => {
  log("debug", "hydrate/icp data", data);
  const hydrated = fromHydratePreloadData(data);

  log(
    "internet_computer/preload",
    `hydrated neurons with ${hydrated.neurons.fullNeurons.length} neurons`,
  );

  setICPPreloadData(hydrated);
};
