import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome6';
import { useNavigation } from '@react-navigation/native';

const PostDetailComponent = ({ route }) => {
  const { post } = route.params;
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FontAwesome name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Image source={post.profileImage} style={styles.profileImage} />
        <Text style={styles.userName}>{post.user}</Text>
      </View>

      <ScrollView>
        {post.image && <Image source={post.image} style={styles.postImage} />}
        <Text style={styles.content}>{post.content}</Text>
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
});

export default PostDetailComponent;
