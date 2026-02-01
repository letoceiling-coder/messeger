/**
 * Фоновый сервис для обработки уведомлений
 * Работает даже когда приложение закрыто
 */

import messaging from '@react-native-firebase/messaging';
import {showLocalNotification} from './notificationService';

// Обработчик фоновых уведомлений (background/quit state)
try {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message:', remoteMessage);
    const {notification, data} = remoteMessage;
    if (notification) {
      showLocalNotification(
        notification.title || 'Новое сообщение',
        notification.body || '',
        data,
      );
    }
  });

  messaging().onNotificationOpenedApp(remoteMessage => {
    console.log('Notification opened app from background:', remoteMessage);
    if (remoteMessage.data?.chatId) {
      // NavigationService.navigate('Chat', {chatId: remoteMessage.data.chatId});
    }
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage && remoteMessage.data?.chatId) {
        console.log('Notification opened app from quit state:', remoteMessage);
      }
    })
    .catch(() => {});
} catch (e) {
  console.warn('Firebase messaging init failed:', e?.message);
}

export {};
