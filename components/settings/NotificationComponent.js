import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'; 
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageTitleComponent from '../common/PageTitleComponent';
import supabase from '../../supabase'; 
import { useUserStore } from "../../stores/UserStore"; 

const NotificationSettings = () => {
  const navigation = useNavigation();
  const { user_id: currentUserId } = useUserStore(); 

  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState({
    all: false,
    trend: false,
    board: false,
    news: false,
  });
  const [isLoading, setIsLoading] = useState(true); 

  // Supabase에서 저장된 설정 불러오기
  useEffect(() => {
    const loadSettingsFromSupabase = async () => {
      if (!currentUserId) {
        console.warn("알림 설정: 사용자 ID가 없어 설정을 불러올 수 없습니다.");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', currentUserId)
          .single(); 

        if (error && error.code !== 'PGRST116') { 
          throw error;
        }

        if (data) {
          
          setIsNotificationsEnabled({
            all: data.enabled_all,
            trend: data.enabled_trend,
            board: data.enabled_board,
            news: data.enabled_news,
          });
          console.log('알림 설정 불러오기 성공:', data);
        } else {
          
          console.log('저장된 알림 설정 없음. 기본값으로 초기화.');
          
          await saveSettingsToSupabase({
              all: false, trend: false, board: false, news: false
          });
        }
      } catch (e) {
        console.error('알림 설정 불러오기 실패:', e.message);
        Alert.alert('오류', `알림 설정을 불러오는 데 실패했습니다: ${e.message}`);
      } finally {
        setIsLoading(false); 
      }
    };

    loadSettingsFromSupabase();
  }, [currentUserId]); 

  // ⭐ 2. 알림 상태 변경 시 Supabase에 저장하기
  const saveSettingsToSupabase = async (settings) => {
    if (!currentUserId) {
      console.warn("알림 설정: 사용자 ID가 없어 설정을 저장할 수 없습니다.");
      return;
    }
    try {
      
      const { data, error } = await supabase
        .from('user_notification_settings')
        .upsert(
          {
            user_id: currentUserId,
            enabled_all: settings.all,
            enabled_trend: settings.trend,
            enabled_board: settings.board,
            enabled_news: settings.news,
            last_updated_at: new Date().toISOString(), 
          },
          { onConflict: 'user_id', ignoreDuplicates: false } 
        );

      if (error) {
        throw error;
      }
      console.log('알림 설정 저장 성공:', data);
    } catch (e) {
      console.error('알림 설정 저장 실패:', e.message);
      Alert.alert('오류', `알림 설정을 저장하는 데 실패했습니다: ${e.message}`);
    }
  };

  // 토글 상태 변경 함수 (전체 알림 동작 개선 포함)
  const toggleSwitch = (section) => {
    setIsNotificationsEnabled(prevState => {
      let updatedStates = { ...prevState };

      if (section === 'all') {
        const newState = !prevState.all;
        updatedStates = {
          all: newState,
          trend: newState,
          board: newState,
          news: newState,
        };
      } else {
        updatedStates[section] = !prevState[section];

        // 개별 토글 변경 시 'all' 상태 동기화
        if (!updatedStates.trend && !updatedStates.board && !updatedStates.news) {
          updatedStates.all = false;
        } else if (updatedStates.trend && updatedStates.board && updatedStates.news) {
          updatedStates.all = true;
        } else {
          updatedStates.all = false;
        }
      }
      
      saveSettingsToSupabase(updatedStates); 
      return updatedStates;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="black" />
        <Text style={{ marginTop: 10 }}>알림 설정을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageTitleComponent title="알림 설정" />

      <View style={styles.settingsBox}>
        {/* 전체 알림 토글 */}
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>전체</Text>
          <TouchableOpacity
            style={[styles.toggleContainer, isNotificationsEnabled.all && styles.toggleActive]}
            onPress={() => toggleSwitch('all')}
          >
            <View style={[styles.toggleCircle, isNotificationsEnabled.all && styles.toggleActiveCircle]} />
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
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  headerText: { fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  settingsBox: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'black',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingText: { fontSize: 16 },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
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
  },
  toggleActiveCircle: {
    left: 24,
  },
});

export default NotificationSettings;