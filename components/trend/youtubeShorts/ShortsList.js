import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";
import {Dimensions, FlatList, Platform, StatusBar, View} from "react-native";
import WebView from "react-native-webview";

const { width, height } = Dimensions.get("window"); // 현재 화면 너비, 높이

const ShortsList = ({videoList, max}) => {
    const tabBarHeight = useBottomTabBarHeight(); // 하단바 크기
    const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight : 0; // 휴대폰 상단 상태바 크기
    const adjustedHeight = height - tabBarHeight; // 하단바 제외한 WebView 높이

    return (
        <FlatList style={{marginTop: statusBarHeight, backgroundColor: "black"}}
            data={videoList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index }) => (
                <View style={{width: width, height: adjustedHeight}}>
                    <WebView
                        source={{uri: item.url }}
                        style={{width: "100%", height: "100%"}}
                    />
                </View>
            )}
            snapToInterval={adjustedHeight} // 스크롤 크기
            decelerationRate={"normal"} // 스크롤 속도
            horizontal={false} // 가로 스크롤 비활성
            initialNumToRender={1} // 초기 1개만 렌더링
            windowSize={max} // 최대 렌더링 개수
        />
    );
};

export default ShortsList;