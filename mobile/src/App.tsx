import React, {useEffect} from 'react';
import {StatusBar, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

// Contexts
import {AuthProvider} from '@contexts/AuthContext';
import {WebSocketProvider} from '@contexts/WebSocketContext';
import {ChatsProvider} from '@contexts/ChatsContext';
import {ThemeProvider} from '@contexts/ThemeContext';
import {NotificationProvider} from '@contexts/NotificationContext';

// Navigation
import RootNavigator from './navigation/RootNavigator';

// Services
import {initializeTheme} from '@utils/theme';
import {requestNotificationPermissions} from '@services/notificationService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'new NativeEventEmitter',
  'Sending `onAnimatedValueUpdate`',
]);

const App = () => {
  useEffect(() => {
    // Инициализация темы
    initializeTheme();
    
    // Запрос разрешений на уведомления
    requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <WebSocketProvider>
              <ChatsProvider>
                <NotificationProvider>
                  <NavigationContainer>
                    <StatusBar barStyle="light-content" />
                    <RootNavigator />
                  </NavigationContainer>
                </NotificationProvider>
              </ChatsProvider>
            </WebSocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
