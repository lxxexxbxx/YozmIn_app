import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MyPageComponent = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>마이페이지</Text>
                <TouchableOpacity style={styles.icon} onPress={() => navigation.navigate('SettingsScreen')}>
                    <Ionicons name="settings" size={24} color="black" />
                </TouchableOpacity>
            </View>
            
            <Text>
                마이페이지 내용
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: 'white',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    icon: {
        padding: 8,
    },
});

export default MyPageComponent;