// 1개 쇼츠 재생(깔끔)
import {View} from "react-native";
import WebView from "react-native-webview";

const Shorts = ({url, w, h}) => {
    return (
        <View style={{width: w, height: h}}>
          <WebView
              source={{uri: url}}
              style={{width: "100%", height: "100%"}}
              //// ios 세팅 ////
              allowsInlineMediaPlayback={true}  // 전체화면 방지
              mediaPlaybackRequiresUserAction={false} // 자동 재생 허용
              allowsFullscreenVideo={false}  // 전체화면 버튼 제거
          />
        </View>
    )
}

export default Shorts;