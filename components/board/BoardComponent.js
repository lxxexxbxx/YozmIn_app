import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput,} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

// 📋 BoardComponent
const BoardComponent = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // 📸 이미지 선택 기능
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      Alert.alert('이미지 선택 완료');
    }
  };

  // 🗑 선택한 사진 삭제
  const removeImage = () => {
    setImageUri(null);
  };

  // 📤 메시지 전송 (내 글 추가)
  const handleSend = () => {
    if (message.trim() || imageUri) {
      const newPost = {
        id: Date.now().toString(),
        user: '나',
        profileImage: { uri: 'https://via.placeholder.com/40' },
        text: message,
        image: imageUri ? { uri: imageUri } : null,
        likes: 0,
        comments: 0,
        isMine: true,
        hasLiked: false,
      };
      setPosts([newPost, ...posts]);
      setMessage('');
      setImageUri(null); // 전송 후 미리보기 초기화
    }
  };

  // 📋 게시글 클릭 시 상세 화면으로 이동
  const handlePress = (post) => {
    navigation.navigate('PostDetail', { post });
  };

  // ❤️ 하트 토글 기능
  const toggleLike = (id) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === id) {
          return {
            ...post,
            likes: post.hasLiked ? post.likes - 1 : post.likes + 1,
            hasLiked: !post.hasLiked,
          };
        }
        return post;
      })
    );
  };

  // 📝 채팅형 게시글 UI
  const renderPost = ({ item }) => (
    <TouchableOpacity onPress={() => handlePress(item)} style={[styles.postContainer, item.isMine ? styles.myPost : styles.otherPost]}>
      {!item.isMine && <Image source={item.profileImage} style={styles.profileImage} />}
      <View style={styles.bubble}>
        {item.image && <Image source={item.image} style={styles.postImage} />}
        <Text style={styles.content}>{item.text}</Text>
        <View style={styles.postFooter}>
          <TouchableOpacity onPress={() => toggleLike(item.id)}>
            <Ionicons name={item.hasLiked ? 'heart' : 'heart-outline'} size={20} color={item.hasLiked ? 'red' : 'black'} />
          </TouchableOpacity>
          <Text style={styles.footerText}>{item.likes}</Text>
          <Ionicons name="chatbubble-outline" size={20} color="black" style={styles.iconSpacing} />
          <Text style={styles.footerText}>{item.comments}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.notice}>최신 트렌드를 사람들과 공유 해보세요!</Text>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        inverted
      />
      {/* ✏️ 입력창 (사진 미리보기 포함) */}
      <View style={styles.inputWrapper}>
        {imageUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity onPress={removeImage} style={styles.removeButton}>
              <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={pickImage}>
            <Ionicons name="image-outline" size={28} color="#333" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="메시지를 입력하세요..."
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity onPress={handleSend}>
            <Ionicons name="send" size={28} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// 📐 스타일 정의
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  postContainer: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 8, marginHorizontal: 10 },
  myPost: { justifyContent: 'flex-end' },
  otherPost: { justifyContent: 'flex-start' },
  profileImage: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  bubble: { maxWidth: '70%', padding: 12, borderRadius: 15, backgroundColor: 'white', elevation: 2 },
  content: { fontSize: 14, color: 'black' },
  postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  footerText: { fontSize: 12, color: '#666', marginLeft: 5 },
  iconSpacing: { marginLeft: 15 },
  postImage: { width: '100%', height: 150, marginTop: 5, borderRadius: 10 },
  inputWrapper: { paddingBottom: 10 }, // 미리보기 포함 UI
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 5,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 5,
    elevation: 2,
  },
  previewImage: { width: 80, height: 80, borderRadius: 10 },
  removeButton: { marginLeft: 10 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderColor: '#ddd' },
  input: { flex: 1, marginLeft: 10, marginRight: 10, padding: 8, borderRadius: 20, backgroundColor: '#FFF' },
  notice: { textAlign: 'center', marginVertical: 10, fontSize: 24, fontWeight: 'bold', color: 'black', marginTop: 50 },
});

export default BoardComponent;
