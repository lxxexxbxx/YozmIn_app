import React from 'react';
import Navigator from "./navigator/Navigator";
import Toast from "react-native-toast-message";
import { ThemeProvider } from './components/settings/theme/ThemeContext';
import {PaperProvider} from "react-native-paper";

const App = () => {
    return (
        <ThemeProvider>
            <PaperProvider>
                <Navigator/>
                <Toast/>
            </PaperProvider>
        </ThemeProvider>
    );
}

export default App;