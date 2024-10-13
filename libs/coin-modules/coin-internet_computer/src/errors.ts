import { createCustomErrorClass } from "@ledgerhq/errors";

/*
 * When the transferID/Memo is non number
 */
export const InvalidMemoICP = createCustomErrorClass("InvalidMemoICP");

/*
 * When the staking amount is not enough
 */
export const NotEnoughTransferAmount = createCustomErrorClass("NotEnoughTransferAmount");
