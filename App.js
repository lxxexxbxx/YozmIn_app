import React from 'react';
import Navigator from "./navigator/Navigator";
import {ThemeProvider} from './components/settings/theme/ThemeContext';
import {PaperProvider} from "react-native-paper";

const App = () => {
    return (
        <ThemeProvider>
            <PaperProvider>
                <Navigator/>
            </PaperProvider>
        </ThemeProvider>
    );
}

export default App;