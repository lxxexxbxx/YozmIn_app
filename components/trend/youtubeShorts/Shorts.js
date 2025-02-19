// 1개 쇼츠 재생(깔끔)
import {View} from "react-native";
import WebView from "react-native-webview";

const Shorts = ({url}) => {
    return (
        <View style={{flex: 1, backgroundColor: "#000"}}>
            <WebView
                source={{ uri: url }}
                style={{ flex: 1 }}
                allowsFullscreenVideo={true} // 전체 화면 모드 허용
                allowsInlineMediaPlayback={true} // iOS에서 인라인 재생 허용
                mediaPlaybackRequiresUserAction={false} // 자동 재생 허용
            />
        </View>
    )
}

export default Shorts;