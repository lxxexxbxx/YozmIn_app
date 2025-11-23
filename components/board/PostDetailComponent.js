// --1부-- PostDetailComponent.js 
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, TextInput, ScrollView,
  Share, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, FlatList
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import supabase from '../../supabase';
import { useUserStore } from "../../stores/UserStore";
import { pushQuest } from "../quest/Quests";
import { ThemeView, ThemeText } from '../common/ThemeComponents';
import { useTheme } from '../settings/theme/ThemeContext';
import dayjs from './day';
import { Feather } from '@expo/vector-icons';

const PostDetailComponent = ({ route, navigation }) => {
  const { postId } = route.params; 
  const { colors, isDark } = useTheme();
  const [isPostMenuVisible, setIsPostMenuVisible] = useState(false);


  const userStore = useUserStore();
  const currentUserId = userStore.user_id;

  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 댓글 옵션 모달
  const [selectedComment, setSelectedComment] = useState(null);
  const [isCommentMenuVisible, setIsCommentMenuVisible] = useState(false);

  // 폴더 선택 모달
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [folders, setFolders] = useState([]); 
  const [selectedFolderNo, setSelectedFolderNo] = useState(null);
  const [folderLoading, setFolderLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      console.warn("현재 로그인된 사용자 ID가 없습니다. 일부 기능은 로그인 후 이용해주세요.");
    }
  }, [currentUserId]);

  // ----------------- 데이터 로드 -----------------
  const fetchLikeCount = async () => {
    const { data, error } = await supabase
      .from('post')
      .select('like_cnt')
      .eq('post_id', postId)
      .single();

    if (error) return;
    setLikeCount(data.like_cnt || 0);
  };

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('post')
      .select(`*`)
      .eq('post_id', postId)
      .single();

    if (error) {
      setPost(null);
      return;
    }
    const postWithProfile = await loadUserProfile(data);
    setPost(postWithProfile);
    setLikeCount(data.like_cnt || 0);
  };

  const fetchIsLiked = async () => {
    if (!currentUserId) {
      setIsLiked(false);
      return;
    }
    const { data } = await supabase
      .from('post_like')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', currentUserId)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const deletePost = async () => {
    if (!post) return;
  
    try {
      await supabase
        .from("post")
        .delete()
        .eq("post_id", postId);
  
      Alert.alert("삭제 완료", "게시글이 삭제되었습니다.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("오류", "게시글 삭제 중 문제가 발생했습니다.");
    }
  };  
  
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comment')
      .select(`*`)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) return;
    const commentsWithProfiles = await Promise.all(
      (data || []).map(comment => loadUserProfile(comment))
    );
    const commentsWithLikes = await loadCommentLikes(commentsWithProfiles);
    setComments(commentsWithLikes);
  };

  const loadUserProfile = async (item) => {
    if (!item || !item.user_id) {
      return { ...item, profiles: { username: '익명', avatar_url: null } };
    }
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('user_id', item.user_id)
      .maybeSingle();

    return {
      ...item,
      profiles: data || { username: '익명', avatar_url: null }
    };
  };

  const loadCommentLikes = async (commentsData) => {
    if (!currentUserId || commentsData.length === 0) {
      return commentsData.map(c => ({
        ...c, isLiked: false, likeCount: c.like_cnt || 0
      }));
    }

    const commentIds = commentsData.map(c => c.id);
    const { data: likedData } = await supabase
      .from('comment_like')
      .select('comment_id')
      .in('comment_id', commentIds)
      .eq('user_id', currentUserId);

    const likedIds = likedData?.map(like => like.comment_id) || [];

    return commentsData.map(c => ({
      ...c,
      isLiked: likedIds.includes(c.id),
      likeCount: c.like_cnt || 0,
    }));
  };

  const loadMyFolders = async () => {
    if (!currentUserId) return;
    setFolderLoading(true);

    const { data, error } = await supabase
      .from('bookmark')
      .select('b_no, b_folder_name, b_folder_img')
      .eq('user_id', currentUserId)
      .order('b_no', { ascending: false });

    setFolders(error ? [] : data || []);
    setFolderLoading(false);
  };

  const createDefaultFolder = async () => {
    if (!currentUserId) return null;
    const { data, error } = await supabase
      .from('bookmark')
      .insert([{ user_id: currentUserId, b_folder_name: '모든 게시글', b_folder_img: null }])
      .select('b_no')
      .single();
    if (error) return null;
    return data?.b_no ?? null;
  };

  const checkBookmarkStatus = async () => {
    if (!currentUserId) {
      setIsBookmarked(false);
      return;
    }
    const { data } = await supabase
      .from('bookmark_post')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('post_id', postId)
      .limit(1)
      .maybeSingle();
    setIsBookmarked(!!data);
  };

  // -------------- 인터랙션 --------------
  const toggleCommentLike = async (index) => {
    if (!currentUserId) return Alert.alert('알림', '로그인 후 댓글 좋아요 가능');

    const updated = [...comments];
    const c = updated[index];
    const prev = c.isLiked;

    c.isLiked = !prev;
    c.likeCount = prev ? c.likeCount - 1 : c.likeCount + 1;
    setComments(updated);

    try {
      if (prev) {
        await supabase.from("comment_like")
          .delete()
          .eq("user_id", currentUserId)
          .eq("comment_id", c.id);

        await supabase.rpc('decrement_comment_like_count', {
          p_comment_id: c.id
        });
      } else {
        await supabase.from("comment_like")
          .insert([{ user_id: currentUserId, comment_id: c.id }]);
        await supabase.rpc('increment_comment_like_count', {
          p_comment_id: c.id
        });
        await pushQuest(8, currentUserId);
      }

      const { data } = await supabase
        .from('comment')
        .select('like_cnt')
        .eq('id', c.id)
        .single();

      updated[index].likeCount = data.like_cnt;
      setComments(updated);

    } catch (err) {}
  };

  const toggleLike = async () => {
    if (!currentUserId) return Alert.alert('알림', '로그인 필요');

    const next = !isLiked;
    setIsLiked(next);

    try {
      if (next) {
        await supabase.rpc('like_post', { p_post_id: postId, p_user_id: currentUserId });
        
        // ⭐ 좋아요 퀘스트
        await pushQuest(3, currentUserId);

      } else {
        await supabase.rpc('unlike_post', { p_post_id: postId, p_user_id: currentUserId });
      }
      await fetchLikeCount();
    } catch (e) {
      setIsLiked(!next);
      await fetchLikeCount();
    }
  };

  const toggleBookmark = async () => {
    if (!currentUserId) return Alert.alert("알림", "로그인 필요");

    if (isBookmarked) {
      try {
        await supabase
          .from('bookmark_post')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', postId);

        setIsBookmarked(false);
      } catch (e) {}
      return;
    }

    await loadMyFolders();
    setSelectedFolderNo(null);
    setFolderModalVisible(true);
  };

  const confirmAddToFolder = async () => {
    if (!currentUserId) return;

    let folderNo = selectedFolderNo;

    if (!folders || folders.length === 0) {
      folderNo = await createDefaultFolder();
      if (!folderNo) return;
    }

    if (!folderNo) return Alert.alert("안내", "폴더 선택");

    try {
      await supabase.from('bookmark_post')
        .insert([{ user_id: currentUserId, folder_no: folderNo, post_id: postId }]);

      setFolderModalVisible(false);
      setIsBookmarked(true);

    } catch (error) {
      if (String(error?.code) === "23505") {
        setFolderModalVisible(false);
        setIsBookmarked(true);
        return;
      }
    }
  };

  const addComment = async () => {
    if (!currentUserId) return Alert.alert("로그인 필요");
    if (!newComment.trim()) return;
  
    // 🔥 버튼 연타 방지
    if (isSubmitting) {
      console.log("⚠ 이미 전송 중...");
      return;
    }
    setIsSubmitting(true);
  
    try {
      // 1) 댓글 insert
      const { data, error } = await supabase
        .from('comment')
        .insert({
          post_id: postId,
          user_id: currentUserId,
          comment: newComment.trim(),
        })
        .select()
        .single();
  
      if (error) {
        console.error("❌ 댓글 insert 오류:", error);
        return;
      }
  
      // 2) 게시글의 댓글 개수 증가
      await supabase.rpc('increment_comment_count', {
        p_post_id: postId
      });
  
      // 3) 댓글 퀘스트 증가
      await pushQuest(4, currentUserId);
  
      // 4) UI 새로고침
      await fetchComments();
      setNewComment('');
  
    } catch (e) {
      console.error("❌ addComment 예외:", e);
    } finally {
      setIsSubmitting(false);  // 🔥 절대 잠기지 않도록 finally 유지
    }
  };

  const deleteCommentRpc = async (commentId, post_id) => {
    try {
      await supabase.rpc('delete_comment', {
        p_comment_id: Number(commentId),
        p_post_id: post_id,
      });

      await fetchComments();
      await fetchPost();
      setSelectedComment(null);
      setIsCommentMenuVisible(false);
    } catch (error) {}
  };

  const deleteComment = (comment) => {
    setSelectedComment(comment);
    setIsCommentMenuVisible(true);
  };

  const onConfirmDelete = () => {
    if (!selectedComment) return;
    deleteCommentRpc(selectedComment.id, postId);
  };

  const reportComment = async (commentId) => {
    if (!currentUserId) {
      Alert.alert("알림", "로그인 후 신고할 수 있습니다.");
      return;
    }
  
    try {
      const { data: existing } = await supabase
        .from('reports')
        .select('id')
        .eq('target_type', 'comment')
        .eq('target_id', String(commentId))
        .eq('reporter_id', currentUserId)
        .maybeSingle();
  
      if (existing) {
        Alert.alert("알림", "이미 신고한 댓글입니다.");
        return;
      }
  
      const { error } = await supabase.from('reports').insert({
        target_type: 'comment',
        target_id: String(commentId),
        reporter_id: currentUserId,
      });
  
      if (error) {
        Alert.alert("오류", "댓글 신고 중 문제가 발생했습니다.");
        return;
      }
  
      Alert.alert("신고 완료", "댓글 신고가 접수 되었습니다.");
  
    } catch (e) {
      Alert.alert("오류", "댓글 신고 중 문제가 발생했습니다.");
    }
  };  
  
  const reportPost = async () => {
    if (!currentUserId) {
      Alert.alert("알림", "로그인 후 신고할 수 있습니다.");
      return;
    }
  
    try {
      const { data: existing } = await supabase
        .from('reports')
        .select('id')
        .eq('target_type', 'post')
        .eq('target_id', String(postId))
        .eq('reporter_id', currentUserId)
        .maybeSingle();
  
      if (existing) {
        Alert.alert("알림", "이미 신고한 게시글입니다.");
        return;
      }
  
      const { error } = await supabase.from('reports').insert({
        target_type: 'post',
        target_id: String(postId),
        reporter_id: currentUserId,
      });
  
      if (error) {
        console.error("게시글 신고 오류:", error);
        Alert.alert("오류", "게시글 신고 중 문제가 발생했습니다.");
        return;
      }
  
      Alert.alert("신고 완료", "게시글 신고가 접수되었습니다.");
  
    } catch (e) {
      console.error("게시글 신고 예외:", e);
      Alert.alert("오류", "게시글 신고 처리 중 문제가 발생했습니다.");
    }
  };

  const cancelCommentMenu = () => {
    setSelectedComment(null);
    setIsCommentMenuVisible(false);
  };

  const sharePost = async () => {
    try {
      await Share.share({
        message: `${post.content}\n\n${post.image_url || ''}`,
      });
    } catch (e) {}
  };

  const onReportPost = async () => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인 후 신고할 수 있습니다.');
      return;
    }
  
    try {
      const payload = {
        target_type: 'post',
        target_id: String(postId),
        reporter_id: currentUserId,
      };
  
      const { error } = await supabase.from('reports').insert(payload);
  
      if (error) {
        if (error.code === '23505' || 
            (error.message && error.message.toLowerCase().includes('duplicate'))) {
          Alert.alert('알림', '이미 신고한 게시글입니다.');
        } else {
          console.error('게시글 신고 실패:', error);
          Alert.alert('오류', '게시글 신고 중 오류가 발생했습니다.');
        }
        return;
      }
  
      Alert.alert('신고 접수', '게시글 신고가 접수되었습니다. 검토 후 조치됩니다.');
    } catch (e) {
      console.error('게시글 신고 예외:', e);
    }
  };  

  const incrementViewCount = async () => {
    try {
      const { error } = await supabase.rpc('increment_post_view_count', {
        p_post_id: postId,
      });

      if (!error) {
        await fetchPost();
        await pushQuest(2, currentUserId);
      }

    } catch (e) {}
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPost();
      await fetchIsLiked();
      await checkBookmarkStatus();
      await fetchComments();
      await incrementViewCount();
      setLoading(false);
    })();
  }, [postId, currentUserId]);

  if (loading || !post) {
    return (
      <ThemeView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </ThemeView>
    );
  }
  // ------ 2부: return JSX ------
  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* 게시글 옵션 Modal */}
      <Modal
        visible={isPostMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPostMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsPostMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <ThemeView style={[styles.modalContent, { backgroundColor: colors.boxBackground }]}>
                
                <ThemeText style={[styles.modalTitle, { color: colors.text }]}>
                  게시글 옵션
                </ThemeText>

                {post.user_id === currentUserId ? (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setIsPostMenuVisible(false);
                      deletePost();
                    }}
                  >
                    <ThemeText style={[styles.modalButtonText, { color: 'red' }]}>
                      삭제
                    </ThemeText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => {
                      setIsPostMenuVisible(false);
                      reportPost();
                    }}
                  >
                    <ThemeText style={[styles.modalButtonText, { color: colors.text }]}>
                      신고
                    </ThemeText>
                  </TouchableOpacity>
                )}

                <ThemeView style={[styles.modalSeparator, { backgroundColor: colors.border }]} />

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setIsPostMenuVisible(false)}
                >
                  <ThemeText style={[styles.modalButtonText, { color: colors.text }]}>
                    취소
                  </ThemeText>
                </TouchableOpacity>

              </ThemeView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
{/* 댓글 옵션 Modal */}
<Modal
  visible={isCommentMenuVisible}
  animationType="fade"
  transparent
  onRequestClose={cancelCommentMenu}
>
  <TouchableWithoutFeedback onPress={cancelCommentMenu}>
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback>
        <ThemeView style={[styles.modalContent, { backgroundColor: colors.boxBackground }]}>

          <ThemeText style={[styles.modalTitle, { color: colors.text }]}>
            댓글 옵션
          </ThemeText>

          {/* 🔥 본인 댓글이면 삭제 / 남의 댓글이면 신고 */}
          {selectedComment?.user_id === currentUserId ? (
            
            // 🔥 내 댓글 → 삭제
            <TouchableOpacity
              style={styles.modalButton}
              onPress={onConfirmDelete}
            >
              <ThemeText style={[styles.modalButtonText, { color: 'red' }]}>
                삭제
              </ThemeText>
            </TouchableOpacity>

          ) : (
            
            // 🔥 남의 댓글 → 신고 (중복 신고 방지 포함)
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setIsCommentMenuVisible(false);
                reportComment(selectedComment.id);  // ← 핵심
              }}
            >
              <ThemeText style={[styles.modalButtonText, { color: colors.text }]}>
                신고
              </ThemeText>
            </TouchableOpacity>

          )}

          {/* 구분선 */}
          <ThemeView
            style={[styles.modalSeparator, { backgroundColor: colors.border }]}
          />

          {/* 취소 */}
          <TouchableOpacity style={styles.modalButton} onPress={cancelCommentMenu}>
            <ThemeText style={[styles.modalButtonText, { color: colors.text }]}>
              취소
            </ThemeText>
          </TouchableOpacity>

        </ThemeView>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>

      {/* 폴더 선택 모달 */}
      <Modal
        visible={folderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFolderModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setFolderModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <ThemeView style={[styles.folderModalCard, { backgroundColor: colors.boxBackground }]}>

                <ThemeText style={[styles.modalTitle, { color: colors.text }]}>폴더 선택</ThemeText>

                {folderLoading ? (
                  <ActivityIndicator size="large" />
                ) : (folders && folders.length > 0) ? (
                  <FlatList
                    data={folders}
                    keyExtractor={(it) => String(it.b_no)}
                    style={{ maxHeight: 280, width: '100%' }}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.folderRow,
                          selectedFolderNo === item.b_no && styles.folderRowSelected
                        ]}
                        onPress={() => setSelectedFolderNo(item.b_no)}
                      >
                        {item.b_folder_img ? (
                          <Image source={{ uri: item.b_folder_img }} style={styles.folderThumb} />
                        ) : (
                          <View style={[styles.folderThumb, { backgroundColor: '#eee' }]} />
                        )}

                        <ThemeText style={[styles.folderName, { color: colors.text }]}>
                          {item.b_folder_name || '이름 없음'}
                        </ThemeText>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <ThemeView style={{ paddingVertical: 20 }}>
                    <ThemeText style={{ color: colors.subText, marginBottom: 10 }}>
                      폴더가 없습니다. 기본 폴더를 만들어 담을까요?
                    </ThemeText>

                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={async () => {
                        const created = await createDefaultFolder();
                        if (created) {
                          await loadMyFolders();
                        }
                      }}
                    >
                      <ThemeText style={styles.primaryBtnText}>기본 폴더 만들기</ThemeText>
                    </TouchableOpacity>
                  </ThemeView>
                )}

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setFolderModalVisible(false)}
                  >
                    <ThemeText style={{ color: colors.text }}>취소</ThemeText>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.primaryBtn} onPress={confirmAddToFolder}>
                    <ThemeText style={styles.primaryBtnText}>담기</ThemeText>
                  </TouchableOpacity>
                </View>

              </ThemeView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 상단바 */}
      <ThemeView style={[styles.topBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <FontAwesome name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <ThemeView style={styles.profileContainer }>
          <Image
            source={{ uri: post.profiles?.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.profileImage}
          />
          <ThemeText style={[styles.profileName, { color: colors.text }]}>
            {post.profiles?.username || '익명'}
          </ThemeText>
        </ThemeView>
      {/* 게시글 옵션 버튼 */}
      <TouchableOpacity
        onPress={() => setIsPostMenuVisible(true)}
        style={{ paddingHorizontal: 8 }}
      >
        <FontAwesome name="ellipsis-h" size={22} color={colors.text} />
      </TouchableOpacity>
      </ThemeView>

      {/* 게시글 내용 */}
      <ThemeView style={styles.contentContainer}>

        {post.image_url && (
          <Image source={{ uri: post.image_url }} style={styles.image} />
        )}

        <ThemeView style={styles.postContainer}>
          <ThemeText style={[styles.text, { color: colors.text }]}>
            {post.content || '내용 없음'}
          </ThemeText>

          <ThemeView style={styles.actionsContainer}>

            {/* 좋아요 */}
            <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
              <FontAwesome name={isLiked ? 'heart' : 'heart-o'} size={24} color="red" />
              <ThemeText style={[styles.actionText, { color: colors.text }]}>
                {likeCount}
              </ThemeText>
            </TouchableOpacity>

            <ThemeView style={styles.actionGroup}>

              <ThemeView style={styles.actionButton}>
                <FontAwesome name="eye" size={24} color={colors.subText} />
                <ThemeText style={[styles.actionText, { color: colors.text }]}>
                  {post.view_count || 0}
                </ThemeText>
              </ThemeView>

              {/* 북마크 */}
              <TouchableOpacity onPress={toggleBookmark} style={styles.actionButton}>
                <FontAwesome
                  name={isBookmarked ? 'bookmark' : 'bookmark-o'}
                  size={24}
                  color={colors.subText}
                />
              </TouchableOpacity>

              {/* 공유 */}
              <TouchableOpacity onPress={sharePost} style={styles.actionButton}>
                <FontAwesome name="share-alt" size={24} color={colors.subText} />
              </TouchableOpacity>

              {/* 🔥 신고 버튼 (복원 완료) */}
              <TouchableOpacity onPress={onReportPost} style={styles.actionButton}>
                  <Feather name="alert-triangle" size={24} color={colors.subText} />
              </TouchableOpacity>
            </ThemeView>
          </ThemeView>

              {/* 작성 시간 */}
              <ThemeText style={{ color: colors.subText, fontSize: 12, marginTop: 5 }}>
                {post.created_at ? dayjs(post.created_at).tz("Asia/Seoul").fromNow() : '시간 없음'}</ThemeText>
        </ThemeView>

        {/* 댓글 */}
        <ThemeView style={[styles.commentSection, { flex: 1 }]}>
          <ThemeView style={styles.commentHeader}>
            <FontAwesome name="comments" size={20} color={colors.text} />
            <ThemeText style={[styles.commentTitle, { color: colors.text }]}>댓글</ThemeText>
            <ThemeText style={[styles.commentCount, { color: colors.subText }]}>
              {comments.length}
            </ThemeText>
          </ThemeView>

          {/* 댓글 입력 */}
          <ThemeView style={[
            styles.commentInputContainer,
            { backgroundColor: colors.boxBackground, borderColor: colors.border }
          ]}>
            <TextInput
              style={[styles.commentInput, { color: colors.text }]}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="댓글을 입력하세요..."
              placeholderTextColor={colors.subText}
            />
            <TouchableOpacity
              onPress={addComment}
              style={styles.sendButton}
              disabled={!newComment.trim()}
            >
              <FontAwesome
                name="arrow-right"
                size={20}
                color={!newComment.trim() ? '#AAA' : 'white'}
                />
            </TouchableOpacity>
          </ThemeView>

          {/* 댓글 리스트 (스크롤 가능) */}
          <ScrollView nestedScrollEnabled={true} style={{ flex: 1 }}>
            {comments.map((item, idx) => {
              return (
                <ThemeView key={String(item.id)} style={styles.comment}>
                  <Image
                    source={{ uri: item.profiles?.avatar_url || 'https://via.placeholder.com/40' }}
                    style={styles.commentProfileImage}
                  />

                  <ThemeView style={styles.commentContent}>

                        <ThemeView style={[styles.commentHeaderRow, { justifyContent: "space-between" }]}>
          
                        {/* 닉네임 + 시간 묶기 */}
                        <ThemeView style={{ flexDirection: "row", alignItems: "center" }}>
                          <ThemeText style={[styles.commentUserName, { color: colors.text }]}>
                            {item.profiles?.username || '익명'}
                          </ThemeText>

                          <ThemeText 
                            style={{ 
                              color: colors.subText, 
                              fontSize: 12, 
                              marginLeft: 6
                            }}
                          >
                            {dayjs(item.created_at).fromNow()}
                          </ThemeText>
                        </ThemeView>

                        {/* 옵션 버튼 */}
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedComment(item);
                            setIsCommentMenuVisible(true);
                          }}
                          style={styles.commentMenuButtonSmall}
                        >
                          <FontAwesome name="ellipsis-h" size={18} color={colors.subText} />
                        </TouchableOpacity>
                    </ThemeView>

                    <ThemeText
                      style={{ color: item.is_deleted ? colors.subText : colors.text, marginTop: 2, marginBottom: 2 }}
                    >
                      {item.comment}
                    </ThemeText>

                    <ThemeView style={styles.commentFooter}>
                      <TouchableOpacity
                        onPress={() => toggleCommentLike(idx)}
                        style={styles.commentLikeButton}
                      >
                        <FontAwesome
                          name={item.isLiked ? 'heart' : 'heart-o'}
                          size={16}
                          color={item.isLiked ? 'red' : colors.subText}
                        />
                        <ThemeText style={[styles.commentLikeCount, { color: colors.subText }]}>
                          {item.likeCount || 0}
                        </ThemeText>
                      </TouchableOpacity>
                    </ThemeView>

                  </ThemeView>
                </ThemeView>
              );
            })}
          </ScrollView>

        </ThemeView>
      </ThemeView>
    </ThemeView>
  );
};

// ------ 3부: StyleSheet + export default ------

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: { flexDirection: 'row', alignItems: 'center', padding: 10, marginTop: 30 },
  profileContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  profileName: { marginLeft: 10, fontSize: 16 },

  contentContainer: { flex: 1, paddingBottom: 20 },
  image: { width: '100%', height: undefined, aspectRatio: 1.6, resizeMode: 'cover' },

  postContainer: { padding: 10 },
  text: { fontSize: 16, marginBottom: 10 },

  actionsContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  actionText: { marginLeft: 5, fontSize: 14 },
  actionGroup: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },

  commentSection: { marginTop: 10, paddingHorizontal: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  commentTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 5 },
  commentCount: { fontSize: 14, marginLeft: 5 },

  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
  },
  commentInput: { flex: 1, paddingVertical: 8, fontSize: 14 },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 8,
  },

  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8,
    paddingVertical: 6,
    borderBottomWidth: 0,
  },
  commentProfileImage: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentContent: { flex: 1 },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentUserName: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  commentMenuButtonSmall: { paddingHorizontal: 6 },
  commentFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  commentLikeButton: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  commentLikeCount: { marginLeft: 5, fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '80%',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 0,
    alignItems: 'center',
    overflow: 'hidden'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 12,
    width: '100%',
    textAlign: 'center'
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
  },
  modalSeparator: {
    width: '100%',
    height: 1,
  },

  folderModalCard: {
    width: '85%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center'
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2'
  },
  folderRowSelected: {
    backgroundColor: '#f5faff'
  },
  folderThumb: {
    width: 40, height: 40, borderRadius: 6, marginRight: 10
  },
  folderName: {
    fontSize: 15,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    marginTop: 12
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginRight: 10
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007bff',
    borderRadius: 8
  },
  primaryBtnText: {
    color: 'white', fontWeight: '600'
  },
});

export default PostDetailComponent;
