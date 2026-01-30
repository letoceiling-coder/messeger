// STUN + опциональный TURN из env (для NAT/мобильных сетей)
function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];
  const turnUrl = import.meta.env.VITE_TURN_URL;
  if (turnUrl && typeof turnUrl === 'string' && turnUrl.trim()) {
    const turn: RTCIceServer = { urls: turnUrl.trim() };
    const user = import.meta.env.VITE_TURN_USER;
    const cred = import.meta.env.VITE_TURN_CREDENTIAL;
    if (user != null && String(user).trim()) turn.username = String(user).trim();
    if (cred != null && String(cred).trim()) turn.credential = String(cred).trim();
    servers.push(turn);
  }
  return servers;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private chatId: string | null = null;
  private socket: any;
  private iceCandidateQueue: RTCIceCandidateInit[] = [];
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndCallback?: () => void;
  private onConnectionFailedCallback?: () => void;
  private onNoAnswerCallback?: () => void;

  constructor(socket: any) {
    this.socket = socket;
    this.setupWebSocketListeners();
  }

  private async addIceCandidateSafe(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection || !this.chatId) return;
    const hasRemote = !!this.peerConnection.remoteDescription;
    if (hasRemote) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('addIceCandidate error:', e);
      }
    } else {
      this.iceCandidateQueue.push(candidate);
    }
  }

  private async drainIceQueue() {
    if (!this.peerConnection) return;
    while (this.iceCandidateQueue.length > 0) {
      const c = this.iceCandidateQueue.shift()!;
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.warn('drainIceQueue error:', e);
      }
    }
  }

  private setupWebSocketListeners() {
    this.socket.on('call:answer', async (data: { chatId: string; answer: RTCSessionDescriptionInit }) => {
      if (this.peerConnection && data.chatId === this.chatId) {
        try {
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          await this.drainIceQueue();
        } catch (e) {
          console.error('setRemoteDescription (answer) error:', e);
        }
      }
    });

    this.socket.on('call:ice-candidate', (data: { chatId: string; candidate: RTCIceCandidateInit }) => {
      if (data.chatId === this.chatId) {
        this.addIceCandidateSafe(data.candidate);
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

    this.socket.on('call:no-answer', (data: { chatId: string }) => {
      if (data.chatId === this.chatId) {
        this.endCall();
        this.onNoAnswerCallback?.();
      }
    });
  }

  async initiateCall(chatId: string, options?: { video?: boolean }): Promise<MediaStream> {
    this.chatId = chatId;
    const useVideo = options?.video !== false;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Микрофон (и камера) доступны только по HTTPS или localhost. Откройте сайт по https://...',
      );
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: useVideo,
        audio: true,
      });

      this.peerConnection = new RTCPeerConnection({
        iceServers: getIceServers(),
        iceCandidatePoolSize: 10,
      });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Удалённый поток: поддерживаем и streams[0], и один track (для стабильной двусторонней связи)
      this.peerConnection.ontrack = (event) => {
        const stream = event.streams?.[0] || (event.track ? new MediaStream([event.track]) : null);
        if (!stream) return;
        if (!this.remoteStream) {
          this.remoteStream = stream;
        } else {
          const rs = this.remoteStream;
          if (rs) {
            stream.getTracks().forEach((t) => {
              if (!rs.getTracks().some((r) => r.id === t.id)) rs.addTrack(t);
            });
          }
        }
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.chatId) {
          this.socket.emit('call:ice-candidate', {
            chatId: this.chatId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        if (state === 'failed' || state === 'disconnected') {
          this.onConnectionFailedCallback?.();
        }
      };

      // Создание offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Отправка offer через WebSocket
      this.socket.emit('call:initiate', {
        chatId,
        offer: offer,
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
    options?: { video?: boolean },
  ): Promise<MediaStream> {
    this.chatId = chatId;
    const useVideo = options?.video !== false;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Микрофон (и камера) доступны только по HTTPS или localhost. Откройте сайт по https://...',
      );
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: useVideo,
        audio: true,
      });

      this.peerConnection = new RTCPeerConnection({
        iceServers: getIceServers(),
        iceCandidatePoolSize: 10,
      });

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      this.peerConnection.ontrack = (event) => {
        const stream = event.streams?.[0] || (event.track ? new MediaStream([event.track]) : null);
        if (!stream) return;
        if (!this.remoteStream) {
          this.remoteStream = stream;
        } else {
          const rs = this.remoteStream;
          if (rs) {
            stream.getTracks().forEach((t) => {
              if (!rs.getTracks().some((r) => r.id === t.id)) rs.addTrack(t);
            });
          }
        }
        if (this.onRemoteStreamCallback && this.remoteStream) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.chatId) {
          this.socket.emit('call:ice-candidate', {
            chatId: this.chatId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      await this.drainIceQueue();

      // Создание answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Отправка answer через WebSocket
      this.socket.emit('call:answer', {
        chatId,
        answer: answer,
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
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.iceCandidateQueue = [];
    if (this.chatId && this.socket?.emit) {
      this.socket.emit('call:end', { chatId: this.chatId });
      this.chatId = null;
    }

    this.remoteStream = null;

    if (this.onCallEndCallback) {
      this.onCallEndCallback();
    }
  }

  rejectCall(chatId: string) {
    if (this.socket?.emit) {
      this.socket.emit('call:reject', { chatId });
    }
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

  onConnectionFailed(callback: () => void) {
    this.onConnectionFailedCallback = callback;
  }

  onNoAnswer(callback: () => void) {
    this.onNoAnswerCallback = callback;
  }
}
