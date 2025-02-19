import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";
import {useState} from "react";
import {Dimensions, FlatList, View} from "react-native";
import WebView from "react-native-webview";

const { width, height } = Dimensions.get("window"); // 현재 화면 너비, 높이

const ShortsList = ({videoList}) => {
    const tabBarHeight = useBottomTabBarHeight(); // 하단바 크기 가져오기
    const adjustedHeight = height - tabBarHeight; // 하단바 제외한 WebView 높이 설정
    const [currentIndex, setCurrentIndex] = useState(0);

    return (
        <FlatList
            data={videoList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
                <View style={[{ width: width }, { height: adjustedHeight }]}>
                    {index === currentIndex || index === currentIndex + 1 ? ( // ✅ 현재 영상과 다음 영상만 렌더링
                        <WebView
                            source={{ uri: item.url }}
                            style={{width: "100%", height: "100%"}}
                            allowsFullscreenVideo={true}
                            allowsInlineMediaPlayback={true}
                            mediaPlaybackRequiresUserAction={false}
                        />
                    ) : null}
                </View>
            )}
            pagingEnabled
            horizontal={false}
            showsVerticalScrollIndicator={false}
            getItemLayout={(data, index) => ({
                length: adjustedHeight,
                offset: adjustedHeight * index,
                index,
            })}
            initialNumToRender={2} // ✅ 초기 2개만 렌더링 (현재 영상 + 다음 영상)
            windowSize={3} // ✅ 현재 화면 + 앞뒤 1개씩만 렌더링
            maxToRenderPerBatch={2} // ✅ 한 번에 렌더링할 최대 개수 제한
            onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.y / adjustedHeight);
                setCurrentIndex(newIndex);
            }}
        />
    );
};

export default ShortsList;