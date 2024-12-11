import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import CheckCircle from "~/renderer/icons/CheckCircle";
import { rgba } from "~/renderer/styles/helpers";

const Container = styled(Box)<{ selected?: boolean }>`
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid ${p => p.theme.colors.palette.divider};
  background: ${p => (p.selected ? rgba(p.theme.colors.palette.primary.main, 0.05) : "none")};

  &:hover {
    background: ${p => rgba(p.theme.colors.palette.primary.main, 0.05)};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ValidatorRow = ({
  validator,
  selected,
  onClick,
}: {
  validator: {
    address: string;
    name: string;
    delegators: number;
    totalStake: string;
  };
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <Container horizontal alignItems="center" selected={selected} onClick={onClick}>
      <Box flex={1}>
        <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
          {validator.name}
        </Text>
        <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
          {validator.address}
        </Text>
      </Box>
      <Box>
        <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={4}>
          {validator.totalStake} MINA
        </Text>
        <Text ff="Inter|Regular" color="palette.text.shade60" fontSize={3}>
          {validator.delegators} Delegators
        </Text>
      </Box>
      {selected && (
        <Box ml={3}>
          <CheckCircle size={16} />
        </Box>
      )}
    </Container>
  );
};

export default ValidatorRow;
