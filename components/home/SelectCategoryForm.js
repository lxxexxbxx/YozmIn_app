import React, { useState } from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Dimensions} from 'react-native';
import PageTitleComponent from "../common/PageTitleComponent";
import supabase from "../../supabase";
import Toast from "react-native-toast-message";
import {useUserStore} from "../../stores/UserStore";
import {useNavigation} from "@react-navigation/native";

const { width, height } = Dimensions.get('window');


const INTERESTS = {
    '취미 & 관심사': [
        { id: 'int_cooking', label: '🍳 요리' },
        { id: 'int_baking', label: '🥐 베이킹' },
        { id: 'int_travel', label: '✈ 여행' },
        { id: 'int_drive', label: '🚙 드라이브' },
        { id: 'int_shopping', label: '🛍 쇼핑' },
        { id: 'int_diy', label: '🪔 DIY' },
    ],
    '엔터테인먼트': [
        { id: 'ent_movie', label:'🎬 영화' },
        { id: 'ent_drama', label: '🎭 TV/드라마' },
        { id: 'ent_game', label: '🎮 게임' },
        { id: 'ent_instagram', label: '⭐ 인스타그램' },
        { id: 'ent_instrument', label: '🎹 악기연주' },
        { id: 'ent_show', label: '🎤 공연관람' },
        { id: 'ent_musical', label: '🤹‍ 뮤지컬' },
        { id: 'ent_concert', label: '🤹‍ 콘서트' },
        { id: 'ent_theater', label: '♂‍ 연극' },
        { id: 'ent_mukbang', label: '🍗‍ 먹방' },
    ],
    '라이프스타일': [
        { id: 'life_home', label: '🏠 집콕' },
        { id: 'life_romance', label: '❤ 연애' },
        { id: 'life_walk', label: '🚶 산책' },
        { id: 'life_petlover', label: '🐕 애견인' },
        { id: 'life_otaku', label: '🧐 덕질' },
        { id: 'life_pet', label: '🦮 반려동물' },
    ],
    '아트 & 뷰티': [
        { id: 'art_music', label: '🎧 음악' },
        { id: 'art_photo', label: '📷 사진' },
        { id: 'art_fashion', label: '👕 패션' },
        { id: 'art_painting', label: '🌄 그림 그리기' },
        { id: 'art_exhibit', label: '🤹 ‍전시회관람' },
        { id: 'art_design', label: '⚜ 디자인' },
        { id: 'art_film', label: '🎥 필름카메라' },
    ],
    '음식': [
        { id: 'food_restaurant', label: '🍱 맛집' },
        { id: 'food_coffee', label: '☕ 커피' },
        { id: 'food_dessert', label: '🍰 디저트' },
        { id: 'food_sushi', label: '🍣 스시' },
    ],
};

const SelectCategoryForm = () => {
    const store = useUserStore();
    const navigation = useNavigation();
    const [selected, setSelected] = useState(
        store.categories ? store.categories.split(',') : []
    );


    const toggleInterest = (id) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleNext = async () => {
        const selectedItems = selected.join(",");
        await store.setter.setCategories(selectedItems);

        if(!store.categories) {
            Toast.show({
                type: 'error',
                text1: '관심사를 선택해주세요.',
            });
            return;
        }

        const response = await supabase
            .from("user")
            .update([{
                categories: store.categories
            }])
            .eq('user_id', store.user_id);
        console.log(response);

        if(response.status === 204) {
            Toast.show({
                type: 'success',
                text1: '관심사 저장 완료',
            });
            navigation.goBack();
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <ScrollView contentContainerStyle={styles.container}>
                {/* 헤더 */}
                <PageTitleComponent title={"관심사"}/>

                {/* 제목 */}
                <Text style={styles.title}>관심사를 골라볼까요?</Text>
                <Text style={styles.subtitle}>관심사에 맞게 콘텐츠를 추천해드릴게요!</Text>
                <Text style={styles.count}>{selected.length} / 10개</Text>

                {/* 카테고리 별 태그 */}
                {Object.entries(INTERESTS).map(([category, items]) => (
                    <View key={category} style={styles.section}>
                        <Text style={styles.sectionTitle}>{category}</Text>
                        <View style={styles.tagContainer}>
                            {items.map((item) => {
                                const isSelected = selected.includes(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[styles.tag, isSelected && styles.selectedTag]}
                                        onPress={() => toggleInterest(item.id)}
                                    >
                                        <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
                <TouchableOpacity onPress={() => {handleNext()}}>
                    <View style={styles.btnContainer}>
                        <Text style={styles.btn}>
                            {"다음"}
                        </Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: "center",
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 20,
    },
    backBtn: {
        fontSize: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    doneBtn: {
        fontSize: 16,
        color: '#007AFF',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: '#666',
        marginBottom: 4,
    },
    count: {
        color: 'red',
        marginBottom: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tag: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 30,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 10,
    },
    tagText: {
        fontSize: 14,
        color: '#555',
    },
    selectedTag: {
        borderColor: 'red',
        backgroundColor: '#ffe6e6',
    },
    selectedTagText: {
        color: 'red',
    },
    btnContainer: {
        marginTop: height * 0.1,
        height: height * 0.073,
        width: width * 0.78,
        backgroundColor: "rgba(118, 166, 255, 1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        rowGap: height * 0.012,
        paddingHorizontal: width * 0.10,
        paddingVertical: height * 0.018,
        borderRadius: 30,
        marginBottom: height * 0.1,
    },
    btn: {
        textAlign: "center",
        color: "rgba(255, 255, 255, 1)",
        fontFamily: "Share",
        fontSize: width * 0.05,
    },
});

export default SelectCategoryForm;