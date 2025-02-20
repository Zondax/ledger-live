import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import ValidatorList from "../components/ValidatorList";
import { StepProps } from "../types";
import TrackPage from "~/renderer/analytics/TrackPage";
import ErrorBanner from "~/renderer/components/ErrorBanner";

const Container = styled(Box).attrs(() => ({
  flex: 1,
  mb: 4,
}))``;

const StepValidator = ({ account, transaction, onUpdateTransaction, error }: StepProps) => {
  if (!transaction) return null;
  if (!account) return null;

  return (
    <Container>
      <TrackPage category="Delegation Flow" name="Step Validator" />
      {error && <ErrorBanner error={error} />}
      <Box mb={4}>
        <Text ff="Inter|Medium" fontSize={4} color="palette.text.shade100">
          Select a validator from the list below to delegate your MINA tokens.
        </Text>
      </Box>
      <ValidatorList
        account={account}
        transaction={transaction}
        onUpdateTransaction={onUpdateTransaction}
      />
    </Container>
  );
};

export function StepValidatorFooter({ transitionTo, onClose, transaction }: StepProps) {
  const canContinue = transaction?.recipient;

  return (
    <Box horizontal>
      <Button mr={1} secondary onClick={onClose}>
        Cancel
      </Button>
      <Button
        id="stake-continue-button"
        disabled={!canContinue}
        primary
        onClick={() => transitionTo("connectDevice")}
      >
        Continue
      </Button>
    </Box>
  );
}

export default StepValidator;
