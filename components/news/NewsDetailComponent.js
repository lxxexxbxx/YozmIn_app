import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import supabase from '../../supabase';

export default function NewsDetailComponent() {
    const [news, setNews] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        // 탭 바 숨기기
        navigation.getParent()?.setOptions({
            tabBarStyle: { display: 'none' },
        });

        // 언마운트 시 탭 바 복구
        return () => {
            navigation.getParent()?.setOptions({
                tabBarStyle: undefined,
            });
        };
    }, [navigation]);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        const { data, error } = await supabase
            .from('news_top10')
            .select('*');

        if (error) {
            console.error(error);
        } else {
            console.log("Fetched Data:", data);
            setNews(data);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flex: 1, padding: 20 }}>
                {/* 🔙 커스텀 뒤로가기 버튼 */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{'← 뒤로가기'}</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Top 10 뉴스</Text>
                <FlatList
                    data={news}
                    keyExtractor={(item) => item.news_id.toString()}
                    renderItem={({ item }) => (
                        <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }}>
                            <Text style={{ fontSize: 16 }}>{item.title}</Text>
                            <Text>{item.content_summarize}</Text>
                        </View>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}
