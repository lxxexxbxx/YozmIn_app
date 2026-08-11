import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import supabase from '../supabase';
import { decode } from 'base64-arraybuffer';

const SUPABASE_BUCKET_NAME = 'post-image';

const ImageUploader = forwardRef(({ onUploadSuccess, onUploadStart, onUploadEnd }, ref) => {
    const [isUploading, setIsUploading] = useState(false);
    // selectedLocalUri는 이제 ImageUploader 내부에서 미리보기용으로 사용되지 않고,
    // 단지 사진 선택 여부를 판단하는 용도로만 사용됩니다.
    const [hasSelectedImage, setHasSelectedImage] = useState(false);

    useImperativeHandle(ref, () => ({
        resetImage: () => {
            setHasSelectedImage(false); // 이미지 선택 상태 초기화
            setIsUploading(false); // 업로드 중 상태 초기화
        }
    }));

    const pickImage = async () => {
        if (isUploading) {
            return;
        }

        // 이미지가 선택되어 있다면 다시 선택하지 못하게 함
        if (hasSelectedImage) {
            Alert.alert('알림', '이미 사진이 선택되었습니다. 기존 사진을 삭제 후 다시 선택하거나 게시글을 작성해주세요.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // 사용자가 사진을 편집할 수 있도록 허용
            aspect: [4, 3], // 4:3 비율로 편집을 유도
            quality: 0.7, // 이미지 품질 (0.0 ~ 1.0)
            base64: true, // Base64 인코딩된 데이터 요청
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            const base64 = result.assets[0].base64;
            setHasSelectedImage(true); // 이미지가 선택되었음을 표시
            await uploadImageToSupabase(uri, base64);
        }
    };

    const uploadImageToSupabase = async (uri, base64) => {
        setIsUploading(true);
        onUploadStart && onUploadStart(true); // 부모 컴포넌트에 업로드 시작 알림

        if (!uri) {
            Alert.alert('오류', '선택된 이미지가 없습니다.');
            setIsUploading(false);
            onUploadEnd && onUploadEnd(false);
            setHasSelectedImage(false); // 선택된 이미지 없음으로 초기화
            return;
        }

        try {
            const fileExt = uri.split('.').pop(); // 파일 확장자 추출
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`; // 고유한 파일 이름 생성
            const filePath = `public/${fileName}`; // Supabase Storage에 저장될 경로

            const arrayBuffer = decode(base64); // Base64를 ArrayBuffer로 디코딩

            const { error: uploadError } = await supabase.storage
                .from(SUPABASE_BUCKET_NAME)
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${fileExt}`,
                    upsert: false, // 동일한 파일 이름이 있을 경우 덮어쓰지 않음
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage
                .from(SUPABASE_BUCKET_NAME)
                .getPublicUrl(filePath);

            const publicUrl = publicUrlData.publicUrl;

            if (publicUrl) {
                onUploadSuccess(publicUrl); // 업로드 성공 시 공개 URL을 부모에게 전달
            } else {
                throw new Error('사진 URL을 가져올 수 없습니다.');
            }

        } catch (error) {
            console.error('사진 업로드 실패:', error);
            Alert.alert('오류', `사진 업로드 실패: ${error.message}`);
            onUploadSuccess(null); // 업로드 실패 시 부모에게도 초기화 알림
            setHasSelectedImage(false); // 선택된 이미지 없음으로 초기화
        } finally {
            setIsUploading(false);
            onUploadEnd && onUploadEnd(false); // 업로드 종료를 부모에게 알림
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={pickImage} disabled={isUploading || hasSelectedImage} style={styles.pickImageButton}>
                {isUploading ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                    <Ionicons name="image-outline" size={28} color={hasSelectedImage ? "#999" : "#333"} />
                )}
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        // 이 컨테이너의 레이아웃은 BoardComponent의 commentInputContainer에서 flex로 제어됩니다.
    },
    pickImageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E0E0E0',
        marginRight: 8, // TextInput과의 간격
    },
});

export default ImageUploader;