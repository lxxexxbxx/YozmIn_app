import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import axios from 'axios';
import {useKeyStore} from "../../../stores/KeyStore";

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

const GameTrendComponent = ({ navigation }) => {
    const keyStore = useKeyStore();
    const IGDB_CLIENT_ID = keyStore.IGDB_CLIENT_ID;
    const IGDB_ACCESS_TOKEN = keyStore.IGDB_ACCESS_TOKEN;

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const res = await axios.post(
                    'https://api.igdb.com/v4/games',
                    `
          fields name, summary, cover.image_id, rating, platforms.name, genres.name;
          sort rating desc;
          where rating != null & platforms = (6, 48, 130);
          limit 10;
          `,
                    {
                        headers: {
                            'Client-ID': IGDB_CLIENT_ID,
                            Authorization: `Bearer ` + IGDB_ACCESS_TOKEN,
                        },
                    }
                );

                setGames(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchGames();
    }, []);

    const renderItem = ({ item }) => {
        const imageUrl = item.cover
            ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${item.cover.image_id}.jpg`
            : null;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('GameDetail', { game: item })}
            >
                {imageUrl && (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                )}
                <View style={styles.content}>
                    <Text style={styles.title}>{item.name}</Text>
                    <Text style={styles.rating}>⭐ {item.rating ? item.rating.toFixed(1) : 'N/A'}</Text>
                    <Text style={styles.summary} numberOfLines={3}>
                        {item.summary || 'No description available.'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={{ marginTop: 10, color: '#ccc' }}>Loading popular games...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={games}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
        />
    );
};

const styles = StyleSheet.create({
    listContainer: {
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: '#000',
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#111',
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 10,
        shadowColor: '#fff',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    coverImage: {
        width: '100%',
        height: CARD_WIDTH * 0.56,
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    rating: {
        fontSize: 14,
        color: '#FF6B6B',
        marginBottom: 4,
    },
    summary: {
        fontSize: 14,
        color: '#ccc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    }
});

export default GameTrendComponent;
