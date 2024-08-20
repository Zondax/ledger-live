import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ICP_LIST_NEURONS, {
  Props as MODAL_ICP_LIST_NEURONS_PROPS,
} from "./ListNeuronFlowModal";

export type DelegationActionsModalName = "MODAL_ICP_LIST_NEURONS";

export type ModalsData = {
  MODAL_ICP_LIST_NEURONS: MODAL_ICP_LIST_NEURONS_PROPS;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ICP_LIST_NEURONS,
};

export default modals;
