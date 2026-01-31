import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useTheme} from '@contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const {width, height} = Dimensions.get('window');

const CallScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {colors} = useTheme();

  const {chatId, userId, isVideo, isIncoming} = route.params as {
    chatId: string;
    userId: string;
    isVideo: boolean;
    isIncoming?: boolean;
  };

  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);

  useEffect(() => {
    // TODO: Инициализация WebRTC
    
    // Таймер звонка
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      // TODO: Завершить WebRTC соединение
    };
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    navigation.goBack();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Mute/Unmute audio
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // TODO: Enable/Disable speaker
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // TODO: Enable/Disable video
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    videoContainer: {
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 18,
      color: '#ffffff',
      opacity: 0.5,
    },
    infoContainer: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    callerName: {
      fontSize: 24,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 8,
    },
    callStatus: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.7)',
    },
    controlsContainer: {
      position: 'absolute',
      bottom: 40,
      left: 0,
      right: 0,
      paddingHorizontal: 32,
    },
    controls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    controlButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    controlButtonActive: {
      backgroundColor: colors.accent,
    },
    endCallButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: colors.error,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {/* Video Container */}
      <View style={styles.videoContainer}>
        <Text style={styles.placeholderText}>
          {isVideoEnabled ? 'Видео' : 'Аудио звонок'}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.callerName}>Пользователь</Text>
        <Text style={styles.callStatus}>
          {callDuration > 0 ? formatDuration(callDuration) : 'Звоним...'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controls}>
          {/* Mute */}
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}>
            <Icon
              name={isMuted ? 'mic-off' : 'mic'}
              size={28}
              color="#ffffff"
            />
          </TouchableOpacity>

          {/* End Call */}
          <TouchableOpacity
            style={styles.endCallButton}
            onPress={handleEndCall}>
            <Icon name="call" size={32} color="#ffffff" />
          </TouchableOpacity>

          {/* Speaker / Video */}
          {isVideo ? (
            <TouchableOpacity
              style={[styles.controlButton, !isVideoEnabled && styles.controlButtonActive]}
              onPress={toggleVideo}>
              <Icon
                name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                size={28}
                color="#ffffff"
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
              onPress={toggleSpeaker}>
              <Icon
                name={isSpeakerOn ? 'volume-high' : 'volume-low'}
                size={28}
                color="#ffffff"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default CallScreen;
