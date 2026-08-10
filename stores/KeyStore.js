import {create} from "zustand";
import supabase from "../supabase";
import CryptoJS from "react-native-crypto-js";

const SECRET_KEY = process.env.EXPO_PUBLIC_SECRET_KEY || "";

export const useKeyStore = create((set, get) =>({
    GEMINI_API_KEY: "",
    GOOGLE_API_KEY: "",
    GOOGLE_WEB_CLIENT_ID: "",
    SEARCH_ENGINE_ID: "",
    NAVER_CLIENT_ID: "",
    NAVER_CLIENT: "",
    SUPABASE_URL: "",
    SUPABASE_API_KEY: "",
    TMDB_API_KEY: "",
    IGDB_CLIENT_ID: "",
    IGDB_ACCESS_TOKEN: "",
    KAKAO_JS_KEY: "",
    KAKAO_NATIVE_APP_KEY: "",
    KAKAO_REST_API_KEY: "",
    KAKAO_ADMIN_KEY: "",
    HF_TOKEN: "",

    setter: {
        setClear: function () {set({
            GEMINI_API_KEY: "",
            GOOGLE_API_KEY: "",
            GOOGLE_WEB_CLIENT_ID: "",
            SEARCH_ENGINE_ID: "",
            NAVER_CLIENT_ID: "",
            NAVER_CLIENT: "",
            SUPABASE_URL: "",
            SUPABASE_API_KEY: "",
            TMDB_API_KEY: "",
            IGDB_CLIENT_ID: "",
            KAKAO_JS_KEY: "",
            KAKAO_NATIVE_APP_KEY: "",
            KAKAO_REST_API_KEY: "",
            KAKAO_ADMIN_KEY: "",
            HF_TOKEN: "",
        })},
        decryptKey: function (encryptedBase64) {
            try {
                // Python에서 넘어온 Base64 디코드
                const rawData = CryptoJS.enc.Base64.parse(encryptedBase64);

                // IV와 암호문 분리
                const iv = CryptoJS.lib.WordArray.create(
                    rawData.words.slice(0, 16 / 4), // 16바이트 → wordArray 4개
                    16
                );
                const ciphertext = CryptoJS.lib.WordArray.create(
                    rawData.words.slice(16 / 4),
                    rawData.sigBytes - 16
                );

                // AES 복호화
                const decrypted = CryptoJS.AES.decrypt(
                    {ciphertext: ciphertext},
                    CryptoJS.enc.Utf8.parse(SECRET_KEY),
                    {
                        iv: iv,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7,
                    }
                );

                return decrypted.toString(CryptoJS.enc.Utf8);
            } catch (e) {
                console.error("❌ 복호화 에러:", e);
                return null;
            }
        },
        setKey: async function () {
            const { data, error } = await supabase.from("api_keys").select("*");
            if (error) {
                console.error("❌ Supabase 에러:", error);
                return;
            }

            data.forEach((li) => {
                set({ [li.service]: this.decryptKey(li.api_key) });
            });
        },
    },
}));