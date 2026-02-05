import { webrtcLogService } from './webrtc-log.service';
import { getMediaStreamWithFallback } from '@/lib/mediaDevices';

function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [];
  const turnUser = import.meta.env.VITE_TURN_USER;
  const turnCred = import.meta.env.VITE_TURN_CREDENTIAL;
  const turnServer = import.meta.env.VITE_TURN_SERVER;

  if (turnUser && turnCred && String(turnUser).trim() && String(turnCred).trim()) {
    const username = String(turnUser).trim();
    const credential = String(turnCred).trim();
    const server = turnServer ? String(turnServer).trim() : '89.169.39.244';
    servers.push({ urls: 'stun:stun.l.google.com:19302' });
    servers.push({ urls: `turn:${server}:3478`, username, credential });
    servers.push({ urls: `turn:${server}:3478?transport=tcp`, username, credential });
    servers.push({ urls: `turns:${server}:5349?transport=tcp`, username, credential });
    webrtcLogService.add(`ICE: TURN ${server}`);
  } else {
    servers.push({ urls: 'stun:stun.l.google.com:19302' });
    servers.push({ urls: 'stun:stun1.l.google.com:19302' });
    servers.push({ urls: 'stun:stun2.l.google.com:19302' });
    webrtcLogService.add('ICE: Google STUN');
  }
  return servers;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private chatId: string | null = null;
  private socket: { emit: (e: string, d: unknown) => void; on: (e: string, h: (d: unknown) => void) => void; off: (e: string, h?: (d: unknown) => void) => void };
  private iceCandidateQueue: RTCIceCandidateInit[] = [];
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndCallback?: () => void;
  private onConnectionFailedCallback?: () => void;
  private onNoAnswerCallback?: () => void;
  private onCallBusyCallback?: (data: { message?: string }) => void;
  private onCallErrorCallback?: (message: string) => void;
  private _handlers: Array<{ event: string; fn: (d: unknown) => void }> = [];

  constructor(socket: WebRTCService['socket']) {
    this.socket = socket;
    this.setupListeners();
  }

  private setupListeners() {
    const onAnswer = async (data: { chatId?: string; answer?: RTCSessionDescriptionInit }) => {
      if (String(data?.chatId) !== String(this.chatId) || !this.peerConnection) return;
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data!.answer!));
        await this.drainIceQueue();
      } catch (e) {
        webrtcLogService.warn('setRemoteDescription error', String(e));
      }
    };
    const onIce = (data: { chatId?: string; candidate?: RTCIceCandidateInit }) => {
      if (String(data?.chatId) === String(this.chatId)) this.addIceCandidateSafe(data!.candidate!);
    };
    const onEnd = (data: { chatId?: string }) => {
      if (data?.chatId === this.chatId) this.endCall();
    };
    const onRejected = (data: { chatId?: string }) => {
      if (data?.chatId === this.chatId) this.endCall();
    };
    const onNoAnswer = (data: { chatId?: string }) => {
      if (data?.chatId === this.chatId) {
        this.endCall();
        this.onNoAnswerCallback?.();
      }
    };
    const onBusy = (data: { chatId?: string; message?: string }) => {
      if (data?.chatId === this.chatId) {
        this.endCall();
        this.onCallBusyCallback?.(data);
      }
    };
    const onError = (data: { message?: string }) => {
      this.endCall();
      this.onCallErrorCallback?.(data?.message ?? 'Ошибка звонка');
    };

    this._handlers = [
      { event: 'call:answer', fn: onAnswer },
      { event: 'call:ice-candidate', fn: onIce },
      { event: 'call:end', fn: onEnd },
      { event: 'call:rejected', fn: onRejected },
      { event: 'call:no-answer', fn: onNoAnswer },
      { event: 'call:busy', fn: onBusy },
      { event: 'call:error', fn: onError },
    ];
    this._handlers.forEach(({ event, fn }) => this.socket.on(event, fn));
  }

  private removeListeners() {
    this._handlers.forEach(({ event, fn }) => this.socket.off(event, fn));
    this._handlers = [];
  }

  private async addIceCandidateSafe(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection || !this.chatId) return;
    if (this.peerConnection.remoteDescription) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        webrtcLogService.warn('addIceCandidate error', String(e));
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

  async initiateCall(chatId: string, options?: { video?: boolean }): Promise<MediaStream> {
    this.chatId = chatId;
    const useVideo = options?.video !== false;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Микрофон доступен только по HTTPS или localhost');
    }

    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: useVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
    });

    this.peerConnection = new RTCPeerConnection({
      iceServers: getIceServers(),
      iceCandidatePoolSize: 10,
    });

    this.localStream.getTracks().forEach((t) => this.peerConnection!.addTrack(t, this.localStream!));

    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate && this.chatId) {
        this.socket.emit('call:ice-candidate', { chatId: this.chatId, candidate: e.candidate.toJSON() });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'failed') this.onConnectionFailedCallback?.();
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection?.iceConnectionState === 'failed') this.onConnectionFailedCallback?.();
    };

    this.peerConnection.ontrack = (e) => {
      const stream = e.streams?.[0] || (e.track ? new MediaStream([e.track]) : null);
      if (!stream) return;
      if (!this.remoteStream) this.remoteStream = new MediaStream(stream.getTracks());
      else stream.getTracks().forEach((t) => {
        if (!this.remoteStream!.getTracks().some((r) => r.id === t.id)) this.remoteStream!.addTrack(t);
      });
      this.onRemoteStreamCallback?.(new MediaStream(this.remoteStream.getTracks()));
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.socket.emit('call:initiate', { chatId, offer, videoMode: useVideo });
    return this.localStream;
  }

  async handleOffer(
    chatId: string,
    offer: RTCSessionDescriptionInit,
    options?: { video?: boolean; preCapturedStream?: MediaStream | null }
  ): Promise<MediaStream> {
    this.chatId = chatId;
    const useVideo = options?.video !== false;

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Микрофон доступен только по HTTPS или localhost');
    }

    if (options?.preCapturedStream?.getTracks().length) {
      this.localStream = options.preCapturedStream;
    } else {
      const { stream } = await getMediaStreamWithFallback({
        audio: true,
        video: useVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
      });
      if (!stream) throw new Error('Не удалось получить доступ к микрофону');
      this.localStream = stream;
    }

    this.peerConnection = new RTCPeerConnection({ iceServers: getIceServers(), iceCandidatePoolSize: 10 });

    this.peerConnection.ontrack = (e) => {
      const stream = e.streams?.[0] || (e.track ? new MediaStream([e.track]) : null);
      if (!stream) return;
      if (!this.remoteStream) this.remoteStream = new MediaStream(stream.getTracks());
      else stream.getTracks().forEach((t) => {
        if (!this.remoteStream!.getTracks().some((r) => r.id === t.id)) this.remoteStream!.addTrack(t);
      });
      this.onRemoteStreamCallback?.(new MediaStream(this.remoteStream.getTracks()));
    };

    this.peerConnection.onicecandidate = (e) => {
      if (e.candidate && this.chatId) {
        this.socket.emit('call:ice-candidate', { chatId: this.chatId, candidate: e.candidate.toJSON() });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'failed') this.onConnectionFailedCallback?.();
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection?.iceConnectionState === 'failed') this.onConnectionFailedCallback?.();
    };

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.drainIceQueue();

    const transceivers = this.peerConnection.getTransceivers?.() ?? [];
    const audioTrack = this.localStream.getAudioTracks()[0];
    const videoTrack = this.localStream.getVideoTracks()[0];
    for (const tr of transceivers) {
      if (!tr.sender || tr.sender.track != null) continue;
      const kind = (tr.receiver?.track?.kind ?? '').toLowerCase();
      const localTrack = kind === 'video' ? videoTrack : audioTrack;
      if (localTrack) {
        try {
          await tr.sender.replaceTrack(localTrack);
          tr.direction = 'sendrecv';
        } catch (e) {
          webrtcLogService.warn('replaceTrack failed', String(e));
        }
      }
    }
    if (!transceivers.some((tr) => tr.sender?.track != null)) {
      this.localStream.getTracks().forEach((t) => this.peerConnection!.addTrack(t, this.localStream!));
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this.socket.emit('call:answer', { chatId, answer });
    return this.localStream;
  }

  endCall() {
    this.removeListeners();
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.peerConnection?.close();
    this.peerConnection = null;
    this.iceCandidateQueue = [];
    if (this.chatId && this.socket?.emit) {
      this.socket.emit('call:end', { chatId: this.chatId });
      this.chatId = null;
    }
    this.remoteStream = null;
    const cb = this.onCallEndCallback;
    this.onCallEndCallback = undefined;
    cb?.();
  }

  rejectCall(chatId: string) {
    this.socket?.emit('call:reject', { chatId });
    this.chatId = null;
  }

  toggleAudio() {
    const t = this.localStream?.getAudioTracks()[0];
    if (t) t.enabled = !t.enabled;
  }

  toggleVideo() {
    const t = this.localStream?.getVideoTracks()[0];
    if (t) t.enabled = !t.enabled;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  onRemoteStream(cb: (s: MediaStream) => void) {
    this.onRemoteStreamCallback = cb;
  }

  onCallEnd(cb: () => void) {
    this.onCallEndCallback = cb;
  }

  onConnectionFailed(cb: () => void) {
    this.onConnectionFailedCallback = cb;
  }

  onNoAnswer(cb: () => void) {
    this.onNoAnswerCallback = cb;
  }

  onCallBusy(cb: (d: { message?: string }) => void) {
    this.onCallBusyCallback = cb;
  }

  onCallError(cb: (m: string) => void) {
    this.onCallErrorCallback = cb;
  }
}
