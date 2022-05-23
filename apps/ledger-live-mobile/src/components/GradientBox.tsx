import React, { memo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "styled-components/native";
import LinearGradient from "react-native-linear-gradient";
import { Box, Flex, Text } from "@ledgerhq/native-ui";

type Props = {
  size: "small" | "large";
  title: string;
  text: string;
};

function GradientBox({ size, title, text }: Props) {
  const { colors } = useTheme();
  const padding = {
    x: size === "small" ? 6 : 8,
    y: size === "small" ? 6 : 11,
  };

  return (
    <LinearGradient
      colors={["rgba(39, 39, 39, 1)", "rgba(39, 39, 39, 0)"]}
      style={styles.linearGradient}
    >
      <Box px={padding.x} py={padding.y}>
        <Flex justifyContent={"center"} alignItems={"center"}>
          <Text variant="large" fontWeight="bold" textAlign={"center"}>
            {title}
          </Text>
          <Text
            variant="paragraph"
            color={colors.neutral.c70}
            textAlign={"center"}
            mt={3}
          >
            {text}
          </Text>
        </Flex>
      </Box>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    borderRadius: 8,
  },
});

export default memo(GradientBox);
