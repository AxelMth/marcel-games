import React from "react";
import { StyleSheet, View, Text, Dimensions, Platform } from "react-native";
import { useTranslation } from "react-i18next";

import { DesignSystem } from '@marcel-games/ui';

type Props = {
  level: number;
  onPressHint: () => void;
  onPressHelp: () => void;
};

export const HEADER_HEIGHT =
  Platform.OS === "android"
    ? 50
    : Dimensions.get("window").width > 375
      ? 100
      : 80;

export const Header: React.FC<Props> = ({
  level,
  onPressHelp,
  onPressHint,
}) => {
  const { t } = useTranslation("header");
  const screenWidth = Dimensions.get("window").width;
  let paddingTop = 10;
  if (Platform.OS === "ios") {
    paddingTop = screenWidth > 375 ? 50 : 45;
  }
  return (
    <View style={[styles.header, { height: HEADER_HEIGHT, paddingTop }]}>
      <Text style={styles.sideBtn} onPress={onPressHint}>
        {t("hints")}
      </Text>
      <Text style={styles.title}>
        {t("level")}&nbsp;{level + 1}
      </Text>
      <Text style={styles.sideBtn} onPress={onPressHelp}>
        {t("help")}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: DesignSystem.backgroundColor,
    borderBottomColor: DesignSystem.border.color,
    borderBottomWidth: DesignSystem.border.width,
    justifyContent: "space-between",
    alignItems: "baseline",
    flexDirection: "row",
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: DesignSystem.fontSize.xl,
    fontWeight: DesignSystem.fontWeight.bold as "800",
    fontFamily: DesignSystem.fontFamily.extraBold,
  },
  sideBtn: {
    fontSize: DesignSystem.fontSize.medium,
    fontWeight: DesignSystem.fontWeight.semiBold as "600",
    fontFamily: DesignSystem.fontFamily.medium,
    paddingTop: Platform.OS === "ios" ? 10 : 0,
  },
});
