// PostDetailComponent.js (전체 파일)
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, TextInput,
  Share, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, FlatList
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import supabase from '../../supabase';
import { useUserStore } from "../../stores/UserStore";

const PostDetailComponent = ({ route, navigation }) => {
  const { postId } = route.params;

  const userStore = useUserStore();
  const currentUserId = userStore.user_id;

  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  // 댓글 옵션 모달
  const [selectedComment, setSelectedComment] = useState(null);
  const [isCommentMenuVisible, setIsCommentMenuVisible] = useState(false);

  // 폴더 선택 모달
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [folders, setFolders] = useState([]);              // { b_no, b_folder_name, b_folder_img }
  const [selectedFolderNo, setSelectedFolderNo] = useState(null);
  const [folderLoading, setFolderLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId) {
      console.warn("현재 로그인된 사용자 ID가 없습니다. 일부 기능은 로그인 후 이용해주세요.");
    }
  }, [currentUserId]);

  // ────────────────────────────────────────────────────────────────
  // 데이터 로드
  // ────────────────────────────────────────────────────────────────
  const fetchLikeCount = async () => {
    const { data, error } = await supabase
      .from('post')
      .select('like_cnt')
      .eq('post_id', postId)
      .single();

    if (error) {
      console.error('좋아요 카운트 로딩 실패:', error);
      return;
    }
    setLikeCount(data.like_cnt || 0);
  };

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('post')
      .select(`*`)
      .eq('post_id', postId)
      .single();

    if (error) {
      console.error('포스트 로딩 실패:', error);
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

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comment')
      .select(`*`)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('댓글 로딩 실패:', error);
      return;
    }
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
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('user_id', item.user_id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn(`프로필 로딩 실패 for user_id ${item.user_id}:`, error.message);
    }

    return {
      ...item,
      profiles: data || { username: '익명', avatar_url: null }
    };
  };

  const loadCommentLikes = async (commentsData) => {
    if (!currentUserId || commentsData.length === 0) {
      return commentsData.map(c => ({ ...c, isLiked: false, likeCount: c.like_cnt || 0 }));
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

  // 내 폴더 불러오기
  const loadMyFolders = async () => {
    if (!currentUserId) return;
    setFolderLoading(true);
    const { data, error } = await supabase
      .from('bookmark') // 폴더 테이블
      .select('b_no, b_folder_name, b_folder_img')
      .eq('user_id', currentUserId)
      .order('b_no', { ascending: false });

    if (error) {
      console.error('폴더 로딩 실패:', error.message);
      setFolders([]);
    } else {
      setFolders(data || []);
    }
    setFolderLoading(false);
  };

  // 기본 폴더 생성 (없을 때)
  const createDefaultFolder = async () => {
    if (!currentUserId) return null;
    const { data, error } = await supabase
      .from('bookmark')
      .insert([{ user_id: currentUserId, b_folder_name: '모든 게시글', b_folder_img: null }])
      .select('b_no')
      .single();
    if (error) {
      Alert.alert('오류', `기본 폴더 생성 실패: ${error.message}`);
      return null;
    }
    return data?.b_no ?? null;
  };

  // 현재 글 북마크 여부 (매핑 테이블 기준)
  const checkBookmarkStatus = async () => {
    if (!currentUserId) { setIsBookmarked(false); return; }
    const { data, error } = await supabase
      .from('bookmark_post')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('post_id', postId)
      .limit(1)
      .maybeSingle();

    setIsBookmarked(!!data && !error);
  };

  // ────────────────────────────────────────────────────────────────
  // 인터랙션
  // ────────────────────────────────────────────────────────────────
  const toggleCommentLike = async (index) => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인 후 댓글에 좋아요를 누를 수 있습니다.');
      return;
    }

    const updatedComments = [...comments];
    const commentToUpdate = updatedComments[index];
    const isCurrentlyLiked = commentToUpdate.isLiked;

    commentToUpdate.isLiked = !isCurrentlyLiked;
    commentToUpdate.likeCount = isCurrentlyLiked
      ? Math.max(0, (commentToUpdate.likeCount || 0) - 1)
      : (commentToUpdate.likeCount || 0) + 1;
    setComments(updatedComments);

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from('comment_like')
          .delete()
          .eq('user_id', currentUserId)
          .eq('comment_id', commentToUpdate.id);
        if (error) throw error;

        const { error: rpcError } = await supabase.rpc('decrement_comment_like_count', {
          p_comment_id: commentToUpdate.id
        });
        if (rpcError) throw rpcError;

      } else {
        const { error } = await supabase
          .from('comment_like')
          .insert([{ user_id: currentUserId, comment_id: commentToUpdate.id }]);
        if (error) throw error;

        const { error: rpcError } = await supabase.rpc('increment_comment_like_count', {
          p_comment_id: commentToUpdate.id
        });
        if (rpcError) throw rpcError;
      }

      const { data: updatedCommentData, error: fetchError } = await supabase
        .from('comment')
        .select('like_cnt')
        .eq('id', commentToUpdate.id)
        .single();
      if (fetchError) throw fetchError;

      const finalUpdatedComments = [...comments];
      finalUpdatedComments[index].likeCount = updatedCommentData.like_cnt || 0;
      setComments(finalUpdatedComments);

    } catch (error) {
      console.error('댓글 좋아요 작업 실패:', error);
      Alert.alert('오류', `댓글 좋아요 변경 중 오류가 발생했습니다: ${error.message}`);
      const revertedComments = [...comments];
      revertedComments[index].isLiked = isCurrentlyLiked;
      revertedComments[index].likeCount = isCurrentlyLiked
        ? (revertedComments[index].likeCount || 0) + 1
        : Math.max(0, (revertedComments[index].likeCount || 0) - 1);
      setComments(revertedComments);
    }
  };

  // 좋아요 토글(버그 방지용으로 next 상태 기준)
  const toggleLike = async () => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인 후 좋아요를 누를 수 있습니다.');
      return;
    }

    const next = !isLiked;
    setIsLiked(next);

    try {
      if (next) {
        await supabase.rpc('like_post', { p_post_id: postId, p_user_id: currentUserId });
      } else {
        await supabase.rpc('unlike_post', { p_post_id: postId, p_user_id: currentUserId });
      }
      await fetchLikeCount();
    } catch (e) {
      console.error('❌ 좋아요 토글 에러 (RPC):', e);
      Alert.alert('오류', '좋아요 상태 변경 중 오류가 발생했습니다.');
      setIsLiked(!next);
      await fetchLikeCount();
    }
  };

  // 북마크 토글 → 새로운 폴더 선택 플로우
  const toggleBookmark = async () => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인 후 게시글을 북마크할 수 있습니다.');
      return;
    }

    if (isBookmarked) {
      // 이미 북마크된 경우: 내 모든 폴더에서 이 글 제거 (간단 토글)
      try {
        const { error } = await supabase
          .from('bookmark_post')
          .delete()
          .eq('user_id', currentUserId)
          .eq('post_id', postId);
        if (error) throw error;
        setIsBookmarked(false);
      } catch (error) {
        console.error('북마크 제거 실패:', error);
        Alert.alert('오류', `북마크 제거 실패: ${error.message}`);
      }
      return;
    }

    // 아직 북마크 아님 → 폴더 선택 모달
    await loadMyFolders();
    setSelectedFolderNo(null);
    setFolderModalVisible(true);
  };

  // 폴더 선택 모달에서 "담기"
  const confirmAddToFolder = async () => {
    if (!currentUserId) return;

    let folderNo = selectedFolderNo;

    if (!folders || folders.length === 0) {
      const created = await createDefaultFolder();
      if (!created) return;
      folderNo = created;
    }

    if (!folderNo) {
      Alert.alert('안내', '담을 폴더를 선택해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('bookmark_post')
        .insert([{ user_id: currentUserId, folder_no: folderNo, post_id: postId }]);
      if (error) throw error;

      setFolderModalVisible(false);
      setIsBookmarked(true);
      Alert.alert('완료', '선택한 폴더에 담았어요.');
    } catch (error) {
      console.error('북마크 담기 실패:', error);
      if (String(error?.code) === '23505') {
        // unique 충돌이면 이미 담겨 있는 것이므로 성공처럼 처리
        setFolderModalVisible(false);
        setIsBookmarked(true);
        return;
      }
      Alert.alert('오류', `북마크 담기 실패: ${error.message}`);
    }
  };

  const addComment = async () => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인 후 댓글을 작성할 수 있습니다.');
      return;
    }
    if (!newComment.trim()) return;

    const newCommentObj = {
      post_id: postId,
      user_id: currentUserId,
      comment: newComment,
    };

    const { data, error } = await supabase.from('comment').insert(newCommentObj).select().single();

    if (error) {
      console.error('댓글 저장 실패:', error);
      Alert.alert('오류', '댓글 저장 중 오류가 발생했습니다.');
      return;
    }

    const { error: rpcError } = await supabase.rpc('increment_comment_count', {
      p_post_id: postId,
    });
    if (rpcError) {
      console.error('❌ 댓글 수 증가 RPC 호출 실패:', rpcError.message);
    }

    await fetchComments();
    setNewComment('');
  };

  // 댓글 삭제 RPC
  const deleteCommentRpc = async (commentId, post_id) => {
    try {
      const { error: rpcError } = await supabase.rpc('delete_comment', {
        p_comment_id: Number(commentId),
        p_post_id: post_id,
      });

      if (rpcError) throw rpcError;

      await fetchComments();
      await fetchPost();
      setSelectedComment(null);
      setIsCommentMenuVisible(false);
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      Alert.alert('오류', `댓글 삭제 중 오류가 발생했습니다: ${error.message || error}`);
    }
  };

  const deleteComment = (comment) => {
    setSelectedComment(comment);
    setIsCommentMenuVisible(true);
  };

  const onConfirmDelete = () => {
    if (!selectedComment) return;
    deleteCommentRpc(selectedComment.id, postId);
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
    } catch (error) {
      console.error('공유 실패:', error);
      Alert.alert('오류', '게시글 공유에 실패했습니다.');
    }
  };

  const incrementViewCount = async () => {
    try {
      const { error } = await supabase.rpc('increment_post_view_count', {
        p_post_id: postId,
      });
      if (error) {
        console.error('조회수 증가 실패:', error);
      } else {
        await fetchPost();
      }
    } catch (e) {
      console.error('조회수 증가 RPC 호출 중 예외 발생:', e);
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, currentUserId]);

  if (loading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // 댓글 렌더
  const renderComments = () => {
    if (!comments || comments.length === 0) {
      return <Text style={{ color: 'gray', paddingHorizontal: 10 }}>등록된 댓글이 없습니다.</Text>;
    }
    return comments.map((item, idx) => {
      const isMyComment = item.user_id === currentUserId;
      return (
        <View key={String(item.id)} style={styles.comment}>
          <Image
            source={{ uri: item.profiles?.avatar_url || 'https://via.placeholder.com/40' }}
            style={styles.commentProfileImage}
          />
          <View style={styles.commentContent}>
            <View style={styles.commentHeaderRow}>
              <Text style={styles.commentUserName}>{item.profiles?.username || '익명'}</Text>
              {isMyComment && (
                <TouchableOpacity
                  onPress={() => deleteComment(item)}
                  style={styles.commentMenuButtonSmall}
                >
                  <FontAwesome name="ellipsis-h" size={18} color="gray" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ color: item.is_deleted ? '#999' : '#000' }}>{item.comment}</Text>
            <View style={styles.commentFooter}>
              <TouchableOpacity onPress={() => toggleCommentLike(idx)} style={styles.commentLikeButton}>
                <FontAwesome name={item.isLiked ? 'heart' : 'heart-o'} size={16} color="gray" />
                <Text style={styles.commentLikeCount}>{item.likeCount || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
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
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>댓글 옵션</Text>
                <TouchableOpacity style={styles.modalButton} onPress={onConfirmDelete}>
                  <Text style={[styles.modalButtonText, { color: 'red' }]}>삭제</Text>
                </TouchableOpacity>
                <View style={styles.modalSeparator} />
                <TouchableOpacity style={styles.modalButton} onPress={cancelCommentMenu}>
                  <Text style={styles.modalButtonText}>취소</Text>
                </TouchableOpacity>
              </View>
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
              <View style={styles.folderModalCard}>
                <Text style={styles.modalTitle}>폴더 선택</Text>

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
                        <Text style={styles.folderName}>{item.b_folder_name || '이름 없음'}</Text>
                      </TouchableOpacity>
                    )}
                  />
                ) : (
                  <View style={{ paddingVertical: 20 }}>
                    <Text style={{ color: '#666', marginBottom: 10 }}>
                      폴더가 없습니다. 기본 폴더를 만들어 담을까요?
                    </Text>
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={async () => {
                        const created = await createDefaultFolder();
                        if (created) {
                          await loadMyFolders();
                        }
                      }}
                    >
                      <Text style={styles.primaryBtnText}>기본 폴더 만들기</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setFolderModalVisible(false)}
                  >
                    <Text>취소</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={confirmAddToFolder}
                  >
                    <Text style={styles.primaryBtnText}>담기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          <Image source={{ uri: post.profiles?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.profileImage} />
          <Text style={styles.profileName}>{post.profiles?.username || '익명'}</Text>
        </View>
      </View>

      {/* Post content */}
      <View style={styles.contentContainer}>
        {post.image_url && <Image source={{ uri: post.image_url }} style={styles.image} />}

        <View style={styles.postContainer}>
          <Text style={styles.text}>{post.content || '내용 없음'}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
              <FontAwesome name={isLiked ? 'heart' : 'heart-o'} size={24} color="red" />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <View style={styles.actionGroup}>
              <View style={styles.actionButton}>
                <FontAwesome name="eye" size={24} color="gray" />
                <Text style={styles.actionText}>{post.view_count || 0}</Text>
              </View>
              <TouchableOpacity onPress={toggleBookmark} style={styles.actionButton}>
                <FontAwesome name={isBookmarked ? 'bookmark' : 'bookmark-o'} size={24} color="gray" />
              </TouchableOpacity>
              <TouchableOpacity onPress={sharePost} style={styles.actionButton}>
                <FontAwesome name="share-alt" size={24} color="gray" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 댓글 섹션 */}
        <View style={styles.commentSection}>
          <View style={styles.commentHeader}>
            <FontAwesome name="comments" size={20} color="black" />
            <Text style={styles.commentTitle}>댓글</Text>
            <Text style={styles.commentCount}>{comments.length}</Text>
          </View>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="댓글을 입력하세요..."
              placeholderTextColor="gray"
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
          </View>

          <View>
            {renderComments()}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
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

  // 댓글
  commentSection: { marginTop: 10, paddingHorizontal: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  commentTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 5 },
  commentCount: { fontSize: 14, marginLeft: 5, color: 'gray' },

  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff'
  },
  commentInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: '#000' },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 8,
  },

  comment: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 8, paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  commentProfileImage: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentContent: { flex: 1 },
  commentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commentUserName: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },

  commentMenuButtonSmall: { paddingHorizontal: 6 },

  commentFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  commentLikeButton: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  commentLikeCount: { marginLeft: 5, fontSize: 12, color: 'gray' },

  // 공통 모달 레이어
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 댓글 옵션 모달 카드
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
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
    backgroundColor: '#eee'
  },

  // 폴더 선택 모달 카드
  folderModalCard: {
    width: '85%',
    backgroundColor: 'white',
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
    fontSize: 15, color: '#111'
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
