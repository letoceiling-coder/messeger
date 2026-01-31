import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useAuth} from '@contexts/AuthContext';
import {useTheme} from '@contexts/ThemeContext';
import {Theme} from '@types/index';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen = () => {
  const {user, logout} = useAuth();
  const {colors, theme, setTheme, isDark} = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        {text: 'Отмена', style: 'cancel'},
        {text: 'Выйти', style: 'destructive', onPress: logout},
      ],
    );
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
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
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    profileCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 24,
      fontWeight: '600',
      color: '#ffffff',
    },
    profileInfo: {
      flex: 1,
    },
    username: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemLast: {
      borderBottomWidth: 0,
    },
    itemContent: {
      flex: 1,
      marginLeft: 12,
    },
    itemTitle: {
      fontSize: 16,
      color: colors.text,
    },
    itemSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
    },
    themeButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeButtonActive: {
      borderColor: colors.accent,
    },
    themeIcon: {
      marginBottom: 8,
    },
    themeText: {
      fontSize: 14,
      color: colors.text,
    },
    logoutButton: {
      backgroundColor: colors.error,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
      marginHorizontal: 16,
      marginBottom: 32,
    },
    logoutButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Настройки</Text>
      </View>

      <ScrollView>
        {/* Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Профиль</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.username?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{user?.username}</Text>
              <Text style={styles.email}>{user?.email}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </View>

        {/* Theme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тема оформления</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeButton,
                theme === 'light' && styles.themeButtonActive,
              ]}
              onPress={() => handleThemeChange('light')}>
              <Icon
                name="sunny"
                size={24}
                color={colors.text}
                style={styles.themeIcon}
              />
              <Text style={styles.themeText}>Светлая</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeButton,
                theme === 'dark' && styles.themeButtonActive,
              ]}
              onPress={() => handleThemeChange('dark')}>
              <Icon
                name="moon"
                size={24}
                color={colors.text}
                style={styles.themeIcon}
              />
              <Text style={styles.themeText}>Тёмная</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeButton,
                theme === 'system' && styles.themeButtonActive,
              ]}
              onPress={() => handleThemeChange('system')}>
              <Icon
                name="phone-portrait"
                size={24}
                color={colors.text}
                style={styles.themeIcon}
              />
              <Text style={styles.themeText}>Система</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Настройки</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.item}>
              <Icon name="notifications-outline" size={24} color={colors.text} />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Уведомления</Text>
                <Text style={styles.itemSubtitle}>Звук, вибрация</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.item, styles.itemLast]}>
              <Icon name="lock-closed-outline" size={24} color={colors.text} />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Конфиденциальность</Text>
                <Text style={styles.itemSubtitle}>Статус, последняя активность</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О приложении</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.item}>
              <Icon name="information-circle-outline" size={24} color={colors.text} />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Версия</Text>
                <Text style={styles.itemSubtitle}>1.0.0</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.item, styles.itemLast]}>
              <Icon name="help-circle-outline" size={24} color={colors.text} />
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>Помощь</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
