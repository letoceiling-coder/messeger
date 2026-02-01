import React from 'react';
import {useRoute, useNavigation} from '@react-navigation/native';
import {VideoCall} from '@components/VideoCall';

const CallScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const params = route.params as {
    chatId: string;
    userId: string;
    isVideo: boolean;
    isIncoming?: boolean;
    offer?: RTCSessionDescriptionInit;
    callerId?: string;
  };

  const handleEnd = () => {
    navigation.goBack();
  };

  return (
    <VideoCall
      chatId={params.chatId}
      isIncoming={params.isIncoming ?? false}
      callerId={params.callerId}
      offer={params.offer}
      videoMode={params.isVideo}
      onEnd={handleEnd}
    />
  );
};

export default CallScreen;
