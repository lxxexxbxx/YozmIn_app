import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import supabase from '../../supabase';
import ImageUploader from '../../Images/ImageUploader';
import { useUserStore } from "../../stores/UserStore";
import { pushQuest } from "../quest/Quests";
import { ThemeView, ThemeText } from '../common/ThemeComponents';
import { useTheme } from '../settings/theme/ThemeContext';

const { width } = Dimensions.get('window');

const BoardComponent = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const imageUploaderRef = useRef(null);

  const { user_id: currentUserId } = useUserStore();
  const { colors, isDark } = useTheme();

  /** 게시글 불러오기 **/
  const fetchPosts = useCallback(async () => {
    try {
      const { data: postData, error } = await supabase
        .from('post')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let likedPostIds = [];
      if (currentUserId) {
        const { data: likeData } = await supabase
          .from('post_like')
          .select('post_id')
          .eq('user_id', currentUserId);

        likedPostIds = likeData?.map((l) => l.post_id) || [];
      }

      const formatted = (postData || []).map(post => ({
        id: String(post.post_id),
        text: post.content,
        image: post.image_url ? { uri: post.image_url } : null,
        likes: post.like_cnt,
        comments: post.comment_cnt || 0,
        hasLiked: likedPostIds.includes(post.post_id),
        isMine: post.user_id === currentUserId,

        // ✅ 작성자 user_id 저장 (마이페이지 이동에 사용)
        authorId: post.user_id,
      }));

      setPosts(formatted);
    } catch (e) {
      console.error('❌ 게시글 가져오기 오류:', e);
    }
  }, [currentUserId]);

  useFocusEffect(useCallback(() => { fetchPosts(); }, [fetchPosts]));

  useEffect(() => {
    const channel = supabase
      .channel('realtime-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post' }, () => fetchPosts())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchPosts]);

  /** 이미지 업로드 **/
  const handleImageUploadSuccess = (url) => setUploadedImageUrl(url);
  const handleImageUploadStatusChange = (status) => setIsImageUploading(status);

  /** 게시글 업로드 **/
  const handleSend = async () => {
    if (isImageUploading) {
      Alert.alert('알림', '사진 업로드 중입니다.');
      return;
    }
    if (!message.trim() && !uploadedImageUrl) {
      Alert.alert('경고', '내용 또는 사진을 입력해주세요.');
      return;
    }

    try {
      const postData = {
        content: message,
        image_url: uploadedImageUrl,
        like_cnt: 0,
        comment_cnt: 0,
        user_id: currentUserId,
      };

      const { error } = await supabase.from('post').insert([postData]);
      if (error) throw error;

      await pushQuest(5, currentUserId);

      Alert.alert('성공', '게시글이 등록되었습니다.');
      setMessage('');
      setUploadedImageUrl(null);
      imageUploaderRef.current?.resetImage?.();
      fetchPosts();
    } catch (e) {
      console.error('❌ 게시글 업로드 오류:', e);
      Alert.alert('오류', '게시글 작성 중 문제가 발생했습니다.');
    }
  };

  /** 좋아요 **/
  const toggleLike = async (postId, hasLiked) => {
    try {
      if (hasLiked) {
        await supabase.rpc('unlike_post', { p_post_id: postId, p_user_id: currentUserId });
      } else {
        await supabase.rpc('like_post', { p_post_id: postId, p_user_id: currentUserId });
        await pushQuest(3, currentUserId);
      }
      fetchPosts();
    } catch (e) {
      console.error('❌ 좋아요 토글 오류:', e);
    }
  };

  /** 게시글 상세 **/
  const handlePress = (post) => {
    navigation.navigate('PostDetail', {
      postId: post.id,
      hasLiked: post.hasLiked,
      likeCount: post.likes,
    });
  };

  /** 프로필 클릭 → 마이페이지(읽기 전용 모드) **/
  const handlePressProfile = (post) => {
    if (!post.authorId) return;
    navigation.navigate('MyPage', {
      userId: post.authorId,
      readOnly: true,   // 📌 이걸로 마이페이지에서 버튼 숨김 모드
    });
  };

  /** 개별 게시글 UI **/
  const renderPost = ({ item }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      style={[styles.postContainer, item.isMine ? styles.myPost : styles.otherPost]}
    >
      {/* 프로필 영역 - 클릭 시 마이페이지로 이동 */}
      <TouchableOpacity onPress={() => handlePressProfile(item)}>
        <Image
          source={item.profileImage || require('../../assets/User.jpg')}
          style={styles.profileImage}
        />
      </TouchableOpacity>

      {/* 게시글 박스 (테마 적용됨) */}
      <ThemeView
        style={[
          styles.bubble,
          {
            backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
            borderColor: isDark ? "#333" : "#DDD",
          },
        ]}
      >
        {item.image && <Image source={item.image} style={styles.postImage} />}
        <ThemeText style={[styles.content, { color: colors.text }]}>
          {item.text}
        </ThemeText>

        {/* 하단 아이콘 */}
        <ThemeView style={styles.postFooter}>
          <TouchableOpacity onPress={() => toggleLike(item.id, item.hasLiked)}>
            <Ionicons
              name={item.hasLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.hasLiked ? 'red' : colors.subText}
            />
          </TouchableOpacity>

          <ThemeText style={[styles.footerText, { color: colors.subText }]}>
            {item.likes}
          </ThemeText>

          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={colors.subText}
            style={styles.iconSpacing}
          />

          <ThemeText style={[styles.footerText, { color: colors.subText }]}>
            {item.comments}
          </ThemeText>
        </ThemeView>
      </ThemeView>
    </TouchableOpacity>
  );

  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 공지문구 */}
      <ThemeText style={[styles.notice, { color: colors.text }]}>
        최신 트렌드를 사람들과 공유 해보세요!
      </ThemeText>

      {/* 게시글 목록 */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => String(item.id)}
        inverted
      />

      {/* 입력창 */}
      <ThemeView
        style={[
          styles.inputWrapper,
          { backgroundColor: colors.background, borderTopWidth: 0 },
        ]}
      >
        {/* 이미지 미리보기 */}
        {uploadedImageUrl && (
          <ThemeView
            style={[
              styles.largeImagePreviewContainer,
              { backgroundColor: colors.boxBackground },
            ]}
          >
            <Image source={{ uri: uploadedImageUrl }} style={styles.largeImagePreview} />

            {!isImageUploading && (
              <TouchableOpacity
                onPress={() => {
                  setUploadedImageUrl(null);
                  imageUploaderRef.current?.resetImage?.();
                }}
                style={styles.removeLargeImageButton}
              >
                <Ionicons name="close-circle" size={28} color="red" />
              </TouchableOpacity>
            )}
            {isImageUploading && <ActivityIndicator size="large" color="#007AFF" />}
          </ThemeView>
        )}

        {/* 입력 영역 */}
        <ThemeView
          style={[
            styles.commentInputContainer,
            {
              backgroundColor: colors.boxBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <ImageUploader
            ref={imageUploaderRef}
            onUploadSuccess={handleImageUploadSuccess}
            onUploadStart={handleImageUploadStatusChange}
            onUploadEnd={handleImageUploadStatusChange}
          />

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: isDark ? "#1E1E1E" : "#F0F0F0",
              },
            ]}
            placeholder="메시지를 입력하세요..."
            placeholderTextColor={colors.subText}
            value={message}
            onChangeText={setMessage}
            multiline
            maxHeight={100}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={isImageUploading || (!message.trim() && !uploadedImageUrl)}
            style={styles.sendButton}
          >
            <Ionicons
              name="send"
              size={28}
              color={
                (isImageUploading || (!message.trim() && !uploadedImageUrl))
                  ? '#666'
                  : '#4A90E2'
              }
            />
          </TouchableOpacity>
        </ThemeView>
      </ThemeView>
    </ThemeView>
  );
};

export default BoardComponent;

const styles = StyleSheet.create({
  container: { flex: 1 },
  notice: {
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 10,
    fontSize: 24,
    fontWeight: 'bold',
  },

  postContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 8,
    marginHorizontal: 10,
  },
  myPost: { justifyContent: 'flex-end' },
  otherPost: { justifyContent: 'flex-start' },

  profileImage: {
    width: 40, height: 40, borderRadius: 20, marginRight: 8,
  },

  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },

  content: { fontSize: 14 },

  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: { fontSize: 12, marginLeft: 5 },
  iconSpacing: { marginLeft: 15 },

  postImage: {
    width: '100%',
    height: 150,
    marginTop: 5,
    borderRadius: 10,
  },

  inputWrapper: {
    paddingBottom: 10,
  },

  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 25,
    marginHorizontal: 10,
    marginBottom: 5,
    borderWidth: 1,
  },

  input: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 16,
  },

  imageUploaderButton: { alignSelf: 'center' },
  sendButton: { alignSelf: 'center' },

  largeImagePreviewContainer: {
    alignSelf: 'center',
    width: width * 0.5,
    height: width * 0.5 * (3 / 4),
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  largeImagePreview: { width: '100%', height: '100%' },
  removeLargeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    padding: 2,
  },
});
