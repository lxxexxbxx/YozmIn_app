import {create} from "zustand/react";

export const useUserStore = create((set) =>({
  name: "",
  user_id: "",
  password: "",
  email: "",
  birth_date: "",

  setter: {
    setName: function (value) {set({name: value})},
    setId: function (value) {set({user_id: value})},
    setPw: function (value) {set({password: value})},
    setEmail: function (value) {set({email: value})},
    setBirthDate: function (value) {set({birth_date: value})},
  }

}));