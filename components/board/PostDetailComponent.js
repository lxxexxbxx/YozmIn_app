import React, { useEffect, useState } from 'react';
import {
	View, Text, Image, TouchableOpacity, StyleSheet, FlatList, TextInput, Share, ScrollView, ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../../supabase';

const PostDetailComponent = ({ route, navigation }) => {
	const { postId } = route.params;
	const userId = 'f0334b06-3076-4858-8cb7-47b3804f0696'; // 추후 로그인 연동 예정

	const [post, setPost] = useState(null);
	const [isLiked, setIsLiked] = useState(false); // 좋아요 상태
	const [isBookmarked, setIsBookmarked] = useState(false);
	const [likeCount, setLikeCount] = useState(0); // 좋아요 카운트
	const [comments, setComments] = useState([]);
	const [newComment, setNewComment] = useState('');
	const [loading, setLoading] = useState(true);

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
		setLikeCount(data.like_cnt || 0); // 좋아요 카운트 상태 업데이트
	};

	const fetchIsLiked = async () => {
		const { data } = await supabase
			.from('post_like')
			.select('*')
			.eq('post_id', postId)
			.eq('user_id', userId)
			.single();

		setIsLiked(!!data); // 좋아요 상태 업데이트
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
		const commentIds = commentsData.map(c => c.id);
		const { data: likedData } = await supabase
			.from('comment_like')
			.select('comment_id')
			.in('comment_id', commentIds)
			.eq('user_id', userId);

		const likedIds = likedData?.map(like => like.comment_id) || [];

		return commentsData.map(c => ({
			...c,
			// comment.id와 comment.like_cnt가 데이터베이스 응답에 있는지 확인 필요
			isLiked: likedIds.includes(c.id),
			likeCount: c.like_cnt || 0,
		}));
	};

	const toggleCommentLike = async (index) => {
		const updated = [...comments];
		const comment = updated[index];
		const isNowLiked = !comment.isLiked;

		// UI 즉시 업데이트 (낙관적 업데이트)
		comment.isLiked = isNowLiked;
		comment.likeCount = (comment.likeCount || 0) + (isNowLiked ? 1 : -1);
		setComments(updated);

		// DB 작업
		if (isNowLiked) {
			const { error } = await supabase
				.from('comment_like')
				.insert([{ user_id: userId, comment_id: comment.id }]);
			if (error) {
				console.error('댓글 좋아요 추가 실패:', error);
				// 에러 발생 시 UI 상태 원복 로직 추가 고려
			}
		} else {
			const { error } = await supabase
				.from('comment_like')
				.delete()
				.eq('user_id', userId)
				.eq('comment_id', comment.id);
			if (error) {
				console.error('댓글 좋아요 제거 실패:', error);
				// 에러 발생 시 UI 상태 원복 로직 추가 고려
			}
		}
	};

	const checkBookmarkStatus = async () => {
		const { data, error } = await supabase
			.from('bookmark')
			.select('*')
			.eq('user_id', userId)
			.eq('post_id', postId)
			.single();

		setIsBookmarked(!!data && !error);
	};

	const toggleBookmark = async () => {
		const newBookmark = !isBookmarked;
		setIsBookmarked(newBookmark); // UI 즉시 업데이트

		if (newBookmark) {
			const { error } = await supabase
				.from('bookmark')
				.insert([{ user_id: userId, post_id: postId }]);
			if (error) {
				console.error('북마크 추가 실패:', error);
				setIsBookmarked(false); // 에러 시 UI 상태 원복
			}
		} else {
			const { error } = await supabase
				.from('bookmark')
				.delete()
				.eq('user_id', userId)
				.eq('post_id', postId);
			if (error) {
				console.error('북마크 제거 실패:', error);
				setIsBookmarked(true); // 에러 시 UI 상태 원복
			}
		}
	};

	// === 게시글 좋아요 토글 로직 (like_post/unlike_post RPC 호출) ===
	// 이 함수는 이제 데이터베이스의 like_post(uuid, text)와 unlike_post(uuid, text) 함수를 사용합니다.
	const toggleLike = async () => {
		try {
			// isLiked state를 사용하여 현재 좋아요 상태 판단
			if (isLiked) {
				// unlike_post 함수 호출
				await supabase.rpc('unlike_post', {
					p_post_id: postId, // 게시글 ID (uuid)
					p_user_id: userId, // 사용자 ID (text)
				});
				// UI 상태 낙관적 업데이트
				setIsLiked(false);
				setLikeCount(prevCount => prevCount - 1);

			} else {
				// like_post 함수 호출
				await supabase.rpc('like_post', {
					p_post_id: postId, // 게시글 ID (uuid)
					p_user_id: userId, // 사용자 ID (text)
				});
				// UI 상태 낙관적 업데이트
				setIsLiked(true);
				setLikeCount(prevCount => prevCount + 1);
			}

			// 필요하다면 여기서 fetchPost() 또는 fetchIsLiked() 등을 호출하여 최종 상태 동기화
			// 대부분의 경우 낙관적 업데이트만으로 충분하며, Realtime 구독을 통해 자동 갱신될 수도 있습니다.

		} catch (e) {
			console.error('❌ 좋아요 토글 에러 (RPC):', e);
			// 에러 발생 시 UI 상태 원복 로직 추가 고려 (예: setIsLiked(!isLiked); setLikeCount(prevCount => prevCount + (isLiked ? 1 : -1));)
			Alert.alert('오류', '좋아요 상태 변경 중 오류가 발생했습니다.'); // 사용자에게 알림
		}
	};
	// ===========================================================


  const addComment = async () => {
    if (!newComment.trim()) return;
  
    const newCommentObj = {
      // id는 DB에서 자동 생성 (INT PR)
      post_id: postId,
      user_id: userId,
      comment: newComment, // <--- 여기서 'content' 대신 'comment'로 수정했습니다.
      // like_cnt는 스키마에 없다면 보내지 않음
      // created_at는 DB에 DEFAULT now() 설정이 되어 있다면 보내지 않음
    };
  
    // ... (나머지 삽입 및 후처리 로직은 그대로)
    const { data, error } = await supabase.from('comment').insert(newCommentObj).select().single();
  
    if (error) {
      console.error('댓글 저장 실패:', error);
      Alert.alert('오류', '댓글 저장 중 오류가 발생했습니다.');
      return;
    }
  
    await fetchComments(); // 댓글 목록 다시 가져와서 UI 갱신
    setNewComment(''); // 입력 필드 초기화
  };

	const sharePost = async () => {
		try {
			await Share.share({
				message: `${post.content}\n\n${post.image_url || ''}`,
				// url: '...', // 웹 링크가 있다면 url 속성 사용
				// title: '...', // 제목 속성 사용
			});
		} catch (error) {
			console.error('공유 실패:', error);
			Alert.alert('오류', '게시글 공유에 실패했습니다.');
		}
	};

	// 컴포넌트 마운트 시 데이터 로딩
	useEffect(() => {
		(async () => {
			await fetchPost(); // 게시글 데이터
			await fetchIsLiked(); // 사용자 좋아요 상태
			await checkBookmarkStatus(); // 사용자 북마크 상태
			await fetchComments(); // 댓글 목록
			setLoading(false); // 로딩 완료
		})();
	}, []); // 빈 배열: 컴포넌트가 처음 마운트될 때만 실행

	// 로딩 중이면 로딩 인디케이터 표시
	if (loading || !post) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#007bff" />
			</View>
		);
	}

	// 댓글 아이템 렌더링 함수
	const renderComment = ({ item, index }) => (
		<View style={styles.comment}>
			{/* 프로필 이미지는 댓글 데이터에 user_id만 있다면 별도로 가져와야 합니다 */}
			<Image source={{ uri: item.profile_image || 'https://via.placeholder.com/40' }} style={styles.commentProfileImage} />
			<View style={styles.commentContent}>
				{/* item.text 대신 item.content가 DB 컬럼 이름일 가능성 */}
				<Text>{item.comment}</Text>
				<TouchableOpacity onPress={() => toggleCommentLike(index)} style={styles.commentLikeButton}>
					<FontAwesome name={item.isLiked ? 'heart' : 'heart-o'} size={16} color="gray" />
					<Text style={styles.commentLikeCount}>{item.likeCount || 0}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	// 메인 UI 렌더링
	return (
		<View style={styles.container}>
			{/* 상단 바 */}
			<View style={styles.topBar}>
				<TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 10 }}>
					<FontAwesome name="arrow-left" size={24} color="black" />
				</TouchableOpacity>
				{/* 프로필 정보 (게시글 작성자) */}
				<View style={styles.profileContainer}>
					<Image source={{ uri: post.profile_image || 'https://via.placeholder.com/40' }} style={styles.profileImage} />
					<Text style={styles.profileName}>{post.user_name || '익명'}</Text>
				</View>
				{/* 다른 액션 버튼들 (예: 신고, 수정 등) */}
			</View>

			{/* 게시글 내용 및 댓글 스크롤 영역 */}
			<ScrollView style={styles.contentScroll}>
				{/* 게시글 이미지 */}
				{post.image_url && <Image source={{ uri: post.image_url }} style={styles.image} />}

				{/* 게시글 텍스트 내용 및 액션 버튼 */}
				<View style={styles.postContainer}>
					<Text style={styles.text}>{post.content || '내용 없음'}</Text>
					{/* 액션 버튼들 (좋아요, 조회수, 북마크, 공유) */}
					<View style={styles.actionsContainer}>
						{/* 좋아요 버튼 */}
						<TouchableOpacity onPress={toggleLike} style={styles.actionButton}>
							<FontAwesome name={isLiked ? 'heart' : 'heart-o'} size={24} color="red" />
							<Text style={styles.actionText}>{likeCount}</Text>
						</TouchableOpacity>
						{/* 기타 액션 그룹 */}
						<View style={styles.actionGroup}>
							{/* 조회수 */}
							<View style={styles.actionButton}>
								<FontAwesome name="eye" size={24} color="gray" />
								<Text style={styles.actionText}>{post.view_count || 0}</Text>
							</View>
							{/* 북마크 버튼 */}
							<TouchableOpacity onPress={toggleBookmark} style={styles.actionButton}>
								<FontAwesome name={isBookmarked ? 'bookmark' : 'bookmark-o'} size={24} color="gray" />
							</TouchableOpacity>
							{/* 공유 버튼 */}
							<TouchableOpacity onPress={sharePost} style={styles.actionButton}>
								<FontAwesome name="share-alt" size={24} color="gray" />
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* 댓글 섹션 */}
				<View style={styles.commentSection}>
					<View style={styles.commentHeader}>
						<FontAwesome name="comments" size={20} color="black" />
						<Text style={styles.commentTitle}>댓글</Text>
						<Text style={styles.commentCount}>{comments.length}</Text>
					</View>

					{/* 댓글 입력 필드 */}
					<View style={styles.commentInputContainer}>
						<TextInput
							style={styles.commentInput}
							value={newComment}
							onChangeText={setNewComment}
							placeholder="댓글을 입력하세요..."
							placeholderTextColor="gray" // 플레이스홀더 색상 지정
						/>
						<TouchableOpacity onPress={addComment} style={styles.sendButton}>
							<FontAwesome name="arrow-right" size={20} color="white" />
						</TouchableOpacity>
					</View>

					{/* 댓글 목록 */}
					<FlatList
						data={comments}
						renderItem={renderComment}
						keyExtractor={(item) => item.id} // comment의 고유 ID 사용
						scrollEnabled={false} // ScrollView 안에 있으므로 FlatList 자체 스크롤 비활성화
					/>
				</View>
			</ScrollView>
		</View>
	);
};

// 스타일 시트 (변경 없음)
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
	commentInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 5, paddingHorizontal: 10, color: 'black' }, // 텍스트 색상 추가
	sendButton: { marginLeft: 10, backgroundColor: '#007bff', borderRadius: 5, padding: 10, justifyContent: 'center' }, // 중앙 정렬 추가
	comment: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderColor: '#eee' }, // 하단 경계선 추가
	commentProfileImage: { width: 30, height: 30, borderRadius: 15, marginRight: 8 }, // 크기 약간 줄임
	commentContent: { marginLeft: 10, flex: 1 },
	commentLikeButton: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
	commentLikeCount: { marginLeft: 5 },
});

export default PostDetailComponent;