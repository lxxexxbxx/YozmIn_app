// screens/PostDetailScreen.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';

const PostDetailScreen = ({ route, navigation }) => {
  const { post } = route.params;

  return (
    <View style={styles.container}>
      {/* 🔙 상단 바 */}
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Image source={{ uri: post.profileImage }} style={styles.detailProfileImage} />
        <Text style={styles.userName}>{post.user}</Text>
      </View>

      <ScrollView>
        {/* 📷 게시글 내용 */}
        {post.postImage && <Image source={{ uri: post.postImage }} style={styles.detailPostImage} />}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* ❤️ 좋아요 & 조회수 & 북마크 & 공유 */}
        <View style={styles.actions}>
          <TouchableOpacity>
            <Text>❤️ 좋아요</Text>
          </TouchableOpacity>
          <View style={styles.actionRight}>
            <Text>👁️ {post.views}</Text>
            <TouchableOpacity>
              <Text>🔖</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 💬 댓글 */}
        {post.comments.map((comment) => (
          <View key={comment.id} style={styles.comment}>
            <Text>{comment.user}</Text>
            <Text>{comment.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default PostDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  detailProfileImage: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 10 },
  userName: { fontWeight: 'bold' },
  detailPostImage: { width: '100%', height: 300 },
  postContent: { padding: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  actionRight: { flexDirection: 'row', gap: 10 },
  comment: { padding: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
});
