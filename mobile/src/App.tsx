import React, {useEffect} from 'react';
import {View, StatusBar, LogBox} from 'react-native';
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
import {ErrorBoundary} from '@components/ErrorBoundary';

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
    initializeTheme();
    // Запрос разрешений — с задержкой и без краша при ошибке
    setTimeout(() => {
      requestNotificationPermissions().catch(() => {});
    }, 500);
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <WebSocketProvider>
              <ChatsProvider>
                <NotificationProvider>
                  <ErrorBoundary>
                    <NavigationContainer>
                      <StatusBar barStyle="light-content" />
                      <RootNavigator />
                      <GlobalIncomingCallOverlay />
                    </NavigationContainer>
                  </ErrorBoundary>
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
