import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@contexts/ThemeContext';
import {useChats} from '@contexts/ChatsContext';
import {useAuth} from '@contexts/AuthContext';
import {Chat} from '@types/index';
import {formatChatDate} from '@utils/date';
import {hasDraft} from '@utils/drafts';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatsScreen = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {chats, isLoading, refreshChats, markChatAsRead} = useChats();
  const {user} = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkDrafts();
  }, [chats]);

  const checkDrafts = async () => {
    const draftStatus: Record<string, boolean> = {};
    for (const chat of chats) {
      draftStatus[chat.id] = await hasDraft(chat.id);
    }
    setDrafts(draftStatus);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshChats();
    await checkDrafts();
    setRefreshing(false);
  };

  const handleChatPress = (chat: Chat) => {
    markChatAsRead(chat.id);
    navigation.navigate('Chat' as never, {chatId: chat.id, chat} as never);
  };

  const getChatTitle = (chat: Chat): string => {
    if (chat.type === 'group') {
      return chat.name || 'Группа';
    }
    const otherMember = chat.members?.find(m => m.userId !== user?.id);
    return otherMember?.user?.username || 'Неизвестный';
  };

  const getChatAvatar = (chat: Chat): string => {
    if (chat.type === 'group') {
      return '👥';
    }
    const otherMember = chat.members?.find(m => m.userId !== user?.id);
    return otherMember?.user?.username?.charAt(0).toUpperCase() || '?';
  };

  const renderChatItem = ({item}: {item: Chat}) => {
    const hasDraftMessage = drafts[item.id];
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}>
        {/* Avatar */}
        <View style={[styles.avatar, {backgroundColor: colors.surface}]}>
          <Text style={[styles.avatarText, {color: colors.text}]}>
            {getChatAvatar(item)}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatTitle, {color: colors.text}]} numberOfLines={1}>
              {getChatTitle(item)}
            </Text>
            {item.lastMessageAt && (
              <Text style={[styles.chatDate, {color: colors.textSecondary}]}>
                {formatChatDate(item.lastMessageAt)}
              </Text>
            )}
          </View>

          <View style={styles.chatFooter}>
            {hasDraftMessage ? (
              <View style={styles.draftContainer}>
                <Text style={[styles.draftText, {color: colors.accent}]}>✏️ Черновик</Text>
              </View>
            ) : (
              <Text style={[styles.chatSubtitle, {color: colors.textSecondary}]} numberOfLines={1}>
                {item.lastMessageAt ? '' : 'Нет сообщений'}
              </Text>
            )}

            {item.unreadCount && item.unreadCount > 0 && (
              <View style={[styles.badge, {backgroundColor: colors.accent}]}>
                <Text style={styles.badgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '600',
    },
    chatContent: {
      flex: 1,
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    chatTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
    },
    chatDate: {
      fontSize: 12,
    },
    chatFooter: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatSubtitle: {
      fontSize: 14,
      flex: 1,
    },
    draftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    draftText: {
      fontSize: 14,
      fontWeight: '500',
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    badgeText: {
      color: '#ffffff',
      fontSize: 12,
      fontWeight: '600',
    },
  });

  if (isLoading && chats.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Чаты</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чаты</Text>
      </View>

      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chatbubbles-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>У вас пока нет чатов</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={renderChatItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </View>
  );
};

export default ChatsScreen;
