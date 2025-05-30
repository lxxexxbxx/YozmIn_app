import React, { useEffect, useState } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, FlatList, TextInput, Share, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import supabase from '../../supabase';
import { useUserStore } from "../../stores/UserStore";

const PostDetailComponent = ({ route, navigation }) => {
    const { postId } = route.params;
    
    const userStore = useUserStore();
    const currentUserId = userStore.user_id; // UserStore에서 현재 사용자 ID 가져오기

    const [post, setPost] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [likeCount, setLikeCount] = useState(0); 
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    // 사용자 ID가 없을 때 더 명확한 경고를 콘솔에 표시
    useEffect(() => {
        if (!currentUserId) {
            console.warn("현재 로그인된 사용자 ID가 없습니다. 일부 기능(좋아요, 북마크, 댓글 등)은 로그인 후 이용해주세요.");
        }
    }, [currentUserId]);

    const fetchLikeCount = async () => {
        const { data, error } = await supabase
            .from('post')
            .select('like_cnt')
            .eq('post_id', postId)
            .single();

        if (error) {
            console.error('좋아요 카운트 로딩 실패:', error);
            return;
        }
        setLikeCount(data.like_cnt || 0);
    };

    const fetchPost = async () => {
        const { data, error } = await supabase
            .from('post')
            .select('*')
            .eq('post_id', postId)
            .single();

        if (error) {
            console.error('포스트 로딩 실패:', error);
            return;
        }
        setPost(data);
        setLikeCount(data.like_cnt || 0);
    };

    const fetchIsLiked = async () => {
        if (!currentUserId) {
            setIsLiked(false);
            return;
        }
        const { data } = await supabase
            .from('post_like')
            .select('*')
            .eq('post_id', postId)
            .eq('user_id', currentUserId)
            .single();
        setIsLiked(!!data);
    };

    const fetchComments = async () => {
        const { data, error } = await supabase
            .from('comment')
            .select('*')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('댓글 로딩 실패:', error);
            return;
        }

        const commentsWithLikes = await loadCommentLikes(data || []);
        setComments(commentsWithLikes);
    };

    const loadCommentLikes = async (commentsData) => {
        if (!currentUserId || commentsData.length === 0) {
            return commentsData.map(c => ({...c, isLiked: false, likeCount: c.like_cnt || 0}));
        }
        
        const commentIds = commentsData.map(c => c.id);
        const { data: likedData } = await supabase
            .from('comment_like')
            .select('comment_id')
            .in('comment_id', commentIds)
            .eq('user_id', currentUserId);

        const likedIds = likedData?.map(like => like.comment_id) || [];

        return commentsData.map(c => ({
            ...c,
            isLiked: likedIds.includes(c.id),
            likeCount: c.like_cnt || 0,
        }));
    };

    const toggleCommentLike = async (index) => {
        if (!currentUserId) {
            // 사용자에게 알림 팝업 추가
            Alert.alert('알림', '로그인 후 댓글에 좋아요를 누를 수 있습니다.');
            return;
        }
        const updated = [...comments];
        const comment = updated[index];
        const isNowLiked = !comment.isLiked;

        comment.isLiked = isNowLiked;
        comment.likeCount = (comment.likeCount || 0) + (isNowLiked ? 1 : -1);
        setComments(updated);

        try { 
            if (isNowLiked) {
                const { error } = await supabase
                    .from('comment_like')
                    .insert([{ user_id: currentUserId, comment_id: comment.id }]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('comment_like')
                    .delete()
                    .eq('user_id', currentUserId)
                    .eq('comment_id', comment.id);
                if (error) throw error;
            }
        } catch (error) {
            console.error('댓글 좋아요 작업 실패:', error);
            Alert.alert('오류', `댓글 좋아요 변경 중 오류가 발생했습니다: ${error.message}`);
            // 에러 발생 시 UI 상태 원복
            comment.isLiked = !isNowLiked; 
            comment.likeCount = (comment.likeCount || 0) + (isNowLiked ? -1 : 1);
            setComments([...updated]); 
        }
    };

    const checkBookmarkStatus = async () => {
        if (!currentUserId) {
            setIsBookmarked(false);
            return;
        }
        const { data, error } = await supabase
            .from('bookmark')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('post_id', postId)
            .single();

        setIsBookmarked(!!data && !error);
    };

    const toggleBookmark = async () => {
        if (!currentUserId) {
            // 사용자에게 알림 팝업 추가
            Alert.alert('알림', '로그인 후 게시글을 북마크할 수 있습니다.');
            return;
        }
        const newBookmark = !isBookmarked;
        setIsBookmarked(newBookmark);

        try {
            if (newBookmark) {
                const { error } = await supabase
                    .from('bookmark')
                    .insert([{ user_id: currentUserId, post_id: postId }]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('bookmark')
                    .delete()
                    .eq('user_id', currentUserId)
                    .eq('post_id', postId);
                if (error) throw error;
            }
        } catch (error) {
            console.error('북마크 작업 실패:', error);
            setIsBookmarked(!newBookmark);
            Alert.alert('오류', `북마크 변경 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    const toggleLike = async () => {
        if (!currentUserId) {
            // 사용자에게 알림 팝업 추가
            Alert.alert('알림', '로그인 후 좋아요를 누를 수 있습니다.');
            return; 
        }
        
        setIsLiked(prev => !prev); 

        try {
            if (isLiked) { 
                await supabase.rpc('unlike_post', {
                    p_post_id: postId,
                    p_user_id: currentUserId,
                });
            } else { 
                await supabase.rpc('like_post', {
                    p_post_id: postId,
                    p_user_id: currentUserId,
                });
            }
            await fetchLikeCount(); 

        } catch (e) {
            console.error('❌ 좋아요 토글 에러 (RPC):', e);
            Alert.alert('오류', '좋아요 상태 변경 중 오류가 발생했습니다.');
            setIsLiked(prev => !prev);
            await fetchLikeCount(); 
        }
    };

    const addComment = async () => {
        if (!currentUserId) {
            // 사용자에게 알림 팝업 추가
            Alert.alert('알림', '로그인 후 댓글을 작성할 수 있습니다.');
            return;
        }
        if (!newComment.trim()) return;

        const newCommentObj = {
            post_id: postId,
            user_id: currentUserId,
            comment: newComment,
        };

        const { data, error } = await supabase.from('comment').insert(newCommentObj).select().single();

        if (error) {
            console.error('댓글 저장 실패:', error);
            Alert.alert('오류', '댓글 저장 중 오류가 발생했습니다.');
            return;
        }

        await fetchComments();
        setNewComment('');
    };

    const sharePost = async () => {
        try {
            await Share.share({
                message: `${post.content}\n\n${post.image_url || ''}`,
            });
        } catch (error) {
            console.error('공유 실패:', error);
            Alert.alert('오류', '게시글 공유에 실패했습니다.');
        }
    };

    const incrementViewCount = async () => {
        try {
            // postId가 UUID 타입일 것이므로, RPC 함수 호출 시 명시적으로 타입 변환
            // SQL 함수 인자가 uuid 타입으로 변경되었다면, 이 부분은 그대로 둬도 됩니다.
            // 하지만 만약을 위해 명시적인 캐스팅을 사용할 수 있습니다.
            // 예: p_post_id: postId.toString() 또는 그냥 postId
            const { error } = await supabase.rpc('increment_post_view_count', {
                p_post_id: postId, // SQL 함수 인자가 uuid 타입일 경우 'postId' 그대로 전달
            });
            if (error) {
                console.error('조회수 증가 실패:', error);
            } else {
                await fetchPost(); 
            }
        } catch (e) {
            console.error('조회수 증가 RPC 호출 중 예외 발생:', e);
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchPost();
            await fetchIsLiked(); 
            await checkBookmarkStatus();
            await fetchComments(); 
            
            // 조회수 증가 함수 호출 (게시글 로딩 후)
            await incrementViewCount();

            setLoading(false);
        })();
    }, [postId, currentUserId]);

    if (loading || !post) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    const renderComment = ({ item, index }) => (
        <View style={styles.comment}>
            <Image source={{ uri: item.profile_image || 'https://via.placeholder.com/40' }} style={styles.commentProfileImage} />
            <View style={styles.commentContent}>
                <Text>{item.comment}</Text>
                <TouchableOpacity onPress={() => toggleCommentLike(index)} style={styles.commentLikeButton}>
                    <FontAwesome name={item.isLiked ? 'heart' : 'heart-o'} size={16} color="gray" />
                    <Text style={styles.commentLikeCount}>{item.likeCount || 0}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
                    <FontAwesome name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <View style={styles.profileContainer}>
                    <Image source={{ uri: post.profile_image || 'https://via.placeholder.com/40' }} style={styles.profileImage} />
                    <Text style={styles.profileName}>{post.user_name || '익명'}</Text>
                </View>
            </View>

            <ScrollView style={styles.contentScroll}>
                {post.image_url && <Image source={{ uri: post.image_url }} style={styles.image} />}

                <View style={styles.postContainer}>
                    <Text style={styles.text}>{post.content || '내용 없음'}</Text>
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
                            <FontAwesome name={isLiked ? 'heart' : 'heart-o'} size={24} color="red" />
                            <Text style={styles.actionText}>{likeCount}</Text>
                        </TouchableOpacity>
                        <View style={styles.actionGroup}>
                            <View style={styles.actionButton}>
                                <FontAwesome name="eye" size={24} color="gray" />
                                <Text style={styles.actionText}>{post.view_count || 0}</Text> 
                            </View>
                            <TouchableOpacity onPress={toggleBookmark} style={styles.actionButton}>
                                <FontAwesome name={isBookmarked ? 'bookmark' : 'bookmark-o'} size={24} color="gray" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={sharePost} style={styles.actionButton}>
                                <FontAwesome name="share-alt" size={24} color="gray" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.commentSection}>
                    <View style={styles.commentHeader}>
                        <FontAwesome name="comments" size={20} color="black" />
                        <Text style={styles.commentTitle}>댓글</Text>
                        <Text style={styles.commentCount}>{comments.length}</Text>
                    </View>

                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            value={newComment}
                            onChangeText={setNewComment}
                            placeholder="댓글을 입력하세요..."
                            placeholderTextColor="gray"
                        />
                        <TouchableOpacity 
                            onPress={addComment} 
                            style={styles.sendButton}
                            disabled={!newComment.trim()} 
                        >
                            <FontAwesome 
                                name="arrow-right" 
                                size={20} 
                                color={!newComment.trim() ? '#AAA' : 'white'} 
                            />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: { flexDirection: 'row', alignItems: 'center', padding: 10, marginTop: 30 },
    profileContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
    profileImage: { width: 40, height: 40, borderRadius: 20 },
    profileName: { marginLeft: 10, fontSize: 16 },
    contentScroll: { flex: 1 },
    image: { width: '100%', height: undefined, aspectRatio: 1, resizeMode: 'contain' },
    postContainer: { padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, margin: 10 },
    text: { fontSize: 16, marginBottom: 10 },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    actionButton: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    actionGroup: { flexDirection: 'row' },
    actionText: { marginLeft: 5 },
    commentSection: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, margin: 10, paddingBottom: 10 },
    commentHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
    commentTitle: { marginLeft: 10, fontSize: 18, fontWeight: 'bold' },
    commentCount: { marginLeft: 10 },
    commentInputContainer: { flexDirection: 'row', padding: 10 },
    commentInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, paddingHorizontal: 10, color: 'black' },
    sendButton: { marginLeft: 10, backgroundColor: '#007bff', borderRadius: 5, padding: 10, justifyContent: 'center' },
    comment: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: '#eee' },
    commentProfileImage: { width: 30, height: 30, borderRadius: 15, marginRight: 8 },
    commentContent: { marginLeft: 10, flex: 1 },
    commentLikeButton: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    commentLikeCount: { marginLeft: 5 },
});

export default PostDetailComponent;