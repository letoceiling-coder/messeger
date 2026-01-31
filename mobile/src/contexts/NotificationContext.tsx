import React, {createContext, useContext, useEffect, ReactNode} from 'react';
import {Platform} from 'react-native';
import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import {useAuth} from './AuthContext';
import api from '@services/api';

interface NotificationContextType {
  requestPermission: () => Promise<boolean>;
  showLocalNotification: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({children}: {children: ReactNode}) => {
  const {isAuthenticated, user} = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setupNotifications();
    }
  }, [isAuthenticated]);

  const setupNotifications = async () => {
    // Настройка канала уведомлений (Android)
    PushNotification.createChannel(
      {
        channelId: 'messenger-channel',
        channelName: 'Messenger Notifications',
        channelDescription: 'Notifications for new messages and calls',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`Channel created: ${created}`),
    );

    // Получить FCM токен
    try {
      const fcmToken = await messaging().getToken();
      console.log('FCM Token:', fcmToken);
      
      // Отправить токен на сервер
      if (user) {
        await api.post('/users/fcm-token', {token: fcmToken});
      }
    } catch (error) {
      console.error('Ошибка получения FCM токена:', error);
    }

    // Слушатель входящих уведомлений (foreground)
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      
      if (remoteMessage.notification) {
        showLocalNotification(
          remoteMessage.notification.title || 'Новое сообщение',
          remoteMessage.notification.body || '',
        );
      }
    });

    return unsubscribe;
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Разрешение на уведомления получено');
      }

      return enabled;
    } catch (error) {
      console.error('Ошибка запроса разрешения на уведомления:', error);
      return false;
    }
  };

  const showLocalNotification = (title: string, message: string) => {
    PushNotification.localNotification({
      channelId: 'messenger-channel',
      title,
      message,
      playSound: true,
      soundName: 'default',
      vibrate: true,
      vibration: 300,
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        requestPermission,
        showLocalNotification,
      }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification должен использоваться внутри NotificationProvider');
  }
  return context;
};
