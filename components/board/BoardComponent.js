import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import supabase from '../../supabase';

const BoardComponent = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // ✅ 게시글 불러오기
  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('게시글 불러오기 실패:', error.message);
      return;
    }

    const formattedPosts = data.map((post) => ({
      id: post.post_id.toString(),
      user: '나',
      profileImage: { uri: 'https://via.placeholder.com/40' },
      text: post.content,
      image: post.image_url ? { uri: post.image_url } : null,
      likes: post.like_cnt,
      comments: post.comment_cnt || 0,
      isMine: true,
      hasLiked: false, // 실제 liked 여부는 post detail에서 처리
    }));

    setPosts(formattedPosts);
  };

  // ✅ 포커스될 때마다 최신 게시글 fetch
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  // ✅ 이미지 선택
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

  const removeImage = () => setImageUri(null);

  // ✅ 게시글 전송
  const handleSend = async () => {
    console.log("전송 클릭");

    try {
      const { data, error } = await supabase.from('post').insert([
        {
          content: message,
          image_url: imageUri || null,
          like_cnt: 0,
          user_id: '1', // 나중에 Supabase Auth 또는 Firebase Auth 등을 사용해 유저 로그인 시 user.id를 받아 저장
          // const { data: { user } } = await supabase.auth.getUser();
          // const userId = user?.id;             // useEffect 안에 넣거나, async 함수 안에서 써야 됨

        },
      ]);

      if (error) {
        console.error('❌ 게시글 저장 실패:', error.message);
        console.log('🔍 Supabase 응답 전체:', error);
        return;
      }

      console.log('✅ 게시글 저장 성공:', data);

      setMessage('');
      setImageUri(null);
      fetchPosts(); // 새로고침
    } catch (e) {
      console.error('❗ 예외 발생:', e);
    }
  };

  // ✅ 좋아요 토글 (로컬 상태만 변경, DB는 상세화면에서 처리)
  const toggleLike = (id) => {
    setPosts((prev) =>
      prev.map((post) => {
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

  // ✅ 상세화면 이동
  const handlePress = (post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  // ✅ 게시글 렌더링
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
  inputWrapper: { paddingBottom: 10 },
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
