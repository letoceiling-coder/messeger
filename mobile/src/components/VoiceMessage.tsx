import {useState, useEffect, useRef} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Linking} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

interface VoiceMessageProps {
  audioUrl: string;
  isOwn: boolean;
}

export const VoiceMessage = ({audioUrl, isOwn}: VoiceMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const playerRef = useRef<AudioRecorderPlayer | null>(null);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.stopPlayer().catch(() => {});
        playerRef.current.removePlayBackListener();
        playerRef.current = null;
      }
    };
  }, []);

  const playAudio = async () => {
    if (!audioUrl) return;

    if (playerRef.current) {
      await playerRef.current.stopPlayer();
      playerRef.current.removePlayBackListener();
      playerRef.current = null;
      setIsPlaying(false);
    }

    setLoadError(false);
    const player = new AudioRecorderPlayer();
    playerRef.current = player;

    try {
      player.addPlayBackListener(e => {
        if (e.isFinished) {
          setIsPlaying(false);
          player.stopPlayer().catch(() => {});
          player.removePlayBackListener();
          playerRef.current = null;
        }
      });

      await player.startPlayer(audioUrl);
      setIsPlaying(true);
    } catch (err) {
      console.error('Voice play error:', err);
      setLoadError(true);
      playerRef.current = null;
    }
  };

  const stopAudio = async () => {
    if (playerRef.current) {
      try {
        await playerRef.current.stopPlayer();
        playerRef.current.removePlayBackListener();
      } catch (_) {}
      playerRef.current = null;
      setIsPlaying(false);
    }
  };

  const openInExternal = () => Linking.openURL(audioUrl).catch(() => {});

  if (loadError) {
    return (
      <View style={[styles.container, isOwn && styles.containerOwn]}>
        <TouchableOpacity onPress={openInExternal} style={styles.fallbackBtn}>
          <Text style={styles.fallbackText}>Открыть в плеере</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={isPlaying ? stopAudio : playAudio}
      style={[styles.button, isOwn && styles.buttonOwn]}
      activeOpacity={0.7}>
      <Text style={[styles.text, isOwn && styles.textOwn]}>
        {isPlaying ? '⏸ Остановить' : '▶ Воспроизвести'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {marginVertical: 4},
  containerOwn: {},
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginVertical: 4,
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
  fallbackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  fallbackText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
