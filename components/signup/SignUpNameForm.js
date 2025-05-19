import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Dimensions, TouchableOpacity, TextInput} from 'react-native';
import { Svg, Path, Circle } from 'react-native-svg';
import {useNavigation} from "@react-navigation/native";
import PageTitleComponent from "../../components/common/PageTitleComponent";
import {useUserStore} from "../../stores/UserStore";
import {CommonUtils} from "../common/CommonUtils";

const { width, height } = Dimensions.get('window');

const SignUpNameForm = () => {
  const navigation = useNavigation();
  const store = useUserStore();

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    CommonUtils.noGoBack();

    if(store.name) setName(store.name);
  }, []);

  const handleNext = () => {
    setError("");
    setName(name.trim());

    if(!name.trim()) {
      setError("이름을 입력해주세요.");
      setName("");
      return;
    }

    store.setter.setName(name);
    navigation.replace("SignUpId");
  }

  return (
      <View style={styles.FormContainer}>
        <PageTitleComponent title={"회원가입"} darkMode={false} backToStack={"Login"}></PageTitleComponent>
        <View style={styles.fNull1}/>
        <View style={styles.textContainer}>
          <Text style={styles.text}>
            {"이름을 입력해주세요."}
          </Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {"이름"}
          </Text>
          <View style={{flexDirection: "row"}}>
            <TextInput style={styles.inputBox} value={name} placeholder={"이름"}
                       onChangeText={(value) => {
                         setName(value);
                         setError("");
                       }}/>
            <TouchableOpacity style={{flex: 1, marginBottom: 15, justifyContent: "center", alignItems: "center"}}
                              onPress={() => setName("")}>
              <Svg width="20" height="21" viewBox="0 0 20 21" fill="none" >
                <Circle cx="10" cy="10.5" r="10" fill="#C7C7C7"/>
                <Path d="M5.80005 6.30005L14.3 14.8" stroke="white" strokeWidth="2"/>
                <Path d="M5.80005 14.8L14.3 6.30005" stroke="white" strokeWidth="2"/>
              </Svg>
            </TouchableOpacity>
          </View>
          {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
        </View>
        <View style={styles.fNull2}/>
        <TouchableOpacity onPress={() => {handleNext()}}>
          <View style={styles.btnContainer}>
            <Text style={styles.btn}>
              {"다음"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
  )
}

const styles = StyleSheet.create({
  FormContainer: {
    position: "relative",
    flexShrink: 0,
    backgroundColor: "rgba(255, 255, 255, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    rowGap: 0,
  },
  fNull1: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.075,
    width: width * 0.87,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  textContainer: {
    position: "relative",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
    paddingVertical: height * 0.04,
  },
  text: {
    position: "absolute",
    flexShrink: 0,
    textAlign: "center",
    color: "rgba(0, 0, 0, 1)",
    fontFamily: "Share",
    fontSize: width * 0.07,
    fontWeight: 700,
  },
  inputContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  lbName: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    rowGap: 0,
  },
  label: {
    textAlign: "left",
    fontFamily: "Kanit",
    fontSize: width * 0.04,
    fontWeight: 700,
  },
  inputBox: {
    width: width * 0.72,
    marginBottom: 20,
    borderBottomWidth: 1,
  },
  fNull2: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.45,
    width: width * 0.98,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
    paddingHorizontal: width * 0.18,
    paddingVertical: height * 0.018,
  },
  btnContainer: {
    position: "relative",
    flexShrink: 0,
    height: height * 0.073,
    width: width * 0.78,
    backgroundColor: "rgba(118, 166, 255, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    rowGap: height * 0.012,
    paddingHorizontal: width * 0.10,
    paddingVertical: height * 0.018,
    borderRadius: 30,
  },
  btn: {
    position: "absolute",
    textAlign: "center",
    color: "rgba(255, 255, 255, 1)",
    fontFamily: "Share",
    fontSize: width * 0.07,
    fontWeight: 400,
  }
});

export default SignUpNameForm;