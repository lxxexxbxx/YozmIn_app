import React, { useRef, useState, useEffect } from 'react';
import {
    View, TextInput, TouchableOpacity, Text, StyleSheet,
    Dimensions, Animated, Keyboard, PanResponder, ScrollView, Platform
} from 'react-native';
import {CommonUtils} from "./CommonUtils";
import TypingText from "../chatbot/TypingText";

const { height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.7;
const SNAP_POINT = height - CARD_HEIGHT;

const SlidingSearchCard = ({ userId, prompt }: { userId: string, prompt: string }) => {
    const [input, setInput] = useState('');
    const [answer, setAnswer] = useState('');
    const [visible, setVisible] = useState(false);
    const scrollRef = useRef(null);
    const translateY = useRef(new Animated.Value(height)).current;


    useEffect(() => {
        if (answer && scrollRef.current) {
            scrollRef.current.scrollToEnd({ animated: true });
        }
    }, [answer]);


    const openCard = () => {
        setVisible(true);
        Animated.timing(translateY, {
            toValue: SNAP_POINT,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeCard = () => {
        Keyboard.dismiss();
        Animated.timing(translateY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            setInput('');
            setAnswer('');
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(SNAP_POINT + gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    closeCard();
                } else {
                    Animated.timing(translateY, {
                        toValue: SNAP_POINT,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const handleSend = async () => {
        if (!input.trim()) return;
        Keyboard.dismiss();
        const response = await CommonUtils.fetchGemini(prompt ? prompt + input : input);
        setAnswer(response);

        // await axios.post('https://your-project.supabase.co/rest/v1/user_history', {
        //     user_id: userId,
        //     question: input,
        //     answer: response,
        //     created_at: new Date().toISOString()
        // }, {
        //     headers: {
        //         apikey: 'SUPABASE_API_KEY',
        //         Authorization: 'Bearer SUPABASE_API_KEY',
        //         'Content-Type': 'application/json'
        //     }
        // });
    };

    return (
        <>
            <TouchableOpacity onPress={openCard} style={styles.floatingButton}>
                <Text style={styles.buttonText}>🔍</Text>
            </TouchableOpacity>

            {visible && (
                <Animated.View
                    style={[
                        styles.cardContainer,
                        { transform: [{ translateY }] },
                    ]}
                >
                    <View style={styles.dragHandle} {...panResponder.panHandlers}>
                        <View style={styles.dragBar} />
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="무엇이든 물어보세요"
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />

                    <ScrollView
                        ref={scrollRef}
                        style={styles.answerScroll}
                        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
                        contentContainerStyle={{ paddingBottom: 60 }} // 하단 여유 공간
                    >
                        {answer ? (
                            <View style={styles.answerCard}>
                                <TypingText fullText={answer} speed={30} />
                            </View>
                        ) : null}
                    </ScrollView>
                </Animated.View>
            )}
        </>
    );
};

export default SlidingSearchCard;

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        backgroundColor: 'white',
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    buttonText: {
        color: '#fff',
        fontSize: 28,
    },
    cardContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: CARD_HEIGHT,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        paddingBottom: Platform.OS === 'ios' ? 40 : 0,
    },
    dragHandle: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    dragBar: {
        width: 50,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#ccc',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 12,
        padding: 12,
        margin: 12,
        backgroundColor: '#f7f7f7',
    },
    answerScroll: {
        flex: 1,
        paddingHorizontal: 12,
    },
    answerCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#e6f0ff',
        marginTop: 8,
    },
});
