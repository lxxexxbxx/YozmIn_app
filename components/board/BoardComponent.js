import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import supabase from '../../supabase';
import ImageUploader from '../../Images/ImageUploader';
import { useUserStore } from "../../stores/UserStore";

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
    const fetchPosts = async () => {
        const { data: postData, error } = await supabase
            .from('post')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('게시글 가져오기 오류:', error);
            return;
        }

        // 로그인 여부와 관계없이 게시글을 가져오므로, currentUserId가 없어도 진행
        let likedPostIds = [];
        if (currentUserId) { // currentUserId가 있을 때만 좋아요 여부 확인
            const { data: likeData } = await supabase
                .from('post_like')
                .select('post_id')
                .eq('user_id', currentUserId);
            likedPostIds = likeData?.map((like) => like.post_id) || [];
        }

        const formattedPosts = postData.map((post) => ({
            id: post.post_id.toString(), // postId는 여전히 숫자형으로 가정하고 toString
            text: post.content,
            image: post.image_url ? { uri: post.image_url } : null,
            likes: post.like_cnt,
            comments: post.comment_cnt || 0,
            hasLiked: likedPostIds.includes(post.post_id),
            isMine: post.user_id === currentUserId, // 내 게시글 여부 확인
        }));

        setPosts(formattedPosts);
        // console.log('게시글 불러오기 완료.');
    };

    // useFocusEffect는 화면이 포커스될 때마다 fetchPosts를 호출
    useFocusEffect(
        useCallback(() => {
            fetchPosts();
        }, [currentUserId]) // currentUserId가 변경될 때도 다시 불러오도록 의존성 배열에 추가
    );

    useEffect(() => {
        const channel = supabase
            .channel('realtime-posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'post' }, (payload) => {
                // console.log('📡 실시간 변경 감지:', payload);
                fetchPosts(); // 게시글 변경 시 다시 불러오기
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleImageUploadSuccess = (url) => {
        setUploadedImageUrl(url);
    };

    const handleImageUploadStatusChange = (status) => {
        setIsImageUploading(status);
    };

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
             console.warn("게시글 작성 실패: currentUserId가 없습니다.");
             return;
        }


        try {
            const postData = {
                content: message,
                image_url: uploadedImageUrl,
                like_cnt: 0,
                comment_cnt: 0,
                user_id: currentUserId, // UserStore에서 가져온 user_id 사용
            };

            const { data, error } = await supabase.from('post').insert([postData]);

            if (error) {
                console.error('❌ 게시글 저장 실패:', error.message);
                Alert.alert('오류', `게시글 저장 실패: ${error.message}`);
                return;
            }

            Alert.alert('성공', '게시글이 성공적으로 작성되었습니다!');
            setMessage('');
            setUploadedImageUrl(null);

            if (imageUploaderRef.current && imageUploaderRef.current.resetImage) {
                imageUploaderRef.current.resetImage();
            }

            fetchPosts(); // 게시글 작성 후 목록 갱신
        } catch (e) {
            console.error('❗ 예외 발생:', e);
            Alert.alert('오류', '게시글 제출 중 알 수 없는 오류가 발생했습니다.');
        }
    };

    const toggleLike = async (postId, hasLiked) => {

        if (!currentUserId) { // 로그인 여부 확인 제거 (UUID 오류 해결 위해)
             Alert.alert('오류', '좋아요를 누르려면 로그인해야 합니다.'); // 사용자 경험을 위해 경고는 유지
             return;
        }

        try {
            let rpcResponse;
            if (hasLiked) {
                rpcResponse = await supabase.rpc('unlike_post', {
                    p_post_id: postId,
                    p_user_id: currentUserId,
                });
            } else {
                rpcResponse = await supabase.rpc('like_post', {
                    p_post_id: postId,
                    p_user_id: currentUserId,
                });
            }

            if (rpcResponse.error) {
                console.error('❌ 좋아요/취소 RPC 오류:', rpcResponse.error.message);
                return; // 에러 발생 시 더 이상 진행하지 않음
            }

            fetchPosts(); // 좋아요 상태 변경 후 게시물 다시 가져오기
        } catch (e) {
            console.error('❌ 좋아요 토글 에러 (RPC):', e.message);
            Alert.alert('오류', `좋아요 처리 중 오류가 발생했습니다: ${e.message}`);
        }
    };

    const handlePress = (post) => {
        navigation.navigate('PostDetail', {
            postId: post.id,
            hasLiked: post.hasLiked,
            likeCount: post.likes,
            // user_id는 PostDetail에서 필요하다면 UserStore를 통해 직접 가져오도록 합니다.
        });
    };

    const renderPost = ({ item }) => (
        <TouchableOpacity
            onPress={() => handlePress(item)}
            style={[styles.postContainer, item.isMine ? styles.myPost : styles.otherPost]}
        >
            <Image source={item.profileImage || require('../../assets/User.jpg')} style={styles.profileImage} />
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
                inverted // 최신 게시글이 아래로 오도록 (채팅처럼)
            />
            {/* 게시글 작성 입력창 및 미리보기 영역 */}
            <View style={styles.inputWrapper}>
                {/* 사진 미리보기 영역 (댓글창 위쪽) */}
                {uploadedImageUrl && (
                    <View style={styles.largeImagePreviewContainer}>
                        <Image source={{ uri: uploadedImageUrl }} style={styles.largeImagePreview} />
                        {!isImageUploading && (
                            <TouchableOpacity
                                onPress={() => {
                                    setUploadedImageUrl(null);
                                    if (imageUploaderRef.current && imageUploaderRef.current.resetImage) {
                                        imageUploaderRef.current.resetImage();
                                    }
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
                    {/* ImageUploader 컴포넌트: 작은 사진 버튼 역할 (미리보기 없음) */}
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
    content: { fontSize: 14, color: 'black' },
    postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    footerText: { fontSize: 12, color: '#666', marginLeft: 5 },
    iconSpacing: { marginLeft: 15 },
    postImage: { width: '100%', height: 150, marginTop: 5, borderRadius: 10 },

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
});

export default BoardComponent;