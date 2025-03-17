import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";
import {Dimensions, FlatList, Platform, StatusBar} from "react-native";
import Shorts from "./Shorts";

const {width, height} = Dimensions.get("window"); // 현재 화면 너비, 높이

const ShortsList = ({videoList, max}) => {
    const tabBarHeight = useBottomTabBarHeight(); // 하단바 크기
    const statusBarHeight = Platform.OS === "android" ? StatusBar.currentHeight : 0; // 휴대폰 상단 상태바 크기
    const adjustedHeight = height - tabBarHeight; // 하단바 제외한 WebView 높이

  return (
      <FlatList style={{marginTop: Platform.OS === "ios" ? height * -0.0555 : statusBarHeight, backgroundColor: "black"}}
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
      />
  );
};

export default ShortsList;