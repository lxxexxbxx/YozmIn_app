import {View} from "react-native";
import ChatBotComponent from "../chatbot/ChatBotComponent";
import {useEffect} from "react";
import {useNavigation} from "@react-navigation/native";
import {useUserStore} from "../../stores/UserStore";

const HomeComponent = () => {
    const navigation = useNavigation();
    const store = useUserStore();

    useEffect(() => {
        if(!store.categories) {
            navigation.navigate("SelectCategory");
        }
    }, []);

    return (
        <View style={{flex: 1}}>
            <ChatBotComponent/>
        </View>
    )
}

export default HomeComponent;