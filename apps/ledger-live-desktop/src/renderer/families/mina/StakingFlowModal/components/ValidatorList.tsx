import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow from "./ValidatorRow";
import { Transaction } from "@ledgerhq/live-common/families/mina/types";
import { Account } from "@ledgerhq/types-live";

// Dummy data for validators
const MOCK_VALIDATORS = [
  {
    address: "B62qq3TQ8APMFYPVtMx5tZGF3kWLJukfwG1RGva8W6",
    name: "Auro Wallet",
    delegators: 12023,
    totalStake: "832023234",
  },
  {
    address: "B63456123456",
    name: "Mina Node",
    delegators: 234,
    totalStake: "832023234",
  },
  // Add more mock validators...
];

const ValidatorsContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
`;

type Props = {
  account: Account;
  transaction: Transaction;
  onUpdateTransaction: (tx: (t: Transaction) => Transaction) => void;
};

const ValidatorList = ({ transaction, onUpdateTransaction }: Props) => {
  const handleValidatorSelect = (address: string) => {
    onUpdateTransaction(tx => ({
      ...tx,
      recipient: address,
    }));
  };

  return (
    <ValidatorsContainer>
      {MOCK_VALIDATORS.map(validator => (
        <ValidatorRow
          key={validator.address}
          validator={validator}
          selected={transaction?.recipient === validator.address}
          onClick={() => handleValidatorSelect(validator.address)}
        />
      ))}
    </ValidatorsContainer>
  );
};

export default ValidatorList;
