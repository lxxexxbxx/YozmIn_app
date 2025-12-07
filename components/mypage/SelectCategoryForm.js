import React, { useState } from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Dimensions} from 'react-native';
import PageTitleComponent from "../common/PageTitleComponent";
import supabase from "../../supabase";
import Toast from "react-native-toast-message";
import {useUserStore} from "../../stores/UserStore";
import {useNavigation} from "@react-navigation/native";
import {ThemeText, ThemeView} from "../common/ThemeComponents";
import {useTheme} from "../settings/theme/ThemeContext";

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
    const {colors} = useTheme();

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
           <ThemeView>
               <ScrollView>
                   <ThemeView>
                       {/* 헤더 */}
                       <PageTitleComponent title={"관심사"}/>
                       <ThemeView style={{padding: 20}}>
                           {/* 제목 */}
                           <ThemeText style={{font: 20, alignSelf: "center"}}>관심사를 골라볼까요?</ThemeText>
                           <ThemeText style={{font: 20, alignSelf: "center"}}>관심사에 맞게 콘텐츠를 추천해드릴게요!</ThemeText>
                           <ThemeText style={[styles.count, {font: 20, alignSelf: "center"}]}>{selected.length} / 10개</ThemeText>

                           {/* 카테고리 별 태그 */}
                           {Object.entries(INTERESTS).map(([category, items]) => (
                               <ThemeView key={category} style={styles.section}>
                                   <ThemeText style={styles.sectionTitle}>{category}</ThemeText>
                                   <ThemeView style={styles.tagContainer}>
                                       {items.map((item) => {
                                           const isSelected = selected.includes(item.id);
                                           return (
                                               <TouchableOpacity
                                                   key={item.id}
                                                   style={[styles.tag, isSelected && styles.selectedTag]}
                                                   onPress={() => toggleInterest(item.id)}
                                               >
                                                   <ThemeText style={[styles.tagText, isSelected && styles.selectedTagText]}>
                                                       {item.label}
                                                   </ThemeText>
                                               </TouchableOpacity>
                                           );
                                       })}
                                   </ThemeView>
                               </ThemeView>
                           ))}
                           <ThemeView style={{alignSelf: "center"}}>
                               <TouchableOpacity onPress={() => {
                                   handleNext()
                               }}>
                                   <View style={styles.btnContainer}>
                                       <Text style={styles.btn}>
                                           {"다음"}
                                       </Text>
                                   </View>
                               </TouchableOpacity>
                           </ThemeView>
                       </ThemeView>
                   </ThemeView>
               </ScrollView>
           </ThemeView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 10
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
        borderColor: "rgba(118, 166, 255, 1)",
        borderRadius: 30,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 10,
    },
    tagText: {
        fontSize: 14,
    },
    selectedTag: {
        borderColor: "rgba(118, 166, 255, 1)",
        backgroundColor: 'rgba(118, 166, 255, 1)',
    },
    selectedTagText: {
        color: "rgba(118, 166, 255, 1)",
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