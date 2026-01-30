import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private chatId: string | null = null;
  private socket: any;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndCallback?: () => void;

  constructor(socket: any) {
    this.socket = socket;
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    this.socket.on('call:answer', (data: { chatId: string; answer: RTCSessionDescriptionInit }) => {
      if (this.peerConnection && data.chatId === this.chatId) {
        this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      }
    });

    this.socket.on('call:ice-candidate', (data: { chatId: string; candidate: RTCIceCandidateInit }) => {
      if (this.peerConnection && data.chatId === this.chatId) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    this.socket.on('call:end', (data: { chatId: string }) => {
      if (data.chatId === this.chatId) {
        this.endCall();
      }
    });

    this.socket.on('call:rejected', (data: { chatId: string }) => {
      if (data.chatId === this.chatId) {
        this.endCall();
      }
    });
  }

  async initiateCall(chatId: string): Promise<MediaStream> {
    this.chatId = chatId;

    try {
      // Получение локального медиа-потока
      this.localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 640,
          height: 480,
          frameRate: 30,
        },
      });

      // Создание RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: STUN_SERVERS,
      });

      // Добавление локального потока
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Обработка удаленного потока
      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams.length > 0) {
          this.remoteStream = event.streams[0];
          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(this.remoteStream);
          }
        }
      };

      // Обработка ICE кандидатов
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.chatId) {
          this.socket.emit('call:ice-candidate', {
            chatId: this.chatId,
            candidate: event.candidate,
          });
        }
      };

      // Создание offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Отправка offer через WebSocket
      this.socket.emit('call:initiate', {
        chatId,
        offer: offer.toJSON(),
      });

      return this.localStream;
    } catch (error) {
      console.error('Ошибка инициации звонка:', error);
      throw error;
    }
  }

  async handleOffer(
    chatId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<MediaStream> {
    this.chatId = chatId;

    try {
      // Получение локального медиа-потока
      this.localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 640,
          height: 480,
          frameRate: 30,
        },
      });

      // Создание RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: STUN_SERVERS,
      });

      // Добавление локального потока
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Обработка удаленного потока
      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams.length > 0) {
          this.remoteStream = event.streams[0];
          if (this.onRemoteStreamCallback) {
            this.onRemoteStreamCallback(this.remoteStream);
          }
        }
      };

      // Обработка ICE кандидатов
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.chatId) {
          this.socket.emit('call:ice-candidate', {
            chatId: this.chatId,
            candidate: event.candidate,
          });
        }
      };

      // Установка удаленного описания
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Создание answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Отправка answer через WebSocket
      this.socket.emit('call:answer', {
        chatId,
        answer: answer.toJSON(),
      });

      return this.localStream;
    } catch (error) {
      console.error('Ошибка обработки offer:', error);
      throw error;
    }
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream.release();
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.chatId) {
      this.socket.emit('call:end', { chatId: this.chatId });
      this.chatId = null;
    }

    if (this.remoteStream) {
      this.remoteStream.release();
      this.remoteStream = null;
    }

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }
  }

  rejectCall(chatId: string) {
    this.socket.emit('call:reject', { chatId });
    this.chatId = null;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  onRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStreamCallback = callback;
  }

  onCallEnd(callback: () => void) {
    this.onCallEndCallback = callback;
  }
}
