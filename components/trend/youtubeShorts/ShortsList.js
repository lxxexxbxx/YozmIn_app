import React, { useState } from "react";
import { Dimensions, FlatList, View, Platform } from "react-native";
import Shorts from "./Shorts";
import { useTheme } from "../../settings/theme/ThemeContext";

const { width } = Dimensions.get("window");

// ⚡ 하단 안전 영역 계산 (안드로이드 네비게이션 바 / 아이폰 홈 인디케이터)
const BOTTOM_SAFE_AREA = Platform.OS === 'android' ? 50 : 34;

const ShortsList = ({ videoList }) => {
    const { colors } = useTheme();

    // 부모 뷰(바텀시트 내부)의 실제 크기 측정
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const handleLayout = (e) => {
        const { width, height } = e.nativeEvent.layout;
        // 높이 변화가 감지되면 업데이트
        if (Math.abs(height - containerSize.height) > 1) {
            setContainerSize({ width, height });
        }
    };

    // 높이 측정 전에는 빈 뷰 렌더링
    if (containerSize.height === 0) {
        return (
            <View
                style={{ flex: 1, backgroundColor: colors.background }}
                onLayout={handleLayout}
            />
        );
    }

    // ⚡ 실제 비디오가 표시될 높이 계산 (전체 높이 - 하단 여백)
    // 이렇게 해야 페이징(Snap)이 딱딱 맞으면서 하단도 가려지지 않습니다.
    const itemHeight = containerSize.height - BOTTOM_SAFE_AREA;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                data={videoList}
                keyExtractor={(item, index) => index.toString()}

                // 1. 각 아이템(쇼츠)의 높이를 안전 영역을 뺀 크기로 설정
                renderItem={({ item }) => (
                    <Shorts
                        url={item.url}
                        w={width}
                        h={itemHeight}
                    />
                )}

                // 2. FlatList 자체에 하단 여백을 줘서 스크롤 끝까지 보이게 함
                contentContainerStyle={{ paddingBottom: BOTTOM_SAFE_AREA }}

                // 3. 스냅(페이징) 간격을 아이템 높이로 정확히 설정
                pagingEnabled={true}
                snapToInterval={itemHeight}
                snapToAlignment="start"
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}

                // 4. 레이아웃 최적화
                getItemLayout={(data, index) => ({
                    length: itemHeight,
                    offset: itemHeight * index,
                    index,
                })}

                initialNumToRender={1}
                windowSize={3}
                maxToRenderPerBatch={2}
            />
        </View>
    );
};

export default ShortsList;