/**
 * Сервис для работы с уведомлениями
 */

import PushNotification from 'react-native-push-notification';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';

/**
 * Инициализация уведомлений
 */
export const initializeNotifications = () => {
  // Настройка PushNotification
  PushNotification.configure({
    onRegister: token => {
      console.log('Token:', token);
    },

    onNotification: notification => {
      console.log('Notification:', notification);
      
      // Обработка клика по уведомлению
      if (notification.userInteraction) {
        handleNotificationPress(notification.data);
      }
    },

    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },

    popInitialNotification: true,
    requestPermissions: Platform.OS === 'ios',
  });

  // Создание канала для Android
  if (Platform.OS === 'android') {
    PushNotification.createChannel(
      {
        channelId: 'messenger-default',
        channelName: 'Messenger',
        channelDescription: 'Main notification channel',
        playSound: true,
        soundName: 'default',
        importance: 4,
        vibrate: true,
      },
      created => console.log(`Channel created: ${created}`),
    );

    PushNotification.createChannel(
      {
        channelId: 'messenger-calls',
        channelName: 'Calls',
        channelDescription: 'Incoming calls',
        playSound: true,
        soundName: 'ringtone',
        importance: 5,
        vibrate: true,
      },
      created => console.log(`Calls channel created: ${created}`),
    );
  }
};

/**
 * Запрос разрешений на уведомления
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Получить FCM токен
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Показать локальное уведомление
 */
export const showLocalNotification = (
  title: string,
  message: string,
  data?: any,
  channelId = 'messenger-default',
) => {
  PushNotification.localNotification({
    channelId,
    title,
    message,
    playSound: true,
    soundName: channelId === 'messenger-calls' ? 'ringtone' : 'default',
    vibrate: true,
    vibration: 300,
    userInfo: data,
  });
};

/**
 * Показать уведомление о входящем звонке
 */
export const showIncomingCallNotification = (
  callerName: string,
  chatId: string,
) => {
  showLocalNotification(
    'Входящий звонок',
    `${callerName} звонит вам...`,
    {type: 'call', chatId},
    'messenger-calls',
  );
};

/**
 * Обработка нажатия на уведомление
 */
const handleNotificationPress = (data: any) => {
  console.log('Notification pressed with data:', data);
  
  // Здесь можно навигировать к нужному экрану
  // Например, открыть чат или ответить на звонок
  if (data.type === 'message' && data.chatId) {
    // Навигация к чату
    // NavigationService.navigate('Chat', {chatId: data.chatId});
  } else if (data.type === 'call' && data.chatId) {
    // Открыть экран звонка
    // NavigationService.navigate('Call', {chatId: data.chatId});
  }
};

/**
 * Отменить все уведомления
 */
export const cancelAllNotifications = () => {
  PushNotification.cancelAllLocalNotifications();
};

/**
 * Установить badge count (iOS)
 */
export const setBadgeCount = (count: number) => {
  if (Platform.OS === 'ios') {
    PushNotification.setApplicationIconBadgeNumber(count);
  }
};
