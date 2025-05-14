import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, FlatList, TextInput, Share, ScrollView, ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import supabase from '../../supabase';

const PostDetailComponent = ({ route, navigation }) => {
  const { postId } = route.params;

  const userId = '1'; // 추후 Supabase.auth.getUser() 연동 예정

  const [post, setPost] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const getPostById = async () => {
    try {
      const { data, error } = await supabase
        .from('post')
        .select('*')
        .eq('post_id', postId)
        .single();

      if (error) {
        console.error('포스트 로딩 실패:', error);
        return;
      }

      setPost(data);
      setIsLiked(data.liked_users?.includes(userId) || false);
      setLikeCount(data.like_count || 0);
      setComments(data.comments || []);
      setCommentCount(data.comments?.length || 0);
    } catch (err) {
      console.error('포스트 로딩 중 예외 발생:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPostById();
  }, []);

  const toggleBookmark = () => {
    setIsBookmarked((prev) => !prev);
    // TODO: Supabase 북마크 API 연동
  };

  const toggleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikeCount((prev) => newLiked ? prev + 1 : prev - 1);

    // TODO: Supabase 좋아요 반영
  };

  const toggleCommentLike = (index) => {
    const updated = [...comments];
    const c = updated[index];
    c.isLiked = !c.isLiked;
    c.likeCount += c.isLiked ? 1 : -1;
    setComments(updated);

    // TODO: Supabase 댓글 좋아요 업데이트
  };

  const addComment = () => {
    if (newComment.trim()) {
      const newCommentData = {
        id: Date.now().toString(),
        text: newComment,
        likeCount: 0,
        isLiked: false,
        userId,
      };
      const updated = [...comments, newCommentData];
      setComments(updated);
      setNewComment('');
      setCommentCount(updated.length);

      // TODO: Supabase 댓글 저장
    }
  };

  const sharePost = async () => {
    try {
      await Share.share({
        message: `${post.text}\n\n${post.image?.uri || ''}`,
      });
    } catch {
      alert('공유 실패');
    }
  };

  const renderComment = ({ item, index }) => (
    <View style={styles.comment}>
      <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.commentProfileImage} />
      <View style={styles.commentContent}>
        <Text>{item.text}</Text>
        <TouchableOpacity onPress={() => toggleCommentLike(index)} style={styles.commentLikeButton}>
          <FontAwesome name={item.isLiked ? 'heart' : 'heart-o'} size={16} color="red" />
          <Text style={styles.commentLikeCount}>{item.likeCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading || !post) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          <Image source={{ uri: post.profile_image || 'https://via.placeholder.com/40' }} style={styles.profileImage} />
          <Text style={styles.profileName}>{post.user_name || '익명'}</Text>
        </View>
      </View>

      <ScrollView style={styles.contentScroll}>
        {post.image && <Image source={{ uri: post.image.uri || post.image }} style={styles.image} />}
        <View style={styles.postContainer}>
          <Text style={styles.text}>{post.text || '내용 없음'}</Text>
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

        <View style={styles.commentSection}>
          <View style={styles.commentHeader}>
            <FontAwesome name="comments" size={20} color="black" />
            <Text style={styles.commentTitle}>댓글</Text>
            <Text style={styles.commentCount}>{commentCount}</Text>
          </View>

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="댓글을 입력하세요..."
            />
            <TouchableOpacity onPress={addComment} style={styles.sendButton}>
              <FontAwesome name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
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
  contentScroll: { flex: 1 },
  image: { width: '100%', height: undefined, aspectRatio: 1, resizeMode: 'contain' },
  postContainer: { padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, margin: 10 },
  text: { fontSize: 16, marginBottom: 10 },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  actionGroup: { flexDirection: 'row' },
  actionText: { marginLeft: 5 },
  commentSection: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, margin: 10, paddingBottom: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  commentTitle: { marginLeft: 10, fontSize: 18, fontWeight: 'bold' },
  commentCount: { marginLeft: 10 },
  commentInputContainer: { flexDirection: 'row', padding: 10 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, paddingHorizontal: 10 },
  sendButton: { marginLeft: 10, backgroundColor: '#007bff', borderRadius: 5, padding: 10 },
  comment: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  commentProfileImage: { width: 40, height: 40, borderRadius: 20 },
  commentContent: { marginLeft: 10, flex: 1 },
  commentLikeButton: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  commentLikeCount: { marginLeft: 5 },
});

export default PostDetailComponent;
