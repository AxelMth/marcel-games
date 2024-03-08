import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import { DesignSystem } from '@marcel-games/ui';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

export const Button: React.FC<ButtonProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: DesignSystem.colors.primary,
    height: 35,
    width: 160,
    borderRadius: DesignSystem.border.radius,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
});
