import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorRow from "./ValidatorRow";
import { Transaction, MinaAccount } from "@ledgerhq/live-common/families/mina/types";

const ValidatorsContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
  max-height: 400px;
  overflow: scroll;
`;

type Props = {
  account: MinaAccount;
  transaction: Transaction;
  onUpdateTransaction: (tx: (t: Transaction) => Transaction) => void;
};

const ValidatorList = ({ account, transaction, onUpdateTransaction }: Props) => {
  const handleValidatorSelect = (address: string) => {
    onUpdateTransaction(tx => ({
      ...tx,
      recipient: address,
      txType: "stake",
    }));
  };

  return (
    <ValidatorsContainer>
      {account.minaResources?.blockProducers.map(validator => (
        <ValidatorRow
          key={validator.public_key}
          validator={{
            address: validator.public_key,
            name: validator.identity_name,
            delegators: validator.delegations,
            totalStake: validator.stake,
            fee: validator.fee.toString(),
          }}
          selected={transaction?.recipient === validator.public_key}
          onClick={() => handleValidatorSelect(validator.public_key)}
        />
      ))}
    </ValidatorsContainer>
  );
};

export default ValidatorList;
