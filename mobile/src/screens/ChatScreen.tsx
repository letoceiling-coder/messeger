import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Message } from '../types';
import { messagesService } from '../services/messages.service';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../types';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { VoiceMessage } from '../components/VoiceMessage';
import { VideoCall } from '../components/VideoCall';
import { encryptionService } from '../services/encryption.service';
import { api } from '../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;
type RouteProps = RouteProp<RootStackParamList, 'Chat'>;

export const ChatScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { chatId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInCall, setIsInCall] = useState(false);
  const [useEncryption, setUseEncryption] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    chatId: string;
    callerId: string;
    offer: RTCSessionDescriptionInit;
  } | null>(null);
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    initializeEncryption();

    const handleMessageReceived = async (message: Message) => {
      if (message.chatId === chatId) {
        // Дешифрование зашифрованных сообщений
        if (message.isEncrypted && message.encryptedContent && message.iv) {
          try {
            const decrypted = await encryptionService.decryptMessage(
              message.encryptedContent,
              message.iv,
              chatId,
            );
            if (decrypted) {
              message.content = decrypted;
            }
          } catch (error) {
            console.error('Ошибка дешифрования сообщения:', error);
            message.content = '[Зашифрованное сообщение - ошибка дешифрования]';
          }
        }

        setMessages((prev) => [...prev, message]);
        socket.markAsDelivered(message.id);
        scrollToBottom();
      }
    };

    // Подписка на входящие звонки
    const handleCallOffer = (data: {
      chatId: string;
      offer: RTCSessionDescriptionInit;
      callerId: string;
    }) => {
      if (data.chatId === chatId) {
        setIncomingCall(data);
      }
    };

    socket.onMessageReceived(handleMessageReceived);
    socket.on('call:offer', handleCallOffer);

    return () => {
      socket.offMessageReceived(handleMessageReceived);
      socket.off('call:offer', handleCallOffer);
    };
  }, [chatId, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await messagesService.getMessages(chatId);
      // Дешифрование зашифрованных сообщений
      const decryptedMessages = await Promise.all(
        data.map(async (msg) => {
          if (msg.isEncrypted && msg.encryptedContent && msg.iv) {
            try {
              const decrypted = await encryptionService.decryptMessage(
                msg.encryptedContent,
                msg.iv,
                chatId,
              );
              if (decrypted) {
                return { ...msg, content: decrypted };
              }
            } catch (error) {
              console.error('Ошибка дешифрования сообщения:', error);
            }
          }
          return msg;
        }),
      );
      setMessages(decryptedMessages.reverse());
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeEncryption = async () => {
    if (!chatId || !user) return;

    // Загрузить приватный ключ
    const hasPrivateKey = await encryptionService.loadPrivateKey();
    if (!hasPrivateKey) {
      // Генерировать новую пару ключей
      const { publicKey } = await encryptionService.generateKeyPair();
      await encryptionService.savePublicKey(publicKey);
    }

    // Получить другого участника чата
    try {
      const chat = await api.get(`/chats/${chatId}`);
      const otherMember = chat.data.members?.find((m: any) => m.userId !== user.id);
      if (otherMember) {
        await encryptionService.initializeChatEncryption(chatId, otherMember.userId);
        setUseEncryption(true);
      }
    } catch (error) {
      console.error('Ошибка инициализации шифрования:', error);
    }
  };

  const scrollToBottom = () => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await socket.sendMessage(chatId, newMessage.trim(), useEncryption);
      setNewMessage('');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAudioUrl = (audioUrl?: string) => {
    if (!audioUrl) return null;
    if (audioUrl.startsWith('http')) return audioUrl;
    const baseUrl = 'http://localhost:3000'; // Замените на ваш IP
    return `${baseUrl}${audioUrl}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.userId === user?.id;
    const isVoice = item.messageType === 'voice';
    const audioUrl = getAudioUrl(item.audioUrl);

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.messageOwn : styles.messageOther,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
          ]}
        >
          {isVoice && audioUrl ? (
            <VoiceMessage audioUrl={audioUrl} isOwn={isOwn} />
          ) : (
            <Text
              style={[
                styles.messageText,
                isOwn ? styles.messageTextOwn : styles.messageTextOther,
              ]}
            >
              {item.content}
            </Text>
          )}
          <Text
            style={[
              styles.messageTime,
              isOwn ? styles.messageTimeOwn : styles.messageTimeOther,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const handleStartCall = () => {
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setIncomingCall(null);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (isInCall || incomingCall) {
    return (
      <VideoCall
        chatId={chatId}
        isIncoming={!!incomingCall}
        callerId={incomingCall?.callerId}
        offer={incomingCall?.offer}
        onEnd={handleEndCall}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Чат {useEncryption && '🔒'}
        </Text>
        {useEncryption && (
          <View style={styles.encryptionBadge}>
            <Text style={styles.encryptionBadgeText}>🔒 E2EE</Text>
          </View>
        )}
        <TouchableOpacity onPress={handleStartCall} style={styles.videoCallButton}>
          <Text style={styles.videoCallButtonText}>📹</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      <View style={styles.inputContainer}>
        <VoiceRecorder chatId={chatId} onSent={() => loadMessages()} />
        <View style={styles.textInputRow}>
          <TextInput
            style={styles.input}
            placeholder="Введите сообщение..."
            placeholderTextColor="#9ca3af"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>Отправить</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    fontSize: 16,
    color: '#4f46e5',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  encryptionBadge: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  encryptionBadgeText: {
    fontSize: 12,
    color: '#065f46',
    fontWeight: '600',
  },
  videoCallButton: {
    padding: 8,
  },
  videoCallButtonText: {
    fontSize: 24,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageOwn: {
    alignItems: 'flex-end',
  },
  messageOther: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  messageBubbleOwn: {
    backgroundColor: '#4f46e5',
  },
  messageBubbleOther: {
    backgroundColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  messageTextOwn: {
    color: '#fff',
  },
  messageTextOther: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
  },
  messageTimeOwn: {
    color: '#c7d2fe',
  },
  messageTimeOther: {
    color: '#6b7280',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  textInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  voiceButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginBottom: 4,
  },
  voiceButtonText: {
    color: '#111827',
    fontSize: 14,
  },
  voiceButtonTextOwn: {
    color: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
