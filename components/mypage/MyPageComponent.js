import React, { useEffect, useState } from 'react';
import { Text, View, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Entypo from "react-native-vector-icons/Entypo";
import supabase from '../../supabase';
import { useUserStore } from "../../stores/UserStore";

const MyPageComponent = () => {
    const store = useUserStore();
    const userId = store.user_id;
    const name = store.name;

    
    const navigation = useNavigation();
    const [characterName, setCharacterName] = useState('');
    const [level, setLevel] = useState(0);
    const [coin, setCoin] = useState(0);
    const [userName, setUserName] = useState('');

    const fetchCharacterData = async (userId) => {
        const { data, error } = await supabase
            .from('mypage')
            .select(`
                mp_Name,
                mp_Level,
                mp_Coin,
                user (
                    name
                )
            `)
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error("데이터 조회 실패:", error);
            Alert.alert("오류", "마이페이지 데이터를 불러오는 데 실패했습니다.");
        } else {
            setCharacterName(data.mp_Name);
            setLevel(data.mp_Level);
            setCoin(data.mp_Coin);
            setUserName(data.user?.name || '');
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            

            if (!userId) {
                Alert.alert("오류", "로그인 정보가 없습니다.");
                return;
            }
            await fetchCharacterData(userId);
        };

        fetchUserData();
    }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.profileInfo}>
                    <Image style={styles.profileImage} source={require("../../assets/User.jpg")} />
                    <View>
                        <Text style={styles.username}>{name}</Text>
                        <Text style={styles.level}>Lv. {level}</Text>
                    </View>
                </View>

                {/* Settings & Bookmark Icons */}
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')}>
                        <Ionicons name="settings" size={24} color="black" style={styles.iconSpacing} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Bookmark')}>
                        <Ionicons name="bookmark" size={24} color="black" style={styles.iconSpacing} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Character Box */}
            <View style={styles.characterBox}>
                <View style={styles.characterHeader}>
                    <Text style={styles.characterTitle}>{characterName}</Text>
                    <MaterialCommunityIcons name="currency-usd" size={24} color="gold" />
                    <Text style={styles.money}>{coin} 원</Text>
                </View>

                <Image style={styles.tino} source={require("../../assets/tino.jpg")} />

                <View style={styles.bottomNav}>
                    <View style={styles.iconRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('ShopScreen')}>
                            <Entypo name="shop" size={24} color="black" style={styles.iconSpacing} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('Closet')}>
                            <MaterialCommunityIcons name="wardrobe" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
        marginTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 30,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    username: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    level: {
        fontSize: 14,
        color: 'gray',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    iconSpacing: {
        marginRight: 10,
    },
    characterBox: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 40,
    },
    characterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    money: {
        fontSize: 18,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: 'black',
        marginLeft: 5,
    },
    characterTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
    tino: {
        width: 300,
        height: 300,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        width: '100%',
        marginTop: 10,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default MyPageComponent;
