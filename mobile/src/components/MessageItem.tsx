import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Message} from '@types/index';
import {useAuth} from '@contexts/AuthContext';
import {useTheme} from '@contexts/ThemeContext';
import {formatMessageTime} from '@utils/date';
import Icon from 'react-native-vector-icons/Ionicons';

interface MessageItemProps {
  message: Message;
  onLongPress?: () => void;
}

export const MessageItem = ({message, onLongPress}: MessageItemProps) => {
  const {user} = useAuth();
  const {colors} = useTheme();
  const isOwnMessage = message.userId === user?.id;

  const getMessageContent = () => {
    if (message.messageType === 'voice') {
      return '🎤 Голосовое сообщение';
    }
    if (message.messageType === 'image') {
      return '🖼 Фото';
    }
    if (message.messageType === 'video') {
      return '🎥 Видео';
    }
    if (message.messageType === 'document') {
      return `📎 ${message.fileName || 'Документ'}`;
    }
    return message.content || '';
  };

  const renderDeliveryStatus = () => {
    if (!isOwnMessage) return null;

    const status = message.deliveryStatus;
    if (status === 'read') {
      return <Icon name="checkmark-done" size={14} color={colors.accent} />;
    }
    if (status === 'delivered') {
      return <Icon name="checkmark-done" size={14} color={colors.textSecondary} />;
    }
    return <Icon name="checkmark" size={14} color={colors.textSecondary} />;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    bubble: {
      maxWidth: '75%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: isOwnMessage ? colors.accent : colors.surface,
    },
    content: {
      fontSize: 16,
      color: isOwnMessage ? '#ffffff' : colors.text,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 4,
    },
    time: {
      fontSize: 11,
      color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
    },
    edited: {
      fontSize: 11,
      color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
      fontStyle: 'italic',
    },
    replyContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      padding: 8,
      borderRadius: 8,
      marginBottom: 4,
      borderLeftWidth: 2,
      borderLeftColor: isOwnMessage ? '#ffffff' : colors.accent,
    },
    replyText: {
      fontSize: 13,
      color: isOwnMessage ? 'rgba(255, 255, 255, 0.8)' : colors.textSecondary,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onLongPress={onLongPress}
      activeOpacity={0.7}>
      <View style={styles.bubble}>
        {/* Reply */}
        {message.replyTo && (
          <View style={styles.replyContainer}>
            <Text style={styles.replyText} numberOfLines={2}>
              {message.replyTo.content || 'Медиафайл'}
            </Text>
          </View>
        )}

        {/* Content */}
        <Text style={styles.content}>{getMessageContent()}</Text>

        {/* Footer */}
        <View style={styles.footer}>
          {message.isEdited && <Text style={styles.edited}>изменено</Text>}
          <Text style={styles.time}>{formatMessageTime(message.createdAt)}</Text>
          {renderDeliveryStatus()}
        </View>
      </View>
    </TouchableOpacity>
  );
};
