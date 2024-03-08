import { Modal, StyleSheet, View } from "react-native";
import React, { ReactElement } from "react";

import { DesignSystem } from '@marcel-games/ui';

type Props = {
  modalHeader: ReactElement;
  modalContent: ReactElement;
  modalFooter: ReactElement;
  isVisible: boolean;
  onRequestClose: () => void;
  onDismiss?: () => void;
};

export const ModalComponent = ({
  modalHeader,
  modalContent,
  modalFooter,
  isVisible,
  onRequestClose,
  onDismiss,
}: Props) => {
  return (
    <Modal
      animationType="slide"
      visible={isVisible}
      transparent={true}
      onRequestClose={onRequestClose}
      onDismiss={onDismiss}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>{modalHeader}</View>
          <View style={styles.modalContent}>{modalContent}</View>
          <View style={styles.modalFooter}>{modalFooter}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    borderRadius: 20,
    backgroundColor: DesignSystem.backgroundColor,
    borderColor: DesignSystem.border.color,
    borderWidth: DesignSystem.border.width,
    width: "80%",
    height: 500,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#50555C",
    padding: 20,
  },
  modalHeader: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 4,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalFooter: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
