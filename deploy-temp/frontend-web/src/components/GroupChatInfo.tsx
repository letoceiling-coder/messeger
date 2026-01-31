import { useState } from 'react';
import { Chat, ChatMemberUser } from '../types';
import { chatsService } from '../services/chats.service';
import { usersService } from '../services/users.service';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

interface GroupChatInfoProps {
  chat: Chat;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedChat: Chat) => void;
}

export const GroupChatInfo = ({ chat, isOpen, onClose, onUpdate }: GroupChatInfoProps) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(chat.name || '');
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const currentMember = chat.members.find(m => m.userId === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  const handleSave = async () => {
    if (!groupName.trim()) {
      showToast('Введите название группы', 'error');
      return;
    }

    try {
      setLoading(true);
      const updated = await chatsService.updateGroupChat(chat.id, groupName.trim());
      onUpdate(updated);
      showToast('Группа обновлена', 'success');
      setIsEditing(false);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка обновления группы', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Удалить участника из группы?')) return;

    try {
      const updated = await chatsService.removeMember(chat.id, userId);
      onUpdate(updated);
      showToast('Участник удалён', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка удаления участника', 'error');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    try {
      const updated = await chatsService.updateMemberRole(chat.id, userId, newRole);
      onUpdate(updated);
      showToast(`Роль изменена на ${newRole === 'admin' ? 'администратор' : 'участник'}`, 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка изменения роли', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Вы действительно хотите покинуть группу?')) return;

    try {
      await chatsService.leaveGroup(chat.id);
      showToast('Вы покинули группу', 'success');
      onClose();
      window.location.href = '/'; // Возврат к списку чатов
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка выхода из группы', 'error');
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await usersService.searchUsers(query);
      // Фильтруем пользователей, которые уже в чате
      const memberIds = new Set(chat.members.map(m => m.userId));
      setSearchResults(results.filter(u => !memberIds.has(u.id)));
    } catch (error) {
      console.error('Ошибка поиска', error);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      const updated = await chatsService.addMember(chat.id, userId);
      onUpdate(updated);
      showToast('Участник добавлен', 'success');
      setAddingMember(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Ошибка добавления участника', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-app-surface rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border shrink-0">
          <h2 className="text-xl font-semibold text-app-text">Информация о группе</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-app-surface-hover transition-colors"
          >
            <svg className="w-5 h-5 text-app-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент (с прокруткой) */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Название группы */}
          <div>
            <label className="block text-sm font-medium text-app-text mb-2">Название группы</label>
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  maxLength={100}
                  className="flex-1 px-4 py-2 bg-app-bg border border-app-border rounded-xl 
                           text-app-text focus:outline-none focus:border-app-accent"
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-app-accent hover:bg-app-accent-hover text-white 
                           rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : 'OK'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setGroupName(chat.name || '');
                  }}
                  className="px-4 py-2 bg-app-surface-hover hover:bg-app-border text-app-text 
                           rounded-xl transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-app-text font-medium">{chat.name}</p>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1 text-sm bg-app-surface-hover hover:bg-app-border 
                             text-app-text rounded-lg transition-colors"
                  >
                    Изменить
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Участники */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-app-text">
                Участники ({chat.members.length})
              </h3>
              {isAdmin && (
                <button
                  onClick={() => setAddingMember(!addingMember)}
                  className="px-3 py-1 text-sm bg-app-accent hover:bg-app-accent-hover 
                           text-white rounded-lg transition-colors"
                >
                  {addingMember ? 'Отмена' : '+ Добавить'}
                </button>
              )}
            </div>

            {/* Поиск и добавление участника */}
            {addingMember && (
              <div className="mb-4 space-y-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Поиск пользователей..."
                  className="w-full px-4 py-2 bg-app-bg border border-app-border rounded-xl 
                           text-app-text placeholder-app-text-secondary
                           focus:outline-none focus:border-app-accent"
                />
                {searchResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleAddMember(u.id)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg 
                                 hover:bg-app-bg transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-app-accent flex items-center justify-center shrink-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <span className="text-white text-sm font-semibold">
                              {u.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-app-text truncate">{u.username}</p>
                          <p className="text-xs text-app-text-secondary truncate">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Список участников */}
            <div className="space-y-2">
              {chat.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-app-bg"
                >
                  <div className="w-10 h-10 rounded-full bg-app-accent flex items-center justify-center shrink-0">
                    {member.user.avatarUrl ? (
                      <img src={member.user.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold">
                        {member.user.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-app-text truncate">{member.user.username}</p>
                    <p className="text-xs text-app-text-secondary">{member.role === 'admin' ? 'Администратор' : 'Участник'}</p>
                  </div>
                  {isAdmin && member.userId !== user?.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleRole(member.userId, member.role)}
                        className="px-2 py-1 text-xs bg-app-surface-hover hover:bg-app-border 
                                 text-app-text rounded transition-colors"
                        title={member.role === 'admin' ? 'Снять админа' : 'Сделать админом'}
                      >
                        {member.role === 'admin' ? '⬇' : '⬆'}
                      </button>
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        className="px-2 py-1 text-xs bg-app-error/20 hover:bg-app-error/30 
                                 text-app-error rounded transition-colors"
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Кнопка "Покинуть группу" */}
          <button
            onClick={handleLeaveGroup}
            className="w-full py-3 bg-app-error/20 hover:bg-app-error/30 text-app-error 
                     font-medium rounded-xl transition-colors"
          >
            Покинуть группу
          </button>
        </div>
      </div>
    </div>
  );
};
