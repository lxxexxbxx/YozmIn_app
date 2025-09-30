import React, { useEffect, useState } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, TextInput,
    Share, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, FlatList
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { FontAwesome } from '@expo/vector-icons';
import supabase from '../../supabase';
import { useUserStore } from "../../stores/UserStore";

const PostDetailComponent = ({ route, navigation }) => {
    const { postId } = route.params;
    
    const userStore = useUserStore();
    const currentUserId = userStore.user_id;

    const [post, setPost] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [likeCount, setLikeCount] = useState(0); 
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const [selectedComment, setSelectedComment] = useState(null);
    const [isCommentMenuVisible, setIsCommentMenuVisible] = useState(false);

    useEffect(() => {
        if (!currentUserId) {
            console.warn("현재 로그인된 사용자 ID가 없습니다. 일부 기능은 로그인 후 이용해주세요.");
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
            .select(`*`)
            .eq('post_id', postId)
            .single();

        if (error) {
            console.error('포스트 로딩 실패:', error);
            setPost(null);
            return;
        }
        const postWithProfile = await loadUserProfile(data);
        setPost(postWithProfile);
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
            .select(`*`)
            .eq('post_id', postId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });
    
        if (error) {
            console.error('댓글 로딩 실패:', error);
            return;
        }
        const commentsWithProfiles = await Promise.all(
            (data || []).map(comment => loadUserProfile(comment))
        );
        const commentsWithLikes = await loadCommentLikes(commentsWithProfiles);
        setComments(commentsWithLikes);
    };
    
    const loadUserProfile = async (item) => {
        if (!item || !item.user_id) {
            return { ...item, profiles: { username: '익명', avatar_url: null } };
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('user_id', item.user_id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.warn(`프로필 로딩 실패 for user_id ${item.user_id}:`, error.message);
        }

        return {
            ...item,
            profiles: data || { username: '익명', avatar_url: null }
        };
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
            Alert.alert('알림', '로그인 후 댓글에 좋아요를 누를 수 있습니다.');
            return;
        }
        
        const updatedComments = [...comments];
        const commentToUpdate = updatedComments[index];
        const isCurrentlyLiked = commentToUpdate.isLiked;

        commentToUpdate.isLiked = !isCurrentlyLiked;
        commentToUpdate.likeCount = isCurrentlyLiked ? Math.max(0, (commentToUpdate.likeCount || 0) - 1) : (commentToUpdate.likeCount || 0) + 1;
        setComments(updatedComments);

        try { 
            if (isCurrentlyLiked) {
                await supabase.from('comment_like')
                    .delete()
                    .eq('user_id', currentUserId)
                    .eq('comment_id', commentToUpdate.id);
                await supabase.rpc('decrement_comment_like_count', {
                    p_comment_id: commentToUpdate.id
                });
            } else {
                await supabase.from('comment_like')
                    .insert([{ user_id: currentUserId, comment_id: commentToUpdate.id }]);
                await supabase.rpc('increment_comment_like_count', {
                    p_comment_id: commentToUpdate.id
                });
            }
            const { data: updatedCommentData } = await supabase
                .from('comment')
                .select('like_cnt')
                .eq('id', commentToUpdate.id)
                .single();

            const finalUpdatedComments = [...comments];
            finalUpdatedComments[index].likeCount = updatedCommentData.like_cnt || 0;
            setComments(finalUpdatedComments);

        } catch (error) {
            console.error('댓글 좋아요 작업 실패:', error);
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
            Alert.alert('알림', '로그인 후 게시글을 북마크할 수 있습니다.');
            return;
        }
        const newBookmark = !isBookmarked;
        setIsBookmarked(newBookmark);

        try {
            if (newBookmark) {
                await supabase.from('bookmark')
                    .insert([{ user_id: currentUserId, post_id: postId }]);
            } else {
                await supabase.from('bookmark')
                    .delete()
                    .eq('user_id', currentUserId)
                    .eq('post_id', postId);
            }
        } catch (error) {
            console.error('북마크 작업 실패:', error);
            setIsBookmarked(!newBookmark);
        }
    };

    const toggleLike = async () => {
        if (!currentUserId) {
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
            setIsLiked(prev => !prev);
        }
    };

    const addComment = async () => {
        if (!currentUserId) {
            Alert.alert('알림', '로그인 후 댓글을 작성할 수 있습니다.');
            return;
        }
        if (!newComment.trim()) return;

        const newCommentObj = {
            post_id: postId,
            user_id: currentUserId,
            comment: newComment,
        };

        const { error } = await supabase.from('comment').insert(newCommentObj);
        if (error) {
            console.error('댓글 저장 실패:', error);
            return;
        }
        await supabase.rpc('increment_comment_count', { p_post_id: postId });
        await fetchComments();
        setNewComment('');
    };

    const deleteCommentRpc = async (commentId, post_id) => {
        try {
            await supabase.rpc('delete_comment', {
                p_comment_id: Number(commentId),
                p_post_id: post_id,
            });
            await fetchComments();
            await fetchPost();
            cancelCommentMenu();
        } catch (error) {
            console.error('댓글 삭제 실패:', error);
        }
    };

    const deleteComment = (comment) => {
        setSelectedComment(comment);
        setIsCommentMenuVisible(true);
    };

    const cancelCommentMenu = () => {
        setSelectedComment(null);
        setIsCommentMenuVisible(false);
    };

    const onCopyComment = async () => {
        if (selectedComment?.comment) {
            await Clipboard.setStringAsync(selectedComment.comment);
            Alert.alert("복사 완료", "댓글이 클립보드에 복사되었습니다.");
        }
        cancelCommentMenu();
    };

    const onReportComment = () => {
        Alert.alert("신고 접수", "신고가 접수되었습니다. 검토 후 조치됩니다.");
        cancelCommentMenu();
    };

    const onConfirmDelete = () => {
        if (!selectedComment) return;
        deleteCommentRpc(selectedComment.id, postId);
    };

    const sharePost = async () => {
        try {
            await Share.share({
                message: `${post.content}\n\n${post.image_url || ''}`,
            });
        } catch (error) {
            console.error('공유 실패:', error);
        }
    };

    const onReportPost = async () => {
        if (!currentUserId) {
            Alert.alert('알림', '로그인 후 신고할 수 있습니다.');
            return;
        }
        try {
            const payload = {
                target_type: 'post',
                target_id: String(postId),
                reporter_id: currentUserId,
            };
            const { error } = await supabase.from('reports').insert(payload);
            if (error) {
                if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('duplicate'))) {
                    Alert.alert('알림', '이미 신고한 게시글입니다.');
                } else {
                    console.error('게시글 신고 실패:', error);
                    Alert.alert('오류', '게시글 신고 중 오류가 발생했습니다.');
                }
                return;
            }
            Alert.alert('신고 접수', '게시글 신고가 접수되었습니다. 검토 후 조치됩니다.');
        } catch (e) {
            console.error('게시글 신고 예외:', e);
        }
    };

    const incrementViewCount = async () => {
        try {
            await supabase.rpc('increment_post_view_count', { p_post_id: postId });
            await fetchPost(); 
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

    const renderComment = ({ item, index }) => {
        const isMyComment = item.user_id === currentUserId;
        return (
            <View style={styles.comment}>
                <Image
                    source={{ uri: item.profiles?.avatar_url || 'https://via.placeholder.com/40' }}
                    style={styles.commentProfileImage}
                />
                <View style={styles.commentContent}>
                    <View style={styles.commentHeaderRow}>
                        <Text style={styles.commentUserName}>{item.profiles?.username || '익명'}</Text>
                        <View style={styles.commentMenuWrapper}>
                            <TouchableOpacity onPress={() => deleteComment(item)} style={styles.commentMenuButtonSmall}>
                                <FontAwesome name="ellipsis-h" size={18} color="gray" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text>{item.comment}</Text>
                    <View style={styles.commentFooter}>
                        <TouchableOpacity onPress={() => toggleCommentLike(index)} style={styles.commentLikeButton}>
                            <FontAwesome name={item.isLiked ? 'heart' : 'heart-o'} size={16} color="gray" />
                            <Text style={styles.commentLikeCount}>{item.likeCount || 0}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderComments = () => {
        if (!comments || comments.length === 0) {
            return <Text style={styles.noCommentsText}>등록된 댓글이 없습니다.</Text>;
        }
        return (
            <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
            />
        );
    };

    return (
        <View style={styles.container}>
            <Modal
                visible={isCommentMenuVisible}
                animationType="fade"
                transparent
                onRequestClose={cancelCommentMenu}
            >
                <TouchableWithoutFeedback onPress={cancelCommentMenu}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>댓글 옵션</Text>
                                <TouchableOpacity style={styles.modalButton} onPress={onCopyComment}>
                                    <Text style={styles.modalButtonText}>복사</Text>
                                </TouchableOpacity>
                                <View style={styles.modalSeparator} />
                                <TouchableOpacity style={styles.modalButton} onPress={onReportComment}>
                                    <Text style={styles.modalButtonText}>신고</Text>
                                </TouchableOpacity>
                                {selectedComment?.user_id === currentUserId && (
                                    <>
                                        <View style={styles.modalSeparator} />
                                        <TouchableOpacity style={styles.modalButton} onPress={onConfirmDelete}>
                                            <Text style={[styles.modalButtonText, { color: 'red' }]}>삭제</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                <View style={styles.modalSeparator} />
                                <TouchableOpacity style={styles.modalButton} onPress={cancelCommentMenu}>
                                    <Text style={styles.modalButtonText}>취소</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
                    <FontAwesome name="arrow-left" size={24} color="black" />
                </TouchableOpacity>
                <View style={styles.profileContainer}>
                    <Image source={{ uri: post.profiles?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.profileImage} />
                    <Text style={styles.profileName}>{post.profiles?.username || '익명'}</Text>
                </View>
            </View>

            <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <View style={styles.contentContainer}>
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
                                    <TouchableOpacity onPress={onReportPost} style={styles.actionButton}>
                                        <FontAwesome name="exclamation-circle" size={24} color="gray" />
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
                        </View>
                    </View>
                }
            />
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
    contentContainer: { paddingBottom: 20, backgroundColor: 'white' },
    image: { width: '100%', height: undefined, aspectRatio: 1.6, resizeMode: 'cover' },
    postContainer: { padding: 12 },
    text: { fontSize: 16, marginBottom: 10 },
    actionsContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
    actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
    actionText: { marginLeft: 6, fontSize: 14 },
    actionGroup: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },

    commentSection: { marginTop: 12, paddingHorizontal: 12 },
    commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    commentTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    commentCount: { fontSize: 14, marginLeft: 8, color: 'gray' },

    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 24,
        paddingHorizontal: 12,
        backgroundColor: '#fff'
    },
    commentInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: '#000' },
    sendButton: {
        marginLeft: 10,
        backgroundColor: '#007bff',
        borderRadius: 20,
        padding: 8,
    },

    comment: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 8, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f5f5f5' },
    commentProfileImage: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
    commentContent: { flex: 1 },
    commentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    commentUserName: { fontWeight: '600', fontSize: 14, marginBottom: 4 },
    commentMenuButtonSmall: { paddingHorizontal: 6, paddingVertical: 4 },
    commentFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    commentLikeButton: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
    commentLikeCount: { marginLeft: 6, fontSize: 12, color: 'gray' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '82%',
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 6,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 12,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalButton: {
        width: '100%',
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
    },
    modalSeparator: {
        width: '100%',
        height: 1,
        backgroundColor: '#f0f0f0'
    },
    noCommentsText: {
        textAlign: 'center',
        color: 'gray',
        marginTop: 20,
    }
});

export default PostDetailComponent;