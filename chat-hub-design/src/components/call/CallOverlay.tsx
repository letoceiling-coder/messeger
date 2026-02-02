import { AnimatePresence } from 'framer-motion';
import { useCall } from '@/context/CallContext';
import OutgoingCallScreen from './OutgoingCallScreen';
import IncomingCallScreen from './IncomingCallScreen';
import ActiveCallScreen from './ActiveCallScreen';
import VideoCallScreen from './VideoCallScreen';
import CallNetworkOverlay from './CallNetworkOverlay';

export default function CallOverlay() {
  const {
    activeCall,
    endCall,
    acceptCall,
    declineCall,
    toggleMute,
    toggleSpeaker,
    toggleCamera,
    switchCamera,
    callDurationSeconds,
  } = useCall();

  if (!activeCall) return null;

  const showIncoming = activeCall.direction === 'incoming' && activeCall.state === 'ringing';
  const showOutgoingAudio =
    activeCall.type === 'audio' &&
    activeCall.direction === 'outgoing' &&
    activeCall.state !== 'connected';
  const showActiveAudio = activeCall.type === 'audio' && activeCall.state === 'connected';
  const showVideo =
    activeCall.type === 'video' &&
    (activeCall.direction === 'outgoing' || activeCall.state === 'connected');

  return (
    <>
      <CallNetworkOverlay state={activeCall.networkState} />

      <AnimatePresence mode="wait">
        {showIncoming && (
          <IncomingCallScreen
            key="incoming"
            call={activeCall}
            onAccept={acceptCall}
            onDecline={declineCall}
          />
        )}
        {showOutgoingAudio && (
          <OutgoingCallScreen
            key="outgoing-audio"
            call={activeCall}
            onEnd={endCall}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
          />
        )}
        {showActiveAudio && (
          <ActiveCallScreen
            key="active-audio"
            call={activeCall}
            durationSeconds={callDurationSeconds}
            onEnd={endCall}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
          />
        )}
        {showVideo && (
          <VideoCallScreen
            key="video"
            call={activeCall}
            durationSeconds={callDurationSeconds}
            onEnd={endCall}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onSwitchCamera={switchCamera}
            isOutgoing={activeCall.direction === 'outgoing'}
          />
        )}
      </AnimatePresence>
    </>
  );
}
