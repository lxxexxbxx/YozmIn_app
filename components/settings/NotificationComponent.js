// filepath: /c:/Users/rkdwl/YozmIn_app/components/settings/NotificationSettings.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageTitleComponent from '../common/PageTitleComponent'; // PageTitleComponent import 확인

const NotificationSettings = () => {
  const navigation = useNavigation();

  // 알림 토글 상태 관리
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState({
    home: false,
    trend: false,
    board: false,
    news: false,
  });

  // 토글 상태 변경 함수
  const toggleSwitch = (section) => {
    setIsNotificationsEnabled(prevState => ({
      ...prevState,
      [section]: !prevState[section],
    }));
  };

  return (
    <View style={styles.container}>
      {/* 페이지 제목 컴포넌트 */}
      <PageTitleComponent title="알림 설정" />

      {/* 알림 항목들을 감싸는 선 추가 */}
      <View style={styles.settingsBox}>
        {/* 전체 알림 토글 */}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>전체</Text>
          <TouchableOpacity
            style={[styles.toggleContainer, isNotificationsEnabled.home && styles.toggleActive]}
            onPress={() => toggleSwitch('home')}
          >
            <View style={[styles.toggleCircle, isNotificationsEnabled.home && styles.toggleActiveCircle]} />
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        {/* 트렌드 알림 토글 */}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>트렌드</Text>
          <TouchableOpacity
            style={[styles.toggleContainer, isNotificationsEnabled.trend && styles.toggleActive]}
            onPress={() => toggleSwitch('trend')}
          >
            <View style={[styles.toggleCircle, isNotificationsEnabled.trend && styles.toggleActiveCircle]} />
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        {/* 게시판 알림 토글 */}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>게시판</Text>
          <TouchableOpacity
            style={[styles.toggleContainer, isNotificationsEnabled.board && styles.toggleActive]}
            onPress={() => toggleSwitch('board')}
          >
            <View style={[styles.toggleCircle, isNotificationsEnabled.board && styles.toggleActiveCircle]} />
          </TouchableOpacity>
        </View>

        <View style={styles.separator} />

        {/* 뉴스 알림 토글 */}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>뉴스</Text>
          <TouchableOpacity
            style={[styles.toggleContainer, isNotificationsEnabled.news && styles.toggleActive]}
            onPress={() => toggleSwitch('news')}
          >
            <View style={[styles.toggleCircle, isNotificationsEnabled.news && styles.toggleActiveCircle]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', padding:15 },
  headerText: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  settingsBox: {
    margin: 15,
    backgroundColor: 'white', // 흰색 배경
    borderRadius: 10, // 모서리 둥글게
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,  // 검정색 선 추가
    borderColor: 'black',  // 검정색 테두리 색
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6, // 항목 간 여백 조정
  },
  settingText: { fontSize: 16 },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8, // 항목들 간 간격을 자연스럽게 만들기 위해 여백 조정
  },
  toggleContainer: {
    width: 50,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  toggleActive: {
    backgroundColor: 'black'
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 15,
    backgroundColor: 'white',
    position: 'absolute',
    left: 4,
    top: 4,
    transition: 'left 0.3s ease',
  },
  toggleActiveCircle: {
    left: 24, // 활성화 시 원이 오른쪽으로 이동
  },
});

export default NotificationSettings;