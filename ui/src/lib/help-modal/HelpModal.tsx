import React, { useState } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";

import { useStorageForKey } from "@marcel-games/hooks";
import { DesignSystem } from "@marcel-games/ui";

import { ModalComponent } from "../modal/Modal"
import { Button } from "../button/Button";


interface HelpModalComponentProps {
  isVisible: boolean;
  onRequestClose: () => void;
}

export const HelpModalComponent: React.FC<HelpModalComponentProps> = ({
  isVisible,
  onRequestClose,
}) => {
  const { t } = useTranslation("helpModal");
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  const [hasSeenHelpModal, setHasSeenHelpModal] = useStorageForKey(
    "hasSeenHelpModal",
    false,
  );

  const isFirstTime = !hasSeenHelpModal;
  if (isFirstTime && !isHelpModalVisible) {
    setIsHelpModalVisible(true);
  }

  function onClose(): void {
    setHasSeenHelpModal(true);
    setIsHelpModalVisible(false);
  }

  return (
    <ModalComponent
      isVisible={isVisible || isHelpModalVisible}
      modalHeader={
        <Text
          style={{
            fontSize: DesignSystem.fontSize.xl,
            fontFamily: DesignSystem.fontFamily.semiBold,
          }}
        >
          {isFirstTime ? t("welcomeTitle") : t("helpTitle")}
        </Text>
      }
      modalContent={
        <Text
          style={{
            fontSize: DesignSystem.fontSize.medium,
            fontFamily: DesignSystem.fontFamily.regular,
          }}
        >
          {t("content")}
        </Text>
      }
      modalFooter={
        <Button
          title={t("button")}
          onPress={() => {
            onClose();
            onRequestClose();
          }}
        />
      }
      onRequestClose={() => {
        onClose();
        onRequestClose();
      }}
    />
  );
};
