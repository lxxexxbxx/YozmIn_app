import React, { useEffect, useState } from "react";
import {
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Share,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  View,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import supabase from "../../supabase";
import { useUserStore } from "../../stores/UserStore";
import { pushQuest } from "../quest/Quests";
import { ThemeView, ThemeText } from "../common/ThemeComponents";
import { useTheme } from "../settings/theme/ThemeContext";

const PostDetailComponent = ({ route, navigation }) => {
  const { postId } = route.params;
  const { colors, isDark } = useTheme();
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

  const fetchPost = async () => {
    try {
      const { data: postData } = await supabase
        .from("post")
        .select("*")
        .eq("post_id", postId)
        .single();

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
      console.error("❌ 게시글 로드 실패", e);
    }
  };

  const fetchIsLiked = async () => {
    const { data } = await supabase
      .from("post_like")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", currentUserId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const fetchBookmarkStatus = async () => {
    const { data } = await supabase
      .from("bookmark")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", currentUserId)
      .maybeSingle();
    setIsBookmarked(!!data);
  };

  const fetchComments = async () => {
    try {
      const { data: rows } = await supabase
        .from("comment")
        .select("*")
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      const userIds = [...new Set(rows.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = Object.fromEntries(
        profiles.map((p) => [p.user_id, p])
      );

      const merged = rows.map((c) => ({
        ...c,
        profiles: profileMap[c.user_id] ?? { username: "익명", avatar_url: null },
        isLiked: false,
        likeCount: c.like_cnt || 0,
      }));

      setComments(merged);
    } catch (e) {
      console.error("❌ 댓글 로드 실패", e);
    }
  };

  const toggleLike = async () => {
    if (!currentUserId) return Alert.alert("로그인이 필요합니다.");

    const next = !isLiked;
    setIsLiked(next);

    try {
      if (next) {
        await supabase.rpc("like_post", { p_post_id: postId, p_user_id: currentUserId });
        await pushQuest(3, currentUserId);
      } else {
        await supabase.rpc("unlike_post", { p_post_id: postId, p_user_id: currentUserId });
      }

      const { data } = await supabase
        .from("post")
        .select("like_cnt")
        .eq("post_id", postId)
        .single();
      setLikeCount(data.like_cnt);
    } catch (e) {
      console.error("❌ 좋아요 실패", e);
    }
  };

  const toggleBookmark = async () => {
    if (!currentUserId) return Alert.alert("로그인이 필요합니다.");

    const next = !isBookmarked;
    setIsBookmarked(next);

    try {
      if (next) {
        await supabase.from("bookmark").insert([{ post_id: postId, user_id: currentUserId }]);
      } else {
        await supabase
          .from("bookmark")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", currentUserId);
      }
    } catch (e) {
      console.error("❌ 북마크 실패", e);
    }
  };

  const sharePost = async () => {
    try {
      await Share.share({
        message: `${post?.content || ""}\n\n${post?.image_url || ""}`,
      });
    } catch (e) {
      Alert.alert("오류", "공유 실패");
    }
  };

  const reportPost = async () => {
    if (!currentUserId) return;

    try {
      await supabase.from("report").insert([
        {
          user_id: currentUserId,
          post_id: postId,
          type: "post",
          reason: "사용자가 게시글을 신고함",
        },
      ]);

      Alert.alert("신고 완료", "검토 후 조치됩니다.");
    } catch (e) {
      console.error("❌ 신고 실패", e);
    }
  };

  const toggleCommentLike = async (index) => {
    const target = comments[index];
    const currentlyLiked = target.isLiked;
    const updated = [...comments];

    try {
      if (currentlyLiked) {
        await supabase
          .from("comment_like")
          .delete()
          .match({ user_id: currentUserId, comment_id: target.id });

        await supabase.rpc("decrement_comment_like_count", {
          p_comment_id: target.id,
        });
      } else {
        await supabase.from("comment_like").insert([
          { user_id: currentUserId, comment_id: target.id },
        ]);

        await supabase.rpc("increment_comment_like_count", {
          p_comment_id: target.id,
        });
        await pushQuest(8, currentUserId);
      }

      updated[index].isLiked = !currentlyLiked;
      updated[index].likeCount = currentlyLiked
        ? Math.max(0, target.likeCount - 1)
        : target.likeCount + 1;

      setComments(updated);
    } catch (e) {
      console.error("❌ 댓글 좋아요 실패", e);
    }
  };

  const deleteComment = (comment) => {
    setSelectedComment(comment);
    setIsCommentMenuVisible(true);
  };

  const confirmDeleteComment = async () => {
    try {
      await supabase.rpc("delete_comment", {
        p_comment_id: selectedComment.id,
        p_post_id: postId,
      });

      setIsCommentMenuVisible(false);
      fetchComments();
    } catch (e) {
      Alert.alert("오류", "댓글 삭제 실패");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPost();
      await fetchIsLiked();
      await fetchBookmarkStatus();
      await fetchComments();
      setLoading(false);
    })();
  }, [postId]);

  if (loading || !post) {
    return (
      <ThemeView style={styles.loading}>
        <ActivityIndicator size="large" color="#007bff" />
      </ThemeView>
    );
  }

  return (
    <ThemeView style={[styles.container, { backgroundColor: colors.background }]}>

      <Modal visible={isCommentMenuVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsCommentMenuVisible(false)}>
          <View
            style={styles.modalOverlay}
          >
            <ThemeView style={[styles.modalContent, { backgroundColor: colors.boxBackground }]}>
              <ThemeText style={[styles.modalTitle, { color: colors.text }]}>
                댓글 옵션
              </ThemeText>

              <TouchableOpacity style={styles.modalButton} onPress={confirmDeleteComment}>
                <ThemeText style={[styles.modalButtonText, { color: "red" }]}>
                  삭제
                </ThemeText>
              </TouchableOpacity>

              <ThemeView style={[styles.modalSeparator, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setIsCommentMenuVisible(false);
                }}
              >
                <ThemeText style={[styles.modalButtonText, { color: colors.text }]}>
                  취소
                </ThemeText>
              </TouchableOpacity>
            </ThemeView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ThemeView style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color={isDark ? "#DADADA" : "black"} />
        </TouchableOpacity>
      </ThemeView>

      <ScrollView style={styles.scroll}>
        <ThemeView style={{ paddingBottom: 30 }}>

          {post.image_url && (
            <Image source={{ uri: post.image_url }} style={styles.image} />
          )}

          <ThemeText style={[styles.postText, { color: colors.text }]}>
            {post.content}
          </ThemeText>

          <ThemeView style={styles.actionRow}>

            <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
              <FontAwesome
                name={isLiked ? "heart" : "heart-o"}
                size={24}
                color={isLiked ? "red" : isDark ? "#CCC" : "gray"}
              />
              <ThemeText style={[styles.actionText, { color: colors.text }]}>
                {likeCount}
              </ThemeText>
            </TouchableOpacity>

            <ThemeView style={styles.actionRight}>

              <ThemeView style={styles.actionButton}>
                <FontAwesome
                  name="eye"
                  size={24}
                  color={isDark ? "#AAA" : "gray"}
                />
                <ThemeText style={[styles.actionText, { color: colors.text }]}>
                  {post.view_count || 0}
                </ThemeText>
              </ThemeView>

              <TouchableOpacity onPress={toggleBookmark} style={styles.actionButton}>
                <FontAwesome
                  name={isBookmarked ? "bookmark" : "bookmark-o"}
                  size={24}
                  color={isDark ? "#DDD" : "gray"}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={sharePost} style={styles.actionButton}>
                <FontAwesome name="share-alt" size={24} color={isDark ? "#DDD" : "gray"} />
              </TouchableOpacity>

              <TouchableOpacity onPress={reportPost} style={[styles.actionButton]}>
                <MaterialIcons name="report" size={26} color={colors.subText} />
              </TouchableOpacity>

            </ThemeView>
          </ThemeView>

          <ThemeView style={{ paddingHorizontal: 10 }}>
            <ThemeText style={[styles.commentTitle, { color: colors.text }]}>
              댓글 {comments.length}
            </ThemeText>

            {comments.map((c, idx) => (
              <ThemeView
                key={c.id}
                style={[styles.commentRow, { borderBottomWidth: 0 }]}
              >
                <Image
                  source={{ uri: c.profiles?.avatar_url || "https://via.placeholder.com/40" }}
                  style={styles.commentProfile}
                />

                <ThemeView style={{ flex: 1 }}>

                  <ThemeView style={styles.commentHeader}>
                    <ThemeText style={[styles.commentUser, { color: colors.text }]}>
                      {c.profiles?.username}
                    </ThemeText>

                    {c.user_id === currentUserId && (
                      <TouchableOpacity
                        onPress={() => deleteComment(c)}
                        style={styles.commentMenuBtn}
                      >
                        <FontAwesome name="ellipsis-h" size={18} color={isDark ? "#AAA" : "gray"} />
                      </TouchableOpacity>
                    )}
                  </ThemeView>

                  <ThemeText style={{ color: colors.text }}>
                    {c.comment}
                  </ThemeText>

                  <TouchableOpacity
                    onPress={() => toggleCommentLike(idx)}
                    style={styles.commentLikeButton}
                  >
                    <FontAwesome
                      name={c.isLiked ? "heart" : "heart-o"}
                      size={16}
                      color={c.isLiked ? "#FF5252" : isDark ? "#AAA" : "gray"}
                    />
                    <ThemeText
                      style={[styles.commentLikeText, { color: colors.subText }]}
                    >
                      {c.likeCount}
                    </ThemeText>
                  </TouchableOpacity>

                </ThemeView>

              </ThemeView>
            ))}
          </ThemeView>
        </ThemeView>
      </ScrollView>

      <ThemeView style={[styles.commentInputWrapper, { backgroundColor: colors.boxBackground }]}>
        <ThemeView 
          style={[
            styles.commentInputBox, 
            { 
              borderColor: colors.border,
              backgroundColor: isDark ? "#2A2A2A" : colors.boxBackground,
            }
          ]}
        >
          <TextInput
            style={[styles.commentInput, { color: colors.text }]}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor={colors.subText}
          />
          <TouchableOpacity
            onPress={async () => {
              if (!newComment.trim()) return;

              try {
                await supabase.from("comment").insert([
                  {
                    post_id: postId,
                    user_id: currentUserId,
                    comment: newComment,
                  },
                ]);

                await supabase.rpc("increment_comment_count", { p_post_id: postId });
                await pushQuest(4, currentUserId);

                setNewComment("");
                fetchComments();
              } catch (e) {
                console.error("❌ 댓글 작성 실패", e);
                Alert.alert("오류", "댓글 작성 실패");
              }
            }}
            disabled={!newComment.trim()}
            style={[styles.sendButton, { opacity: newComment.trim() ? 1 : 0.4 }]}
          >
            <FontAwesome name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        </ThemeView>
      </ThemeView>
    </ThemeView>
  );
};

export default PostDetailComponent;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  topBar: { flexDirection: "row", alignItems: "center", padding: 10, marginTop: 30 },

  scroll: { flex: 1 },

  image: { width: "100%", aspectRatio: 1.6, resizeMode: "cover" },

  postText: { fontSize: 16, paddingHorizontal: 10, marginTop: 8 },

  actionRow: { flexDirection: "row", alignItems: "center", marginVertical: 10, paddingHorizontal: 10 },
  actionButton: { flexDirection: "row", alignItems: "center", marginRight: 10 },
  actionText: { marginLeft: 5, fontSize: 14 },
  actionRight: { flexDirection: "row", alignItems: "center", marginLeft: "auto" },

  commentTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 8 },

  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  commentProfile: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },

  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  commentUser: { fontWeight: "bold", fontSize: 14, marginBottom: 2 },

  commentMenuBtn: { paddingHorizontal: 6 },

  commentLikeButton: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  commentLikeText: { marginLeft: 6, fontSize: 13 },

  commentInputWrapper: { padding: 10, marginBottom: 10 },
  commentInputBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical : 6 },
  commentInput: { flex: 1, paddingVertical: 8, fontSize: 14 },
  sendButton: { marginLeft: 10, backgroundColor: "#007bff", borderRadius: 20, padding: 8 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", borderRadius: 12, paddingVertical: 10, alignItems: "center", overflow: "hidden" },
  modalTitle: { fontSize: 16, fontWeight: "600", paddingVertical: 12 },
  modalButton: { width: "100%", paddingVertical: 14, alignItems: "center" },
  modalButtonText: { fontSize: 16 },
  modalSeparator: { width: "100%", height: 1 },
});