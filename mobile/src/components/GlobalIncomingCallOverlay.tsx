import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Modal} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useWebSocket} from '@contexts/WebSocketContext';

export const GlobalIncomingCallOverlay = () => {
  const navigation = useNavigation();
  const {globalIncomingCall, rejectGlobalCall, clearGlobalCall} = useWebSocket();

  if (!globalIncomingCall) return null;

  const handleAccept = () => {
    clearGlobalCall();
    navigation.navigate('Call' as never, {
      chatId: globalIncomingCall.chatId,
      userId: globalIncomingCall.callerId,
      isVideo: globalIncomingCall.videoMode ?? true,
      isIncoming: true,
      offer: globalIncomingCall.offer,
      callerId: globalIncomingCall.callerId,
    } as never);
  };

  const handleReject = () => {
    rejectGlobalCall();
  };

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>
            {globalIncomingCall.videoMode ? 'Входящий видеозвонок' : 'Входящий звонок'}
          </Text>
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}>
              <Text style={styles.buttonText}>Принять</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={handleReject}>
              <Text style={styles.buttonText}>Отклонить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 24,
    minWidth: 280,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34c759',
  },
  rejectButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
