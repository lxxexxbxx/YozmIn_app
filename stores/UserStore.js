import {create} from "zustand/react";

export const useUserStore = create((set) =>({
  name: "",
  user_id: "",
  password: "",
  email: "",
  birth_date: "",
  categories: "",
  coin : 0,

  setter: {
    setClear: function () {set({
      name: "",
      user_id: "",
      password: "",
      email: "",
      birth_date: "",
      categories: "",
      coin : 0,
    })},
    setUser: function (name, userId, email, birthDate, categories) {set({
        name: name,
        user_id: userId,
        email: email,
        birth_date: birthDate,
        categories: categories,
    })},
    setName: function (value) {set({name: value})},
    setId: function (value) {set({user_id: value})},
    setPw: function (value) {set({password: value})},
    setEmail: function (value) {set({email: value})},
    setBirthDate: function (value) {set({birth_date: value})},
    setCategories: function (value) {set({categories: value})},
    setCoin: function (value) {set({ coin: Number(value) || 0 })}},

}));