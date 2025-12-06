import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PageTitleComponent from '../common/PageTitleComponent';
import { ThemeView, ThemeText } from '../common/ThemeComponents';
import { useTheme } from '../settings/theme/ThemeContext';

const SettingsScreen = () => {
  const navigation = useNavigation();

  return (
    <ThemeView style={styles.container}>
      {/* 헤더 */}
      <PageTitleComponent title={"설정"} />

      {/* 설정 목록을 감싸는 박스 */}
      <ThemeView style={styles.settingsBox}>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('GeneralSettings')}>
          <ThemeText style={styles.settingText}>일반</ThemeText>
        </TouchableOpacity>
        <ThemeView style={styles.separator} />
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Notification')}>
          <ThemeText style={styles.settingText}>알림</ThemeText>
        </TouchableOpacity>
      </ThemeView>
    </ThemeView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  settingsBox: {
    backgroundColor: 'white',
    borderRadius: 10, 
    marginHorizontal: 15,
    paddingVertical: 5,
    shadowColor: '#000', 
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // 안드로이드 그림자 효과
    borderWidth: 1,  // 검정색 선 추가
    borderColor: 'black',  
  },
  settingItem: {
    padding: 15,
  },
  settingText: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd', // 연한 회색 구분선
    marginHorizontal: 15,
  },
});

export default SettingsScreen;