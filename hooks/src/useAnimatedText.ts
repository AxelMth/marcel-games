import { Animated } from 'react-native';
import _ from 'lodash';

export const useAnimatedText = (text: string, staggerDelay: number) => {
  const letters = text.split('');
  const animatedValues = letters.map(() => new Animated.Value(0));

  const animation = Animated.stagger(
    staggerDelay,
    _.shuffle(animatedValues).map((animatedValue) => {
      return Animated.timing(animatedValue, {
        toValue: 1,
        duration: Math.floor(Math.random() * 500),
        useNativeDriver: true,
      });
    })
  );

  return [animatedValues, animation] as const;
};
