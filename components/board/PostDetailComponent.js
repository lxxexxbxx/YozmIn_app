import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import { useNavigation } from '@react-navigation/native';

const PostDetailComponent = ({ route }) => {
  const { post } = route.params;
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* 🔙 상단 바 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('MyPage')}>
          <Image source={post.profileImage} style={styles.profileImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('MyPage')}>
          <Text style={styles.userName}>{post.user}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* 📷 게시글 내용 */}
        {post.image && <Image source={post.image} style={styles.postImage} />}
        <Text style={styles.content}>{post.content}</Text>

        {/* ❤️ 좋아요 & 조회수 & 북마크 & 공유 */}
        <View style={styles.actions}>
          <TouchableOpacity><Text>❤️ 좋아요</Text></TouchableOpacity>
          <View style={styles.rightActions}>
            <Text>👁️ 1234</Text>
            <TouchableOpacity><Text>🔖</Text></TouchableOpacity>
            <TouchableOpacity><Text>📤</Text></TouchableOpacity>
          </View>
        </View>

        {/* 💬 댓글 */}
        {post.comments?.map((comment, index) => (
          <View key={index} style={styles.comment}>
            <Text>{comment.user}</Text>
            <Text>{comment.content}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginLeft: 10 },
  userName: { marginLeft: 10, fontWeight: 'bold' },
  postImage: { width: '100%', height: 300 },
  content: { padding: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
  rightActions: { flexDirection: 'row', gap: 10 },
  comment: { padding: 10, borderTopWidth: 1, borderTopColor: '#ddd' },
});

export default PostDetailComponent;
