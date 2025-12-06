// components/bookmark/BookmarkDetailComponent.js
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import supabase from '../../supabase';
import { useUserStore } from '../../stores/UserStore';
import PageTitleComponent from '../common/PageTitleComponent';          // 🔹 추가
import { ThemeView } from "../common/ThemeComponents";                 // 🔹 추가
import { useTheme } from "../settings/theme/ThemeContext";             // 🔹 추가

const BookmarkDetailComponent = ({ route, navigation }) => {
  const { folderNo: _folderNo, folderName: _folderName } = route.params || {};
  const { user_id: currentUserId } = useUserStore();
  const { colors } = useTheme(); // 🔹 추가

  const [folderNo, setFolderNo] = useState(_folderNo || null);
  const [folderName, setFolderName] = useState(_folderName || '북마크');

  const [items, setItems] = useState([]); // [{post_id, image_url, content, like_cnt, ...}]
  const [loading, setLoading] = useState(false);

  // 1) 폴더 번호가 없으면 이름으로 b_no 찾아오기 (폴백)
  const ensureFolderNo = useCallback(async () => {
    if (folderNo || !currentUserId || !_folderName == null) return;
    const { data, error } = await supabase
      .from('bookmark')
      .select('b_no, b_folder_name')
      .eq('user_id', currentUserId)
      .eq('b_folder_name', _folderName)
      .maybeSingle();
    if (error) {
      console.warn('폴더 번호 조회 실패:', error.message);
      return;
    }
    if (data?.b_no) {
      setFolderNo(data.b_no);
      setFolderName(data.b_folder_name || _folderName);
    }
  }, [folderNo, currentUserId, _folderName]);

  // 2) 폴더 내 북마크(post) 로드
  const fetchFolderPosts = useCallback(async () => {
    if (!currentUserId || !folderNo) return;
    setLoading(true);

    // (1) 매핑에서 post_id 목록
    const { data: mapRows, error: mapErr } = await supabase
      .from('bookmark_post')
      .select('post_id')
      .eq('user_id', currentUserId)
      .eq('folder_no', folderNo)
      .order('created_at', { ascending: false });

    if (mapErr) {
      console.error('bookmark_post 로딩 실패:', mapErr.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const postIds = (mapRows || []).map((r) => r.post_id);
    if (postIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    // (2) post 테이블에서 상세
    const { data: posts, error: postErr } = await supabase
      .from('post')
      .select(
        'post_id, image_url, content, like_cnt, comment_cnt, view_count, created_at, user_id',
      )
      .in('post_id', postIds);

    if (postErr) {
      console.error('post 로딩 실패:', postErr.message);
      setItems([]);
      setLoading(false);
      return;
    }

    // 매핑 순서대로 정렬
    const orderMap = new Map();
    postIds.forEach((id, idx) => orderMap.set(id, idx));
    const sorted = (posts || []).sort((a, b) => {
      return (orderMap.get(a.post_id) ?? 0) - (orderMap.get(b.post_id) ?? 0);
    });

    setItems(sorted);
    setLoading(false);
  }, [currentUserId, folderNo]);

  // 3) 삭제 (이 폴더에서만 제거)
  const removeFromFolder = async (postId) => {
    if (!currentUserId || !folderNo) return;
    try {
      const { error } = await supabase
        .from('bookmark_post')
        .delete()
        .eq('user_id', currentUserId)
        .eq('folder_no', folderNo)
        .eq('post_id', postId);
      if (error) throw error;
      setItems((prev) => prev.filter((p) => p.post_id !== postId));
    } catch (e) {
      console.error('북마크 제거 실패:', e);
      Alert.alert('오류', `폴더에서 제거 실패: ${e.message}`);
    }
  };

  // 포커스시 로드
  useFocusEffect(
    useCallback(() => {
      (async () => {
        await ensureFolderNo();
        // ensureFolderNo에서 setFolderNo가 비동기라, 다음 틱에서 fetch
        setTimeout(fetchFolderPosts, 0);
      })();
    }, [ensureFolderNo, fetchFolderPosts]),
  );

  // 실시간 반영 (선택)
  useEffect(() => {
    if (!currentUserId) return;
    const ch = supabase
      .channel('realtime-bookmark-post')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmark_post' },
        (payload) => {
          const row = payload.new || payload.old;
          if (row?.user_id === currentUserId && row?.folder_no === folderNo) {
            fetchFolderPosts();
          }
        },
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [currentUserId, folderNo, fetchFolderPosts]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={() => navigation.navigate('PostDetail', { postId: item.post_id })}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={{ color: '#777' }}>이미지 없음</Text>
          </View>
        )}
        <Text numberOfLines={2} style={styles.caption}>
          {item.content || '내용 없음'}
        </Text>
      </TouchableOpacity>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <FontAwesome name="heart" size={14} color="#e11d48" />
          <Text style={styles.metaText}>{item.like_cnt || 0}</Text>
        </View>
        <View style={styles.metaItem}>
          <FontAwesome name="comments" size={14} color="#6b7280" />
          <Text style={styles.metaText}>{item.comment_cnt || 0}</Text>
        </View>
        <View style={styles.metaItem}>
          <FontAwesome name="eye" size={14} color="#6b7280" />
          <Text style={styles.metaText}>{item.view_count || 0}</Text>
        </View>

        {/* 폴더에서 제거 */}
        <TouchableOpacity onPress={() => removeFromFolder(item.post_id)} style={styles.removeBtn}>
          <FontAwesome name="trash" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ThemeView
      style={[
        styles.container,
        { backgroundColor: colors.background }, // 🔹 테마 배경
      ]}
    >
      {/* 🔹 옷장 페이지처럼 공통 상단바 사용 */}
      <PageTitleComponent title={folderName || '북마크'} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>이 폴더에 저장된 게시글이 없어요.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.post_id)}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </ThemeView>
  );
};

const GAP = 14;
const CARD_W = 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  // 예전 상단 헤더 스타일 (현재는 PageTitleComponent 사용하므로 미사용)
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  headerBackBtn: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  headerRightSpacer: {
    width: 30,
  },

  // ───── 리스트 / 카드 ─────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: GAP,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },

  card: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  thumb: {
    width: '100%',
    height: 110,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    marginTop: 8,
    fontSize: 13,
    color: '#111827',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#4B5563',
  },
  removeBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
});

export default BookmarkDetailComponent;
