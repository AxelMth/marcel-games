import React, { useState } from "react";
import { Text } from "react-native";
import { useTranslation } from "react-i18next";

// Components
import { ModalComponent } from "../modal/Modal";
import { Button } from "../button/Button";
import { HintItem } from "../hint-item/HintItem";

// Hooks
import { AdType, useAd, useStorageForKey } from "@marcel-games/hooks";

// DS
import { DesignSystem } from '@marcel-games/ui';

interface HintModalProps {
  isVisible: boolean;
  level: number;
  onRequestClose: () => void;
  callbacks: (() => void)[];
  missingItemLabels: string[];
}

export const HintModal: React.FC<HintModalProps> = ({
  isVisible,
  level,
  missingItemLabels,
  callbacks,
  onRequestClose,
}) => {
  const { t } = useTranslation("hintModal");

  const [boughtHintIndex, setBoughtHintIndex] = useStorageForKey(
    "Level" + level + "BoughtHint" + missingItemLabels[0],
    0,
  );
  const [nextHintIndex, setNextHintIndex] = useStorageForKey(
    "Level" + level + "Hint" + missingItemLabels[0],
    boughtHintIndex + 1,
  );
  const [currentAdHintIndex, setCurrentAdHintIndex] = useState<number | null>(
    null,
  );

  const nextCountryName = missingItemLabels[0]

  const hints = [
    {
      lockText: t("hint1"),
      hintText: nextCountryName[0] ?? "",
      disabledWhenShown: true,
    },
    {
      lockText: t("hint2"),
      hintText: t("hint2Revealed"),
      showHint: callbacks[1],
      disabledWhenShown: false,
    },
    {
      lockText: t("hint3"),
      hintText: nextCountryName ?? "",
      disabledWhenShown: true,
    },
  ];

  const showMapHint = (hintIndex: number) => {
    hints[hintIndex - 1]?.showHint?.();
  };

  const goToNextHint = (hintIndex: number) => {
    if (boughtHintIndex <= hintIndex) {
      setBoughtHintIndex(hintIndex);
    }

    if (nextHintIndex <= hintIndex + 1) {
      setNextHintIndex(hintIndex + 1);
    }
  };

  const hasBoughtHint = (hintIndex: number) => {
    return boughtHintIndex >= hintIndex;
  };

  const { showAd } = useAd(AdType.REWARDED);

  const showRewardedAd = (hintIndex: number) => {
    if (!hasBoughtHint(hintIndex)) {
      showAd();
    } else {
      showMapHint(hintIndex);
    }

    setCurrentAdHintIndex(hintIndex);
  };

  return (
    <ModalComponent
      isVisible={isVisible}
      modalHeader={
        <Text
          style={{
            fontSize: DesignSystem.fontSize.xl,
            fontFamily: DesignSystem.fontFamily.semiBold,
          }}
        >
          {t("header")}
        </Text>
      }
      modalContent={
        <>
          <Text
            style={{ fontSize: DesignSystem.fontSize.medium, marginBottom: 20 }}
          >
            {t("content")}
          </Text>
          {hints.map(({ lockText, hintText, disabledWhenShown }, index) => {
            const hintIndex = index + 1;
            return (
              <HintItem
                key={hintIndex}
                text={boughtHintIndex >= hintIndex ? hintText : lockText}
                onPress={() => showRewardedAd(hintIndex)}
                isLocked={nextHintIndex < hintIndex && hintIndex >= 2}
                isShown={boughtHintIndex >= hintIndex}
              />
            );
          })}
        </>
      }
      modalFooter={<Button title={t("button")} onPress={onRequestClose} />}
      onRequestClose={onRequestClose}
    />
  );
};
