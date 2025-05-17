import SignUpNameForm from "./SignUpNameForm";
import {useEffect} from "react";
import {useUserStore} from "../../stores/UserStore";

const SignUpComponent = () => {
  const store = useUserStore();

  useEffect(() => {
    if(store.name || store.user_id || store.password ||
        store.email || store.birth_date) {
      store.setter.setName("");
      store.setter.setId("");
      store.setter.setPw("");
      store.setter.setEmail("");
      store.setter.setBirthDate("");
    }
  }, []);

  return (
      <SignUpNameForm/>
  )
}

export default SignUpComponent;