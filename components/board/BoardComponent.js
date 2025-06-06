import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import supabase from '../../supabase';
import ImageUploader from '../../Images/ImageUploader';

const TEST_USER_ID = 'f0334b06-3076-4858-8cb7-47b3804f0696'; // 실제 존재하는 유효한 uuid (로그인 연동 시 실제 사용자 ID로 변경)

const { width } = Dimensions.get('window'); // 화면 너비 가져오기

const BoardComponent = () => {
    const navigation = useNavigation();
    const [posts, setPosts] = useState([]);
    const [message, setMessage] = useState('');
    const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // ImageUploader로부터 받은 공개 URL 저장
    const [isImageUploading, setIsImageUploading] = useState(false); // 이미지 업로드 중인지 여부 (전송 버튼 비활성화용)

    const imageUploaderRef = useRef(null); 

    const fetchPosts = async () => {
        console.log('Fetching posts...');
        const { data: postData, error } = await supabase
            .from('post')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('게시글 가져오기 오류:', error);
            return;
        }

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
            isMine: post.user_id === TEST_USER_ID,
        }));

        setPosts(formattedPosts);
        console.log('Posts fetched and set.');
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

        try {
            const postData = {
                content: message,
                image_url: uploadedImageUrl,
                like_cnt: 0,
                comment_cnt: 0,
                user_id: TEST_USER_ID,
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

            fetchPosts();
        } catch (e) {
            console.error('❗ 예외 발생:', e);
            Alert.alert('오류', '게시글 제출 중 알 수 없는 오류가 발생했습니다.');
        }
    };

    const toggleLike = async (postId, hasLiked) => {
        try {
            if (hasLiked) {
                await supabase.rpc('unlike_post', {
                    p_post_id: postId,
                    p_user_id: TEST_USER_ID,
                });
            } else {
                await supabase.rpc('like_post', {
                    p_post_id: postId,
                    p_user_id: TEST_USER_ID,
                });
            }
            fetchPosts();
        } catch (e) {
            console.error('❌ 좋아요 토글 에러 (RPC):', e);
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
                inverted
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
                        style={styles.imageUploaderButton} // 새 스타일 적용
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
                        style={styles.sendButton} // 새 스타일 적용
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
        alignItems: 'center', // 여전히 flex-end를 유지하여 TextInput이 늘어날 때 하단 정렬 유지
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
        // TextInput 자체는 높이 변화에 따라 동적으로 조절되므로,
        // 명시적인 alignSelf를 주지 않아도 됩니다.
    },
    // ImageUploader 버튼과 Send 버튼을 세로 중앙에 정렬하기 위한 스타일
    imageUploaderButton: {
        alignSelf: 'center', // 이 컴포넌트 내부의 컨테이너를 중앙 정렬
    },
    sendButton: {
        alignSelf: 'center', // 이 버튼을 중앙 정렬
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