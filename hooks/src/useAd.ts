import { useEffect } from 'react';
import { Platform } from 'react-native';
import {
  TestIds,
  useRewardedAd,
  useRewardedInterstitialAd,
} from 'react-native-google-mobile-ads';
import { showMessage } from 'react-native-flash-message';

import { DesignSystem } from '@marcel-games/ui';

import { Sentry } from '@marcel-games/errors';
import { useTranslation } from 'react-i18next';

const IOS_REWARDED_AD_UNIT_ID = 'ca-app-pub-6271901101573718/5313054703';
const ANDROID_REWARDED_AD_UNIT_ID = 'ca-app-pub-6271901101573718/1913452475';

const REWARDED_AD_UNIT_ID = () => {
  if (__DEV__) {
    return TestIds.REWARDED;
  }
  if (Platform.OS === 'android') return ANDROID_REWARDED_AD_UNIT_ID;
  return IOS_REWARDED_AD_UNIT_ID;
};

const IOS_REWARDED_INTERSTITIAL_AD_UNIT_ID =
  'ca-app-pub-6271901101573718/1798149826';
const ANDROID_REWARDED_INTERSTITIAL_AD_UNIT_ID =
  'ca-app-pub-6271901101573718/4424313161';

const REWARDED_INTERSTITIAL_AD_UNIT_ID = () => {
  if (__DEV__) {
    return TestIds.REWARDED_INTERSTITIAL;
  }
  if (Platform.OS === 'android')
    return ANDROID_REWARDED_INTERSTITIAL_AD_UNIT_ID;
  return IOS_REWARDED_INTERSTITIAL_AD_UNIT_ID;
};

export enum AdType {
  REWARDED_INTERSTITIAL,
  REWARDED,
}

export const useAd = (
  adType: AdType
): { showAd: () => void; isClosed: boolean } => {
  const { t } = useTranslation('ad');
  const { isLoaded, load, show, error, isClosed } =
    adType === AdType.REWARDED
      ? useRewardedAd(REWARDED_AD_UNIT_ID(), {
          keywords: ['games', 'apps', 'geography', 'puzzles', 'enigmas'],
        })
      : useRewardedInterstitialAd(REWARDED_INTERSTITIAL_AD_UNIT_ID(), {
          keywords: ['games', 'apps', 'geography', 'puzzles', 'enigmas'],
        });

  useEffect((): void => {
    load();
  }, [load]);
  useEffect(() => {
    if (isClosed) {
      load();
    }
  }, [isClosed]);

  useEffect((): void => {
    if (!error) {
      return;
    }
    Sentry.captureMessage(error.message, {
      level: 'error',
    });

    showMessage({
      message: t('adErrorMessage'),
      duration: 1500,
      backgroundColor: DesignSystem.colors.secondary,
    });
  }, [error]);

  const showAd = () => {
    if (!isLoaded) {
      showMessage({
        message: t('adNotReady'),
        duration: 1500,
        backgroundColor: DesignSystem.colors.secondary,
      });
      return;
    }

    show();
  };

  return { showAd, isClosed };
};
