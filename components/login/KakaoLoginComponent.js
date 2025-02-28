import {Dimensions, Image, Pressable, StyleSheet} from "react-native";
import React from "react";
import axios from "axios";

const {width, height} = Dimensions.get("window");

const KakaoLoginComponent = () => {
    const handleKakaoLogin = () => {
        // axios.get("https://naver.com");
        alert("카카오 로그인 구현 필요");
    }

    return (
        <Pressable onPress={handleKakaoLogin}>
            <Image
                style={styles.image} source={require("../../assets/kakao_login_large_wide.png")}
                resizeMode={"contain"}
            />
        </Pressable>
    )
}

const styles = StyleSheet.create({
    image: {
        marginTop: 20,
        width: width - 20 * 2,
        // height: 40,
    },
})


export default KakaoLoginComponent;