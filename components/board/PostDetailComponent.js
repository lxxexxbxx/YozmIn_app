import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, FlatList, TextInput, Share, ScrollView, ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../../supabase';

const PostDetailComponent = ({ route, navigation }) => {
  const { postId } = route.params;

  const userId = 'f0334b06-3076-4858-8cb7-47b3804f0696'; // 나중에 Supabase.auth에서 불러올 예정

  const [post, setPost] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
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
    setLikeCount(data.like_cnt || 0);
  };

  const fetchIsLiked = async () => {
    const { data } = await supabase
      .from('like')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    setIsLiked(!!data);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comment')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('댓글 로딩 실패:', error);
      return;
    }

    setComments(data || []);
  };

  useEffect(() => {
    (async () => {
      await fetchPost();
      await fetchIsLiked();
      await fetchComments();
      setLoading(false);
    })();
  }, []);

  const toggleLike = async () => {
    const newLike = !isLiked;
    setIsLiked(newLike);
    setLikeCount((prev) => newLike ? prev + 1 : prev - 1);

    if (newLike) {
      await supabase.from('like').insert({ post_id: postId, user_id: userId });
      await supabase.from('post').update({ like_cnt: likeCount + 1 }).eq('post_id', postId);
    } else {
      await supabase.from('like').delete().eq('post_id', postId).eq('user_id', userId);
      await supabase.from('post').update({ like_cnt: likeCount - 1 }).eq('post_id', postId);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    const newCommentObj = {
      id: uuidv4(),
      post_id: postId,
      user_id: userId,
      text: newComment,
      like_cnt: 0,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('comment').insert(newCommentObj);
    if (error) {
      console.error('댓글 저장 실패:', error);
      return;
    }

    setComments([...comments, newCommentObj]);
    setNewComment('');
  };

  const sharePost = async () => {
    try {
      await Share.share({
        message: `${post.content}\n\n${post.image_url || ''}`,
      });
    } catch {
      alert('공유 실패');
    }
  };

  const renderComment = ({ item }) => (
    <View style={styles.comment}>
      <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.commentProfileImage} />
      <View style={styles.commentContent}>
        <Text>{item.text}</Text>
        <View style={styles.commentLikeButton}>
          <FontAwesome name="heart-o" size={16} color="gray" />
          <Text style={styles.commentLikeCount}>{item.like_cnt || 0}</Text>
        </View>
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
              <TouchableOpacity style={styles.actionButton}>
                <FontAwesome name="bookmark-o" size={24} color="gray" />
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
            <Text style={styles.commentCount}>{comments.length}</Text>
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
