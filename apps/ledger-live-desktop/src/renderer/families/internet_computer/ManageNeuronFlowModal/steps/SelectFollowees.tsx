import React, { useCallback, useState } from "react";
import { KNOWN_NEURON_IDS } from "@ledgerhq/live-common/families/internet_computer/consts";
import Input, { InputError } from "~/renderer/components/Input";
import Label from "~/renderer/components/Label";
import Text from "~/renderer/components/Text";
import { Divider } from "@ledgerhq/react-ui";
import Box from "~/renderer/components/Box";
import Cross from "~/renderer/icons/Cross";
import { CopiableField } from "~/renderer/drawers/NFTViewerDrawer/CopiableField";
import Button from "~/renderer/components/Button";
import { StepProps } from "../types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";

export function StepSelectFollowees({
  followTopic,
  transitionTo,
  setLastManageAction,
  manageNeuronIndex,
  neurons,
  account,
  onChangeTransaction,
}: StepProps) {
  const [error, setError] = useState<InputError>(null);
  const [followNeuronId, setFollowNeuronId] = useState<string>("");
  const [followees, setFollowees] = useState<string[]>([]);
  const neuron = neurons.fullNeurons[manageNeuronIndex];

  const onChangeFollowNeuronId = useCallback(
    (value: string) => {
      setFollowNeuronId(value);
      if (value && /[^0-9]/.test(value)) {
        setError(new Error("Invalid neuron ID, please enter a valid neuron ID"));
      } else {
        setError(null);
      }
    },
    [setFollowNeuronId],
  );

  const onClickFollowNeuron = useCallback(() => {
    const bridge = getAccountBridge(account, undefined);
    const initTx = bridge.createTransaction(account);
    onChangeTransaction(
      bridge.updateTransaction(initTx, {
        neuronId: neuron.id[0]?.id.toString(),
        type: "follow",
        followeesIds: followees,
        followTopic,
      }),
    );
    setLastManageAction("follow");
    transitionTo("manageAction");
  }, [
    transitionTo,
    account,
    neuron.id,
    followees,
    followTopic,
    onChangeTransaction,
    setLastManageAction,
  ]);

  const onClickAddFollowee = useCallback(
    (neuronId?: string) => {
      if (neuronId?.length) {
        setFollowees(prev => [...prev, neuronId]);
      } else if (followNeuronId.length) {
        setFollowees(prev => [...prev, followNeuronId]);
      }
    },
    [followNeuronId],
  );

  const onClickRemoveFollowee = useCallback((followee: string) => {
    setFollowees(prev => prev.filter(f => f !== followee));
  }, []);

  return (
    <Box>
      <Box style={{ gap: 5 }}>
        <Label>Followee&apos;s Neuron Id</Label>
        <Box style={{ gap: 5, justifyContent: "flex-end" }}>
          <Input
            value={followNeuronId}
            onChange={onChangeFollowNeuronId}
            error={error}
            placeholder="Enter neuron ID"
          />
          <Button
            onClick={() => onClickAddFollowee()}
            disabled={!!error}
            style={{ marginLeft: "auto" }}
            primary
          >
            Add
          </Button>
        </Box>
      </Box>
      <Divider my={4} width={"100%"} />
      <Box style={{ gap: 10 }}>
        <Text ff="Inter|SemiBold" fontSize={14}>
          Options For Following
        </Text>
        <Box style={{ gap: 15 }}>
          {Object.entries(KNOWN_NEURON_IDS).map(([key, value]) => (
            <Box
              key={value}
              style={{ gap: 10, flexDirection: "row", justifyContent: "space-between" }}
            >
              <Box>
                <Text ff="Inter|Regular" fontSize={14}>
                  {value}
                </Text>
                <CopiableField value={value}>
                  <Text ff="Inter|Regular" fontSize={14}>
                    {key}
                  </Text>
                </CopiableField>
              </Box>
              <Button
                onClick={() => onClickAddFollowee(key)}
                disabled={followees.includes(key)}
                style={{ boxShadow: "none" }}
                primary
              >
                Add
              </Button>
            </Box>
          ))}
        </Box>
      </Box>
      {!!followees.length && (
        <>
          <Divider my={4} />
          <Box style={{ gap: 10 }}>
            <Text ff="Inter|SemiBold" fontSize={14}>
              Followees ({followees.length})
            </Text>
            <Box style={{ gap: 10 }}>
              {followees.map(followee => (
                <Box style={{ gap: 10, flexDirection: "row" }} key={followee}>
                  <Text ff="Inter|Regular" fontSize={14}>
                    {KNOWN_NEURON_IDS[followee] ?? followee}
                  </Text>
                  <Box
                    style={{ cursor: "pointer", margin: "auto 0" }}
                    onClick={() => onClickRemoveFollowee(followee)}
                  >
                    <Cross size={12} />
                  </Box>
                </Box>
              ))}
            </Box>
            <Button style={{ marginLeft: "auto" }} onClick={onClickFollowNeuron} primary>
              Follow
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
