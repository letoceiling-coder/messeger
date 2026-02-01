import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '@contexts/ThemeContext';
import {useAuth} from '@contexts/AuthContext';
import api from '@services/api';
import {ENDPOINTS} from '@config/api';
import Icon from 'react-native-vector-icons/Ionicons';

interface User {
  id: string;
  username: string;
  email: string;
}

const NewChatScreen = () => {
  const navigation = useNavigation();
  const {colors} = useTheme();
  const {user} = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const searchUsers = useCallback(async () => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get<User[]>(`${ENDPOINTS.USERS_SEARCH}?q=${encodeURIComponent(query.trim())}`);
      setUsers(data.filter(u => u.id !== user?.id));
    } catch (e) {
      console.error('Search error:', e);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [query, user?.id]);

  useEffect(() => {
    const t = setTimeout(searchUsers, 300);
    return () => clearTimeout(t);
  }, [searchUsers]);

  const createChat = async (otherUser: User) => {
    if (creating) return;
    setCreating(true);
    try {
      const chat = await api.post(ENDPOINTS.DIRECT_CHAT, {userId: otherUser.id});
      navigation.navigate('Chat' as never, {chatId: chat.id, chat} as never);
    } catch (e) {
      console.error('Create chat error:', e);
    } finally {
      setCreating(false);
    }
  };

  const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.background},
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backBtn: {padding: 8, marginRight: 8},
    headerTitle: {fontSize: 18, fontWeight: '600', color: colors.text},
    searchInput: {
      flex: 1,
      marginLeft: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      fontSize: 16,
      color: colors.text,
    },
    listContent: {paddingVertical: 8},
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {fontSize: 18, fontWeight: '600', color: '#fff'},
    userInfo: {flex: 1},
    username: {fontSize: 16, fontWeight: '600', color: colors.text},
    email: {fontSize: 13, color: colors.textSecondary, marginTop: 2},
    empty: {
      padding: 32,
      alignItems: 'center',
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Новый чат</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск по имени или email..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.email, {textAlign: 'center'}]}>
            {query.trim() ? 'Никого не найдено' : 'Введите имя или email для поиска'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => createChat(item)}
              disabled={creating}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.username?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default NewChatScreen;
