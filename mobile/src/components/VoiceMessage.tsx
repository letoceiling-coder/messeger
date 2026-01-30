import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

interface VoiceMessageProps {
  audioUrl: string;
  isOwn: boolean;
}

export const VoiceMessage = ({ audioUrl, isOwn }: VoiceMessageProps) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playAudio = async () => {
    if (!audioUrl) return;

    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Ошибка воспроизведения:', error);
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={isPlaying ? stopAudio : playAudio}
      style={[styles.button, isOwn && styles.buttonOwn]}
    >
      <Text style={[styles.text, isOwn && styles.textOwn]}>
        {isPlaying ? '⏸ Остановить' : '▶ Воспроизвести'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginBottom: 4,
  },
  buttonOwn: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  text: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '500',
  },
  textOwn: {
    color: '#fff',
  },
});
