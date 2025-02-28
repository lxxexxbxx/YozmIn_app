import {StyleSheet, Text, View, TouchableOpacity} from "react-native";
import {useNavigation} from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

const PageTitleComponent = ({title}) => {
    const navigation = useNavigation();

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.arrow} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.arrow}/>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: "space-between",
    },
    arrow: {
        marginTop: 8,
        width: 20,
    },
    title: {
        flexGrow: 1,
        textAlign: "center",
        fontSize: 25,
        fontWeight: "bold",
        marginBottom: 20,
    },
})

export default PageTitleComponent;