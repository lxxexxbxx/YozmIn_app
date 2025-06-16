import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import PageTitleComponent from "../../common/PageTitleComponent";

const { width } = Dimensions.get('window');

const GameDetailComponent = ({ route }) => {
    const { game } = route.params;
    const imageUrl = game.cover
        ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
        : null;

    return (
        <ScrollView style={styles.container}>
            <PageTitleComponent darkMode={true} />
            {imageUrl && (
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
            )}
            <View style={styles.content}>
                <Text style={styles.title}>{game.name}</Text>
                <Text style={styles.rating}>⭐ {game.rating ? game.rating.toFixed(1) : 'N/A'}</Text>
                <Text style={styles.summary}>{game.summary || 'No description available.'}</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    coverImage: {
        width: width,
        height: width * 0.56,
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    rating: {
        fontSize: 16,
        color: '#FF6B6B',
        marginBottom: 8,
    },
    summary: {
        fontSize: 16,
        color: '#ccc',
    },
});

export default GameDetailComponent;
