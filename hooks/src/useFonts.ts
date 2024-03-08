import { useFonts } from 'expo-font';

export const useAppFonts = () => {
  return useFonts({
    Kuzfam: require('../fonts/Kuzfam.ttf'),
    KuzfamBlack: require('../fonts/KuzfamBlack.ttf'),
    KuzfamBold: require('../fonts/KuzfamBold.ttf'),
    KuzfamBoldItalic: require('../fonts/KuzfamBoldItalic.ttf'),
    KuzfamExtraBold: require('../fonts/KuzfamExtraBold.ttf'),
    KuzfamExtraBoldItalic: require('../fonts/KuzfamExtraBoldItalic.ttf'),
    KuzfamItalic: require('../fonts/KuzfamItalic.ttf'),
    KuzfamMedium: require('../fonts/KuzfamMedium.ttf'),
    KuzfamSemiBold: require('../fonts/KuzfamSemiBold.ttf'),
    KuzfamSemiBoldItalic: require('../fonts/KuzfamSemiBoldItalic.ttf'),
    KuzfamMediumItalic: require('../fonts/KuzfamMediumItalic.ttf'),
  });
};
