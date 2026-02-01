/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

// Регистрация фоновых задач — отложенно, чтобы не блокировать запуск приложения
setTimeout(() => {
  try {
    require('./src/services/backgroundService');
  } catch (e) {
    console.warn('Background service init failed:', e?.message);
  }
}, 1000);

AppRegistry.registerComponent(appName, () => App);
