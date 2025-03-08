import {SafeAreaView} from "react-native";
import React, {useEffect, useState} from "react";
import axios from "axios";
import ShortsList from "./ShortsList";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_API_KEY; // Gemini 2.0 API 키

const YoutubeTrendingShorts = () => {
  const [trendingShorts, setTrendingShorts] = useState();

  // 날짜 형식 가공(연-월-일)
  const formatDate = (date) => {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if(month.toString().length < 2) month = "0" + `${month}`;
    if(day.toString().length < 2) day = "0" + `${day}`;

    return `${year}-${month}-${day}`;
  }

  // 검색 키워드 기준 지정 기간동안 지정 개수만큼의 쇼츠 정보 리스트를 조회해오는 함수
  const fetchYouTubeTrendingShorts = async () => {
    const searchWord = "챌린지"; // 검색어
    const maxResults = 10; // 검색 쇼츠 개수

    const today = new Date(); // 오늘
    const ago = new Date(); // n일 전
    ago.setDate(today.getDate() - 1);

    // YouTube API 조회
    const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchWord}&publishedAfter=${formatDate(ago)}T00:00:00Z
&publishedBefore=${formatDate(today)}T23:59:59Z&maxResults=${maxResults}&order=viewCount&type=video&videoDuration=short&regionCode=KR&relevanceLanguage=ko&key=${GOOGLE_API_KEY}`
    );

    // 조회해온 쇼츠의 제목, 업로드 시간, 영상ID, URL(쇼츠) 정보 리스트 저장
    let shorts = response.data.items.map(video => ({
      title: video.snippet.title,
      publishTime: video.snippet.publishTime,
      publishedAt: video.snippet.publishedAt,
      id: video.id.videoId,
      url: `https://www.youtube.com/shorts/${video.id.videoId}`
    }));
    setTrendingShorts(shorts);
    console.log(trendingShorts);
  };

  // 페이지 진입 시 쇼츠 리스트 조회
  useEffect(() => {
    fetchYouTubeTrendingShorts();
  }, []);

  return (
      <SafeAreaView style={{flex: 1}}>
        <ShortsList videoList={trendingShorts}/>
      </SafeAreaView>
  )
}

export default YoutubeTrendingShorts;