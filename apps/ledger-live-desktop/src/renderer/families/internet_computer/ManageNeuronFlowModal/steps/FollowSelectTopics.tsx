import React, { useCallback } from "react";
import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import Text from "~/renderer/components/Text";
import Box from "~/renderer/components/Box";
import WarnBox from "~/renderer/components/WarnBox";
import CollapsibleCard from "~/renderer/components/CollapsibleCard";
import { StepProps } from "../types";
import { useTranslation } from "react-i18next";
import Button from "~/renderer/components/Button";

export function StepFollowSelectTopics({ setFollowTopic, transitionTo }: StepProps) {
  const { t } = useTranslation();
  const onClickSelectTopic = useCallback(
    (topic: string) => {
      setFollowTopic(topic);
      transitionTo("selectFollowees");
    },
    [setFollowTopic, transitionTo],
  );

  return (
    <Box>
      <WarnBox>
        <Text ff="Inter|SemiBold" fontSize={14}>
          Follow neurons to automate your voting, and receive the maximum voting rewards. You can
          follow neurons on specific topics or all topics.
        </Text>
      </WarnBox>
      <Box>
        <Text ff="Inter|SemiBold" fontSize={14} mb={10}>
          List of available topics to follow
        </Text>
        <Box style={{ gap: 10 }}>
          {Object.entries(KNOWN_TOPICS).map(([key, value]) => (
            <Box
              key={key}
              style={{
                flexDirection: "row",
                gap: 10,
                justifyContent: "space-between",
              }}
            >
              <CollapsibleCard
                header={
                  <Text ff="Inter|Regular" fontSize={14}>
                    {value}
                  </Text>
                }
                width="100%"
              >
                <Box
                  style={{
                    flexDirection: "column",
                    gap: 10,
                    marginLeft: "auto",
                    padding: "0 40px",
                  }}
                >
                  <Text ff="Inter|Regular" fontSize={14}>
                    {t(`internetComputer.manageNeuron.followTopic.${key}.description`)}
                  </Text>
                  <Button
                    primary
                    style={{ margin: "auto" }}
                    onClick={() => onClickSelectTopic(key)}
                  >
                    Add Followee
                  </Button>
                </Box>
              </CollapsibleCard>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
