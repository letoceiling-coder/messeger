import React, {useState} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {useTheme} from '@contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface MessageInputProps {
  onSend: (text: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  onAttach?: () => void;
  placeholder?: string;
}

export const MessageInput = ({
  onSend,
  onTyping,
  onStopTyping,
  onAttach,
  placeholder = 'Сообщение',
}: MessageInputProps) => {
  const {colors} = useTheme();
  const [text, setText] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTextChange = (value: string) => {
    setText(value);

    // Уведомить о печатании
    if (onTyping && value.length > 0) {
      onTyping();

      // Сбросить таймер
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Установить новый таймер
      const timeout = setTimeout(() => {
        if (onStopTyping) {
          onStopTyping();
        }
      }, 3000);

      setTypingTimeout(timeout);
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');

      if (onStopTyping) {
        onStopTyping();
      }

      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingHorizontal: 12,
      marginRight: 8,
      maxHeight: 100,
    },
    input: {
      flex: 1,
      paddingVertical: 8,
      fontSize: 16,
      color: colors.text,
      maxHeight: 100,
    },
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    attachButton: {
      padding: 8,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            value={text}
            onChangeText={handleTextChange}
            multiline
            maxLength={4000}
          />

          <TouchableOpacity
            style={styles.attachButton}
            onPress={onAttach}
            disabled={!onAttach}>
            <Icon name="attach" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSend}
          disabled={!text.trim()}>
          <Icon
            name={text.trim() ? 'send' : 'mic'}
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
