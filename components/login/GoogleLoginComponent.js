import {
    Dimensions,
    Image,
    StyleSheet,
    TouchableOpacity
} from "react-native";
import React from "react";

const {width, height} = Dimensions.get("window");

const GoogleLoginComponent = () => {
    const handleGoogleLogin = () => {
        // axios.get("https://naver.com");
        alert("구글 로그인 구현 필요");
    }

    return (
        <TouchableOpacity onPress={handleGoogleLogin}>
            <Image
                style={styles.image} source={require("../../assets/google_login.png")}
                resizeMode={"contain"}
            />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    image: {
        width: width * 0.85,
        height: height * 0.08,
        alignSelf: "center"
    },
})


export default GoogleLoginComponent;