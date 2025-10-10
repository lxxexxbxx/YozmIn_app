import YoutubeTrendingShorts from "./youtubeShorts/YoutubeTrendingShorts";
import TrendNavigator from "./TrendNavigator";
import SlidingSearchCard from "../common/SlidingSearchCard";

const TrendComponent = () => {
    return (
        // <YoutubeTrendingShorts/>
        <>
            <TrendNavigator/>
            <SlidingSearchCard userId={"bbbbb"} prompt={"너는 영화 및 TV 시리즈 전문가야. 다음 질문 등에 대해 답변해줘: "}/>
        </>
    )
};

export default TrendComponent;