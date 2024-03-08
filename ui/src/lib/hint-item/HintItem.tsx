import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DesignSystem } from '@marcel-games/ui';

interface HintItemProps {
  text: string;
  onPress: () => void;
  isLocked: boolean;
  isShown: boolean;
}

export const HintItem: React.FC<HintItemProps> = ({
  text,
  onPress,
  isLocked,
  isShown,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isLocked && !isShown) {
      const interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.03,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, 2000);

      return () => clearInterval(interval);
    }
    return () => {};
  }, [isLocked, isShown]);

  const isRevealed = !isLocked && isShown;
  function getIcon() {
    if (isRevealed) {
      return 'check';
    }
    if (isLocked) {
      return 'lock';
    }
    return 'play';
  }
  return (
    <TouchableOpacity
      style={[
        styles.hintItem,
        isLocked && styles.locked,
        { transform: [{ scale }] },
      ]}
      onPress={onPress}
      disabled={isLocked || isShown}
    >
      <View style={[styles.icon, isRevealed && { backgroundColor: 'green' }]}>
        <MaterialCommunityIcons
          style={[
            { alignSelf: 'center', marginTop: 5 },
            isLocked && !isShown && { opacity: 0.5 },
          ]}
          name={getIcon()}
          size={20}
          color={'white'}
        />
      </View>
      <Text style={styles.text}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  hintItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: DesignSystem.border.width,
    borderColor: DesignSystem.border.color,
    borderRadius: 50,
    width: '100%',
    marginBottom: 20,
  },
  text: {
    fontSize: DesignSystem.fontSize.medium,
    marginLeft: 10,
  },
  icon: {
    width: 30,
    height: 30,
    backgroundColor: 'black',
    borderRadius: 50,
  },
  locked: {
    backgroundColor: '#D3D3D3',
  },
});
