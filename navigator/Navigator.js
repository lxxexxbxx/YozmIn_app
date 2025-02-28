import {createStackNavigator} from "@react-navigation/native/src/__stubs__/createStackNavigator";
import {NavigationContainer} from "@react-navigation/native";
import {useEffect} from "react";
import TabNavigator from "./TabNavigator";
import LoginComponent from "../components/login/LoginComponent";
import RegisterComponent from "../components/login/RegisterComponent";

const Stack = createStackNavigator();

const Navigator = () => {
    useEffect(() => {

    }, []);

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={"Login"}>
                {/*로그인 컴포넌트*/}
                <Stack.Screen name={"Login"} component={LoginComponent}/>
                {/*회원가입 컴포넌트*/}
                <Stack.Screen name={"LoginRegister"} component={RegisterComponent}/>
                {/*하단 바 네비게이터*/}
                <Stack.Screen name={"TabNavigator"} component={TabNavigator}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default Navigator;