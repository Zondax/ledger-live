import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the transferID/Memo is non number
 */
export const InvalidMemoICP = createCustomErrorClass("InvalidMemoICP");

/*
 * When the staking amount is not enough
 */
export const NotEnoughTransferAmount = createCustomErrorClass("NotEnoughTransferAmount");

/*
 * When the dissolve delay is negative
 */
export const DissolveDelayLTMin = createCustomErrorClass("DissolveDelayLTMin");

/*
 * When the dissolve delay is greater than the maximum
 */
export const DissolveDelayGTMax = createCustomErrorClass("DissolveDelayGTMax");

/*
 * When the dissolve delay is less than the current dissolve delay
 */
export const DissolveDelayLTCurrent = createCustomErrorClass("DissolveDelayLTCurrent");

/*
 * When the neuron is not found
 */
export const NeuronNotFound = createCustomErrorClass("NeuronNotFound");
