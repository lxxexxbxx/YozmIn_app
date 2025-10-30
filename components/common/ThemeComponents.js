import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../settings/theme/ThemeContext';

// 💡 ThemeView
export const ThemeView = ({ style, ...props }) => {
  const { colors } = useTheme();
  return (
    <View {...props} style={[{ backgroundColor: colors.background }, style]}/>
  );
};

// 💡 ThemeText
export const ThemeText = ({ style, ...props }) => {
  const { colors } = useTheme();
  return <Text {...props} style={[{ color: colors.text }, style]} />;
};

// 💡 ThemeScrollView
export const ThemeScrollView = ({ style, contentContainerStyle, ...props }) => {
  const { colors } = useTheme();
  return (
    <ScrollView {...props} style={[{ backgroundColor: colors.background }, style]}
      contentContainerStyle={contentContainerStyle}
    />
  );
};

// 💡 ThemeTouchableOpacity
export const ThemeTouchableOpacity = ({ style, ...props }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity {...props} style={[
        {
          backgroundColor: colors.boxBackground,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
        },
        style,
      ]}
    />
  );
};

// 💡 ThemeLoading (로딩 스피너도 테마에 맞춰 색상 자동 조정)
export const ThemeLoading = ({ style }) => {
  const { isDark } = useTheme();
  return (
    <ActivityIndicator
      size="large"
      color={isDark ? '#FFFFFF' : '#000000'}
      style={style}
    />
  );
};