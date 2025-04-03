import React, { useCallback, useState } from "react";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Input from "~/renderer/components/Input";
import { StepProps } from "../types";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import TrackPage from "~/renderer/analytics/TrackPage";

export function SplitNeuron({
  manageNeuronIndex,
  neurons,
  account,
  status,
  onChangeTransaction,
  setLastManageAction,
  transitionTo,
}: StepProps) {
  const [amount, setAmount] = useState("");
  const neuron = neurons.fullNeurons[manageNeuronIndex];
  const { errors } = status;
  const unit = account.currency.units[0];
  const currencyId = account.currency.id;
  const neuronBalance = BigNumber(neuron.cached_neuron_stake_e8s.toString());

  const onChangeAmount = useCallback(
    (value: string) => {
      setAmount(value);
      const bridge = getAccountBridge(account, undefined);
      const initTx = bridge.createTransaction(account);
      onChangeTransaction(
        bridge.updateTransaction(initTx, {
          neuronId: neuron.id[0]?.id.toString(),
          type: "split_neuron",
          amount: BigNumber(value || "0").multipliedBy(10 ** unit.magnitude),
        }),
      );
    },
    [account, neuron.id, onChangeTransaction, unit.magnitude],
  );

  const handleMax = useCallback(() => {
    onChangeAmount(neuronBalance.div(10 ** unit.magnitude).toString());
  }, [neuronBalance, onChangeAmount, unit.magnitude]);

  const onClickConfirmSplit = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    const action = "split_neuron";
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: action,
        amount: BigNumber(amount).multipliedBy(10 ** unit.magnitude),
      }),
    );
    setLastManageAction(action);
    transitionTo("manageAction");
  }, [
    account,
    onChangeTransaction,
    transitionTo,
    neuron,
    setLastManageAction,
    amount,
    unit.magnitude,
  ]);

  const formattedBalance = formatCurrencyUnit(unit, neuronBalance, {
    showCode: true,
    disableRounding: true,
  });

  const txFee = BigNumber(0.0001);
  const formattedFee = formatCurrencyUnit(unit, txFee.multipliedBy(10 ** unit.magnitude), {
    showCode: true,
    disableRounding: true,
  });

  return (
    <Box>
      <TrackPage
        category="Split Neuron ICP Flow"
        name="Step Split"
        flow="split"
        action="splitNeuron"
        currency={currencyId}
      />

      <Text ff="Inter|SemiBold" fontSize={22} mb={12}>
        Split Neuron
      </Text>

      <Box mb={12}>
        <Box horizontal alignItems="center">
          <Text ff="Inter|Regular" fontSize={14}>
            Neuron ID:
          </Text>
          <Text ml={1} ff="Inter|SemiBold" fontSize={16}>
            {neuron.id[0]?.id.toString()}
          </Text>
        </Box>
        <Box horizontal alignItems="center" mb={12}>
          <Text ff="Inter|Regular" fontSize={14}>
            Current balance:
          </Text>
          <Text ml={1} ff="Inter|SemiBold" fontSize={16}>
            {formattedBalance}
          </Text>
        </Box>

        <Box horizontal justifyContent="space-between" alignItems="center">
          <Text ff="Inter|Medium" fontSize={14}>
            Amount
          </Text>
          <Button onClick={handleMax} small>
            Max
          </Button>
        </Box>

        <Input
          value={amount}
          onChange={onChangeAmount}
          error={!!amount && errors.splitNeuron}
          placeholder="Amount"
          type="number"
        />
      </Box>

      <Box mb={24}>
        <Box>
          <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade80">
            Transaction Fee
          </Text>
          <Text ff="Inter|Regular" fontSize={14} color="palette.text.shade80">
            {formattedFee}
          </Text>
        </Box>
      </Box>

      <Box horizontal justifyContent="flex-end">
        <Button mr={2} onClick={() => transitionTo("manage")}>
          Cancel
        </Button>
        <Button primary onClick={onClickConfirmSplit} disabled={!!errors.splitNeuron}>
          Confirm Split
        </Button>
      </Box>
    </Box>
  );
}
