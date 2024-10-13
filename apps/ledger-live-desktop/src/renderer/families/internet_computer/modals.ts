import { MakeModalsType } from "~/renderer/modals/types";
import MODAL_ICP_LIST_NEURONS, {
  Props as MODAL_ICP_LIST_NEURONS_PROPS,
} from "./ListNeuronFlowModal";
import MODAL_ICP_MANAGE_NEURON, {
  Props as MODAL_ICP_MANAGE_NEURON_PROPS,
} from "./ManageNeuronFlowModal";

export type DelegationActionsModalName = "MODAL_ICP_LIST_NEURONS";

export type ModalsData = {
  MODAL_ICP_LIST_NEURONS: MODAL_ICP_LIST_NEURONS_PROPS;
  MODAL_ICP_MANAGE_NEURON: MODAL_ICP_MANAGE_NEURON_PROPS;
};

const modals: MakeModalsType<ModalsData> = {
  MODAL_ICP_LIST_NEURONS,
  MODAL_ICP_MANAGE_NEURON,
};

export default modals;
