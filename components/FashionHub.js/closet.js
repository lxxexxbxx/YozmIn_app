import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

const ClosetScreen = () => {
  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity style={styles.backButton}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      {/* 캐릭터 이름과 옷장 타이틀 */}
      <Text style={styles.title}>(캐릭터 이름) 옷장</Text>

      {/* 캐릭터 이미지 */}
      <View style={styles.characterContainer}>
        <Image style={styles.characterImage} source={require("../../assets/tino.jpg")} />
      </View>

      {/* 카테고리 탭 */}
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryText}>옷</Text>
        <Text style={styles.categoryText}>모자</Text>
        <Text style={styles.categoryText}>하의</Text>
      </View>

      {/* 아이템 박스 */}
      <View style={styles.itemGrid}>
        <View style={[styles.itemSlot, styles.rightBorder, styles.bottomBorder]}>
          <Image style={styles.itemImage} source={require("../../assets/tino.jpg")} />
        </View>
        <View style={[styles.itemSlot, styles.bottomBorder]}>
          <Image style={styles.itemImage} source={require("../../assets/tino.jpg")} />
        </View>
        <View style={[styles.itemSlot, styles.rightBorder]}>
          <View style={styles.emptySlot} />
        </View>
        <View style={styles.itemSlot}>
          <View style={styles.emptySlot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    marginTop: 30,
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
  },
  backArrow: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  characterContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
    marginTop: 10,  
  },
  characterImage: {
    width: 170,
    height: 170,
  },
  categoryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "70%",
    borderBottomWidth: 2,
    paddingBottom: 5,
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  itemGrid: {
    width: "80%",
    height: 350,
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 2,
    borderColor: "#000",
  },
  itemSlot: {
    width: "50%",
    height: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  itemImage: {
    width: 100,
    height: 150,
  },
  emptySlot: {
    width: 100,
    height: 150,
    borderWidth: 1,
    borderColor: "#AAA",
  },
  rightBorder: {
    borderRightWidth: 2,
    borderColor: "#000",
  },
  bottomBorder: {
    borderBottomWidth: 2,
    borderColor: "#000",
  },
});


export default ClosetScreen;
