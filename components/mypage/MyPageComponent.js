import React from 'react';
import { Text, View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Entypo from "react-native-vector-icons/Entypo";

const MyPageComponent = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.profileInfo}>
                    <Image style={styles.profileImage} source={require("../../assets/User.jpg")} />
                    <View>
                        <Text style={styles.username}>이재혁</Text>
                        <Text style={styles.level}>Lv. 99</Text>
                    </View>
                </View>

                {/* Settings & Bookmark Icons (Right-Aligned) */}
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => navigation.navigate('SettingsScreen')}>
                        <Ionicons name="settings" size={24} color="black" style={styles.iconSpacing} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('BookMark')}>
                        <Ionicons name="bookmark" size={24} color="black" style={styles.iconSpacing} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Character Section (Rounded Box with White Background) */}
            <View style={styles.characterBox}>
                <View style={styles.characterHeader}>
                    <Text style={styles.characterTitle}>(캐릭터 이름)</Text>
                    <MaterialCommunityIcons name="currency-usd" size={24} color="gold" />
                    <Text style={styles.money}>555</Text>
                </View>
                <Image style={styles.tino} source={require("../../assets/tino.jpg")} />

                {/* Bottom Navigation (Right-Aligned) */}
                <View style={styles.bottomNav}>
                    <View style={styles.iconRow}>
                        <TouchableOpacity onPress={() => navigation.navigate('ShopScreen')}>
                            <Entypo name="shop" size={24} color="black" style={styles.iconSpacing} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('ClosetScreen')}>
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
        backgroundColor: '#f5f5f5', // 회색 배경
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
        justifyContent: 'flex-end', // 아이콘을 오른쪽 정렬
    },
    iconSpacing: {
        marginRight: 10, // 아이콘 사이 간격 추가
    },
    characterBox: {
        backgroundColor: 'white', // 캐릭터 영역은 흰색
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
        textDecorationLine: 'underline', // 밑줄 추가
        color: 'black',
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
        justifyContent: 'flex-end', // 오른쪽 정렬
        width: '100%',
        marginTop: 10,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});

export default MyPageComponent;
