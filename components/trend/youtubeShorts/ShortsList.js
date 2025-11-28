import {Dimensions, FlatList, Platform, StatusBar} from "react-native";
import Shorts from "./Shorts";
import {useTheme} from "../../settings/theme/ThemeContext";

const {width, height} = Dimensions.get("window"); // 현재 화면 너비, 높이

const ShortsList = ({videoList, max}) => {
    // const tabBarHeight = height * 0.2; // 하단바 크기
    const adjustedHeight = height * 0.78; // 하단바 제외한 WebView 높이
    const {colors} = useTheme();

    return (
        <FlatList
            style={{backgroundColor: colors.background, height: adjustedHeight * max}}
            data={videoList}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => (
                <Shorts url={item.url} w={width} h={adjustedHeight}/>
            )}
            pagingEnabled={true}
            snapToInterval={adjustedHeight} // 스크롤 크기
            snapToAlignment={"start"} // 올바르게 정렬되도록 설정
            decelerationRate={"fast"} // 스크롤 속도
            horizontal={false} // 가로 스크롤 비활성
            initialNumToRender={2} // 초기 렌더링 개수
            windowSize={max} // 최대 렌더링 개수
            // ListHeaderComponent={
            //     <KeywordTrendComponent w={width} h={adjustedHeight}/>
            // }
        />
    );
};

export default ShortsList;