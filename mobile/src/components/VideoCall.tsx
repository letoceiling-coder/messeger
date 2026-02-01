import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { WebRTCService } from '../services/webrtc.service';
import { useWebSocket } from '../contexts/WebSocketContext';

interface VideoCallProps {
  chatId: string;
  isIncoming: boolean;
  callerId?: string;
  offer?: RTCSessionDescriptionInit;
  videoMode?: boolean;
  onEnd: () => void;
}

export const VideoCall = ({
  chatId,
  isIncoming,
  callerId,
  offer,
  onEnd,
}: VideoCallProps) => {
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
  const webrtcServiceRef = useRef<WebRTCService | null>(null);
  const { socket } = useWebSocket();

  useEffect(() => {
    const webrtc = new WebRTCService(socket);
    webrtcServiceRef.current = webrtc;

    webrtc.onRemoteStream((stream) => {
      setRemoteStream(stream);
      setIsConnecting(false);
    });

    webrtc.onCallEnd(() => {
      onEnd();
    });

    const initializeCall = async () => {
      try {
        let stream: any;
        if (isIncoming && offer) {
          stream = await webrtc.handleOffer(chatId, offer);
          stream = await webrtc.handleOffer(chatId, offer, videoMode);
        } else {
          stream = await webrtc.initiateCall(chatId, videoMode);
        setLocalStream(stream);
      } catch (error) {
        console.error('Ошибка инициализации звонка:', error);
        Alert.alert('Ошибка', 'Не удалось начать видеозвонок');
        onEnd();
      }
    };

    initializeCall();

    return () => {
      webrtc.endCall();
    };
  }, [chatId, isIncoming, offer, socket, onEnd]);
  }, [chatId, isIncoming, offer, videoMode, socket, onEnd]);
  const handleEndCall = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.endCall();
    }
    onEnd();
  };

  const handleToggleVideo = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleVideo();
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleToggleAudio = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleAudio();
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleReject = () => {
    if (webrtcServiceRef.current && chatId) {
      webrtcServiceRef.current.rejectCall(chatId);
    }
    onEnd();
  };

  const handleAccept = async () => {
    if (offer && webrtcServiceRef.current) {
      try {
        const stream = await webrtcServiceRef.current.handleOffer(chatId, offer);
        const stream = await webrtcServiceRef.current.handleOffer(chatId, offer, videoMode);
      } catch (error) {
        console.error('Ошибка принятия звонка:', error);
        Alert.alert('Ошибка', 'Не удалось принять звонок');
      }
    }
  };

  if (isIncoming && !localStream) {
    return (
      <Modal visible={true} transparent animationType="fade">
        <View style={styles.incomingCallContainer}>
          <View style={styles.incomingCallBox}>
            <Text style={styles.incomingCallTitle}>Входящий видеозвонок</Text>
            <Text style={styles.incomingCallTitle}>
              {videoMode ? 'Входящий видеозвонок' : 'Входящий звонок'}
            </Text>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={handleAccept}
              >
                <Text style={styles.buttonText}>Принять</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={handleReject}
              >
                <Text style={styles.buttonText}>Отклонить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      {/* Удаленное видео */}
      <View style={styles.remoteVideoContainer}>
        {isConnecting && (
          <View style={styles.connectingOverlay}>
            <Text style={styles.connectingText}>Подключение...</Text>
          </View>
        )}
        {remoteStream && (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        )}
      </View>

      {/* Локальное видео (маленькое) */}
      {localStream && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror
          />
        </View>
      )}

      {/* Управление */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            !isVideoEnabled && styles.controlButtonDisabled,
          ]}
          onPress={handleToggleVideo}
        >
          <Text style={styles.controlButtonText}>
            {isVideoEnabled ? '📹' : '📵'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.controlButton,
            !isAudioEnabled && styles.controlButtonDisabled,
          ]}
          onPress={handleToggleAudio}
        >
          <Text style={styles.controlButtonText}>
            {isAudioEnabled ? '🎤' : '🔇'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={handleEndCall}
        >
          <Text style={styles.controlButtonText}>📞</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
  },
  connectingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingText: {
    color: '#fff',
    fontSize: 18,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  endCallButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  controlButtonText: {
    fontSize: 24,
  },
  incomingCallContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingCallBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    minWidth: 280,
  },
  incomingCallTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  incomingCallButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
