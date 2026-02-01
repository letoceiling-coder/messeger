import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Linking} from 'react-native';
import {Message} from '@types/index';
import {useAuth} from '@contexts/AuthContext';
import {useTheme} from '@contexts/ThemeContext';
import {formatMessageTime} from '@utils/date';
import Icon from 'react-native-vector-icons/Ionicons';
import {VoiceMessage} from './VoiceMessage';
import {MEDIA_BASE_URL} from '@config/api';

const BASE_URL = MEDIA_BASE_URL;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const MEDIA_MAX_WIDTH = SCREEN_WIDTH * 0.65;

interface MessageItemProps {
  message: Message;
  onLongPress?: () => void;
}

export const MessageItem = ({message, onLongPress}: MessageItemProps) => {
  const {user} = useAuth();
  const {colors} = useTheme();
  const isOwnMessage = message.userId === user?.id;

  const getMediaUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  };

  const renderContent = () => {
    if (message.messageType === 'voice') {
      const url = getMediaUrl(message.audioUrl);
      if (url) return <VoiceMessage audioUrl={url} isOwn={isOwnMessage} />;
      return <Text style={styles.content}>🎤 Голосовое</Text>;
    }
    if (message.messageType === 'image') {
      const url = getMediaUrl(message.mediaUrl);
      if (url) {
        return (
          <Image
            source={{uri: url}}
            style={[styles.mediaImage, {maxWidth: MEDIA_MAX_WIDTH}]}
            resizeMode="cover"
            onError={() => console.warn('Image load failed:', url)}
          />
        );
      }
      return <Text style={styles.content}>🖼 Фото</Text>;
    }
    if (message.messageType === 'video') {
      const url = getMediaUrl(message.mediaUrl);
      if (url) {
        return (
          <TouchableOpacity
            onPress={() => Linking.openURL(url).catch(() => {})}
            style={[styles.videoPlaceholder, {maxWidth: MEDIA_MAX_WIDTH}]}>
            <Icon name="play-circle" size={48} color="#fff" />
            <Text style={styles.videoText}>Нажмите для просмотра</Text>
          </TouchableOpacity>
        );
      }
      return <Text style={styles.content}>🎥 Видео</Text>;
    }
    if (message.messageType === 'document') {
      return <Text style={styles.content}>📎 {message.fileName || 'Документ'}</Text>;
    }
    return <Text style={styles.content}>{message.content || ''}</Text>;
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
    mediaImage: {
      height: 200,
      borderRadius: 12,
      marginVertical: 4,
    },
    videoPlaceholder: {
      height: 160,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 4,
    },
    videoText: {
      color: '#fff',
      marginTop: 8,
      fontSize: 14,
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
        {renderContent()}

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
