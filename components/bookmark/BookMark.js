import React, { useState } from 'react';
import { Text, View, TouchableOpacity, Image, StyleSheet, FlatList, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Entypo from "react-native-vector-icons/Entypo";
import { launchImageLibrary } from 'react-native-image-picker';
import PageTitleComponent from '../common/PageTitleComponent';

// 북마크된 아이템 목록 (예시 데이터)
const bookmarks = [
    { id: '1', title: '모든 게시글', image: require('../../assets/dog.jpg') },
    { id: '2', title: '럭키비키한걸? ★', image: require('../../assets/Luck.jpg') },
    { id: '3', title: '직박구리', image: require('../../assets/chil.jpg') }
];

const BookMarkComponent = () => {
    const navigation = useNavigation();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [categoryName, setCategoryName] = useState('');

    // 북마크 항목 렌더링 함수
    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={() => navigation.navigate('BookmarkDetail', { title: item.title })}
        >
            <Image source={item.image} style={styles.image} />
            <Text style={styles.title}>{item.title}</Text>
        </TouchableOpacity>
    );
    

    // 이미지 선택 함수
    const pickImage = () => {
        launchImageLibrary({ mediaType: 'photo' }, (response) => {
            if (response.assets && response.assets.length > 0) {
                setSelectedImage(response.assets[0].uri);
            }
        });
    };

    return (
        <View style={styles.container}>
            {/* 상단에 "북마크" 텍스트 추가 */}


            <PageTitleComponent title={"북마크"} backToTab={"MyPage"}/>


            

            <FlatList 
                data={bookmarks}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                numColumns={2} // 2열 레이아웃
            />
    
            {/* 하단 추가 버튼 (모달이 떠도 항상 보이도록 absolute 위치) */}
            <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                <Entypo name="plus" size={30} color="white" />
            </TouchableOpacity>
    
            {/* 이미지 업로드 모달 */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* 닫기 버튼 */}
                        <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                            <Entypo name="cross" size={24} color="black" />
                        </TouchableOpacity>
    
                        <Text style={styles.modalTitle}>새 카테고리 만들기</Text>
    
                        {/* 이미지 업로드 영역 */}
                        <TouchableOpacity style={styles.imageUpload} onPress={pickImage}>
                            {selectedImage ? (
                                <Image source={{ uri: selectedImage }} style={styles.uploadedImage} />
                            ) : (
                                <Text style={styles.uploadText}>Import Image</Text>
                            )}
                        </TouchableOpacity>
    
                        {/* 카테고리명 입력 */}
                        <Text style={styles.label}>카테고리명</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="카테고리명 입력"
                            value={categoryName}
                            onChangeText={setCategoryName}
                        />
                    </View>

                    {/* 모달 내부에서도 + 버튼을 추가 */}
                    <TouchableOpacity style={styles.addButtonModal} onPress={() => console.log("추가 버튼 클릭")}>
                        <Entypo name="plus" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },




    itemContainer: {
        alignItems: 'center',
        margin: 15,
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#000',
    },
    title: {
        marginTop: 5,
        fontSize: 14,
        textAlign: 'center',
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#000',
        borderRadius: 30,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10, // 버튼이 항상 위쪽에 위치
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.3)', // 반투명 배경 (기존보다 투명하게)
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        alignItems: 'center',
        height: '70%', // 기존보다 더 위로 올림 (높이 조정)
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    imageUpload: {
        width: 200,
        height: 200,
        backgroundColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginBottom: 15,
    },
    uploadText: {
        fontSize: 16,
        color: 'blue',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        marginBottom: 20,
    },
    addButtonModal: {
        position: 'absolute',
        bottom: 20, // 모달 내부에서 하단에 고정
        right: 20,  // 오른쪽으로 이동
        backgroundColor: '#000',
        borderRadius: 30,
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    }

});

export default BookMarkComponent;
