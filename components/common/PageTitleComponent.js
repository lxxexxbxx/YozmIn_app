import {StyleSheet, Text, View, TouchableOpacity} from "react-native";
import {useNavigation} from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

const PageTitleComponent = ({title, darkMode, backToTab, backToStack}) => {
    const navigation = useNavigation();

    const back = () => {
        if(!!backToTab) navigation.navigate("TabNavigator", {screen: `${backToTab}`});
        else if(!!backToStack) navigation.navigate(`${backToStack}`);
        else navigation.goBack();
    }

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.arrow} onPress={() => back()}>
                {darkMode === true ? <Ionicons name="chevron-back" size={24} color="white"/> : <Ionicons name="chevron-back" size={24} color="black" />}
            </TouchableOpacity>
            <Text style={darkMode === true ? styles.darkTitle : styles.title}>{title}</Text>
            <View style={styles.arrow}/>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: "space-between",
        marginTop: 40,
        marginLeft: 20,
        marginRight: 20,
    },
    arrow: {
        marginTop: 8,
        width: 20,
    },
    title: {
        flexGrow: 1,
        textAlign: "left",
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 20,
        marginLeft: 20,
    },
    darkTitle: {
        flexGrow: 1,
        textAlign: "center",
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 20,
        color: "white",
    }
})

export default PageTitleComponent;