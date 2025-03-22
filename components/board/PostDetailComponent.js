import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, TextInput, Share, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const PostDetailComponent = ({ route, navigation }) => {
  // const { post } = route.params;
  // 아래는 테스트용 더미 데이터임 수정 필요
  const defaultPost = {
    userName: "테스트 유저",
    text: "이건 테스트 게시글입니다.",
    image: null,
    likeCount: 10,
    viewCount: 50,
    comments: [],
    profileImage: "https://via.placeholder.com/40", // 더미 프로필 사진 URL
  };
  
  const { post = defaultPost } = route.params || {};
  
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);

  const toggleBookmark = () => setIsBookmarked(!isBookmarked);

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
  };

  const toggleCommentLike = (index) => {
    const updatedComments = [...comments];
    updatedComments[index].isLiked = !updatedComments[index].isLiked;
    updatedComments[index].likeCount += updatedComments[index].isLiked ? 1 : -1;
    setComments(updatedComments);
  };

  const addComment = () => {
    if (newComment.trim()) {
      const newCommentData = { id: Date.now().toString(), text: newComment, likeCount: 0, isLiked: false };
      setComments([...comments, newCommentData]);
      setNewComment('');
      setCommentCount(commentCount + 1);
    }
  };

  const sharePost = async () => {
    try {
      await Share.share({ message: `${post.text}\n\n${post.image}` });
    } catch (error) {
      alert('공유하는 동안 오류가 발생했습니다.');
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

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <View style={styles.profileContainer}>
          <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.profileImage} />
          <Text style={styles.profileName}>{post?.userName || '익명'}</Text>
          {/* 위 코드는 테스트용 더미 데이터임 수정 필요 */}
          {/* <Text style={styles.profileName}>{post.userName}</Text> */}
        </View>
      </View>

      <ScrollView style={styles.contentScroll}>
        {post.image && <Image source={{ uri: post.image.uri }} style={styles.image} />}
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
                <Text style={styles.actionText}>{post.viewCount || 0}</Text>
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
            <TextInput style={styles.commentInput} value={newComment} onChangeText={setNewComment} placeholder="댓글을 입력하세요..." />
            <TouchableOpacity onPress={addComment} style={styles.sendButton}>
              <FontAwesome name="arrow-right" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <FlatList data={comments} renderItem={renderComment} keyExtractor={(item) => item.id} scrollEnabled={false} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
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