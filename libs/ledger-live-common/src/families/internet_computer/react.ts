import { useState, useEffect } from "react";
import { getCurrentICPPreloadData, getICPPreloadDataUpdates, ICPPreloadedData } from "./preload";

export function useICPPreloadData(): ICPPreloadedData {
  const [state, setState] = useState(getCurrentICPPreloadData);
  useEffect(() => {
    const sub = getICPPreloadDataUpdates().subscribe(data => {
      setState(data);
    });
    return () => sub.unsubscribe();
  }, []);
  return state;
}
