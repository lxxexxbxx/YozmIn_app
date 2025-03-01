import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appearance } from 'react-native'; // Appearance API 사용
import { useNavigation } from '@react-navigation/native';

const GeneralSettings = () => {
  const navigation = useNavigation();
  const [theme, setTheme] = useState(Appearance.getColorScheme()); // 기기 테마 상태 관리

  useEffect(() => {
    // 기기 테마 변경 시 상태 업데이트
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme); // 'dark' 또는 'light' 테마
    });

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="black" />
        <Text style={styles.headerText}>일반</Text>
      </TouchableOpacity>

      <View style={styles.mainBox}>
        {/* 화면 테마 항목 */}
        <View style={styles.settingsBox}>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>화면 테마</Text>
            <Text style={styles.themeText}>기기 테마 사용</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  mainBox: {
    marginTop: 20,
    marginHorizontal: 15,
  },
  settingsBox: {
    backgroundColor: 'white',
    borderRadius: 10, // 모서리 둥글게
    marginBottom: 10,
    shadowColor: '#000', // 그림자 효과 추가
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3, // 안드로이드 그림자 효과
    borderWidth: 1,  // 검정색 선 추가
    borderColor: 'black',  // 검정색 테두리 색
  },
  settingItem: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
  },
  themeText: {
    fontSize: 14,
    color: '#888', // 다크모드/라이트모드 텍스트 색
  },
});

export default GeneralSettings;
