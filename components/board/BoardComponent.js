// components/board/BoardComponent.js

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

// 더미 데이터 (기존 게시글 유지)
const dummyPosts = [
  { id: "1", message: "안녕하세요!", isMine: true },
  { id: "2", message: "반가워요!", isMine: false },
];

const BoardComponent = () => {
  const [posts, setPosts] = useState(dummyPosts);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);

  // 📸 이미지 선택
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // 📤 게시글 추가
  const sendMessage = () => {
    if (message || image) {
      setPosts([
        ...posts,
        { id: Date.now().toString(), message, image, isMine: true },
      ]);
      setMessage("");
      setImage(null);
    }
  };

  // 게시글 렌더링
  const renderPost = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.isMine ? styles.myBubble : styles.otherBubble,
      ]}
    >
      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}
      <Text style={styles.messageText}>{item.message}</Text>
      <View style={styles.footer}>
        <Ionicons name="heart-outline" size={16} color="gray" />
        <Text>5</Text>
        <Ionicons name="chatbubble-outline" size={16} color="gray" />
        <Text>2</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 📄 게시글 목록 */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
      />

      {/* 📸 사진 + 채팅 입력 바 (하단 고정) */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage}>
          <Ionicons name="camera-outline" size={30} color="gray" />
        </TouchableOpacity>
        <TextInput
          placeholder="메시지를 입력하세요..."
          value={message}
          onChangeText={setMessage}
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage}>
          <Ionicons name="send" size={30} color="blue" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    position: "absolute",
    bottom: 10, // 네비게이션 바 위에 고정
    width: "100%",
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    marginLeft: 10,
  },
  bubble: {
    padding: 10,
    borderRadius: 15,
    margin: 10,
    maxWidth: "80%",
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#DCF8C6",
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
  },
  postImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  messageText: {
    marginTop: 5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 5,
  },
});

export default BoardComponent;
