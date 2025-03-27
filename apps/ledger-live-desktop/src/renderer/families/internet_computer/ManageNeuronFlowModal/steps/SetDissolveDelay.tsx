import React, { useCallback, useState } from "react";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import { StepProps } from "../types";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  SECONDS_IN_DAY,
  MAX_DISSOLVE_DELAY,
} from "@ledgerhq/live-common/families/internet_computer/consts";
import {
  getMinDissolveDelay,
  secondsToDurationString,
  votingPower,
} from "@ledgerhq/live-common/families/internet_computer/utils";

export function SetDissolveDelay({
  manageNeuronIndex,
  neurons,
  account,
  status,
  onChangeTransaction,
  setLastManageAction,
  transitionTo,
}: StepProps) {
  const [dissolveDelay, setDissolveDelay] = useState("");
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const { errors } = status;

  const onChangeDissolveDelay = useCallback(
    (value: string) => {
      setDissolveDelay(value);
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      const valueInSeconds = BigNumber(value).times(SECONDS_IN_DAY).toString();
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          neuronId: neuron.id[0]?.id.toString(),
          type: "set_dissolve_delay",
          dissolveDelay: valueInSeconds,
        }),
      );
    },
    [account, neuron.id, onChangeTransaction],
  );

  const onClickIncreaseDissolveDelay = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    const action = "set_dissolve_delay";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
        dissolveDelay: BigNumber(dissolveDelay).times(SECONDS_IN_DAY).toString(),
      }),
    );
    setLastManageAction(action);
    transitionTo("manageAction");
  }, [account, onChangeTransaction, transitionTo, neuron, setLastManageAction, dissolveDelay]);

  return (
    <Box p={20}>
      <Text ff="Inter|SemiBold" fontSize={22} mb={10}>
        Set Dissolve Delay
      </Text>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          Neuron ID
        </Text>
        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade80">
          {neuron.id[0]?.id.toString()}
        </Text>
      </Box>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          Balance
        </Text>
        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade80">
          {formatCurrencyUnit(
            account.currency.units[0],
            BigNumber(neuron.cached_neuron_stake_e8s.toString()),
            {
              showCode: false,
              disableRounding: true,
            },
          )}
        </Text>
      </Box>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          Dissolve Delay
        </Text>
        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade60" mb={2}>
          Dissolve delay is the minimum amount of time you have to wait for the neuron to unlock,
          and ICP to be available again. Note, that dissolve delay only decreases when the neuron is
          in a dissolving state.
        </Text>

        <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade60">
          Voting power is given to neurons with a dissolve delay of at least 6 months.
        </Text>
      </Box>

      <Box mb={10}>
        <Text ff="Inter|SemiBold" fontSize={14} mb={2}>
          Dissolve Delay (in days)
        </Text>

        <Box horizontal justifyContent="space-between">
          <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade80">
            Min: {(getMinDissolveDelay(neuron) / SECONDS_IN_DAY).toFixed(4)}
          </Text>
          <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade80">
            Max: {MAX_DISSOLVE_DELAY / SECONDS_IN_DAY}
          </Text>
        </Box>
        <Input
          value={dissolveDelay}
          onChange={onChangeDissolveDelay}
          error={errors.dissolveDelay}
          placeholder="Enter dissolve delay"
          type="number"
          min="0"
        />

        <Box horizontal justifyContent="space-between" alignItems="center" padding={20}>
          <Box alignItems="center">
            <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade60">
              {dissolveDelay
                ? secondsToDurationString(BigNumber(dissolveDelay).times(SECONDS_IN_DAY).toString())
                : "0"}
            </Text>
            <Text ff="Inter|SemiBold" fontSize={12} color="palette.text.shade60">
              Dissolve Delay
            </Text>
          </Box>
          <Box alignItems="center">
            <Text ff="Inter|SemiBold" fontSize={14} color="palette.text.shade60">
              {dissolveDelay
                ? votingPower({
                    stakeE8s: neuron.cached_neuron_stake_e8s,
                    dissolveDelay: BigInt(
                      BigNumber(dissolveDelay).times(SECONDS_IN_DAY).integerValue().toString(),
                    ),
                    ageSeconds: neuron.aging_since_timestamp_seconds,
                  }).toString()
                : "0"}
            </Text>
            <Text ff="Inter|SemiBold" fontSize={12} color="palette.text.shade60">
              Voting Power
            </Text>
          </Box>
        </Box>
      </Box>

      <Box horizontal justifyContent="flex-end">
        <Button mr={2} onClick={() => transitionTo("manage")}>
          Cancel
        </Button>
        <Button
          primary
          onClick={onClickIncreaseDissolveDelay}
          disabled={!dissolveDelay || isNaN(parseFloat(dissolveDelay)) || errors.dissolveDelay}
        >
          Update Delay
        </Button>
      </Box>
    </Box>
  );
}
