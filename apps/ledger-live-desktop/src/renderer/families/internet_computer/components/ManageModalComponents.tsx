import React from "react";
import styled from "styled-components";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import Box from "~/renderer/components/Box";
import IconInfo from "~/renderer/icons/InfoCircle";
import IconArrowRight from "~/renderer/icons/ArrowRight";
import Tooltip from "~/renderer/components/Tooltip";

const Section = styled(Box)`
  width: 100%;
`;

const SectionHeader = styled(Box)`
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const SectionHeaderLeft = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TitleRow = styled(Box)`
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 8px;
`;

const Element = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 8px 0;
  justify-content: space-between;
`;

const StyledIconInfo = styled(IconInfo)`
  color: ${p => p.theme.colors.palette.text.shade60};
`;

type ManageModalSectionProps = {
  title: string;
  titleTooltip?: string;
  description?: string;
  value?: React.ReactNode;
  children: React.ReactNode;
};

export function ManageModalSection({
  title,
  titleTooltip,
  description,
  value,
  children,
}: ManageModalSectionProps) {
  return (
    <Section>
      <SectionHeader>
        <SectionHeaderLeft>
          <TitleRow>
            <Text ff="Inter|SemiBold" fontSize={6} color="palette.text.shade100">
              {title}
            </Text>
            {titleTooltip && (
              <Tooltip content={titleTooltip}>
                <Box>
                  <StyledIconInfo size={14} />
                </Box>
              </Tooltip>
            )}
          </TitleRow>
          {description && (
            <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade60">
              {description}
            </Text>
          )}
        </SectionHeaderLeft>
        {value && (
          <Text ff="Inter|SemiBold" fontSize={6} color="palette.text.shade100">
            {value}
          </Text>
        )}
      </SectionHeader>
      <Box>{children}</Box>
    </Section>
  );
}

type ManageModalElementProps = {
  label: string;
  labelTooltip?: string;
  value?: React.ReactNode;
  valueTooltip?: string;
};

export function ManageModalElement({
  label,
  labelTooltip,
  value,
  valueTooltip,
}: ManageModalElementProps) {
  return (
    <Element>
      <Box style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
        <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade100">
          {label}
        </Text>
        {labelTooltip && (
          <Tooltip content={labelTooltip}>
            <Box>
              <StyledIconInfo size={14} />
            </Box>
          </Tooltip>
        )}
      </Box>
      <Box>
        <Text ff="Inter|SemiBold" fontSize={4} color="palette.text.shade100">
          {value}
        </Text>
        {valueTooltip && (
          <Tooltip content={valueTooltip}>
            <Box>
              <StyledIconInfo size={14} />
            </Box>
          </Tooltip>
        )}
      </Box>
    </Element>
  );
}

type ManageModalElementWithIconProps = {
  label: string;
  labelTooltip?: string;
  value?: React.ReactNode;
  valueTooltip?: string;
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }[];
  icon?: React.ReactNode;
};

export function ManageModalElementWithIcon({
  label,
  labelTooltip,
  value,
  valueTooltip,
  action,
  icon = <IconArrowRight size={14} />,
}: ManageModalElementWithIconProps) {
  return (
    <Element>
      <Box style={{ flexDirection: "row", gap: 8 }}>
        <Box
          height={54}
          width={54}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#131415",
            borderRadius: "4px",
          }}
        >
          {icon}
        </Box>
        <Box style={{ gap: 8 }}>
          <Box style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
            {value && (
              <Text ff="Inter|SemiBold" fontSize={4} color="palette.text.shade100">
                {value}
              </Text>
            )}
            {valueTooltip && (
              <Tooltip content={valueTooltip}>
                <Box>
                  <StyledIconInfo size={14} />
                </Box>
              </Tooltip>
            )}
          </Box>
          <Box>
            <Box style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
              <Text ff="Inter|Regular" fontSize={4} color="palette.text.shade100">
                {label}
              </Text>
              {labelTooltip && (
                <Tooltip content={labelTooltip}>
                  <StyledIconInfo size={14} />
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      <Box style={{ flexDirection: "row", gap: 8 }}>
        {action &&
          action.map(action => (
            <Button key={action.label} primary onClick={action.onClick} disabled={action.disabled}>
              {action.label}
            </Button>
          ))}
      </Box>
    </Element>
  );
}
