import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import supabase from '../../supabase';

const TEST_USER_ID = 'f0334b06-3076-4858-8cb7-47b3804f0696'; // 실제 존재하는 유효한 uuid

const BoardComponent = () => {
	const navigation = useNavigation();
	const [posts, setPosts] = useState([]);
	const [message, setMessage] = useState('');
	const [imageUri, setImageUri] = useState(null);

	const fetchPosts = async () => {
		const { data: postData, error } = await supabase
			.from('post')
			.select('*')
			.order('created_at', { ascending: false });

		const { data: likeData } = await supabase
			.from('post_like')
			.select('post_id')
			.eq('user_id', TEST_USER_ID);

		const likedPostIds = likeData?.map((like) => like.post_id) || [];

		const formattedPosts = postData.map((post) => ({
			id: post.post_id.toString(),
			text: post.content,
			image: post.image_url ? { uri: post.image_url } : null,
			likes: post.like_cnt,
			comments: post.comment_cnt || 0,
			hasLiked: likedPostIds.includes(post.post_id),
			isMine: true,
		}));

		setPosts(formattedPosts);
	};

	useFocusEffect(
		useCallback(() => {
			fetchPosts();
		}, [])
	);

	useEffect(() => {
		const channel = supabase
			.channel('realtime-posts')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'post' }, (payload) => {
				console.log('📡 실시간 변경 감지:', payload);
				fetchPosts();
			})
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, []);

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

	const handleSend = async () => {
		try {
			const { data, error } = await supabase.from('post').insert([
				{
					content: message,
					image_url: imageUri || null,
					like_cnt: 0,
					comment_cnt: 0,
					user_id: TEST_USER_ID,
				},
			]);

			if (error) {
				console.error('❌ 게시글 저장 실패:', error.message);
				return;
			}

			setMessage('');
			setImageUri(null);
		} catch (e) {
			console.error('❗ 예외 발생:', e);
		}
	};

	// === 좋아요 토글 로직 (이 부분은 이미 수정된 DB 함수 호출에 맞춰져 있습니다) ===
	const toggleLike = async (postId, hasLiked) => {
		try {
			if (hasLiked) {
				// like_post(uuid, text) 함수 호출
				await supabase.rpc('unlike_post', {
					p_post_id: postId,
					p_user_id: TEST_USER_ID, // user_id (text) 전달
				});
			} else {
				// unlike_post(uuid, text) 함수 호출
				await supabase.rpc('like_post', {
					p_post_id: postId,
					p_user_id: TEST_USER_ID, // user_id (text) 전달
				});
			}

			fetchPosts(); // DB 변경 후 목록 상태 갱신
		} catch (e) {
			console.error('❌ 좋아요 토글 에러 (RPC):', e);
			// 에러 처리 UI/로직 추가 고려
		}
	};
	// ==================================================================


	const handlePress = (post) => {
		navigation.navigate('PostDetail', {
			postId: post.id,
			hasLiked: post.hasLiked,
			likeCount: post.likes,
		});
	};

	const renderPost = ({ item }) => (
		<TouchableOpacity
			onPress={() => handlePress(item)}
			style={[styles.postContainer, item.isMine ? styles.myPost : styles.otherPost]}
		>
			{!item.isMine && <Image source={item.profileImage} style={styles.profileImage} />}
			<View style={styles.bubble}>
				{item.image && <Image source={item.image} style={styles.postImage} />}
				<Text style={styles.content}>{item.text}</Text>
				<View style={styles.postFooter}>
					{/* 좋아요 버튼: toggleLike 함수에 postId와 현재 좋아요 상태(hasLiked) 전달 */}
					<TouchableOpacity onPress={() => toggleLike(item.id, item.hasLiked)}>
						<Ionicons
							name={item.hasLiked ? 'heart' : 'heart-outline'}
							size={20}
							color={item.hasLiked ? 'red' : 'black'}
						/>
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
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		borderTopWidth: 1,
		borderColor: '#ddd',
	},
	input: {
		flex: 1,
		marginLeft: 10,
		marginRight: 10,
		padding: 8,
		borderRadius: 20,
		backgroundColor: '#FFF',
	},
	notice: {
		textAlign: 'center',
		marginVertical: 10,
		fontSize: 24,
		fontWeight: 'bold',
		color: 'black',
		marginTop: 50,
	},
});

export default BoardComponent;