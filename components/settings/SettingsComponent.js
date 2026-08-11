import React from 'react';
import {TouchableOpacity, StyleSheet, Text, Alert} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PageTitleComponent from '../common/PageTitleComponent';
import { ThemeView, ThemeText } from '../common/ThemeComponents';
import { useTheme } from '../settings/theme/ThemeContext';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const logout = () => {
    Alert.alert(
        "로그아웃", // Title of the alert
        "로그아웃 하시겠습니까?", // Message of the alert
        [
          {
            text: "취소",
            onPress: () => {},
            style: 'cancel', // 'cancel' style typically positions the button on the left (iOS) or as a negative action (Android)
          },
          {
            text: "로그아웃",
            onPress: () => navigation.navigate("Login"),
            style: 'destructive', // 'destructive' style typically highlights the button in red (iOS) or as a primary destructive action (Android)
          },
        ],
        { cancelable: false } // Prevents dismissal by tapping outside the alert
    );
  }

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
        <ThemeView style={styles.separator} />
        <TouchableOpacity style={styles.settingItem} onPress={() => logout()}>
          <Text style={{color: "red", textColor: "red"}}>로그아웃</Text>
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