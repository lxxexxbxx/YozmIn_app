// components/common/ThemeComponents.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../settings/theme/ThemeContext';

// 공통 규칙:
// - style 병합 순서를 [style, themedDefaults]로 두면
//   컴포넌트 외부에서 명시한 backgroundColor 등으로 "의도적 override"가 가능해집니다.
//   컨테이너에서 테마색을 강제하고 싶다면, 외부 style에 backgroundColor를 주지 않으면 됩니다.

export const ThemeView = ({ style, ...props }) => {
  const { colors } = useTheme();
  return <View {...props} style={[style, { backgroundColor: colors.background }]} />;
};

export const ThemeText = ({ style, ...props }) => {
  const { colors } = useTheme();
  return <Text {...props} style={[style, { color: colors.text }]} />;
};

export const ThemeScrollView = ({ style, contentContainerStyle, ...props }) => {
  const { colors } = useTheme();
  return (
    <ScrollView
      {...props}
      style={[style, { backgroundColor: colors.background }]}
      contentContainerStyle={contentContainerStyle}
    />
  );
};

export const ThemeTouchableOpacity = ({ style, ...props }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      {...props}
      style={[
        style,
        {
          backgroundColor: colors.boxBackground,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
        },
      ]}
    />
  );
};

export const ThemeLoading = ({ style }) => {
  const { isDark } = useTheme();
  return <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} style={style} />;
};
