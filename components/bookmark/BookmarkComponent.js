// components/Bookmark/BookmarkComponent.js
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import PageTitleComponent from '../common/PageTitleComponent'; // ← 기존 import 그대로 둠
import supabase from '../../supabase';
import ImageUploader from '../../Images/ImageUploader';
import { useUserStore } from '../../stores/UserStore';

const BookmarkComponent = () => {
  const navigation = useNavigation();
  const { user_id: currentUserId } = useUserStore();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const imageUploaderRef = useRef(null);

  const fetchBookmarks = useCallback(async () => {
    if (!currentUserId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('bookmark') // 테이블명
      .select('b_no, user_id, b_folder_name, b_folder_img, post_id')
      .eq('user_id', currentUserId)
      .order('b_no', { ascending: false });

    if (error) {
      console.error('bookmark 불러오기 오류:', error.message);
      setItems([]);
    } else {
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, [currentUserId]);

  useFocusEffect(
    useCallback(() => {
      fetchBookmarks();
    }, [fetchBookmarks]),
  );

  useEffect(() => {
    // 실시간 반영 (옵션)
    const ch = supabase
      .channel('realtime-bookmark')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmark' },
        () => fetchBookmarks(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchBookmarks]);

  // ImageUploader 콜백
  const onUploadSuccess = (url) => setUploadedImageUrl(url);
  const onUploadStart = () => setIsImageUploading(true);
  const onUploadEnd = () => setIsImageUploading(false);

  const resetModalState = () => {
    setCategoryName('');
    setUploadedImageUrl(null);
    if (imageUploaderRef.current && imageUploaderRef.current.resetImage) {
      imageUploaderRef.current.resetImage();
    }
  };

  const handleCreate = async () => {
    if (!currentUserId) {
      Alert.alert('오류', '로그인 후 이용해주세요.');
      return;
    }
    if (isImageUploading) {
      Alert.alert('안내', '이미지 업로드 중입니다. 잠시만 기다려 주세요.');
      return;
    }
    if (!categoryName.trim() && !uploadedImageUrl) {
      Alert.alert('안내', '카테고리명 또는 이미지를 입력해주세요.');
      return;
    }

    const insertRow = {
      user_id: currentUserId,
      b_folder_name: categoryName.trim() || null,
      b_folder_img: uploadedImageUrl || null, // ← Storage URL 저장
      post_id: null,
    };

    const { error } = await supabase.from('bookmark').insert([insertRow]);
    if (error) {
      console.error('bookmark 생성 실패:', error.message);
      Alert.alert('오류', `생성 실패: ${error.message}`);
      return;
    }

    setModalVisible(false);
    resetModalState();
    fetchBookmarks();
  };

  // ✅ 폴더 삭제 함수 (길게 눌렀을 때 호출)
  const handleDelete = useCallback(
    (item) => {
      Alert.alert(
        '삭제',
        '이 카테고리를 삭제하시겠어요?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('bookmark')
                  .delete()
                  .eq('b_no', item.b_no)
                  .eq('user_id', currentUserId);

                if (error) {
                  console.error('bookmark 삭제 실패:', error.message);
                  Alert.alert('오류', '삭제에 실패했습니다.');
                  return;
                }

                // 로컬 목록에서도 바로 제거
                setItems((prev) => prev.filter((it) => it.b_no !== item.b_no));
              } catch (e) {
                console.error('bookmark 삭제 예외:', e);
                Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
              }
            },
          },
        ],
        { cancelable: true },
      );
    },
    [currentUserId],
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() =>
        navigation.navigate('BookmarkDetail', {
          folderNo: item.b_no,
          folderName: item.b_folder_name || '북마크',
        })
      }
      onLongPress={() => handleDelete(item)} // ✅ 길게 누르면 삭제
      delayLongPress={500} // (선택) 0.5초 이상 눌러야 인식
    >
      {item.b_folder_img ? (
        <Image source={{ uri: item.b_folder_img }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>이미지 없음</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={1}>
        {item.b_folder_name || '이름 없음'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 🔹 상단 헤더: 뒤로가기 + 로고 + 북마크 */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              // 보통: 마이페이지에서 북마크로 왔으니까 한 칸 뒤로 가면 다시 마이페이지
              navigation.goBack();
            } else {
              // 혹시 직접 북마크만 띄운 경우엔 탭 네비게이터로 보내기
              navigation.navigate('TabNavigator');
              // TabNavigator 안에서 마지막에 보던 탭(대부분 마이페이지)이 그대로 떠 있음
            }
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#111" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image
            source={require('../../assets/main_logo.jpeg')}
            style={styles.headerLogo}
          />
          <Text style={styles.headerTitleText}>북마크</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.b_no)}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>아직 만든 북마크가 없어요.</Text>
              <Text style={styles.emptySubText}>오른쪽 아래 + 버튼으로 새 폴더를 만들어보세요.</Text>
            </View>
          }
        />
      )}

      {/* 플로팅 + 버튼 */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Entypo name="plus" size={30} color="white" />
      </TouchableOpacity>

      {/* 생성 모달 */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          resetModalState();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setModalVisible(false);
                resetModalState();
              }}
            >
              <Entypo name="cross" size={24} color="black" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>새 카테고리 만들기</Text>

            {/* 이미지 업로드 */}
            <View style={styles.imageUpload}>
              {uploadedImageUrl ? (
                <Image source={{ uri: uploadedImageUrl }} style={styles.uploadedImage} />
              ) : (
                <Text style={styles.uploadText}>이미지 업로드</Text>
              )}

              <View style={{ marginTop: 10 }}>
                <ImageUploader
                  ref={imageUploaderRef}
                  onUploadSuccess={onUploadSuccess}
                  onUploadStart={onUploadStart}
                  onUploadEnd={onUploadEnd}
                />
              </View>

              {isImageUploading && <ActivityIndicator style={{ position: 'absolute' }} />}
            </View>

            {/* 카테고리명 */}
            <Text style={styles.label}>카테고리명</Text>
            <TextInput
              style={styles.input}
              placeholder="카테고리명 입력"
              value={categoryName}
              onChangeText={setCategoryName}
            />

            <TouchableOpacity
              style={[styles.addButtonModal, isImageUploading && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={isImageUploading}
            >
              <Entypo name="plus" size={26} color="white" />
              <Text style={styles.addButtonModalText}>추가하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const BOX = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7FB',
  },

  // ───── 헤더 스타일 (옷장/상점과 통일) ─────
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
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  headerRightSpacer: {
    width: 30,
  },

  // ───── 리스트/카드 ─────
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  itemContainer: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  image: {
    width: BOX,
    height: BOX,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    color: '#111827',
  },

  emptyBox: {
    marginTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // ───── 플로팅 버튼 ─────
  addButton: {
    position: 'absolute',
    bottom: 90, // ← 기존보다 위로 올림 (탭바 위에 떠 있게)
    right: 20,
    backgroundColor: '#2F80ED',
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  // ───── 모달 ─────
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    minHeight: '60%',
  },
  closeButton: { position: 'absolute', top: 12, right: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },

  imageUpload: {
    width: BOX * 1.6,
    height: BOX * 1.6,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 18,
    overflow: 'hidden',
  },
  uploadText: { fontSize: 16, color: '#2563EB' },
  uploadedImage: { width: '100%', height: '100%' },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#9CA3AF',
    marginBottom: 24,
  },

  addButtonModal: {
    marginTop: 4,
    backgroundColor: '#2F80ED',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonModalText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BookmarkComponent;
