import {create} from "zustand";
import supabase from "../supabase";
import {CommonUtils} from "../components/common/CommonUtils";

export const useKeyStore = create((set, get) =>({
    GOOGLE_API_KEY: "",
    SEARCH_ENGINE_ID: "",
    NAVER_CLIENT_ID: "",
    NAVER_CLIENT_SECRET: "",
    SUPABASE_URL: "",
    SUPABASE_API_KEY: "",
    TMDB_API_KEY: "",
    IGDB_CLIENT_ID: "",
    IGDB_ACCESS_TOKEN: "",
    KAKAO_JS_KEY: "",
    KAKAO_NATIVE_APP_KEY: "",
    KAKAO_REST_API_KEY: "",
    KAKAO_ADMIN_KEY: "",

    setter: {
        setClear: function () {set({
            GOOGLE_API_KEY: "",
            SEARCH_ENGINE_ID: "",
            NAVER_CLIENT_ID: "",
            NAVER_CLIENT_SECRET: "",
            SUPABASE_URL: "",
            SUPABASE_API_KEY: "",
            TMDB_API_KEY: "",
            IGDB_CLIENT_ID: "",
            KAKAO_JS_KEY: "",
            KAKAO_NATIVE_APP_KEY: "",
            KAKAO_REST_API_KEY: "",
            KAKAO_ADMIN_KEY: "",
        })},
        setKey: async function () {
            const { data, error } = await supabase.from("api_keys").select("*");
            if (error) {
                console.error("❌ Supabase 에러:", error);
                return;
            }

            data.forEach((li) => {
                set({ [li.service]: CommonUtils.decryptKey(li.api_key) });
            });
        },
    },
}));