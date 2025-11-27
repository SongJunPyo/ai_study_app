import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  TouchableOpacityProps,
} from 'react-native';

interface TouchableScaleProps extends TouchableOpacityProps {
  children: React.ReactNode;
  scaleValue?: number; // Default 0.98
}

export default function TouchableScale({
  children,
  scaleValue = 0.98,
  onPressIn,
  onPressOut,
  ...props
}: TouchableScaleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

    if (onPressIn) {
      onPressIn(e);
    }
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();

    if (onPressOut) {
      onPressOut(e);
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
