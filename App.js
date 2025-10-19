import React from 'react';
import Navigator from "./navigator/Navigator";
import Toast from "react-native-toast-message";
import { ThemeProvider } from './components/settings/theme/ThemeContext';

const App = () => {
    return (
        <ThemeProvider>
            <Navigator/>
            <Toast/>
        </ThemeProvider>
    );
}

export default App;