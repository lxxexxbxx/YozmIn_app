import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import supabase from '../../supabase';
import ImageUploader from '../../Images/ImageUploader';
import { useUserStore } from "../../stores/UserStore";
import dayjs from './day';

const { width } = Dimensions.get('window');

const BoardComponent = () => {
    const navigation = useNavigation();
    const [posts, setPosts] = useState([]);
    const [message, setMessage] = useState('');
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
    const [isImageUploading, setIsImageUploading] = useState(false);

    const imageUploaderRef = useRef(null);
    const userStore = useUserStore();
    const currentUserId = userStore.user_id;
    
    const fetchPosts = useCallback(async () => {
        const { data: postData, error } = await supabase
            .from('post')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('게시글 가져오기 오류:', error);
            return;
        }

        let likedPostIds = [];
        if (currentUserId) {
            const { data: likeData } = await supabase
                .from('post_like')
                .select('post_id')
                .eq('user_id', currentUserId);
            likedPostIds = likeData?.map((like) => like.post_id) || [];
        }

        const formattedPosts = postData.map((post) => ({
            id: post.post_id,
            text: post.content,
            image: post.image_url ? { uri: post.image_url } : null,
            likes: post.like_cnt,
            comments: post.comment_cnt || 0,
            hasLiked: likedPostIds.includes(post.post_id),
            isMine: post.user_id === currentUserId,
            created_at: post.created_at,
            profileImage: post.profiles?.avatar_url ? { uri: post.profiles.avatar_url } : require('../../assets/User.jpg')
        }));

        setPosts(formattedPosts);
    }, [currentUserId]);

    useFocusEffect(
        useCallback(() => {
            fetchPosts();
        }, [fetchPosts])
    );

    useEffect(() => {
        const channel = supabase
            .channel('realtime-posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post' }, (payload) => {
                fetchPosts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPosts]);

    const handleImageUploadSuccess = (url) => setUploadedImageUrl(url);
    const handleImageUploadStatusChange = (status) => setIsImageUploading(status);

    const handleSend = async () => {
        if (isImageUploading) {
            Alert.alert('알림', '사진 업로드 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        if (!message.trim() && !uploadedImageUrl) {
            Alert.alert('경고', '내용 또는 사진을 입력해주세요.');
            return;
        }
        if (!currentUserId) {
            Alert.alert('오류', '사용자 정보가 없어 게시글을 작성할 수 없습니다. 로그인 상태를 확인해주세요.');
            return;
        }

        try {
            const postData = {
                content: message,
                image_url: uploadedImageUrl,
                like_cnt: 0,
                comment_cnt: 0,
                user_id: currentUserId,
            };
            const { data, error } = await supabase.from('post').insert([postData]);
            if (error) {
                Alert.alert('오류', `게시글 저장 실패: ${error.message}`);
                return;
            }

            setMessage('');
            setUploadedImageUrl(null);
            if (imageUploaderRef.current?.resetImage) imageUploaderRef.current.resetImage();
            fetchPosts();
        } catch (e) {
            Alert.alert('오류', '게시글 제출 중 알 수 없는 오류가 발생했습니다.');
        }
    };

    const toggleLike = async (postId, hasLiked) => {
        if (!currentUserId) {
            Alert.alert('오류', '좋아요를 누르려면 로그인해야 합니다.');
            return;
        }
        try {
            let rpcResponse;
            if (hasLiked) {
                rpcResponse = await supabase.rpc('unlike_post', { p_post_id: postId, p_user_id: currentUserId });
            } else {
                rpcResponse = await supabase.rpc('like_post', { p_post_id: postId, p_user_id: currentUserId });
            }
            if (rpcResponse.error) {
                console.error('좋아요/취소 RPC 오류:', rpcResponse.error.message);
                return;
            }
            fetchPosts();
        } catch (e) {
            console.error('좋아요 토글 에러:', e.message);
        }
    };

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
            <Image source={item.profileImage} style={styles.profileImage} />
            <View style={styles.bubble}>
                {item.image && <Image source={item.image} style={styles.postImage} />}
                <Text style={styles.content}>{item.text}</Text>
                <View style={styles.postFooter}>
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
                    <Text style={styles.postDate}>{item.created_at? dayjs.utc(item.created_at).tz("Asia/Seoul").fromNow(): '시간 없음'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.notice}>최신 트렌드를 사람들과 공유 해보세요!</Text>
            {posts && posts.length > 0 ? (
                <FlatList
                    data={posts}
                    renderItem={renderPost}
                    keyExtractor={(item) => item.id}
                    inverted
                />
            ) : (
                <Text style={{ padding: 10 }}>게시물이 없습니다.</Text>
            )}

            <View style={styles.inputWrapper}>
                {uploadedImageUrl && (
                    <View style={styles.largeImagePreviewContainer}>
                        <Image source={{ uri: uploadedImageUrl }} style={styles.largeImagePreview} />
                        {!isImageUploading && (
                            <TouchableOpacity
                                onPress={() => {
                                    setUploadedImageUrl(null);
                                    imageUploaderRef.current?.resetImage?.();
                                }}
                                style={styles.removeLargeImageButton}
                            >
                                <Ionicons name="close-circle" size={28} color="red" />
                            </TouchableOpacity>
                        )}
                        {isImageUploading && (
                            <ActivityIndicator size="large" color="#007AFF" style={styles.largeActivityIndicator} />
                        )}
                    </View>
                )}

                <View style={styles.commentInputContainer}>
                    <ImageUploader
                        ref={imageUploaderRef}
                        onUploadSuccess={handleImageUploadSuccess}
                        onUploadStart={handleImageUploadStatusChange}
                        onUploadEnd={handleImageUploadStatusChange}
                        style={styles.imageUploaderButton}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="메시지를 입력하세요..."
                        value={message}
                        onChangeText={setMessage}
                        multiline={true}
                        maxHeight={100}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={isImageUploading || (!message.trim() && !uploadedImageUrl)}
                        style={styles.sendButton}
                    >
                        <Ionicons
                            name="send"
                            size={28}
                            color={(isImageUploading || (!message.trim() && !uploadedImageUrl)) ? '#CCC' : '#007AFF'}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    notice: {
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 24,
        fontWeight: 'bold',
        color: 'black',
        marginTop: 50,
    },
    postContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 8,
        marginHorizontal: 10
    },
    myPost: {
        justifyContent: 'flex-end'
    },
    otherPost: {
        justifyContent: 'flex-start'
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 8
    },
    bubble: {
        maxWidth: '70%',
        padding: 12,
        borderRadius: 15,
        backgroundColor: 'white',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    content: { fontSize: 14, color: 'black', marginTop: 5 },
    postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    footerText: { fontSize: 12, color: '#666', marginLeft: 5 },
    iconSpacing: { marginLeft: 15 },
    postImage: { width: '100%', height: 150, marginTop: 5, borderRadius: 10 },
    postDate: { fontSize: 12, color: 'gray', marginLeft: 10},  

    inputWrapper: {
        paddingBottom: 10,
        backgroundColor: '#F5F5F5',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 25,
        marginHorizontal: 10,
        marginBottom: 5,
        borderColor: '#e0e0e0',
        borderWidth: 1,
    },
    input: {
        flex: 1,
        marginLeft: 8,
        marginRight: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        fontSize: 16,
    },
    imageUploaderButton: {
        alignSelf: 'center',
    },
    sendButton: {
        alignSelf: 'center',
    },
    largeImagePreviewContainer: {
        alignSelf: 'center',
        width: width * 0.5,
        height: width * 0.5 * (3 / 4),
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 10,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    largeImagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeLargeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 14,
        padding: 2,
    },
    largeActivityIndicator: {
        position: 'absolute',
    }
});export default BoardComponent;