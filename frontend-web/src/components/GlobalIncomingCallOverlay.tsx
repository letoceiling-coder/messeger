import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { chatsService } from '../services/chats.service';
import { soundService } from '../services/sound.service';

export const GlobalIncomingCallOverlay = () => {
  const { globalIncomingCall, rejectGlobalCall, clearGlobalCall } = useWebSocket();
  const [callerName, setCallerName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    if (globalIncomingCall) {
      soundService.playRingtone();
      
      // Загрузить информацию о чате для получения имени звонящего
      chatsService.getChat(globalIncomingCall.chatId).then((chat) => {
        const caller = chat.members?.find((m) => m.userId === globalIncomingCall.callerId);
        setCallerName(caller?.user?.username || caller?.user?.email || 'Неизвестный');
      }).catch(() => {
        setCallerName('Неизвестный');
      });
    } else {
      soundService.stopRingtone();
    }

    return () => {
      soundService.stopRingtone();
    };
  }, [globalIncomingCall]);

  if (!globalIncomingCall) {
    return null;
  }

  const handleAccept = () => {
    soundService.stopRingtone();
    // Перенаправление в чат с параметрами для автоматического принятия звонка
    // НЕ очищаем globalIncomingCall здесь - это сделает ChatPage после обработки
    navigate(`/chat/${globalIncomingCall.chatId}?incomingCall=true&videoMode=${globalIncomingCall.videoMode ?? true}`);
  };

  const handleReject = () => {
    soundService.stopRingtone();
    rejectGlobalCall();
  };

  return (
    <div className="fixed inset-0 bg-[#0b0b0b] bg-opacity-95 flex items-center justify-center z-[1000]">
      <div className="bg-[#1c1c1e] rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/10">
        <p className="text-[#86868a] text-sm mb-1">
          {globalIncomingCall.videoMode ? 'Входящий видеозвонок' : 'Входящий голосовой звонок'}
        </p>
        <h2 className="text-xl font-semibold text-white mb-6">{callerName}</h2>
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-xl font-medium"
          >
            Принять
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl font-medium"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
};
