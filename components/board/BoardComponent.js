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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import supabase from '../../supabase';
import ImageUploader from '../../Images/ImageUploader';
import { useUserStore } from "../../stores/UserStore";
import { pushQuest } from "../quest/Quests";
import { ThemeView, ThemeText } from '../common/ThemeComponents';
import { useTheme } from '../settings/theme/ThemeContext';
import dayjs from './day';

function formatKST(dateString) {
  if (!dateString) return "방금 전";
  const d = dayjs.utc(dateString);
  if (!d.isValid()) return "방금 전";
  return d.tz("Asia/Seoul").fromNow();
}

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

  /** 게시글 불러오기 (프로필/이름 포함) **/
  const fetchPosts = useCallback(async () => {
    try {
      const { data: postData, error } = await supabase
        .from('post')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // ✅ 내가 좋아요한 게시글
      let likedPostIds = [];
      if (currentUserId) {
        const { data: likeData } = await supabase
          .from('post_like')
          .select('post_id')
          .eq('user_id', currentUserId);

        likedPostIds = likeData?.map((l) => l.post_id) || [];
      }

      // ✅ 작성자 user_id 모으기
      const authorIds = Array.from(
        new Set((postData || []).map((p) => p.user_id).filter(Boolean))
      );

      // ✅ 작성자들의 마이페이지 프로필 / 캐릭터 이름 / 유저 이름 가져오기
      let profileMap = {};
      if (authorIds.length > 0) {
        const { data: mpRows, error: mpError } = await supabase
          .from('mypage')
          .select('user_id, mp_Name, profileimg, user(name)')
          .in('user_id', authorIds);

        if (mpError) {
          console.error('❌ 마이페이지 프로필 조회 오류:', mpError);
        } else if (mpRows) {
          profileMap = mpRows.reduce((acc, row) => {
            acc[row.user_id] = {
              profileImgUrl:
                row.profileimg && row.profileimg !== 'EMPTY' ? row.profileimg : null,
              characterName: row.mp_Name || '',
              userName: row.user?.name || '',
            };
            return acc;
          }, {});
        }
      }

      // ✅ 게시글 포맷팅
      const formatted = (postData || []).map(post => {
        const profile = profileMap[post.user_id] || {};
        return {
          id: String(post.post_id),
          text: post.content,
          image: post.image_url ? { uri: post.image_url } : null,
          likes: post.like_cnt,
          comments: post.comment_cnt || 0,
          hasLiked: likedPostIds.includes(post.post_id),
          isMine: post.user_id === currentUserId,
          created_at: post.created_at,

          authorId: post.user_id, // 마이페이지 / 프로필 이동용

          profileImage: profile.profileImgUrl ? { uri: profile.profileImgUrl } : null,
          userName: profile.userName || null,
          characterName: profile.characterName || null, // 프로필 화면에서 쓸 수 있게 유지
        };
      });

      setPosts(formatted);
    } catch (e) {
      console.error('❌ 게시글 가져오기 오류:', e);
    }
  }, [currentUserId]);

  useFocusEffect(useCallback(() => { fetchPosts(); }, [fetchPosts]));

  useEffect(() => {
    const channel = supabase
      .channel('realtime-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'post' },
        () => fetchPosts()
      )
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
        await supabase.rpc('unlike_post', {
          p_post_id: postId,
          p_user_id: currentUserId,
        });
      } else {
        await supabase.rpc('like_post', {
          p_post_id: postId,
          p_user_id: currentUserId,
        });
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

  /** 프로필 탭 → 간단 프로필 화면 */
  const handlePressProfileSimple = (post) => {
    if (!post.authorId) return;

    navigation.navigate('BoardUserProfile', {
      userId: post.authorId,
      profileImgUrl: post.profileImage ? post.profileImage.uri : null,
      userName: post.userName,
      characterName: post.characterName,
    });
  };

  /** 프로필 길게 눌렀을 때 → MyPage (readOnly) */
  const handlePressProfileMyPage = (post) => {
    if (!post.authorId) return;
    navigation.navigate('MyPage', {
      userId: post.authorId,
      readOnly: true,
    });
  };

  /** 개별 게시글 UI **/
  const renderPost = ({ item }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      style={[
        styles.postContainer,
        item.isMine ? styles.myPost : styles.otherPost,
      ]}
    >
      {/* 프로필 영역 */}
      <TouchableOpacity
        onPress={() => handlePressProfileSimple(item)}
        onLongPress={() => handlePressProfileMyPage(item)}
        delayLongPress={400}
      >
        <Image
          source={item.profileImage || require('../../assets/User.jpg')}
          style={styles.profileImage}
        />
      </TouchableOpacity>

      {/* 게시글 박스 */}
      <ThemeView
        style={[
          styles.bubble,
          {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#333' : '#DDD',
          },
        ]}
      >
        {/* 🔹 회원 이름만 표시 (캐릭터 이름은 제거) */}
        {item.userName && (
          <ThemeView style={{ flexDirection: 'row', marginBottom: 4 }}>
            <ThemeText
              style={{
                fontWeight: 'bold',
                marginRight: 6,
                color: colors.text,
              }}
            >
              {item.userName}
            </ThemeText>
          </ThemeView>
        )}

        {item.image && <Image source={item.image} style={styles.postImage} />}

        <ThemeText style={[styles.content, { color: colors.text }]}>
          {item.text}
        </ThemeText>

        {/* 하단 아이콘/정보 */}
        <ThemeView style={styles.postFooter}>
          <TouchableOpacity
            onPress={() => toggleLike(item.id, item.hasLiked)}
          >
            <Ionicons
              name={item.hasLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={item.hasLiked ? 'red' : colors.subText}
            />
          </TouchableOpacity>

          <ThemeText
            style={[styles.footerText, { color: colors.subText }]}
          >
            {item.likes}
          </ThemeText>

          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={colors.subText}
            style={styles.iconSpacing}
          />

          <ThemeText
            style={[styles.footerText, { color: colors.subText }]}
          >
            {item.comments}
          </ThemeText>

          <ThemeText style={styles.postDate}>
            {item.created_at
              ? formatKST(item.created_at) : '시간 없음'}
          </ThemeText>
        </ThemeView>
      </ThemeView>
    </TouchableOpacity>
  );

  return (
    <ThemeView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* 상단 안내 문구 */}
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

      {/* 👇 입력창: 키보드 올라올 때 같이 움직이게 */}
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 85 }
      >
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
              <Image
                source={{ uri: uploadedImageUrl }}
                style={styles.largeImagePreview}
              />

              {!isImageUploading && (
                <TouchableOpacity
                  onPress={() => {
                    setUploadedImageUrl(null);
                    imageUploaderRef.current?.resetImage?.();
                  }}
                  style={styles.removeLargeImageButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={28}
                    color="red"
                  />
                </TouchableOpacity>
              )}

              {isImageUploading && (
                <ActivityIndicator size="large" color="#007AFF" />
              )}
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
                  backgroundColor: isDark ? '#1E1E1E' : '#F0F0F0',
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
              disabled={
                isImageUploading ||
                (!message.trim() && !uploadedImageUrl)
              }
              style={styles.sendButton}
            >
              <Ionicons
                name="send"
                size={28}
                color={
                  isImageUploading || (!message.trim() && !uploadedImageUrl)
                    ? '#666'
                    : '#4A90E2'
                }
              />
            </TouchableOpacity>
          </ThemeView>
        </ThemeView>
      </KeyboardAvoidingView>
    </ThemeView>
  );
};

export default BoardComponent;

const styles = StyleSheet.create({
  container: { flex: 1 },

  notice: {
    textAlign: 'center',
    marginTop: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
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

  postDate: {
    marginLeft: 10,
    fontSize: 12,
  },
});
