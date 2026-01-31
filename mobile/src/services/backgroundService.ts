/**
 * Фоновый сервис для обработки уведомлений
 * Работает даже когда приложение закрыто
 */

import messaging from '@react-native-firebase/messaging';
import {showLocalNotification} from './notificationService';

// Обработчик фоновых уведомлений (background/quit state)
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

// Обработчик уведомлений при закрытом приложении
messaging().onNotificationOpenedApp(remoteMessage => {
  console.log('Notification opened app from background:', remoteMessage);
  
  // Навигация к нужному экрану
  if (remoteMessage.data?.chatId) {
    // NavigationService.navigate('Chat', {chatId: remoteMessage.data.chatId});
  }
});

// Проверка уведомления, которое открыло приложение
messaging()
  .getInitialNotification()
  .then(remoteMessage => {
    if (remoteMessage) {
      console.log('Notification opened app from quit state:', remoteMessage);
      
      // Навигация к нужному экрану
      if (remoteMessage.data?.chatId) {
        // NavigationService.navigate('Chat', {chatId: remoteMessage.data.chatId});
      }
    }
  });

export {};
