import React, { useEffect, useState } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet, TextInput,
  Share, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, ScrollView
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import { pushQuest } from "../quest/Quests";

const PostDetailComponent = ({ route, navigation }) => {
  const { postId } = route.params;
  const { user_id: currentUserId } = useUserStore();

  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState(null);
  const [isCommentMenuVisible, setIsCommentMenuVisible] = useState(false);

  // ✅ 게시글 로드
  const fetchPost = async () => {
    try {
      const { data: postData, error: postErr } = await supabase
        .from("post")
        .select("*")
        .eq("post_id", postId)
        .single();
      if (postErr || !postData) throw postErr;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .eq("user_id", postData.user_id)
        .maybeSingle();

      setPost({
        ...postData,
        profiles: profileData || { username: "익명", avatar_url: null },
      });
      setLikeCount(postData.like_cnt || 0);
    } catch (e) {
      console.error("❌ 포스트 로딩 실패:", e);
      setPost(null);
    }
  };

  const fetchLikeCount = async () => {
    const { data } = await supabase
      .from("post")
      .select("like_cnt")
      .eq("post_id", postId)
      .single();
    setLikeCount(data?.like_cnt || 0);
  };

  const fetchIsLiked = async () => {
    if (!currentUserId) return setIsLiked(false);
    const { data } = await supabase
      .from("post_like")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", currentUserId)
      .maybeSingle();
    setIsLiked(!!data);
  };

  const checkBookmarkStatus = async () => {
    if (!currentUserId) return setIsBookmarked(false);
    const { data, error } = await supabase
      .from("bookmark")
      .select("*")
      .eq("user_id", currentUserId)
      .eq("post_id", postId)
      .maybeSingle();
    setIsBookmarked(!!data && !error);
  };

  // ✅ 댓글 로드 (프로필 직접 매핑)
  const fetchComments = async () => {
    try {
      const { data: rows, error } = await supabase
        .from("comment")
        .select("*")
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((rows || []).map((c) => c.user_id))];
      let profileMap = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url")
          .in("user_id", userIds);
        profileMap = Object.fromEntries((profs || []).map((p) => [p.user_id, p]));
      }

      const merged = (rows || []).map((c) => ({
        ...c,
        profiles: profileMap[c.user_id] || { username: "익명", avatar_url: null },
        isLiked: false,
        likeCount: c.like_cnt || 0,
      }));
      setComments(merged);
    } catch (e) {
      console.error("❌ 댓글 로딩 실패:", e);
      setComments([]);
    }
  };

  // ✅ 게시글 좋아요
  const toggleLike = async () => {
    if (!currentUserId) return Alert.alert("알림", "로그인 후 이용해주세요.");
    const next = !isLiked;
    setIsLiked(next);
    try {
      if (next) {
        await supabase.rpc("like_post", { p_post_id: postId, p_user_id: currentUserId });
        await pushQuest(3, currentUserId);
      } else {
        await supabase.rpc("unlike_post", { p_post_id: postId, p_user_id: currentUserId });
      }
      await fetchLikeCount();
    } catch (e) {
      console.error("❌ 좋아요 토글 실패:", e);
      setIsLiked(!next);
    }
  };

  // ✅ 게시글 신고
  const reportPost = async () => {
    if (!currentUserId) return Alert.alert("알림", "로그인이 필요합니다.");
    try {
      await supabase.from("report").insert([
        {
          user_id: currentUserId,
          post_id: postId,
          type: "post",
          reason: "사용자가 게시글을 신고함",
          created_at: new Date().toISOString(),
        },
      ]);
      Alert.alert("신고 완료", "게시글이 신고되었습니다. 검토 후 조치됩니다.");
    } catch (e) {
      console.error("❌ 신고 실패:", e);
      Alert.alert("오류", "게시글 신고 중 문제가 발생했습니다.");
    }
  };

  // ✅ 댓글 신고
  const reportComment = async (commentId) => {
    if (!currentUserId) return Alert.alert("알림", "로그인이 필요합니다.");
    try {
      await supabase.from("report").insert([
        {
          user_id: currentUserId,
          comment_id: commentId,
          type: "comment",
          reason: "사용자가 댓글을 신고함",
          created_at: new Date().toISOString(),
        },
      ]);
      Alert.alert("신고 완료", "댓글이 신고되었습니다. 검토 후 조치됩니다.");
    } catch (e) {
      console.error("❌ 신고 실패:", e);
      Alert.alert("오류", "댓글 신고 중 문제가 발생했습니다.");
    }
  };

  // ✅ 북마크
  const toggleBookmark = async () => {
    if (!currentUserId) return Alert.alert("알림", "로그인 후 이용해주세요.");
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      if (next) {
        const { error } = await supabase
          .from("bookmark")
          .insert([{ user_id: currentUserId, post_id: postId }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookmark")
          .delete()
          .eq("user_id", currentUserId)
          .eq("post_id", postId);
        if (error) throw error;
      }
    } catch (e) {
      console.error("❌ 북마크 토글 실패:", e);
      setIsBookmarked(!next);
    }
  };

  // ✅ 공유
  const sharePost = async () => {
    try {
      await Share.share({
        message: `${post?.content ?? ""}\n\n${post?.image_url ?? ""}`,
      });
    } catch (error) {
      Alert.alert("오류", "게시글 공유에 실패했습니다.");
    }
  };

  // ✅ 조회수 증가
  const incrementViewCount = async () => {
    try {
      await supabase.rpc("increment_post_view_count", { p_post_id: postId });
      await pushQuest(2, currentUserId);
    } catch (e) {
      console.error("❌ 조회수 증가 실패:", e);
    }
  };

  // ✅ 댓글 추가
  const addComment = async () => {
    if (!currentUserId) return Alert.alert("알림", "로그인이 필요합니다.");
    if (!newComment.trim()) return;
    try {
      const { error } = await supabase
        .from("comment")
        .insert([{ post_id: postId, user_id: currentUserId, comment: newComment }]);
      if (error) throw error;
      await supabase.rpc("increment_comment_count", { p_post_id: postId });
      await pushQuest(4, currentUserId);
      setNewComment("");
      fetchComments();
    } catch (e) {
      console.error("❌ 댓글 작성 실패:", e);
    }
  };

  // ✅ 댓글 좋아요
  const toggleCommentLike = async (index) => {
    if (!currentUserId) return Alert.alert("알림", "로그인 후 이용해주세요.");
    const updated = [...comments];
    const target = updated[index];
    const currentlyLiked = target.isLiked;
    try {
      if (currentlyLiked) {
        await supabase.from("comment_like").delete().match({ user_id: currentUserId, comment_id: target.id });
        await supabase.rpc("decrement_comment_like_count", { p_comment_id: target.id });
      } else {
        await supabase.from("comment_like").insert([{ user_id: currentUserId, comment_id: target.id }]);
        await supabase.rpc("increment_comment_like_count", { p_comment_id: target.id });
        await pushQuest(8, currentUserId);
      }
      target.isLiked = !currentlyLiked;
      target.likeCount = currentlyLiked ? Math.max(0, target.likeCount - 1) : target.likeCount + 1;
      setComments(updated);
    } catch (e) {
      console.error("❌ 댓글 좋아요 실패:", e);
    }
  };

  const deleteCommentRpc = async (commentId) => {
    try {
      const { error } = await supabase.rpc("delete_comment", {
        p_comment_id: Number(commentId),
        p_post_id: postId,
      });
      if (error) throw error;
      fetchComments();
    } catch (e) {
      Alert.alert("오류", "댓글 삭제 중 문제가 발생했습니다.");
    }
  };

  const deleteComment = (comment) => {
    setSelectedComment(comment);
    setIsCommentMenuVisible(true);
  };

  const onConfirmDelete = () => {
    if (!selectedComment) return;
    deleteCommentRpc(selectedComment.id);
    setIsCommentMenuVisible(false);
  };

  // ✅ 초기 로드
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 댓글 옵션 Modal */}
      <Modal visible={isCommentMenuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsCommentMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>댓글 옵션</Text>
              <TouchableOpacity style={styles.modalButton} onPress={onConfirmDelete}>
                <Text style={[styles.modalButtonText, { color: "red" }]}>삭제</Text>
              </TouchableOpacity>
              <View style={styles.modalSeparator} />
              <TouchableOpacity style={styles.modalButton} onPress={() => reportComment(selectedComment?.id)}>
                <Text style={[styles.modalButtonText, { color: "#ff9900" }]}>신고</Text>
              </TouchableOpacity>
              <View style={styles.modalSeparator} />
              <TouchableOpacity style={styles.modalButton} onPress={() => setIsCommentMenuVisible(false)}>
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 상단 */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentScroll}>
        <View style={styles.contentContainer}>
          {post.image_url && <Image source={{ uri: post.image_url }} style={styles.image} />}
          <Text style={styles.text}>{post.content || "내용 없음"}</Text>

          {/* 좋아요 / 북마크 / 조회수 / 공유 */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
              <FontAwesome name={isLiked ? "heart" : "heart-o"} size={24} color="red" />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>

            <View style={styles.actionGroup}>
                <View style={styles.actionButton}>
                    <FontAwesome name="eye" size={24} color="gray" />
                    <Text style={styles.actionText}>{post.view_count || 0}</Text>
                </View>

                <TouchableOpacity onPress={toggleBookmark} style={styles.actionButton}>
                    <FontAwesome name={isBookmarked ? "bookmark" : "bookmark-o"} size={24} color="gray" />
                </TouchableOpacity>

                <TouchableOpacity onPress={sharePost} style={styles.actionButton}>
                    <FontAwesome name="share-alt" size={24} color="gray" />
                </TouchableOpacity>

                {/* 🚨 신고 버튼 — 공유 오른쪽 끝으로 이동 */}
                <TouchableOpacity onPress={reportPost} style={[styles.actionButton, { marginLeft: 6 }]}>
                    <MaterialIcons name="report" size={26} color="#ff4d4f" />
                </TouchableOpacity>
            </View>
          </View>

          {/* 댓글 */}
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>댓글 {comments.length}</Text>
            {comments.map((c, idx) => (
              <View key={c.id} style={styles.comment}>
                <Image
                  source={{ uri: c.profiles?.avatar_url || "https://via.placeholder.com/40" }}
                  style={styles.commentProfileImage}
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeaderRow}>
                    <Text style={styles.commentUserName}>{c.profiles?.username || "익명"}</Text>
                    {c.user_id === currentUserId && (
                      <TouchableOpacity onPress={() => deleteComment(c)} style={styles.commentMenuButtonSmall}>
                        <FontAwesome name="ellipsis-h" size={18} color="gray" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text>{c.comment}</Text>
                  <View style={styles.commentFooter}>
                    <TouchableOpacity onPress={() => toggleCommentLike(idx)} style={styles.commentLikeButton}>
                      <FontAwesome name={c.isLiked ? "heart" : "heart-o"} size={16} color="gray" />
                      <Text style={styles.commentLikeCount}>{c.likeCount || 0}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* 댓글 입력 */}
      <View style={styles.commentInputWrapper}>
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor="gray"
          />
          <TouchableOpacity onPress={addComment} style={styles.sendButton} disabled={!newComment.trim()}>
            <FontAwesome name="arrow-right" size={20} color={!newComment.trim() ? "#AAA" : "white"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

/* ------------------- 스타일 ------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { flexDirection: "row", alignItems: "center", padding: 10, marginTop: 30 },
  profileImage: { width: 40, height: 40, borderRadius: 20 },
  profileName: { marginLeft: 10, fontSize: 16 },
  contentScroll: { flex: 1 },
  contentContainer: { paddingBottom: 20 },
  image: { width: "100%", aspectRatio: 1.6, resizeMode: "cover" },
  text: { fontSize: 16, marginBottom: 10 },
  actionsContainer: { flexDirection: "row", alignItems: "center", marginVertical: 10 },
  actionButton: { flexDirection: "row", alignItems: "center", marginRight: 15 },
  actionText: { marginLeft: 5, fontSize: 14 },
  actionGroup: { flexDirection: "row", alignItems: "center", marginLeft: "auto" },
  commentSection: { marginTop: 10, paddingHorizontal: 10 },
  commentTitle: { fontSize: 16, fontWeight: "bold", marginLeft: 5 },
  commentInputWrapper: { padding: 10, borderTopWidth: 1, borderColor: "#eee", backgroundColor: "white" },
  commentInputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 10 },
  commentInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: "#000" },
  sendButton: { marginLeft: 10, backgroundColor: "#007bff", borderRadius: 20, padding: 8 },
  comment: { flexDirection: "row", alignItems: "flex-start", marginVertical: 8, paddingVertical: 6, borderBottomWidth: 1, borderColor: "#f0f0f0" },
  commentProfileImage: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentContent: { flex: 1 },
  commentHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  commentUserName: { fontWeight: "bold", fontSize: 14, marginBottom: 2 },
  commentMenuButtonSmall: { paddingHorizontal: 6 },
  commentFooter: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  commentLikeButton: { flexDirection: "row", alignItems: "center", marginRight: 10 },
  commentLikeCount: { marginLeft: 5, fontSize: 12, color: "gray" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", backgroundColor: "white", borderRadius: 12, paddingVertical: 10, alignItems: "center", overflow: "hidden" },
  modalTitle: { fontSize: 16, fontWeight: "600", paddingVertical: 12, width: "100%", textAlign: "center" },
  modalButton: { width: "100%", paddingVertical: 14, justifyContent: "center", alignItems: "center" },
  modalButtonText: { fontSize: 16 },
  modalSeparator: { width: "100%", height: 1, backgroundColor: "#eee" },
});

export default PostDetailComponent;