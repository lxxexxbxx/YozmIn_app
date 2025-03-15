import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PageTitleComponent from '../common/PageTitleComponent';

const SettingsScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <PageTitleComponent title={"설정"} backToTab={"MyPage"} />

      {/* 설정 목록을 감싸는 박스 */}
      <View style={styles.settingsBox}>
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('GeneralSettings')}>
          <Text style={styles.settingText}>일반</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Notification')}>
          <Text style={styles.settingText}>알림</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    borderWidth: 1,  // 검정색 선 추가
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