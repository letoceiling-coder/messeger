/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

// Регистрация фоновых задач
import './src/services/backgroundService';

AppRegistry.registerComponent(appName, () => App);
