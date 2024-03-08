import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { formatTime } from "@marcel-games/helpers";

import { ModalComponent } from "../modal/Modal";
import { Button } from "../button/Button"

import { DesignSystem } from '@marcel-games/ui';

export const SuccessModal = ({
  isSuccessModalVisible,
  numberOfAttempt,
  timer,
  foundItemLabels,
  onPress,
  onRequestClose,
}: {
  isSuccessModalVisible: boolean;
  numberOfAttempt: number;
  timer: number;
  foundItemLabels: string[];
  onPress: () => void;
  onRequestClose: () => void;
}) => {
  const { t } = useTranslation("successModal");
  return (
    <ModalComponent
      modalHeader={
        <Text
          style={{
            fontSize: DesignSystem.fontSize.xl,
            fontFamily: DesignSystem.fontFamily.semiBold,
          }}
        >
          {t("congratulations")}
        </Text>
      }
      modalContent={
        <>
          <View style={styles.levelIndicator}>
            <Text style={styles.text}>{t("attempts")}</Text>
            <Text style={styles.text}>{numberOfAttempt}</Text>
          </View>
          <View style={styles.levelIndicator}>
            <Text style={styles.text}>{t("time")}</Text>
            <Text style={styles.text}>
              {formatTime(timer)} min{timer > 60 ? "s" : ""}
            </Text>
          </View>
          <Text style={[styles.text, { marginBottom: 10 }]}>
            {t("countries")}
          </Text>
          <View style={styles.countryList}>
            {foundItemLabels.map((item) => (
              <Text style={styles.countryName} key={item}>
                {item}
              </Text>
            ))}
          </View>
        </>
      }
      modalFooter={<Button title={t("nextLevel")} onPress={onPress} />}
      isVisible={isSuccessModalVisible}
      onRequestClose={onRequestClose}
    ></ModalComponent>
  );
};

const styles = StyleSheet.create({
  levelIndicator: {
    height: 50,
    width: "100%",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
  },
  countryList: {
    width: "100%",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  countryName: {
    fontSize: DesignSystem.fontSize.small,
    fontFamily: DesignSystem.fontFamily.regular,
  },
  text: {
    fontSize: DesignSystem.fontSize.large,
    fontFamily: DesignSystem.fontFamily.regular,
  },
});
