import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useTheme} from '@contexts/ThemeContext';
import {useAuth} from '@contexts/AuthContext';
import {useWebSocket} from '@contexts/WebSocketContext';
import {Message, Chat} from '@types/index';
import {MessageItem} from '@components/MessageItem';
import {MessageInput} from '@components/MessageInput';
import {saveDraft, getDraft, deleteDraft} from '@utils/drafts';
import api from '@services/api';
import {mediaService} from '@services/media.service';
import {ENDPOINTS} from '@config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';

const ChatScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {user} = useAuth();
  const {socket, isConnected, joinChat, sendMessage, onMessage} = useWebSocket();

  const {chatId, chat: initialChat} = route.params as {chatId: string; chat?: Chat};
  const [chat, setChat] = useState<Chat | undefined>(initialChat);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    loadDraft();
    if (!chat?.members?.length) {
      api.get<Chat>(`${ENDPOINTS.CHATS}/${chatId}`).then(setChat).catch(() => {});
    }
    
    if (isConnected) {
      joinChat(chatId);
    }

    // Слушатель новых сообщений (дедупликация — сервер шлёт и в room, и client)
    const unsubscribe = onMessage((message: Message) => {
      if (message.chatId === chatId) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [message, ...prev];
        });
        
        // Прокрутить вниз
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({offset: 0, animated: true});
        }, 100);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [chatId, isConnected]);

  const loadMessages = async () => {
    try {
      const data = await api.get<Message[]>(`${ENDPOINTS.MESSAGES}?chatId=${chatId}`);
      setMessages(data.reverse()); // Reverse для отображения снизу вверх
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = async () => {
    const draft = await getDraft(chatId);
    if (draft) {
      // Можно установить в MessageInput, если добавить prop defaultValue
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      // Отправить через WebSocket
      sendMessage({
        chatId,
        content: text.trim(),
        messageType: 'text',
      });

      // Удалить черновик
      await deleteDraft(chatId);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleAttach = () => {
    launchImageLibrary(
      {mediaType: 'mixed', selectionLimit: 5, includeBase64: false},
      async response => {
        if (response.didCancel || !response.assets?.length) return;
        if (response.errorCode) {
          Alert.alert('Ошибка', response.errorMessage || 'Не удалось выбрать файл');
          return;
        }
        setSending(true);
        try {
          for (const asset of response.assets) {
            const uri = asset.uri || (asset as any).originalPath;
            if (!uri) continue;
            const isVideo = (asset.type || '').startsWith('video/');
            const mimeType = asset.type || (isVideo ? 'video/mp4' : 'image/jpeg');
            const fileName = asset.fileName || (isVideo ? 'video.mp4' : 'image.jpg');
            const res = isVideo
              ? await mediaService.uploadVideo(uri, chatId, mimeType, fileName)
              : await mediaService.uploadImage(uri, chatId, mimeType, fileName);
            if (res?.message) {
              setMessages(prev => {
                if (prev.some(m => m.id === res.message.id)) return prev;
                return [res.message, ...prev];
              });
            }
          }
        } catch (e: any) {
          console.error('Upload error:', e?.message || e);
          const msg = e?.response?.data?.message || e?.message || 'Не удалось загрузить файл';
          Alert.alert('Ошибка', msg);
        } finally {
          setSending(false);
        }
      },
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.delete(`${ENDPOINTS.MESSAGES}/${messageId}`);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (e) {
      console.error('Delete error:', e);
      Alert.alert('Ошибка', 'Не удалось удалить сообщение');
    }
  };

  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit('typing:start', {chatId});
    }
  };

  const handleStopTyping = () => {
    if (socket && isConnected) {
      socket.emit('typing:stop', {chatId});
    }
  };

  const getChatTitle = (): string => {
    if (chat?.type === 'group') {
      return chat.name || 'Группа';
    }
    const otherMember = chat?.members?.find(m => m.userId !== user?.id);
    return otherMember?.user?.username || 'Чат';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    headerButton: {
      padding: 8,
      marginLeft: 4,
      minWidth: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    messagesList: {
      flex: 1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getChatTitle()}</Text>
          {isConnected ? (
            <Text style={styles.headerSubtitle}>в сети</Text>
          ) : (
            <Text style={styles.headerSubtitle}>нет соединения</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            const otherUserId = chat?.members?.find(m => m.userId !== user?.id)?.userId;
            if (otherUserId) {
              navigation.navigate('Call' as never, {chatId, userId: otherUserId, isVideo: false} as never);
            } else if (chat?.type === 'group') {
              Alert.alert('Групповой чат', 'Звонки доступны только в личных чатах');
            } else {
              Alert.alert('Ожидание', 'Загрузка данных чата...');
            }
          }}>
          <Icon name="call" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => {
            const otherUserId = chat?.members?.find(m => m.userId !== user?.id)?.userId;
            if (otherUserId) {
              navigation.navigate('Call' as never, {chatId, userId: otherUserId, isVideo: true} as never);
            } else if (chat?.type === 'group') {
              Alert.alert('Групповой чат', 'Звонки доступны только в личных чатах');
            } else {
              Alert.alert('Ожидание', 'Загрузка данных чата...');
            }
          }}>
          <Icon name="videocam" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chatbubble-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Начните общение!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <MessageItem
              message={item}
              onLongPress={() => {
                if (item.userId === user?.id) {
                  Alert.alert(
                    'Удалить сообщение?',
                    '',
                    [
                      {text: 'Отмена', style: 'cancel'},
                      {text: 'Удалить', style: 'destructive', onPress: () => handleDeleteMessage(item.id)},
                    ],
                  );
                }
              }}
            />
          )}
          inverted
          contentContainerStyle={{paddingVertical: 8}}
        />
      )}

      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        onAttach={handleAttach}
      />
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
