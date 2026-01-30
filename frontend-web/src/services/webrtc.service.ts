import { webrtcLogService } from './webrtc-log.service';

function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [];
  
  // Metered.ca STUN/TURN (if configured)
  const turnUser = import.meta.env.VITE_TURN_USER;
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
  
  if (turnUser && turnCred && String(turnUser).trim() && String(turnCred).trim()) {
    const username = String(turnUser).trim();
    const credential = String(turnCred).trim();
    
    // Metered STUN
    servers.push({ urls: 'stun:stun.relay.metered.ca:80' });
    
    // Metered TURN UDP
    servers.push({
      urls: 'turn:global.relay.metered.ca:80',
      username,
      credential,
    });
    
    // Metered TURN TCP
    servers.push({
      urls: 'turn:global.relay.metered.ca:80?transport=tcp',
      username,
      credential,
    });
    
    // Metered TURN 443
    servers.push({
      urls: 'turn:global.relay.metered.ca:443',
      username,
      credential,
    });
    
    // Metered TURNS (TLS)
    servers.push({
      urls: 'turns:global.relay.metered.ca:443?transport=tcp',
      username,
      credential,
    });
    
    webrtcLogService.add(`ICE servers: Metered (${servers.length} servers)`);
  } else {
    // Fallback to Google STUN
    servers.push({ urls: 'stun:stun.l.google.com:19302' });
    servers.push({ urls: 'stun:stun1.l.google.com:19302' });
    servers.push({ urls: 'stun:stun2.l.google.com:19302' });
    webrtcLogService.add('ICE servers: Google STUN (fallback)');
  }
  
  return servers;
}

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768;
  return narrow || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
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
  private _handlerAnswer?: (data: any) => void;
  private _handlerIce?: (data: any) => void;
  private _handlerEnd?: (data: any) => void;
  private _handlerRejected?: (data: any) => void;
  private _handlerNoAnswer?: (data: any) => void;

  constructor(socket: any) {
    this.socket = socket;
    this.setupWebSocketListeners();
  }

  private removeSocketListeners() {
    if (!this.socket) return;
    if (this._handlerAnswer) this.socket.off('call:answer', this._handlerAnswer);
    if (this._handlerIce) this.socket.off('call:ice-candidate', this._handlerIce);
    if (this._handlerEnd) this.socket.off('call:end', this._handlerEnd);
    if (this._handlerRejected) this.socket.off('call:rejected', this._handlerRejected);
    if (this._handlerNoAnswer) this.socket.off('call:no-answer', this._handlerNoAnswer);
    this._handlerAnswer = this._handlerIce = this._handlerEnd = this._handlerRejected = this._handlerNoAnswer = undefined;
  }

  private async addIceCandidateSafe(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection || !this.chatId) return;
    const hasRemote = !!this.peerConnection.remoteDescription;
    if (hasRemote) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn('[WebRTC] addIceCandidate error:', e);
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
        webrtcLogService.warn('drainIceQueue error', String(e));
      }
    }
  }

  private setupWebSocketListeners() {
    this._handlerAnswer = async (data: { chatId: string; answer: RTCSessionDescriptionInit }) => {
      webrtcLogService.add('event call:answer chatId=' + String(data?.chatId) + ' myChatId=' + String(this.chatId));
      const chatMatch = data?.chatId != null && this.chatId != null && String(data.chatId) === String(this.chatId);
      if (this.peerConnection && chatMatch) {
        try {
          webrtcLogService.add('received call:answer, setting remote description');
          await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          await this.drainIceQueue();
          webrtcLogService.add('setRemoteDescription (caller) ok');
        } catch (e) {
          webrtcLogService.warn('setRemoteDescription (answer) error', String(e));
          console.error('[WebRTC] setRemoteDescription (answer) error:', e);
        }
      } else if (!chatMatch) {
        webrtcLogService.add('call:answer chatId mismatch, skip');
      }
    };
    this.socket.on('call:answer', this._handlerAnswer);

    this._handlerIce = (data: { chatId: string; candidate: RTCIceCandidateInit }) => {
      const match = data?.chatId != null && this.chatId != null && String(data.chatId) === String(this.chatId);
      if (match) {
        webrtcLogService.add('received ICE candidate (remote)');
        this.addIceCandidateSafe(data.candidate);
      }
    };
    this.socket.on('call:ice-candidate', this._handlerIce);

    this._handlerEnd = (data: { chatId: string }) => {
      if (data.chatId === this.chatId) {
        this.endCall();
      }
    };
    this.socket.on('call:end', this._handlerEnd);

    this._handlerRejected = (data: { chatId: string }) => {
      if (data.chatId === this.chatId) {
        this.endCall();
      }
    };
    this.socket.on('call:rejected', this._handlerRejected);

    this._handlerNoAnswer = (data: { chatId: string }) => {
      if (data.chatId === this.chatId) {
        this.endCall();
        this.onNoAnswerCallback?.();
      }
    };
    this.socket.on('call:no-answer', this._handlerNoAnswer);
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
      // Ограничения для стабильной работы на ПК и мобильных (Android/iOS)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: useVideo
          ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
          : false,
      });

      // Звонок с телефона на ПК: без relay ICE на телефоне уходит в failed. Включаем relay только для звонящего на мобильном.
      const iceServers = getIceServers();
      const hasTurn = iceServers.some((s) => s.urls && String(s.urls).includes('turn:'));
      const useRelay = isMobile() && hasTurn;
      this.peerConnection = new RTCPeerConnection({
        iceServers,
        iceCandidatePoolSize: 10,
        ...(useRelay ? { iceTransportPolicy: 'relay' as RTCIceTransportPolicy } : {}),
      });
      if (useRelay) webrtcLogService.add('ICE: relay (TURN only, mobile caller)');

      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) webrtcLogService.add('ICE candidate (local)');
        if (event.candidate && this.chatId) {
          this.socket.emit('call:ice-candidate', {
            chatId: this.chatId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      this.peerConnection.onicegatheringstatechange = () => {
        const state = this.peerConnection?.iceGatheringState;
        webrtcLogService.add('ICE gathering (caller): ' + state);
      };

      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        const ice = this.peerConnection?.iceConnectionState;
        webrtcLogService.add('connectionState: ' + state + ' ice: ' + ice);
        if (state === 'failed') {
          webrtcLogService.warn('Connection failed');
          this.onConnectionFailedCallback?.();
        }
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        const ice = this.peerConnection?.iceConnectionState;
        webrtcLogService.add('iceConnectionState (caller): ' + ice);
        if (ice === 'failed') {
          webrtcLogService.warn('ICE failed (на мобильных часто нужен TURN)');
          this.onConnectionFailedCallback?.();
        }
      };

      this.peerConnection.ontrack = (event) => {
        webrtcLogService.add('ontrack (caller): ' + (event.track?.kind ?? '') + ' streams=' + (event.streams?.length ?? 0));
        const stream = event.streams?.[0] || (event.track ? new MediaStream([event.track]) : null);
        if (!stream) return;
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream(stream.getTracks());
        } else {
          stream.getTracks().forEach((t) => {
            if (!this.remoteStream!.getTracks().some((r) => r.id === t.id)) this.remoteStream!.addTrack(t);
          });
        }
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(new MediaStream(this.remoteStream.getTracks()));
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
    options?: { video?: boolean; preCapturedStream?: MediaStream | null },
  ): Promise<MediaStream> {
    this.chatId = chatId;
    const useVideo = options?.video !== false;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        'Микрофон (и камера) доступны только по HTTPS или localhost. Откройте сайт по https://...',
      );
    }

    try {
      if (options?.preCapturedStream && options.preCapturedStream.getTracks().length > 0) {
        this.localStream = options.preCapturedStream;
      } else {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: useVideo
            ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
            : false,
        });
      }

      this.peerConnection = new RTCPeerConnection({
        iceServers: getIceServers(),
        iceCandidatePoolSize: 10,
      });

      this.peerConnection.ontrack = (event) => {
        webrtcLogService.add('ontrack (answerer): ' + (event.track?.kind ?? ''));
        const stream = event.streams?.[0] || (event.track ? new MediaStream([event.track]) : null);
        if (!stream) return;
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream(stream.getTracks());
        } else {
          stream.getTracks().forEach((t) => {
            if (!this.remoteStream!.getTracks().some((r) => r.id === t.id)) this.remoteStream!.addTrack(t);
          });
        }
        if (this.onRemoteStreamCallback && this.remoteStream) {
          this.onRemoteStreamCallback(new MediaStream(this.remoteStream.getTracks()));
        }
      };

      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) webrtcLogService.add('ICE candidate (local)');
        if (event.candidate && this.chatId) {
          this.socket.emit('call:ice-candidate', {
            chatId: this.chatId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      this.peerConnection.onicegatheringstatechange = () => {
        const state = this.peerConnection?.iceGatheringState;
        webrtcLogService.add('ICE gathering (answerer): ' + state);
      };

      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        const ice = this.peerConnection?.iceConnectionState;
        webrtcLogService.add('connectionState (answerer): ' + state + ' ice: ' + ice);
        if (state === 'failed') this.onConnectionFailedCallback?.();
      };

      this.peerConnection.oniceconnectionstatechange = () => {
        const ice = this.peerConnection?.iceConnectionState;
        webrtcLogService.add('iceConnectionState (answerer): ' + ice);
        if (ice === 'failed') this.onConnectionFailedCallback?.();
      };

      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      await this.drainIceQueue();

      // Ответчик: отправляем свой поток через существующие transceivers (replaceTrack),
      // чтобы обе стороны гарантированно видели и слышали друг друга (ПК ↔ мобильный).
      const transceivers = this.peerConnection.getTransceivers?.() ?? [];
      const audioTrack = this.localStream.getAudioTracks()[0];
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (typeof console?.log === 'function') console.log('[WebRTC] transceivers:', transceivers.length);
      for (const tr of transceivers) {
        if (!tr.sender || tr.sender.track != null) continue;
        const kind = (tr.receiver?.track?.kind ?? (tr as { kind?: string }).kind ?? '').toLowerCase();
        const localTrack = kind === 'video' ? videoTrack : audioTrack;
        if (localTrack) {
          try {
            await tr.sender.replaceTrack(localTrack);
            tr.direction = 'sendrecv';
            webrtcLogService.add('replaceTrack ok: ' + kind);
          } catch (e) {
            webrtcLogService.warn('replaceTrack failed ' + kind, String(e));
          }
        }
      }
      const hasSendTrack = transceivers.some((tr) => tr.sender?.track != null);
      webrtcLogService.add('hasSendTrack: ' + hasSendTrack);
      if (!hasSendTrack) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

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
    this.removeSocketListeners();
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

  /** Состояние соединения для диагностики во время звонка */
  getConnectionInfo(): { connectionState?: string; iceConnectionState?: string } | null {
    if (!this.peerConnection) return null;
    return {
      connectionState: this.peerConnection.connectionState,
      iceConnectionState: this.peerConnection.iceConnectionState,
    };
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
